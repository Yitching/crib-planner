// Package calc works out the payments for a BTO flat.
//
// All figures are planning estimates, not official HDB/CPF numbers. The
// constants below are kept in one place so they are easy to update when
// policy changes. Check https://www.hdb.gov.sg before relying on them.
package calc

import (
	"fmt"
	"math"
	"time"
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
	MinCashPct float64 `json:"minCashPct"` // share of the price that must be paid in cash
}

// Loans holds the supported loan types.
var Loans = map[string]Loan{
	"hdb":  {Label: "HDB loan", LTV: 0.75, Rate: 0.026, Years: 25, MinCashPct: 0},
	"bank": {Label: "Bank loan", LTV: 0.75, Rate: 0.03, Years: 25, MinCashPct: 0.05},
}

// Scheme is how the downpayment is split between signing the lease and key collection.
type Scheme struct {
	Label      string  `json:"label"`
	SigningPct float64 `json:"signingPct"` // share of the price due at signing (incl. booking fee)
}

// Schemes holds the supported downpayment schemes.
var Schemes = map[string]Scheme{
	"standard":  {Label: "Standard", SigningPct: 0.10},
	"staggered": {Label: "Staggered Downpayment", SigningPct: 0.05},
	"dia":       {Label: "Deferred Income Assessment", SigningPct: 0.025},
}

// Stages are the points a household can be at, in order.
var Stages = []string{"applying", "booked", "signed", "keys"}

const (
	// SigningOtherFees and KeysOtherFees are rough legal / registration / insurance costs.
	SigningOtherFees = 350
	KeysOtherFees    = 350
	// CPFOARate is the share of monthly wages that goes into CPF Ordinary Account (age 35 and below).
	CPFOARate = 0.23
	// MSR is the Mortgage Servicing Ratio cap for HDB flats (applies to HDB and bank loans).
	MSR = 0.30
	// IncomeCeiling is the household income ceiling for an HDB loan / BTO as a family.
	IncomeCeiling = 14000
	// CPFRetain is how much CPF OA you may keep when taking an HDB loan; the rest reduces the loan.
	CPFRetain = 20000
	// LoanEndAge is the age by which the loan must be paid off.
	LoanEndAge = 65
	// DIAMaxAge: at least one of you must be this age or younger to use DIA.
	DIAMaxAge = 30

	DefaultMonthsToSigning = 6
	DefaultMonthsToKeys    = 42 // ~3.5 years
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
	Income   float64 `json:"income"` // combined gross monthly income
	CPFA     float64 `json:"cpfA"`
	CPFB     float64 `json:"cpfB"`
	Cash     float64 `json:"cash"`
	SaveA    float64 `json:"saveA"` // monthly cash savings, you
	SaveB    float64 `json:"saveB"` // monthly cash savings, partner
	AgeA     int     `json:"ageA"`
	AgeB     int     `json:"ageB"`
	// Student: either of you is a full-time student or in NS, or finished within the last 12 months.
	Student  bool   `json:"student"`
	LoanType string `json:"loanType"`
	Scheme   string `json:"scheme"`
	Stage    string `json:"stage"`
	SignDate string `json:"signDate"` // YYYY-MM, optional
	KeyDate  string `json:"keyDate"`  // YYYY-MM, optional
	AsOf     string `json:"asOf"`     // YYYY-MM, optional; defaults to this month
	// Overrides replaces the estimated amount of a stop ("book", "sign", "keys")
	// with what HDB actually asked for or what was actually paid.
	Overrides map[string]float64 `json:"overrides"`
}

// DefaultInputs is the worked example from the design.
var DefaultInputs = Inputs{
	FlatType: "4-room", Price: 400000, Income: 7000,
	CPFA: 25000, CPFB: 20000, Cash: 93000,
	AgeA: 28, AgeB: 28,
	LoanType: "hdb", Scheme: "standard", Stage: "applying",
}

