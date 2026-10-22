/**
 * LUDO WARRIOR — MONETIZATION & STORE PIPELINE CONFIGURATION
 * ============================================================
 * Per product directive:
 * - Zero advertisements (100% Ad-Free forever).
 * - All in-app purchase (IAP), store, VIP pass, and payment gateway
 *   pipelines are architected and staged in this module, but strictly
 *   switched OFF (`false`) for future upgrades.
 */

export interface MonetizationPipelineFlags {
  /** Master kill-switch for all real-money purchase flows */
  MASTER_MONETIZATION_ENABLED: boolean;
  /** In-App Purchase Coin & Gem Vault bundles */
  IAP_CURRENCY_PACKS_ENABLED: boolean;
  /** Seasonal "Imperial War Pass" premium tier upgrade */
  ROYAL_WAR_PASS_IAP_ENABLED: boolean;
  /** Monthly "Sovereign VIP" subscription pipeline */
  VIP_SUBSCRIPTION_PIPELINE_ENABLED: boolean;
  /** Exclusive Mythic Board & Pawn skin direct purchase pipeline */
  MYTHIC_ARMORY_DIRECT_BUY_ENABLED: boolean;
  /** Tournament entry ticket real-money top-up pipeline */
  TOURNAMENT_TICKET_IAP_ENABLED: boolean;
  /** Payment gateway providers (Stripe / Razorpay / Apple IAP / Google Play Billing) */
  PAYMENT_GATEWAY_LIVE: boolean;
  /** Strict zero-ad policy enforcement */
  ZERO_ADS_ENFORCED: boolean;
}

export const MONETIZATION_PIPELINE_FLAGS: MonetizationPipelineFlags = {
  MASTER_MONETIZATION_ENABLED: false,
  IAP_CURRENCY_PACKS_ENABLED: false,
  ROYAL_WAR_PASS_IAP_ENABLED: false,
  VIP_SUBSCRIPTION_PIPELINE_ENABLED: false,
  MYTHIC_ARMORY_DIRECT_BUY_ENABLED: false,
  TOURNAMENT_TICKET_IAP_ENABLED: false,
  PAYMENT_GATEWAY_LIVE: false,
  ZERO_ADS_ENFORCED: true,
};

export interface StagedStoreProduct {
  sku: string;
  category: 'gold_pack' | 'gem_vault' | 'war_pass' | 'vip_membership' | 'mythic_bundle';
  title: string;
  subtitle: string;
  priceUSD: number;
  priceINR: number;
  grants: {
    gold?: number;
    gems?: number;
    unlockSkinId?: string;
    vipDays?: number;
  };
  badge?: string;
  pipelineStage: 'DORMANT_READY' | 'STAGED_FOR_V2' | 'GATEWAY_LOCKED';
}

/**
 * Staged product catalog kept in the pipeline for future upgrades.
 * While `MASTER_MONETIZATION_ENABLED` is `false`, these items cannot be charged
 * and all gameplay cosmetics remain earnable through in-game matches & XP.
 */
export const STAGED_STORE_CATALOG: StagedStoreProduct[] = [
  {
    sku: 'lw_gold_pouch_10k',
    category: 'gold_pack',
    title: 'Squire’s Gold Coffer',
    subtitle: '10,000 Imperial Gold Coins',
    priceUSD: 0.99,
    priceINR: 79,
    grants: { gold: 10000 },
    pipelineStage: 'DORMANT_READY',
  },
  {
    sku: 'lw_gold_treasury_100k',
    category: 'gold_pack',
    title: 'Warlord’s War Chest',
    subtitle: '100,000 Imperial Gold + 50 Valor Gems',
    priceUSD: 4.99,
    priceINR: 399,
    grants: { gold: 100000, gems: 50 },
    badge: 'MOST POPULAR (PIPELINE)',
    pipelineStage: 'DORMANT_READY',
  },
  {
    sku: 'lw_gems_astral_500',
    category: 'gem_vault',
    title: 'Astral Gem Reliquary',
    subtitle: '500 Valor Gems for Mythic Armory',
    priceUSD: 7.99,
    priceINR: 649,
    grants: { gems: 500 },
    pipelineStage: 'DORMANT_READY',
  },
  {
    sku: 'lw_season1_imperial_pass',
    category: 'war_pass',
    title: 'Season I: Imperial War Pass',
    subtitle: '30 Tiers of Sovereign Skins, Custom Dice & Animated Emotes',
    priceUSD: 3.99,
    priceINR: 299,
    grants: { gold: 50000, gems: 200, unlockSkinId: 'celestial_astral' },
    badge: 'SEASONAL PIPELINE',
    pipelineStage: 'STAGED_FOR_V2',
  },
  {
    sku: 'lw_sovereign_vip_monthly',
    category: 'vip_membership',
    title: 'Sovereign Crown VIP (30 Days)',
    subtitle: 'Golden Nameplate, Custom Room Themes & 2x Match XP',
    priceUSD: 2.99,
    priceINR: 249,
    grants: { gold: 30000, gems: 120, vipDays: 30 },
    pipelineStage: 'GATEWAY_LOCKED',
  },
];

export interface CheckoutAttemptResult {
  allowed: boolean;
  pipelineStatus: 'OFF_BY_DIRECTIVE';
  message: string;
  timestamp: string;
}

/**
 * Stub checkout handler that intercepts any purchase call and returns
 * a clean dormant-pipeline response while flags are off.
 */
export function requestStagedCheckout(sku: string): CheckoutAttemptResult {
  const product = STAGED_STORE_CATALOG.find((p) => p.sku === sku);
  return {
    allowed: false,
    pipelineStatus: 'OFF_BY_DIRECTIVE',
    message: `Purchase pipeline for "${product?.title ?? sku}" is staged and currently switched OFF. Earn all rewards free via gameplay!`,
    timestamp: new Date().toISOString(),
  };
}
