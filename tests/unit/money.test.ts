import assert from 'node:assert/strict';
import test from 'node:test';
import {
  currencySymbolFor,
  formatCurrencyAmount,
  formatMinorUnits,
} from '../../src/lib/money';

test('VND uses dong as its smallest unit and displays the dong symbol', () => {
  assert.equal(currencySymbolFor('VND'), '₫');
  assert.match(formatMinorUnits(1_000_000, 'VND'), /1\.000\.000/);
  assert.match(formatMinorUnits(1_000_000, 'VND'), /₫/);
});

test('currencies with fractional minor units are still divided by 100', () => {
  assert.match(formatMinorUnits(123_45, 'USD'), /123,45|123\.45/);
});

test('estimated order values are formatted as major currency amounts', () => {
  assert.match(formatCurrencyAmount(2_500_000, 'VND'), /2\.500\.000/);
});