// Validate checks the inputs and returns a user-facing error.
func (i Inputs) Validate() error {
	if _, ok := BookingFee[i.FlatType]; !ok {
		return fmt.Errorf("unknown flat type %q", i.FlatType)
	}
	if _, ok := Loans[i.LoanType]; !ok {
		return fmt.Errorf("unknown loan type %q", i.LoanType)
	}
	if _, ok := Schemes[i.Scheme]; !ok {
		return fmt.Errorf("unknown downpayment scheme %q", i.Scheme)
	}
	if stageIndex(i.Stage) < 0 {
		return fmt.Errorf("unknown stage %q", i.Stage)
	}
	for name, v := range map[string]float64{"price": i.Price, "income": i.Income, "cpfA": i.CPFA, "cpfB": i.CPFB, "cash": i.Cash, "saveA": i.SaveA, "saveB": i.SaveB} {
		if !validAmount(v) {
			return fmt.Errorf("%s must be between 0 and 1,000,000,000", name)
		}
	}
	for _, age := range []int{i.AgeA, i.AgeB} {
		if age < 18 || age > 99 {
			return fmt.Errorf("ages must be between 18 and 99")
		}
	}
	for name, d := range map[string]string{"signDate": i.SignDate, "keyDate": i.KeyDate, "asOf": i.AsOf} {
		if d == "" {
			continue
		}
		if _, err := time.Parse("2006-01", d); err != nil {
			return fmt.Errorf("%s must look like 2027-06", name)
		}
	}
	for id, v := range i.Overrides {
		if id != "book" && id != "sign" && id != "keys" {
			return fmt.Errorf("unknown payment %q", id)
		}
		if !validAmount(v) {
			return fmt.Errorf("payment amounts must be between 0 and 1,000,000,000")
		}
	}
	return nil
}

func validAmount(v float64) bool {
	return v >= 0 && !math.IsNaN(v) && !math.IsInf(v, 0) && v <= 1e9
}

func stageIndex(s string) int {
	for i, v := range Stages {
		if v == s {
			return i
		}
	}
	return -1
}

// Item is one line of a payment breakdown.
type Item struct {
	Label  string  `json:"label"`
	Amount float64 `json:"amount"`
}

// Stop is one payment on the road to the keys.
type Stop struct {
	ID         string  `json:"id"`
	Title      string  `json:"title"`
	Month      string  `json:"month"` // YYYY-MM
	MonthsAway int     `json:"monthsAway"`
	Amount     float64 `json:"amount"`
	PaidFrom   string  `json:"paidFrom"`
	Color      string  `json:"color"`
	Monthly    bool    `json:"monthly"`
	Status     string  `json:"status"` // paid | next | upcoming
	Overridden bool    `json:"overridden"`
	Breakdown  []Item  `json:"breakdown"`
	// What this payment takes from each pot, and what you'll have in each pot
	// just before paying it (projected from today's balances, savings and CPF).
	CPFPart       float64 `json:"cpfPart"`
	CashPart      float64 `json:"cashPart"`
	CPFAvailable  float64 `json:"cpfAvailable"`
	CashAvailable float64 `json:"cashAvailable"`
	Shortfall     float64 `json:"shortfall"`
}

// Criterion is one condition for getting the maximum loan.
type Criterion struct {
	Label  string `json:"label"`
	Detail string `json:"detail"`
	Status string `json:"status"` // ok | warn | fail | info
}

// LoanResult describes the loan you can expect.
type LoanResult struct {
	Loan
	Amount      float64     `json:"amount"`   // what you'd borrow
	MaxByLTV    float64     `json:"maxByLTV"` // 75% of the price
	MaxByIncome float64     `json:"maxByIncome"`
	CPFToLoan   float64     `json:"cpfToLoan"` // CPF above the retention limit used to cut the loan
	TenureYears int         `json:"tenureYears"`
	Monthly     float64     `json:"monthly"`
	Criteria    []Criterion `json:"criteria"`
}

