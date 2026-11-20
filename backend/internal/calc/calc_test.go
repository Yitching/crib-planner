package calc

import (
	"strings"
	"testing"
)

func example() Inputs {
	in := DefaultInputs
	in.AsOf = "2026-11"
	return in
}

func stopsByID(r Result) map[string]Stop {
	m := map[string]Stop{}
	for _, s := range r.Stops {
		m[s.ID] = s
	}
	return m
}

func TestDesignExample(t *testing.T) {
	r := Calculate(example())
	s := stopsByID(r)
	want := []struct {
		id       string
		amount   float64
		paidFrom string
		status   string
	}{
		{"book", 2000, "Cash", "next"},
		{"sign", 44950, "CPF", "upcoming"},
		{"keys", 60350, "CPF", "upcoming"},
		// $17,320 of CPF above the $20,000 retention cuts the $300,000 loan.
		{"loan", 1282, "Monthly CPF", "upcoming"},
	}
	for _, w := range want {
		got := s[w.id]
		if got.Amount != w.amount || got.PaidFrom != w.paidFrom || got.Status != w.status {
			t.Errorf("%s: got %v from %q (%s), want %v from %q (%s)", w.id, got.Amount, got.PaidFrom, got.Status, w.amount, w.paidFrom, w.status)
		}
	}
	if r.Loan.MaxByLTV != 300000 || r.Loan.CPFToLoan != 17320 || r.Loan.Amount != 282680 {
		t.Errorf("loan = %+v", r.Loan)
	}
	if r.Loan.TenureYears != 25 {
		t.Errorf("tenure = %d, want 25", r.Loan.TenureYears)
	}
	if r.CashLeft != 91000 || r.CPFLeft != 20000 {
		t.Errorf("cash left = %v, cpf left = %v", r.CashLeft, r.CPFLeft)
	}
	if s["sign"].Month != "2027-05" || s["keys"].Month != "2030-05" || r.MonthsToKeys != 42 {
		t.Errorf("months: sign %s, keys %s, %d to keys", s["sign"].Month, s["keys"].Month, r.MonthsToKeys)
	}
	if r.Verdict != "ok" {
		t.Errorf("verdict = %q, want ok", r.Verdict)
	}
}

func TestMonthlySavingsAddUpByKeys(t *testing.T) {
	in := example()
	in.SaveA, in.SaveB = 600, 400
	r := Calculate(in)
	if r.SavedByKeys != 42000 || r.CashLeft != 91000+42000 {
		t.Errorf("saved by keys = %v, cash left = %v", r.SavedByKeys, r.CashLeft)
	}
	if got := stopsByID(r)["keys"].CashAvailable; got != 93000-2000+42000 {
		t.Errorf("cash available at keys = %v", got)
	}
}

func TestKeyDateChangesTimeline(t *testing.T) {
	in := example()
	in.SaveA = 1000
	in.KeyDate = "2028-11"
	r := Calculate(in)
	if r.MonthsToKeys != 24 || r.SavedByKeys != 24000 {
		t.Errorf("months to keys = %d, saved = %v", r.MonthsToKeys, r.SavedByKeys)
	}
}

func TestAlreadySignedLease(t *testing.T) {
	in := example()
	in.Stage = "signed"
	r := Calculate(in)
	s := stopsByID(r)
	if s["book"].Status != "paid" || s["sign"].Status != "paid" || s["keys"].Status != "next" {
		t.Errorf("statuses: %s %s %s", s["book"].Status, s["sign"].Status, s["keys"].Status)
	}
	if r.PaidSoFar != 46950 {
		t.Errorf("paid so far = %v, want 46950", r.PaidSoFar)
	}
	// Balances are after past payments, so nothing more comes out of cash.
	if r.CashLeft != 93000 {
		t.Errorf("cash left = %v, want 93000", r.CashLeft)
	}
}

func TestDeferredIncomeAssessment(t *testing.T) {
	in := example()
	in.Scheme = "dia"
	s := stopsByID(Calculate(in))
	if s["sign"].Amount != 8000+6600+350 {
		t.Errorf("signing = %v, want 14950", s["sign"].Amount)
	}
	if s["keys"].Amount != 90000+350 {
		t.Errorf("keys = %v, want 90350", s["keys"].Amount)
	}
}

func TestStaggeredDownpayment(t *testing.T) {
	in := example()
	in.Scheme = "staggered"
	if got := stopsByID(Calculate(in))["sign"].Amount; got != 18000+6600+350 {
		t.Errorf("signing = %v, want 24950", got)
	}
}

func TestDIAEligibility(t *testing.T) {
	in := example()
	in.Student, in.AgeA, in.AgeB = true, 31, 29
	if !DIAEligible(in) {
		t.Error("want eligible when one partner is 30 or under")
	}
	in.AgeB = 32
	if DIAEligible(in) {
		t.Error("want not eligible when both are over 30")
	}
	in.Student, in.AgeA = false, 24
	if DIAEligible(in) {
		t.Error("want not eligible without a student or NS partner")
	}
}

