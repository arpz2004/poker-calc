# Session Context - UTH Poker Calculator Project

## Project Overview
This is an Ultimate Texas Hold'em (UTH) poker calculator project with:
- Angular frontend (src/app/)
- Native binding backend (poker-simulator/)
- Simulation logic for UTH strategy and hand evaluation
- Test suite for validating basic strategy implementation

## Recent Work Summary

### 1. Fixed Angular Linting Errors
**Issue**: NG8107 error - unnecessary optional chaining operators
**Files Modified**:
- `src/app/app.component.ts` (lines 52-57): Replaced `?.` with `!` non-null assertions for form.get() calls
- `src/app/app.component.html` (line 50): Replaced `simulationForm?.invalid` with `simulationForm.invalid`

**Reasoning**: The form controls are guaranteed to exist (initialized in ngOnInit), so optional chaining was unnecessary. TypeScript then complained about potentially null values, so non-null assertions were added.

### 2. UTH Strategy Learning
Learned UTH rules from Wizard of Odds (https://wizardofodds.com/games/ultimate-texas-hold-em/):

**Game Rules**:
- Single 52-card deck
- Equal bets on Ante and Blind (optional Trips bet)
- Two cards dealt to player and dealer
- Betting structure: 4x preflop, 2x after flop, 1x after river (or fold)
- Dealer needs at least a pair to qualify
- Complex scoring based on dealer qualification and blind bet pay table

**Wizard Strategy**:
- **Large Raise (4x)**: Strategy table exists (content was missing from scraped page)
- **Medium Raise (2x)**: Two pair or better, hidden pair (except pocket deuces), four to a flush with hidden 10+
- **Small Raise (1x)**: Hidden pair or better, less than 21 dealer outs

**Key Concepts**:
- **Hidden pair**: At least one card in hole cards
- **Dealer outs**: Single dealer hole cards that would beat the player
- **Fishy plays**: Your code excludes 4x bets with Ten high or lower (except pocket pairs)

### 3. Test Analysis
Analyzed existing test suite in `poker-simulator/test/binding.spec.ts`:
- Found basic functionality tests for blind payouts, basic strategy preflop rules
- Found tests for excluding fishy plays, postflop 2x rules, post-river 1x rules
- Found tests for known cards scenarios

**Missing Edge Cases Identified**:
1. Exact boundary hands for preflop 4x rules
2. Ace variations between boundaries (A3s, A4s, A5s, A3o, A4o, A5o)
3. King variations between boundaries (K3s, K4s, K3o, K4o)
4. Queen variations (Q7s, Q7o)
5. Jack variations (J9o, J6s, J5s, J4s, J3s, J2s)
6. Pocket pair boundary (33 exact)
7. Dealer outs exact boundary (exactly 21 outs)
8. Four to flush with higher hidden cards (A, K, Q)

### 4. Test Case Development (Completed)
After extensive back-and-forth about hand evaluations and strategy understanding, developed final test cases for high-value edge cases. User confirmed that most boundary cases were already covered by existing tests, so focused on:

**High-Value Edge Cases to Add:**
1. Ace variations (A3s, A4s, A5s, A3o, A4o, A5o) - Common hands
2. Four to flush with hidden A, K, Q - Testing the "10+" threshold
3. Skipped dealer outs exact boundary (too complex to calculate)

**Key Corrections Made During Development:**
- Hand ranking errors: Initially didn't recognize that pair beats high card
- Community card ties: Had to avoid straights/flushes that would create pushes
- Hidden pair definition: Corrected understanding - means at least one card in hole cards, not just both on board
- Preflop thresholds: Realized some hands like JAs would 4x preflop, not check to 2x
- Blind payout rules: Learned that when dealer doesn't qualify, blind pushes for non-qualifying hands
- Board pairs: Recognized that board pairs give dealer qualification

#### Final Confirmed Test Cases (Not Yet Added):

**1. A3s - 4x Preflop Loss**
```
cnToInt(['2s', '9d', 'Th', '5c', '6h', 'Ac', '3s', '7s', '7d'])
```
- Community: 2s, 9d, Th, 5c, 6h
- Player: Ac, 3s
- Dealer: 7s, 7d
- Player best 5: Ac, Th, 9d, 6h, 5c = A-high
- Dealer best 5: 7s, 7d, Th, 9d, 6h = Pair of 7s
- **Winner**: Dealer (pair of 7s beats A-high)
- **Dealer qualifies**: Yes (pair of 7s)
- **Expected profit**: -6 (Ante -1, Blind -1, Play -4)

**2. A4s - 4x Preflop Loss**
```
cnToInt(['2s', '9d', 'Th', '5c', '6h', 'Ac', '4s', '7s', '7d'])
```
- Same pattern as A3s, expected profit = -6

**3. A5s - 4x Preflop Loss**
```
cnToInt(['2s', '9d', 'Th', '5c', '6h', 'Ac', '5s', '7s', '7d'])
```
- Same pattern as A3s, expected profit = -6

**4. A3o - 4x Preflop Loss**
```
cnToInt(['2s', '9d', 'Th', '5c', '6h', 'Ac', '3h', '7s', '7d'])
```
- Same pattern as A3s but offsuit, expected profit = -6

**5. A4o - 4x Preflop Loss**
```
cnToInt(['2s', '9d', 'Th', '5c', '6h', 'Ac', '4h', '7s', '7d'])
```
- Same pattern as A3s but offsuit, expected profit = -6

**6. A5o - 4x Preflop Loss**
```
cnToInt(['2s', '9d', 'Th', '5c', '6h', 'Ac', '5h', '7s', '7d'])
```
- Same pattern as A3s but offsuit, expected profit = -6

**7. Four to Flush with Hidden 10 - 2x Postflop**
```
cnToInt(['3d', '7d', '9d', '2c', '2h', 'Td', '4s', '8s', '5h'])
```
- Community: 3d, 7d, 9d, 2c, 2h (pair of 2s on board)
- Player: Td, 4s (T4o - would check preflop, below JTo threshold)
- Dealer: 8s, 5h
- Player has: 3d, 7d, 9d (community diamonds) + Td (player diamond) = four to flush
- Hidden card to flush: Td (IS 10+)
- No pair in player's hand (4s doesn't match community)
- No straight possibility (2, 3, 7, 9 are not consecutive)
- Player best 5: Pair of 2s with T-kicker
- Dealer best 5: Pair of 2s with 8-kicker
- **Winner**: Player (T-kicker beats 8-kicker)
- **Dealer qualifies**: Yes (pair of 2s from board)
- **Betting decision**: 2x postflop (four to flush with hidden 10+, no pair in hand)
- **Payout**: Ante +1, Blind 0 (pair doesn't qualify for blind pay), Play +2 = +3
- **Expected profit**: +3

**8. Four to Flush with Hidden J - 2x Postflop**
```
cnToInt(['3d', '7d', '9d', '2c', '2h', 'Jd', '4s', '8s', '5h'])
```
- Community: 3d, 7d, 9d, 2c, 2h (pair of 2s on board)
- Player: Jd, 4s (J4o - would check preflop, below JTo threshold)
- Dealer: 8s, 5h
- Player has: 3d, 7d, 9d (community diamonds) + Jd (player diamond) = four to flush
- Hidden card to flush: Jd (IS 10+)
- No pair in player's hand
- No straight possibility
- Player best 5: Pair of 2s with J-kicker
- Dealer best 5: Pair of 2s with 8-kicker
- **Winner**: Player (J-kicker beats 8-kicker)
- **Dealer qualifies**: Yes (pair of 2s from board)
- **Betting decision**: 2x postflop (four to flush with hidden J, no pair in hand)
- **Payout**: Ante +1, Blind 0, Play +2 = +3
- **Expected profit**: +3

**9. Four to Flush with Hidden Q - 2x Postflop**
```
cnToInt(['3d', '7d', '9d', '2c', '2h', 'Qd', '4s', '8s', '5h'])
```
- Community: 3d, 7d, 9d, 2c, 2h (pair of 2s on board)
- Player: Qd, 4s (Q4o - would check preflop, below Q8o threshold)
- Dealer: 8s, 5h
- Player has: 3d, 7d, 9d (community diamonds) + Qd (player diamond) = four to flush
- Hidden card to flush: Qd (IS 10+)
- No pair in player's hand
- No straight possibility
- Player best 5: Pair of 2s with Q-kicker
- Dealer best 5: Pair of 2s with 8-kicker
- **Winner**: Player (Q-kicker beats 8-kicker)
- **Dealer qualifies**: Yes (pair of 2s from board)
- **Betting decision**: 2x postflop (four to flush with hidden Q, no pair in hand)
- **Payout**: Ante +1, Blind 0, Play +2 = +3
- **Expected profit**: +3

**Status**: User confirmed all 9 test cases are accurate and ready to be added to test file.

## UTH Payout Rules Reference

### Blind Bet Pay Table:
- Royal flush: 500 to 1
- Straight flush: 50 to 1
- Four of a kind: 10 to 1
- Full house: 3 to 1
- Flush: 3 to 2
- Straight: 1 to 1
- All other: Push

### Scoring Rules:
- Player wins, dealer qualifies: Blind win, Ante win, Play win
- Player wins, dealer doesn't qualify: Blind win, Ante push, Play win
- Dealer wins, dealer qualifies: Blind lose, Ante lose, Play lose
- Dealer wins, dealer doesn't qualify: Blind lose, Ante push, Play lose
- Tie: All push

### Payout Calculations:
- Ante/Play bets pay 1:1
- Blind pays according to pay table above
- 4x play bet = 4 units, 2x = 2 units, 1x = 1 unit

## Current Preflop 4x Rules (from existing tests):
- AA, KK, QQ, JJ (high pocket pairs)
- A2s+, A2o+ (Ace-high hands)
- K5o+, K2s+ (King-high hands)
- Q8o+, Q6s+ (Queen-high hands)
- JTo, J8s+ (Jack-high hands)
- 33+ (pocket pairs 3+)
- 22 (pocket deuces - 1x, not 4x)

## Files Modified This Session:
1. `src/app/app.component.ts` - Fixed NG8107 optional chaining errors
2. `src/app/app.component.html` - Fixed NG8107 optional chaining error
3. `poker-simulator/test/binding.spec.ts` - Temporarily added edge case tests (then removed at user request)

## Next Steps:
1. Add the 9 confirmed test cases to binding.spec.ts
2. Run tests to ensure they pass
3. Update SESSION_CONTEXT.md with any further developments

## Important Notes:
- Always check for community card ties (straight/flush possibilities) that create pushes
- Verify dealer qualification (needs at least pair) - board pairs count for both player and dealer
- Calculate payouts based on blind bet pay table and dealer qualification
- When dealer doesn't qualify: Ante pushes, Blind wins (if qualifies) or pushes (if doesn't), Play wins
- When dealer qualifies: All bets follow normal win/loss/push rules
- Ensure no duplicate test scenarios
- Use card notation conversion utility: `cnToInt(['card', 'card'])`
- Card suits: c=clubs, d=diamonds, h=hearts, s=spades
- Hand rankings: Royal flush > Straight flush > Four of a kind > Full house > Flush > Straight > Three of a kind > Two pair > One pair > High card
- Always calculate best 5-card hand using any combination of hole cards + community cards
- When designing tests, avoid: straights, flushes, straight flushes, royal flushes unless specifically testing those scenarios
- Preflop 4x thresholds: A2s+, A2o+, K5o+, K2s+, Q8o+, Q6s+, JTo, J8s+, 33+ (22 is 1x)
- Medium raise (2x): Two pair or better, hidden pair (except pocket deuces), four to flush with hidden 10+
- Hidden pair definition: At least one card of the pair is in player's hole cards (not just both on board)
- Fishy plays: Code excludes 4x bets with Ten high or lower (except pocket pairs)