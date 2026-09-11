import assert from 'node:assert/strict';
import test from 'node:test';
import { PartnerTier } from '@prisma/client';
import {
  referralRateForCompletedOrders,
  sellerPlatformFeeBpsForRevenue,
  shouldCreateReferralCommission,
  tierForCompletedOrders,
} from '../../src/lib/commission-policy';

test('KOL/KOC tier thresholds are 5% / 6% / 7%', () => {
  assert.equal(tierForCompletedOrders(0), PartnerTier.STANDARD);
  assert.equal(referralRateForCompletedOrders(4), 500);
  assert.equal(tierForCompletedOrders(5), PartnerTier.VIP);
  assert.equal(referralRateForCompletedOrders(9), 600);
  assert.equal(tierForCompletedOrders(10), PartnerTier.SVIP);
  assert.equal(referralRateForCompletedOrders(100), 700);
});

test('SMEE seller fee stays between 15% and 20%', () => {
  assert.equal(sellerPlatformFeeBpsForRevenue(0), 2000);
  assert.equal(sellerPlatformFeeBpsForRevenue(10_000_000_000), 1800);
  assert.equal(sellerPlatformFeeBpsForRevenue(50_000_000_000), 1500);
});

test('a seller never receives an extra referral commission on the same order', () => {
  assert.equal(shouldCreateReferralCommission('affiliate-1', 'affiliate-1'), false);
  assert.equal(shouldCreateReferralCommission('referrer', 'seller'), true);
  assert.equal(shouldCreateReferralCommission(undefined, 'seller'), false);
});
