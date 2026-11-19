# Our Home — crib planner

A phone-first BTO flat payment planner. It turns the numbers into a picture:
a winding **road to your keys** with a stop for each payment.

Design: [`docs/design-summary.md`](docs/design-summary.md) (concept C, "Road to your keys").

## Screens

- **First-time setup (C2):** six questions, one per screen: flat, combined income, your CPF OA,
  your partner's CPF OA, cash saved, and HDB or bank loan. Each one gives instant feedback, such as the grant estimate.
- **Road to your keys (C):** the verdict ("You can afford it"), cash left for renovation, and four
  stops: book, sign the lease, get your keys, and the monthly loan.
- **Edit my numbers (C3):** a sheet that slides up to change any input, then "Show my road".
- **Budget:** what's left at key collection. **Vendors:** placeholder for now.

Inputs are saved in the browser (`localStorage`).

## Run

No build step and no dependencies.

```bash
npm start      # serves on http://localhost:8080
```

```bash
npm test       # calculator tests (Node 20+)
```

## How the numbers work

All logic is in [`src/calc.js`](src/calc.js); every assumption is a named constant at the top.

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