// Result is everything the app shows.
type Result struct {
	Inputs         Inputs     `json:"inputs"`
	Loan           LoanResult `json:"loan"`
	Scheme         Scheme     `json:"scheme"`
	Stops          []Stop     `json:"stops"`
	Grant          float64    `json:"grant"`
	BookingFee     float64    `json:"bookingFee"`
	StampDuty      float64    `json:"stampDuty"`
	MonthsToKeys   int        `json:"monthsToKeys"`
	KeyMonth       string     `json:"keyMonth"`
	SavingsMonthly float64    `json:"savingsMonthly"`
	SavedByKeys    float64    `json:"savedByKeys"` // cash you'll add from savings by key collection
	CashLeft       float64    `json:"cashLeft"`    // cash left for renovation at key collection
	CPFLeft        float64    `json:"cpfLeft"`
	MonthlyOA      float64    `json:"monthlyOA"`
	PaidSoFar      float64    `json:"paidSoFar"`
	DIAEligible    bool       `json:"diaEligible"`
	Verdict        string     `json:"verdict"` // ok | tight | no
	Reasons        []string   `json:"reasons"` // why it doesn't work
	Notes          []string   `json:"notes"`   // things worth knowing
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
	if principal <= 0 || years <= 0 {
		return 0
	}
	if r == 0 {
		return principal / n
	}
	return principal * r / (1 - math.Pow(1+r, -n))
}

// MaxPrincipal is the largest loan a monthly payment can support.
func MaxPrincipal(monthly, annualRate float64, years int) float64 {
	n := float64(years * 12)
	r := annualRate / 12
	if monthly <= 0 || years <= 0 {
		return 0
	}
	if r == 0 {
		return monthly * n
	}
	return monthly * (1 - math.Pow(1+r, -n)) / r
}