func TestIncomeLimitsLoan(t *testing.T) {
	in := example()
	in.Income = 3000
	r := Calculate(in)
	if r.Loan.MaxByIncome >= 300000 || r.Loan.Amount > r.Loan.MaxByIncome {
		t.Errorf("loan = %+v", r.Loan)
	}
	keys := stopsByID(r)["keys"]
	if keys.Amount <= 60350 {
		t.Errorf("keys amount = %v, want more than 60350", keys.Amount)
	}
	if len(r.Notes) == 0 || !strings.Contains(strings.Join(r.Notes, " "), "income supports") {
		t.Errorf("notes = %q", r.Notes)
	}
}

func TestAgeShortensTenure(t *testing.T) {
	in := example()
	in.AgeA, in.AgeB = 50, 50
	if r := Calculate(in); r.Loan.TenureYears != 11 {
		t.Errorf("tenure = %d, want 11", r.Loan.TenureYears)
	}
	in.AgeA, in.AgeB = 70, 70
	if r := Calculate(in); r.Verdict != "no" {
		t.Errorf("verdict = %q, want no", r.Verdict)
	}
}

func TestOverrideAmount(t *testing.T) {
	in := example()
	in.Overrides = map[string]float64{"sign": 40000}
	s := stopsByID(Calculate(in))["sign"]
	if s.Amount != 40000 || !s.Overridden {
		t.Errorf("sign = %+v", s)
	}
}

func TestEstimateGrant(t *testing.T) {
	cases := map[float64]float64{7000: 30000, 1000: 120000, 9001: 0}
	for income, want := range cases {
		if got := EstimateGrant(income); got != want {
			t.Errorf("EstimateGrant(%v) = %v, want %v", income, got, want)
		}
	}
}

func TestStampDuty(t *testing.T) {
	if got := StampDuty(400000); got != 6600 {
		t.Errorf("StampDuty(400000) = %v, want 6600", got)
	}
}

func TestCPFShortfallToppedUpFromCash(t *testing.T) {
	in := example()
	in.CPFA, in.CPFB = 0, 0
	r := Calculate(in)
	if got := stopsByID(r)["sign"].PaidFrom; got != "CPF + cash" {
		t.Errorf("signing paid from %q, want CPF + cash", got)
	}
	if r.CashLeft >= 91000 {
		t.Errorf("cash left = %v, want less than 91000", r.CashLeft)
	}
}

func TestShortfallNamesTheStop(t *testing.T) {
	in := example()
	in.CPFA, in.CPFB, in.Cash = 0, 0, 5000
	r := Calculate(in)
	if r.Verdict != "no" {
		t.Fatalf("verdict = %q, want no", r.Verdict)
	}
	if len(r.Reasons) == 0 || r.Reasons[0] != "You're about $32,290 short when you sign the lease." {
		t.Errorf("reasons = %q", r.Reasons)
	}
	if got := stopsByID(r)["sign"].Shortfall; got != 32290 {
		t.Errorf("shortfall = %v", got)
	}
}

func TestBankLoanNeedsCash(t *testing.T) {
	in := example()
	in.LoanType = "bank"
	r := Calculate(in)
	if got := stopsByID(r)["sign"].PaidFrom; got != "CPF + cash" {
		t.Errorf("signing paid from %q, want CPF + cash", got)
	}
	if r.CashLeft != 93000-20000 {
		t.Errorf("cash left = %v, want 73000", r.CashLeft)
	}
	if r.Loan.CPFToLoan != 0 {
		t.Errorf("bank loans don't use the CPF retention rule")
	}
}

func TestValidate(t *testing.T) {
	ok := example()
	bad := []func(*Inputs){
		func(i *Inputs) { i.FlatType = "mansion" },
		func(i *Inputs) { i.LoanType = "loan-shark" },
		func(i *Inputs) { i.Price = -1 },
		func(i *Inputs) { i.Scheme = "free" },
		func(i *Inputs) { i.Stage = "moved-out" },
		func(i *Inputs) { i.AgeA = 12 },
		func(i *Inputs) { i.KeyDate = "next year" },
		func(i *Inputs) { i.Overrides = map[string]float64{"loan": 1} },
		func(i *Inputs) { i.SaveA = -5 },
	}
	for n, mutate := range bad {
		in := ok
		mutate(&in)
		if in.Validate() == nil {
			t.Errorf("case %d: Validate(%+v) = nil, want error", n, in)
		}
	}
	if err := ok.Validate(); err != nil {
		t.Errorf("default inputs invalid: %v", err)
	}
}

func TestFmt(t *testing.T) {
	cases := map[float64]string{0: "0", 999: "999", 1000: "1,000", 1234567: "1,234,567", -2500: "-2,500"}
	for n, want := range cases {
		if got := Fmt(n); got != want {
			t.Errorf("Fmt(%v) = %q, want %q", n, got, want)
		}
	}
}
