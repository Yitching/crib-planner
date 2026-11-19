import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calculate, estimateGrant, stampDuty, DEFAULT_INPUTS } from '../src/calc.js';

test('design example: $400k 4-room with HDB loan', () => {
  const r = calculate(DEFAULT_INPUTS);
  const byId = Object.fromEntries(r.stops.map((s) => [s.id, s]));
  assert.equal(byId.book.amount, 2000);
  assert.equal(byId.book.paidFrom, 'Cash');
  assert.equal(byId.sign.amount, 44950);
  assert.equal(byId.sign.paidFrom, 'CPF');
  assert.equal(byId.keys.amount, 60350);
  assert.equal(byId.keys.paidFrom, 'CPF');
  assert.equal(byId.loan.amount, 1361);
  assert.equal(byId.loan.paidFrom, 'Monthly CPF');
  assert.equal(r.loan.amount, 300000);
  assert.equal(r.cashLeft, 91000);
  assert.equal(r.verdict, 'ok');
});

test('grant estimate for $7,000 combined income', () => {
  assert.equal(estimateGrant(7000), 30000);
  assert.equal(estimateGrant(1000), 120000);
  assert.equal(estimateGrant(9001), 0);
});

test('stamp duty on $400k', () => {
  assert.equal(stampDuty(400000), 6600);
});

test('CPF shortfall is topped up from cash', () => {
  const r = calculate({ ...DEFAULT_INPUTS, cpfA: 0, cpfB: 0 });
  assert.equal(r.stops[1].paidFrom, 'CPF + cash');
  assert.ok(r.cashLeft < 91000);
});

test('not affordable when cash and CPF run out', () => {
  const r = calculate({ ...DEFAULT_INPUTS, cpfA: 0, cpfB: 0, cash: 5000 });
  assert.equal(r.verdict, 'no');
  assert.ok(r.reasons.length > 0);
});

test('not affordable when monthly payment breaks MSR', () => {
  const r = calculate({ ...DEFAULT_INPUTS, income: 3000, price: 700000 });
  assert.equal(r.verdict, 'no');
});

test('bank loan needs 5% cash at signing', () => {
  const r = calculate({ ...DEFAULT_INPUTS, loanType: 'bank' });
  assert.equal(r.stops[1].paidFrom, 'CPF + cash');
  assert.equal(r.cashLeft, 93000 - 20000);
});
