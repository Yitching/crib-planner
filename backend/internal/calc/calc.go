// Package calc works out the payments for a BTO flat.
//
// All figures are planning estimates, not official HDB/CPF numbers. The
// constants below are kept in one place so they are easy to update when
// policy changes.
package calc

import (
	"fmt"
	"math"
)

// FlatTypes lists the supported flat sizes, smallest first.
var FlatTypes = []string{"2-room", "3-room", "4-room", "5-room"}

// BookingFee is the HDB option fee by flat type (paid in cash, counts toward the downpayment).
var BookingFee = map[string]float64{"2-room": 500, "3-room": 1000, "4-room": 2000, "5-room": 2000}

// Loan describes a loan product.
type Loan struct {
	Label      string  `json:"label"`
	LTV        float64 `json:"ltv"`
	Rate       float64 `json:"rate"`
	Years      int     `json:"years"`
	MinCashPct float64 `json:"minCashPct"`
}

// Loans holds the supported loan types.
var Loans = map[string]Loan{
	"hdb":  {Label: "HDB loan", LTV: 0.75, Rate: 0.026, Years: 25, MinCashPct: 0},
	"bank": {Label: "Bank loan", LTV: 0.75, Rate: 0.03, Years: 25, MinCashPct: 0.05},
}

const (
	// SigningPct is the share of the price due when signing the Agreement for Lease.
	SigningPct = 0.10
	// SigningOtherFees and KeysOtherFees are rough legal / registration / insurance costs.
	SigningOtherFees = 350
	KeysOtherFees    = 350
	// CPFOARate is the share of monthly wages that goes into CPF Ordinary Account (age 35 and below).
	CPFOARate = 0.23
	// MSR is the Mortgage Servicing Ratio cap for HDB flats.
	MSR             = 0.30
	MonthsToSigning = 6
	MonthsToKeys    = 42 // ~3.5 years
)

// Enhanced CPF Housing Grant by combined monthly income (upper bound of band).
var ehgBands = [][2]float64{
	{1500, 120000}, {2000, 110000}, {2500, 105000}, {3000, 95000},
	{3500, 90000}, {4000, 80000}, {4500, 70000}, {5000, 65000},
	{5500, 55000}, {6000, 50000}, {6500, 40000}, {7000, 30000},
	{7500, 25000}, {8000, 20000}, {8500, 10000}, {9000, 5000},
}

// Inputs are the numbers the household enters.
type Inputs struct {
	FlatType string  `json:"flatType"`
	Price    float64 `json:"price"`
	Income   float64 `json:"income"`
	CPFA     float64 `json:"cpfA"`
	CPFB     float64 `json:"cpfB"`
	Cash     float64 `json:"cash"`
	LoanType string  `json:"loanType"`
}

// DefaultInputs is the worked example from the design.
var DefaultInputs = Inputs{
	FlatType: "4-room", Price: 400000, Income: 7000,
	CPFA: 25000, CPFB: 20000, Cash: 93000, LoanType: "hdb",
}

// Validate checks the inputs and returns a user-facing error.
func (i Inputs) Validate() error {
	if _, ok := BookingFee[i.FlatType]; !ok {
		return fmt.Errorf("unknown flat type %q", i.FlatType)
	}
	if _, ok := Loans[i.LoanType]; !ok {
		return fmt.Errorf("unknown loan type %q", i.LoanType)
	}
	for name, v := range map[string]float64{"price": i.Price, "income": i.Income, "cpfA": i.CPFA, "cpfB": i.CPFB, "cash": i.Cash} {
		if v < 0 || math.IsNaN(v) || math.IsInf(v, 0) || v > 1e9 {
			return fmt.Errorf("%s must be between 0 and 1,000,000,000", name)
		}
	}
	return nil
}

// Stop is one payment on the road to the keys.
type Stop struct {
	ID       string  `json:"id"`
	Title    string  `json:"title"`
	When     string  `json:"when"`
	Amount   float64 `json:"amount"`
	PaidFrom string  `json:"paidFrom"`
	Color    string  `json:"color"`
	Monthly  bool    `json:"monthly"`
}

// LoanResult is the chosen loan plus the amount borrowed.
type LoanResult struct {
	Loan
	Amount float64 `json:"amount"`
}

// Result is everything the app shows.
type Result struct {
	Inputs     Inputs     `json:"inputs"`
	Loan       LoanResult `json:"loan"`
	Stops      []Stop     `json:"stops"`
	Grant      float64    `json:"grant"`
	BookingFee float64    `json:"bookingFee"`
	StampDuty  float64    `json:"stampDuty"`
	CashLeft   float64    `json:"cashLeft"`
	CPFLeft    float64    `json:"cpfLeft"`
	MonthlyOA  float64    `json:"monthlyOA"`
	Verdict    string     `json:"verdict"` // ok | tight | no
	Reasons    []string   `json:"reasons"`
}

// EstimateGrant returns the income-based housing grant estimate.
func EstimateGrant(income float64) float64 {
	if income < 0 {
		return 0
	}
	for _, b := range ehgBands {
		if income <= b[0] {
			return b[1]
		}
	}
	return 0
}

