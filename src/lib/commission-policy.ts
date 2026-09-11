import { PartnerTier } from '@prisma/client';

export const PARTNER_TIERS = {
  [PartnerTier.STANDARD]: {
    minimumOrders: 0,
    referralRateBps: 500,
    personalCare: false,
    mediaSupport: false,
  },
  [PartnerTier.VIP]: {
    minimumOrders: 5,
    referralRateBps: 600,
    personalCare: true,
    mediaSupport: false,
  },
  [PartnerTier.SVIP]: {
    minimumOrders: 10,
    referralRateBps: 700,
    personalCare: true,
    mediaSupport: true,
  },
} as const;

export function tierForCompletedOrders(completedOrders: number): PartnerTier {
  if (completedOrders >= PARTNER_TIERS.SVIP.minimumOrders) return PartnerTier.SVIP;
  if (completedOrders >= PARTNER_TIERS.VIP.minimumOrders) return PartnerTier.VIP;
  return PartnerTier.STANDARD;
}

export function referralRateForCompletedOrders(completedOrders: number): number {
  return PARTNER_TIERS[tierForCompletedOrders(completedOrders)].referralRateBps;
}

export function sellerPlatformFeeBpsForRevenue(revenueCents: number): number {
  // SMEE takes 20% initially, 18% from 100m VND and 15% from 500m VND.
  if (revenueCents >= 50_000_000_000) return 1500;
  if (revenueCents >= 10_000_000_000) return 1800;
  return 2000;
}

export function shouldCreateReferralCommission(
  referrerAffiliateId: string | null | undefined,
  sellerAffiliateId: string | null | undefined,
): boolean {
  return Boolean(referrerAffiliateId && referrerAffiliateId !== sellerAffiliateId);
}
