# House App Design Summary

Nov 19, 2026 · @ching

## Overview

The canvas "House App Theme Options" holds 9 phone screens (390 × 844 px) for the BTO calculator, in two rows. The top row compares 4 colour themes on the same results screen. The bottom row tries 3 more graphical concepts, then expands the chosen one, "Road to your keys", into a full flow.

| Row | Screens | Purpose |
| --- | --- | --- |
| Four theme options | 1 Calm Sage, 2 Bold Coral, 3 Night Mint, 4 Soft Pastel | Same content, different look |
| More graphical concepts | A Floor by floor, B Savings jars, C Road to your keys | Turn the numbers into a picture |
| Chosen flow (same row) | C2 First time setup, C3 Edit my numbers | How inputs work around the road screen |

All screens use the same example: a $400,000 4-room flat with an HDB loan, $91,000 cash left for renovation at key collection, and a $1,361 monthly loan payment.

## Theme options

The four themes show the same results screen, so only the look changes. Each has a header ("Our Home" / "How much will we pay?"), a verdict card, four payment rows with a CPF vs cash bar, and a bottom tab bar (Calculator, Budget, Vendors).

| Theme | Background | Accent colours | Font | Corners | Feel |
| --- | --- | --- | --- | --- | --- |
| 1 Calm Sage | Pale sage #F3F6F1 | Green #2F6B4F (CPF), gold #C9A227 (cash) | DM Sans | 18 px | Calm, reassuring |
| 2 Bold Coral | White #FFFFFF | Black #111111 (CPF), coral #E8553A (cash) | Space Grotesk headings, Inter body | 10 px | Confident, high contrast |
| 3 Night Mint | Navy #0E1A2B | Blue #6FA8FF (CPF), mint #5BE3B1 (cash) | Inter | 16 px | Dark mode, premium |
| 4 Soft Pastel | Lilac #F7F3FF | Purple #6B4FD8 (CPF), peach #F29E6D (cash) | Plus Jakarta Sans | 24 px | Friendly, playful |

These were judged too plain, which led to the graphical concepts below.

## Graphical concepts

Three concepts turn the payments into a picture you can read without finance knowledge. Concept C, Road to your keys, was chosen.

| Concept | The picture | Headline | Style |
| --- | --- | --- | --- |
| A Floor by floor | An HDB block where each floor is one payment, sized by amount: $2,000 booking, $44,950 signing, $60,350 keys, $300,000 loan on top | Tilted yellow sticker: "You can afford it! $91,000 left for reno" | Retro poster: cream, black, coral, yellow; Space Grotesk |
| B Savings jars | Two jars, CPF and cash, filled to what you'll have at keys; the darker part goes to the flat, the bright part is left over (CPF $66,900, cash $91,000) | "$91,000 free cash for your renovation" in large mint type | Night sky: navy, mint, blue; Inter |
| C Road to your keys (chosen) | A winding road with a stop for each payment, ending at an illustrated house | Green pill: "You can afford it" | Lilac, peach, yellow and purple; Plus Jakarta Sans |

In concept B the four payments also appear as small chips: Book $2k, Sign $45k, Keys $60k, Monthly $1.4k.

## The chosen flow

New users answer one question per screen, then land on the road; after that, a pull-up sheet changes any number and takes them back to the road.

1. **C2 First time: one question per screen.** Back link, six progress dots and "2 of 6" at the top, with a house illustration on a yellow sun. The example screen asks "How much do you earn together each month?" with a large $7,000 input and a payslip hint. A green card gives instant feedback: "Nice! You may get about $30,000 in housing grants." A full-width Next button sits at the bottom.
2. **C Road to your keys.** Header "Our Home / The road to your keys", a "You can afford it" pill and an "Edit my numbers" button. Four cards sit along the road, alternating sides, then the house. A dark pill tab bar holds Calculator, Budget and Vendors.
3. **C3 Edit my numbers.** A white sheet slides up over the dimmed road. It holds flat size chips, flat price, income (with the grant estimate), each partner's CPF OA side by side, cash saved, and HDB vs bank chips. "Show my road" and the close button both return to the road.

The stops on the road:

| Stop | When | Amount | Paid from |
| --- | --- | --- | --- |
| Book your flat | Today | $2,000 | Cash (booking fee) |
| Sign the lease | In \~6 months | $44,950 | CPF |
| Get your keys | In \~3.5 years | $60,350 | CPF |
| Pay off the loan | Then, monthly | $1,361 | Monthly CPF |

In Play mode, "Edit my numbers" opens C3, and "Show my road" or close returns to C.

## Design details

The chosen screens share one small system: Plus Jakarta Sans, a lilac ground, and bold ink outlines on flat illustrations.

| Token | Value | Used for |
| --- | --- | --- |
| Background | Lilac #EFE8FF | Screen ground, input fields |
| Ink | #2A2340 | Text, outlines, tab bar, primary button |
| Muted text | #5F5677 | Hints, secondary labels |
| Purple | #6B4FD8 | Accent label, selected chips, sheet button, signing stop |
| Peach | #FF9E6D | House roof, booking stop |
| Yellow | #FFD966 | Sun, windows, keys stop, active tab |
| Green | #7BC8A4 | "You can afford it" pill, grant feedback, trees |
| Soft lilac | #E2D6FF / #D6CCF0 | Unselected chip borders, progress dots, sheet handle |

- **Type:** Plus Jakarta Sans. Titles 28–30 px at weight 800; amounts 22 px at 800; small caps labels 11–13 px.
- **Cards:** white, 18 px corners, a hard 4 px drop shadow in ink.
- **Inputs and chips:** 46 px tall inputs on lilac with 14 px corners; chips 44 px tall, purple when selected.
- **Buttons:** pill-shaped, 52–56 px tall; the bottom tab bar is a 54 px dark pill.
- **Accessibility:** touch targets are at least 44 px, and decorative drawings are hidden from screen readers.
- **Tweak:** each screen has one accent colour setting, purple #6B4FD8 by default.