// StampDuty is the Buyer's Stamp Duty for residential property.
func StampDuty(price float64) float64 {
	tiers := [][2]float64{{180000, 0.01}, {180000, 0.02}, {640000, 0.03}, {500000, 0.04}, {1500000, 0.05}, {math.Inf(1), 0.06}}
	left, duty := price, 0.0
	for _, t := range tiers {
		part := math.Min(left, t[0])
		duty += part * t[1]
		left -= part
		if left <= 0 {
			break
		}
	}
	return math.Round(duty)
}

// MonthlyPayment is the standard amortised loan payment.
func MonthlyPayment(principal, annualRate float64, years int) float64 {
	n := float64(years * 12)
	r := annualRate / 12
	if principal <= 0 {
		return 0
	}
	if r == 0 {
		return principal / n
	}
	return principal * r / (1 - math.Pow(1+r, -n))
}

func paidFromLabel(cpfPart, cashPart float64) string {
	switch {
	case cashPart > 0 && cpfPart > 0:
		return "CPF + cash"
	case cashPart > 0:
		return "Cash"
	default:
		return "CPF"
	}
}

// Calculate walks through the payments, spending CPF first (except where cash
// is required) and topping up any shortfall from cash.
func Calculate(in Inputs) Result {
	loan := Loans[in.LoanType]
	price, income := in.Price, in.Income

	booking := math.Min(BookingFee[in.FlatType], price)
	loanAmount := math.Round(price * loan.LTV)
	downpayment := price - loanAmount
	signingDown := math.Max(0, math.Round(price*SigningPct)-booking)
	keysDown := math.Max(0, downpayment-booking-signingDown)
	duty := StampDuty(price)

	signing := signingDown + duty + SigningOtherFees
	keys := keysDown + KeysOtherFees
	monthly := math.Round(MonthlyPayment(loanAmount, loan.Rate, loan.Years))
	grant := EstimateGrant(income)
	monthlyOA := income * CPFOARate

	cash := in.Cash
	cpf := in.CPFA + in.CPFB
	var reasons []string

	spend := func(when string, amount, mustBeCash float64) (fromCPF, fromCash float64) {
		cashReq := math.Min(amount, mustBeCash)
		fromCPF = math.Min(cpf, amount-cashReq)
		fromCash = amount - fromCPF
		cpf -= fromCPF
		cash -= fromCash
		if cash < 0 {
			reasons = append(reasons, fmt.Sprintf("You're about $%s short %s.", Fmt(-cash), when))
			cash = 0
		}
		return
	}

	bCPF, bCash := spend("when you book", booking, booking)

	cpf += monthlyOA * MonthsToSigning
	bankCash := math.Max(0, math.Round(price*loan.MinCashPct)-booking)
	sCPF, sCash := spend("when you sign the lease", signing, bankCash)

	// Grants are assumed to arrive by key collection (conservative).
	cpf += monthlyOA*(MonthsToKeys-MonthsToSigning) + grant
	kCPF, kCash := spend("when you get your keys", keys, 0)

	monthlyFromCPF := monthlyOA >= monthly
	msrLimit := income * MSR
	if monthly > msrLimit {
		reasons = append(reasons, fmt.Sprintf("The monthly payment is above 30%% of your income ($%s).", Fmt(msrLimit)))
	}

	loanFrom := "Monthly CPF"
	if !monthlyFromCPF {
		loanFrom = "CPF + cash"
	}

	cashLeft := math.Round(cash)
	verdict := "ok"
	switch {
	case len(reasons) > 0:
		verdict = "no"
	case cashLeft < 10000 || !monthlyFromCPF:
		verdict = "tight"
	}
	if reasons == nil {
		reasons = []string{}
	}

	return Result{
		Inputs: in,
		Loan:   LoanResult{Loan: loan, Amount: loanAmount},
		Stops: []Stop{
			{ID: "book", Title: "Book your flat", When: "Today", Amount: booking, PaidFrom: paidFromLabel(bCPF, bCash), Color: "peach"},
			{ID: "sign", Title: "Sign the lease", When: fmt.Sprintf("In ~%d months", MonthsToSigning), Amount: signing, PaidFrom: paidFromLabel(sCPF, sCash), Color: "purple"},
			{ID: "keys", Title: "Get your keys", When: fmt.Sprintf("In ~%g years", float64(MonthsToKeys)/12), Amount: keys, PaidFrom: paidFromLabel(kCPF, kCash), Color: "yellow"},
			{ID: "loan", Title: "Pay off the loan", When: "Then, monthly", Amount: monthly, PaidFrom: loanFrom, Color: "green", Monthly: true},
		},
		Grant:      grant,
		BookingFee: booking,
		StampDuty:  duty,
		CashLeft:   cashLeft,
		CPFLeft:    math.Round(cpf),
		MonthlyOA:  math.Round(monthlyOA),
		Verdict:    verdict,
		Reasons:    reasons,
	}
}

// Fmt formats a whole-dollar amount with thousands separators.
func Fmt(n float64) string {
	v := int64(math.Round(n))
	neg := v < 0
	if neg {
		v = -v
	}
	s := fmt.Sprintf("%d", v)
	for i := len(s) - 3; i > 0; i -= 3 {
		s = s[:i] + "," + s[i:]
	}
	if neg {
		s = "-" + s
	}
	return s
}
