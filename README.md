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

- **First-time setup:** six questions, one per screen: flat, combined income, your CPF OA,
  your partner's CPF OA, cash saved, and HDB or bank loan. Each one gives instant feedback, such as the grant estimate.
- **Road to your keys:** the verdict ("You can afford it"), cash left for renovation, and four
  stops: book, sign the lease, get your keys, and the monthly loan.
- **Edit my numbers:** a sheet that slides up to change any input, then "Show my road".
- **Budget:** what's left at key collection. **Vendors:** placeholder for now.

## How the numbers work

Every assumption is a named constant at the top of [`backend/internal/calc/calc.go`](backend/internal/calc/calc.go).

| Assumption | Value |
| --- | --- |
| Loan-to-value (HDB and bank) | 75% |
| HDB loan | 2.6%, 25 years |
| Bank loan | 3.0%, 25 years, 5% of price in cash |
| Due at signing | 10% of price − booking fee + stamp duty + ~$350 fees |
| Due at keys | rest of the 25% downpayment + ~$350 fees |
| CPF OA contributions | 23% of combined income per month |
| Grant | Enhanced CPF Housing Grant by income band, credited by key collection |
| Affordability | money never runs out at a stop, and the loan is ≤ 30% of income (MSR) |

CPF is spent first and any gap is topped up from cash. With the design example
($400,000 4-room, HDB loan, $7,000/month income), the stops are $2,000, $44,950, $60,350
and $1,361 a month, with $91,000 cash left for renovation.

These are planning estimates, not official figures. Check with HDB and CPF before committing.