// DIAEligible reports whether the household looks eligible for Deferred Income Assessment.
func DIAEligible(in Inputs) bool {
	return in.Student && (in.AgeA <= DIAMaxAge || in.AgeB <= DIAMaxAge)
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

func monthsBetween(from, to time.Time) int {
	return (to.Year()-from.Year())*12 + int(to.Month()) - int(from.Month())
}

func parseMonth(s string, fallback time.Time) time.Time {
	if t, err := time.Parse("2006-01", s); err == nil {
		return t
	}
	return fallback
}

// Calculate walks through the payments still to come, spending CPF first
// (except where cash is required) and topping up any shortfall from cash.
// Payments already made are assumed to be reflected in today's balances.
func Calculate(in Inputs) Result {
	loan := Loans[in.LoanType]
	scheme := Schemes[in.Scheme]
	stage := stageIndex(in.Stage)
	price, income := in.Price, in.Income

	// ---- Timeline ----
	now := time.Now()
	asOf := parseMonth(in.AsOf, time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, time.UTC))
	signAt := parseMonth(in.SignDate, asOf.AddDate(0, DefaultMonthsToSigning, 0))
	keyAt := parseMonth(in.KeyDate, asOf.AddDate(0, DefaultMonthsToKeys, 0))
	if keyAt.Before(signAt) {
		keyAt = signAt
	}
	mSign := max(0, monthsBetween(asOf, signAt))
	mKeys := max(0, monthsBetween(asOf, keyAt))

	// ---- Loan size ----
	avgAgeAtKeys := float64(in.AgeA+in.AgeB)/2 + float64(mKeys)/12
	tenure := min(loan.Years, int(math.Floor(LoanEndAge-avgAgeAtKeys)))
	tenure = max(tenure, 0)
	maxByLTV := math.Round(price * loan.LTV)
	maxByIncome := math.Floor(MaxPrincipal(income*MSR, loan.Rate, tenure)/100) * 100
	loanAmount := math.Min(maxByLTV, maxByIncome)

	// ---- Payment amounts ----
	booking := math.Min(BookingFee[in.FlatType], price)
	duty := StampDuty(price)
	downpayment := price - loanAmount
	signingDown := math.Max(0, math.Round(price*scheme.SigningPct)-booking)
	keysDown := math.Max(0, downpayment-booking-signingDown)
	extraForIncome := maxByLTV - loanAmount // included in keysDown

	bookItems := []Item{{"Option fee", booking}}
	signItems := []Item{
		{fmt.Sprintf("Downpayment (%g%% of price, less option fee)", scheme.SigningPct*100), signingDown},
		{"Buyer's stamp duty", duty},
		{"Legal and other fees (estimate)", SigningOtherFees},
	}
	keysItems := []Item{{"Rest of the downpayment", keysDown - extraForIncome}}
	if extraForIncome > 0 {
		keysItems = append(keysItems, Item{"Extra, because your income supports a smaller loan", extraForIncome})
	}
	keysItems = append(keysItems, Item{"Legal, registration and insurance fees (estimate)", KeysOtherFees})

	amounts := map[string]float64{
		"book": booking,
		"sign": signingDown + duty + SigningOtherFees,
		"keys": keysDown + KeysOtherFees,
	}
	items := map[string][]Item{"book": bookItems, "sign": signItems, "keys": keysItems}
	overridden := map[string]bool{}
	for id, v := range in.Overrides {
		amounts[id] = v
		overridden[id] = true
		items[id] = []Item{{"Amount you entered", v}}
	}

	// ---- Walk the timeline ----
	grant := EstimateGrant(income)
	monthlyOA := income * CPFOARate
	savingsMonthly := in.SaveA + in.SaveB
	cash := in.Cash
	cpf := in.CPFA + in.CPFB
	t := 0
	advance := func(to int) {
		if to > t {
			cash += savingsMonthly * float64(to-t)
			cpf += monthlyOA * float64(to-t)
			t = to
		}
	}

	var reasons, notes []string
	// Bank loans need part of the price in cash; the option fee counts toward it.
	cashStillRequired := math.Max(0, math.Round(price*loan.MinCashPct)-booking)

	type plan struct {
		id, title, color string
		at               time.Time
		months           int
		stageDone        int // stage index at which this stop has been paid
	}
	plans := []plan{
		{"book", "Book your flat", "peach", asOf, 0, 1},
		{"sign", "Sign the lease", "purple", signAt, mSign, 2},
		{"keys", "Get your keys", "yellow", keyAt, mKeys, 3},
	}

	var stops []Stop
	paidSoFar := 0.0
	nextMarked := false
	for _, p := range plans {
		amount := amounts[p.id]
		s := Stop{ID: p.id, Title: p.title, Color: p.color, Amount: amount, Breakdown: items[p.id], Overridden: overridden[p.id]}
		if stage >= p.stageDone {
			s.Status, s.PaidFrom = "paid", "Paid"
			s.Month = ""
			paidSoFar += amount
			if p.id == "sign" {
				cashStillRequired = math.Max(0, cashStillRequired-signingDown)
			}
			stops = append(stops, s)
			continue
		}
		advance(p.months)
		if p.id == "keys" {
			cpf += grant // grants assumed credited by key collection
		}
		s.Month, s.MonthsAway = p.at.Format("2006-01"), p.months
		s.CPFAvailable, s.CashAvailable = math.Round(cpf), math.Round(cash)

		mustCash := 0.0
		switch p.id {
		case "book":
			mustCash = amount
		case "sign":
			mustCash = math.Min(cashStillRequired, signingDown)
			cashStillRequired -= mustCash
		case "keys":
			mustCash = cashStillRequired
		}
		mustCash = math.Min(mustCash, amount)
		fromCPF := math.Min(cpf, amount-mustCash)
		fromCash := amount - fromCPF
		cpf -= fromCPF
		cash -= fromCash
		if cash < 0 {
			s.Shortfall = math.Round(-cash)
			reasons = append(reasons, fmt.Sprintf("You're about $%s short when you %s.", Fmt(-cash), map[string]string{
				"book": "book", "sign": "sign the lease", "keys": "get your keys",
			}[p.id]))
			cash = 0
		}
		s.CPFPart, s.CashPart = math.Round(fromCPF), math.Round(fromCash)
		s.PaidFrom = paidFromLabel(fromCPF, fromCash)
		if !nextMarked {
			s.Status, nextMarked = "next", true
		} else {
			s.Status = "upcoming"
		}
		stops = append(stops, s)
	}
	advance(mKeys)

	// With an HDB loan you keep up to $20,000 of CPF OA; the rest cuts the loan.
	cpfToLoan := 0.0
	if in.LoanType == "hdb" && stage < 3 && cpf > CPFRetain {
		cpfToLoan = math.Min(cpf-CPFRetain, loanAmount)
		cpfToLoan = math.Round(cpfToLoan)
		loanAmount -= cpfToLoan
		cpf -= cpfToLoan
	}

	monthly := math.Round(MonthlyPayment(loanAmount, loan.Rate, tenure))
	monthlyFromCPF := monthlyOA >= monthly
	loanFrom := "Monthly CPF"
	if !monthlyFromCPF {
		loanFrom = "CPF + cash"
	}
	loanStatus := "upcoming"
	if stage >= 3 {
		loanStatus = "next"
	}
	stops = append(stops, Stop{
		ID: "loan", Title: "Pay off the loan", Month: keyAt.Format("2006-01"), MonthsAway: mKeys,
		Amount: monthly, PaidFrom: loanFrom, Color: "green", Monthly: true, Status: loanStatus,
		Breakdown: []Item{{fmt.Sprintf("%s of $%s over %d years at %.1f%%", loan.Label, Fmt(loanAmount), tenure, loan.Rate*100), monthly}},
	})

	// ---- Checks ----
	diaOK := DIAEligible(in)
	if tenure <= 0 {
		reasons = append(reasons, fmt.Sprintf("A loan has to be paid off by age %d, so you may not get one at your ages.", LoanEndAge))
	}
	if in.LoanType == "hdb" && income > IncomeCeiling {
		reasons = append(reasons, fmt.Sprintf("Household income above $%s a month is over the HDB loan ceiling.", Fmt(IncomeCeiling)))
	}
	if extraForIncome > 0 && tenure > 0 {
		notes = append(notes, fmt.Sprintf("Your income supports a loan of about $%s, so you'll pay $%s more at key collection.", Fmt(loanAmount+cpfToLoan), Fmt(extraForIncome)))
	}
	if cpfToLoan > 0 {
		notes = append(notes, fmt.Sprintf("With an HDB loan you keep up to $%s in CPF OA; about $%s more goes to cut the loan at key collection.", Fmt(CPFRetain), Fmt(cpfToLoan)))
	}
	if in.Scheme == "dia" && !diaOK {
		notes = append(notes, fmt.Sprintf("Deferred Income Assessment is for couples where one of you is a full-time student or in NS (or finished in the last 12 months), and one of you is %d or younger.", DIAMaxAge))
	}
	if in.Scheme != "dia" && diaOK && stage < 2 {
		notes = append(notes, "You may qualify for Deferred Income Assessment: pay just 2.5% when you sign the lease.")
	}

	cashLeft := math.Round(cash)
	verdict := "ok"
	switch {
	case len(reasons) > 0:
		verdict = "no"
	case cashLeft < 10000 || !monthlyFromCPF:
		verdict = "tight"
	}

	return Result{
		Inputs: in,
		Loan: LoanResult{
			Loan: loan, Amount: loanAmount, MaxByLTV: maxByLTV, MaxByIncome: maxByIncome,
			CPFToLoan: cpfToLoan, TenureYears: tenure, Monthly: monthly,
			Criteria: criteria(in, loan, tenure, avgAgeAtKeys, monthly, cpfToLoan, diaOK),
		},
		Scheme:         scheme,
		Stops:          stops,
		Grant:          grant,
		BookingFee:     booking,
		StampDuty:      duty,
		MonthsToKeys:   mKeys,
		KeyMonth:       keyAt.Format("2006-01"),
		SavingsMonthly: savingsMonthly,
		SavedByKeys:    math.Round(savingsMonthly * float64(mKeys)),
		CashLeft:       cashLeft,
		CPFLeft:        math.Round(cpf),
		MonthlyOA:      math.Round(monthlyOA),
		PaidSoFar:      paidSoFar,
		DIAEligible:    diaOK,
		Verdict:        verdict,
		Reasons:        nonNil(reasons),
		Notes:          nonNil(notes),
	}
}

