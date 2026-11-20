# Our Home — crib planner

A phone-first BTO flat payment planner. It turns the numbers into a picture:
a winding **road to your keys** with a stop for each payment.

Design: [`docs/design-summary.md`](docs/design-summary.md) (concept C, "Road to your keys").

## Stack

| Part | Tech | Folder |
| --- | --- | --- |
| Frontend | React 19 + TypeScript, built with Vite | [`frontend/`](frontend) |
| Backend | Go (standard library only) | [`backend/`](backend) |

The Go backend owns all the payment maths (`backend/internal/calc`) and exposes it as a JSON API.
The React app calls it as you type. In production, the Go server also serves the built React app,
so there is a single server to deploy. Answers are saved in the browser (`localStorage`); there are no accounts yet.

## Run it

You need Go 1.22+ and Node 20+.

```bash
make install    # install frontend packages
```

For development, run these in two terminals, then open http://localhost:5173:

```bash
make dev-backend    # Go API on :8081
```

```bash
make dev-frontend   # Vite dev server on :5173, forwards /api to :8081
```

For production, build the frontend and serve everything from Go on http://localhost:8081:

```bash
make build && make serve
```

Tests (Go unit and API tests, plus a TypeScript type check):

```bash
make test
```

## API

| Method | Path | What it does |
| --- | --- | --- |
| `GET` | `/api/health` | `{"status":"ok"}` |
| `GET` | `/api/defaults` | The design's example inputs |
| `POST` | `/api/calculate` | Inputs in, payment stops and verdict out |

Example:

```bash
curl -X POST localhost:8081/api/calculate -d '{"flatType":"4-room","price":400000,"income":7000,"cpfA":25000,"cpfB":20000,"cash":93000,"loanType":"hdb"}'
```

Missing fields fall back to the example values. Unknown fields, unknown flat or loan types,
and negative amounts get a `400` with an `error` message.

## Screens

- **First-time setup:** seven questions, one per screen: flat, where you are in the process
  (with estimated signing and key dates), your ages and whether either of you is a student or in NS,
  combined income, both CPF OA balances, cash today plus what you each save a month, and loan and downpayment scheme.
  If you look eligible for Deferred Income Assessment, it is picked for you.
- **Road to your keys:** the verdict, cash left for renovation at key collection (savings included),
  a "Next up" card, and the four stops. Paid stops are ticked off.
- **Appointment details (tap a stop):** what's due and why, how much comes from CPF and cash,
  what you'll have by then, a checklist you can tick, and "Different amount from HDB?" to replace our estimate.
- **Edit my numbers:** change any answer.
- **Budget:** how the renovation budget adds up, and **Getting the biggest loan**: your expected loan,
  what limits it, and each criterion with whether you meet it. **Vendors:** placeholder for now.

## How the numbers work

Every assumption is a named constant at the top of [`backend/internal/calc/calc.go`](backend/internal/calc/calc.go).

| Assumption | Value |
| --- | --- |
| Loan limit | 75% of the price (HDB and bank), so the downpayment is 25% |
| Due at signing | Standard 10%, Staggered 5%, Deferred Income Assessment 2.5% of the price, less the option fee, plus stamp duty and ~$350 fees |
| Due at keys | the rest of the downpayment, plus ~$350 fees |
| HDB loan | 2.6%, up to 25 years, must end by 65 (simple average of your ages), payment ≤ 30% of income, income ≤ $14,000 |
| CPF retention (HDB loan) | keep up to $20,000 in CPF OA; the rest cuts the loan at key collection |
| Bank loan | 3.0%, 25 years, 5% of the price in cash |
| DIA eligibility | either of you is a full-time student or in NS (or finished in the last 12 months), and one of you is 30 or under |
| Default dates | signing in 6 months, keys in 42 months (editable) |
| CPF OA contributions | 23% of combined income per month |
| Grant | Enhanced CPF Housing Grant by income band, credited by key collection |
| Already-paid stops | assumed to be reflected in the balances you enter |

CPF is spent first and any gap is topped up from cash. Monthly savings and CPF contributions
build up until each appointment. With the design example ($400,000 4-room, HDB loan,
$7,000/month income, no monthly savings), the stops are $2,000, $44,950 and $60,350, with
$91,000 cash left for renovation. The monthly payment is $1,282 rather than the design's $1,361,
because $17,320 of CPF above the $20,000 retention goes to cut the loan.

Every stop amount can be replaced with the real figure from HDB in the app.

These are planning estimates, not official figures. Check with HDB and CPF before committing.
