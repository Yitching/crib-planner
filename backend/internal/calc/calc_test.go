package calc

import "testing"

func stopsByID(r Result) map[string]Stop {
	m := map[string]Stop{}
	for _, s := range r.Stops {
		m[s.ID] = s
	}
	return m
}

func TestDesignExample(t *testing.T) {
	r := Calculate(DefaultInputs)
	s := stopsByID(r)
	want := []struct {
		id       string
		amount   float64
		paidFrom string
	}{
		{"book", 2000, "Cash"},
		{"sign", 44950, "CPF"},
		{"keys", 60350, "CPF"},
		{"loan", 1361, "Monthly CPF"},
	}
	for _, w := range want {
		if s[w.id].Amount != w.amount || s[w.id].PaidFrom != w.paidFrom {
			t.Errorf("%s: got %v from %q, want %v from %q", w.id, s[w.id].Amount, s[w.id].PaidFrom, w.amount, w.paidFrom)
		}
	}
	if r.Loan.Amount != 300000 {
		t.Errorf("loan = %v, want 300000", r.Loan.Amount)
	}
	if r.CashLeft != 91000 {
		t.Errorf("cash left = %v, want 91000", r.CashLeft)
	}
	if r.Verdict != "ok" {
		t.Errorf("verdict = %q, want ok", r.Verdict)
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
	in := DefaultInputs
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
	in := DefaultInputs
	in.CPFA, in.CPFB, in.Cash = 0, 0, 5000
	r := Calculate(in)
	if r.Verdict != "no" {
		t.Fatalf("verdict = %q, want no", r.Verdict)
	}
	if len(r.Reasons) == 0 || r.Reasons[0] != "You're about $32,290 short when you sign the lease." {
		t.Errorf("reasons = %q", r.Reasons)
	}
}

func TestMSRBreach(t *testing.T) {
	in := DefaultInputs
	in.Income, in.Price = 3000, 700000
	if r := Calculate(in); r.Verdict != "no" {
		t.Errorf("verdict = %q, want no", r.Verdict)
	}
}

func TestBankLoanNeedsCashAtSigning(t *testing.T) {
	in := DefaultInputs
	in.LoanType = "bank"
	r := Calculate(in)
	if got := stopsByID(r)["sign"].PaidFrom; got != "CPF + cash" {
		t.Errorf("signing paid from %q, want CPF + cash", got)
	}
	if r.CashLeft != 93000-20000 {
		t.Errorf("cash left = %v, want 73000", r.CashLeft)
	}
}

func TestValidate(t *testing.T) {
	bad := []Inputs{
		{FlatType: "mansion", LoanType: "hdb"},
		{FlatType: "4-room", LoanType: "loan-shark"},
		{FlatType: "4-room", LoanType: "hdb", Price: -1},
	}
	for _, in := range bad {
		if in.Validate() == nil {
			t.Errorf("Validate(%+v) = nil, want error", in)
		}
	}
	if err := DefaultInputs.Validate(); err != nil {
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