func criteria(in Inputs, loan Loan, tenure int, avgAge, monthly, cpfToLoan float64, diaOK bool) []Criterion {
	status := func(ok bool) string {
		if ok {
			return "ok"
		}
		return "fail"
	}
	msrCap := in.Income * MSR
	c := []Criterion{
		{
			Label:  fmt.Sprintf("Borrow up to %g%% of the flat price", loan.LTV*100),
			Detail: fmt.Sprintf("Up to $%s for this flat.", Fmt(in.Price*loan.LTV)),
			Status: "info",
		},
		{
			Label:  "Monthly payment within 30% of your income",
			Detail: fmt.Sprintf("Up to $%s a month for you. Yours would be $%s.", Fmt(msrCap), Fmt(monthly)),
			Status: status(monthly <= msrCap+0.5),
		},
		{
			Label:  fmt.Sprintf("Paid off by age %d, for at most %d years", LoanEndAge, loan.Years),
			Detail: fmt.Sprintf("Your average age at key collection is about %d, so you get %d years. A longer loan means a bigger one.", int(avgAge), tenure),
			Status: map[bool]string{true: "ok", false: "warn"}[tenure >= loan.Years],
		},
	}
	if in.LoanType == "hdb" {
		c = append(c,
			Criterion{
				Label:  fmt.Sprintf("Household income up to $%s a month", Fmt(IncomeCeiling)),
				Detail: fmt.Sprintf("Yours is $%s.", Fmt(in.Income)),
				Status: status(in.Income <= IncomeCeiling),
			},
			Criterion{
				Label:  fmt.Sprintf("Use your CPF OA first, keeping up to $%s", Fmt(CPFRetain)),
				Detail: retainDetail(cpfToLoan),
				Status: "info",
			},
			Criterion{
				Label:  "Steady income for the past 12 months",
				Detail: map[bool]string{true: "Under Deferred Income Assessment, HDB checks your income just before key collection.", false: "HDB looks at your average income over the last 12 months."}[in.Scheme == "dia"],
				Status: "info",
			},
			Criterion{Label: "No private property in the last 30 months", Detail: "Neither of you can have owned or sold private property in the 30 months before applying.", Status: "info"},
			Criterion{Label: "At least one of you is a Singapore Citizen", Detail: "Needed for an HDB loan.", Status: "info"},
		)
	} else {
		c = append(c,
			Criterion{Label: "All your debts within 55% of your income", Detail: "Banks also apply the Total Debt Servicing Ratio, so car loans and other debts lower what you can borrow.", Status: "info"},
			Criterion{Label: "5% of the price in cash", Detail: fmt.Sprintf("About $%s, paid at signing and key collection.", Fmt(in.Price*loan.MinCashPct)), Status: "info"},
		)
	}
	c = append(c, Criterion{
		Label:  "A valid HDB Flat Eligibility (HFE) letter",
		Detail: "You need it before you can book a flat. It tells you how much HDB will lend you.",
		Status: "info",
	})
	if in.Student {
		c = append(c, Criterion{
			Label:  "Deferred Income Assessment",
			Detail: map[bool]string{true: "You look eligible: pay 2.5% at signing and have your income assessed just before key collection.", false: fmt.Sprintf("One of you needs to be %d or younger to qualify.", DIAMaxAge)}[diaOK],
			Status: map[bool]string{true: "ok", false: "warn"}[diaOK],
		})
	}
	return c
}

func retainDetail(cpfToLoan float64) string {
	if cpfToLoan > 0 {
		return fmt.Sprintf("About $%s of your CPF goes to cut the loan at key collection.", Fmt(cpfToLoan))
	}
	return "You won't have more than that left, so your loan isn't reduced."
}

func nonNil(s []string) []string {
	if s == nil {
		return []string{}
	}
	return s
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
