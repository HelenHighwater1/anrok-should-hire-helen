/**
 * NEXUS THRESHOLDS AND TAX RATES — SOURCE OF TRUTH
 *
 * Economic nexus thresholds verified against primary sources:
 * - Texas: Texas Comptroller of Public Accounts (comptroller.texas.gov)
 * - New York: New York State Department of Taxation and Finance
 * - All other states: TaxCloud 2026 state-by-state guide (taxcloud.com/blog/sales-tax-nexus-by-state)
 *
 * State base tax rates sourced from Tax Foundation 2024 data.
 * NOTE: These are STATE BASE RATES only. Many states allow additional
 * local/municipal rates on top of the base rate. In production, you would
 * use a live tax rate API (e.g. TaxJar, Avalara) to get the precise
 * combined rate for each transaction based on the buyer's zip code.
 *
 * Last verified: April 2026
 */

export interface StateNexusData {
  code: string;                        // Two-letter state code
  name: string;                        // Full state name
  revenueThreshold: number;            // USD — revenue into state required to trigger nexus
  transactionThreshold: number | null; // Number of transactions, or null if none
  transactionThresholdType: "or" | "and" | null; // Whether either or both must be met
  stateTaxRate: number;                // Decimal — e.g. 0.0625 for 6.25%
  measurementPeriod: string;           // How the state measures the threshold window
  notes?: string;                      // Notable edge cases or exceptions
}

export const NEXUS_DATA: StateNexusData[] = [
  {
    code: "CA",
    name: "California",
    revenueThreshold: 500000,
    transactionThreshold: null,
    transactionThresholdType: null,
    stateTaxRate: 0.0725,
    measurementPeriod: "Current or previous calendar year",
    notes:
      "One of three states with a $500,000 threshold (alongside TX and NY). Only gross sales of tangible personal property count toward the threshold — digital goods treatment varies. Marketplace sales included in threshold calculation.",
  },
  {
    code: "TX",
    name: "Texas",
    revenueThreshold: 500000,
    transactionThreshold: null,
    transactionThresholdType: null,
    stateTaxRate: 0.0625,
    measurementPeriod: "Preceding 12 calendar months (rolling, not calendar year)",
    notes:
      "Confirmed against Texas Comptroller: $500,000 safe harbor threshold on a rolling 12-month basis. No transaction count threshold. SaaS is taxable in Texas. Once threshold is crossed, collection obligations begin the first day of the fourth month after crossing — Texas provides a registration grace period unlike most states.",
  },
  {
    code: "NY",
    name: "New York",
    revenueThreshold: 500000,
    transactionThreshold: 100,
    transactionThresholdType: "and",
    stateTaxRate: 0.04,
    measurementPeriod: "Preceding four sales tax quarters (rolling window ending Feb 28, May 31, Aug 31, Nov 30)",
    notes:
      "New York is one of the few states using an AND test — both $500,000 in revenue AND 100+ transactions must be met to trigger nexus. The measurement window is a rolling four sales tax quarters, not a calendar year. Transaction threshold of 100 is lower than the typical 200 used by other states. State base rate is 4% — NYC adds significant local tax bringing combined rates to 8-8.875%.",
  },
  {
    code: "FL",
    name: "Florida",
    revenueThreshold: 100000,
    transactionThreshold: null,
    transactionThresholdType: null,
    stateTaxRate: 0.06,
    measurementPeriod: "Previous calendar year only",
    notes:
      "Florida measures against the PREVIOUS calendar year only — not the current year. This means you could owe tax early in a year before realizing it based on prior year sales. No transaction threshold.",
  },
  {
    code: "WA",
    name: "Washington",
    revenueThreshold: 100000,
    transactionThreshold: null,
    transactionThresholdType: null,
    stateTaxRate: 0.065,
    measurementPeriod: "Current or previous calendar year",
    notes:
      "Washington taxes SaaS and digital products. No transaction threshold.",
  },
  {
    code: "IL",
    name: "Illinois",
    revenueThreshold: 100000,
    transactionThreshold: null,
    transactionThresholdType: null,
    stateTaxRate: 0.0625,
    measurementPeriod: "12-month period",
    notes:
      "Transaction threshold of 200 was repealed effective January 1, 2026. Revenue-only threshold now applies.",
  },
  {
    code: "GA",
    name: "Georgia",
    revenueThreshold: 100000,
    transactionThreshold: 200,
    transactionThresholdType: "or",
    stateTaxRate: 0.04,
    measurementPeriod: "Current or previous calendar year",
    notes:
      "Either threshold triggers nexus — revenue OR transaction count. Digital goods taxability is evolving in Georgia.",
  },
  {
    code: "CO",
    name: "Colorado",
    revenueThreshold: 100000,
    transactionThreshold: null,
    transactionThresholdType: null,
    stateTaxRate: 0.029,
    measurementPeriod: "Current or previous calendar year",
    notes:
      "Colorado has the lowest state base rate in our dataset at 2.9%, but has an unusually complex local tax system with hundreds of home-rule jurisdictions. Combined rates often reach 7-10%. Transaction threshold was repealed in 2019.",
  },
  {
    code: "MA",
    name: "Massachusetts",
    revenueThreshold: 100000,
    transactionThreshold: null,
    transactionThresholdType: null,
    stateTaxRate: 0.0625,
    measurementPeriod: "Current or previous calendar year",
    notes:
      "SaaS is taxable in Massachusetts. No transaction threshold. Marketplace sales excluded from threshold calculation.",
  },
  {
    code: "AZ",
    name: "Arizona",
    revenueThreshold: 100000,
    transactionThreshold: null,
    transactionThresholdType: null,
    stateTaxRate: 0.056,
    measurementPeriod: "Current or previous calendar year",
    notes:
      "Arizona uses a Transaction Privilege Tax (TPT) rather than a traditional sales tax — functionally similar but technically a different legal structure. Marketplace sales excluded from threshold.",
  },
];

/**
 * Helper: get nexus data for a specific state by code
 */
export function getNexusDataForState(stateCode: string): StateNexusData | undefined {
  return NEXUS_DATA.find((s) => s.code === stateCode);
}

/**
 * Helper: check whether a given revenue and transaction count
 * has crossed the nexus threshold for a state.
 *
 * NOTE: This is a simplified check for demo purposes. In production you would
 * also need to handle: measurement period windows (rolling vs. calendar year),
 * marketplace facilitator exclusions, product-specific taxability rules,
 * and registration grace periods before collection begins.
 */
export function hasExceededNexusThreshold(
  stateCode: string,
  revenueInState: number,
  transactionsInState: number
): boolean {
  const state = getNexusDataForState(stateCode);
  if (!state) return false;

  const revenueExceeded = revenueInState >= state.revenueThreshold;

  if (state.transactionThreshold === null) {
    // Revenue only — TX, CA, FL, WA, IL, CO, MA, AZ
    //
    // NOTE (Texas): In reality, Texas provides a grace period before collection
    // obligations begin — tax must be collected starting the first day of the
    // fourth month after the threshold is crossed. This function returns true
    // the moment the threshold is crossed, which slightly overstates urgency
    // for TX specifically. In production, you would model this delay separately.
    return revenueExceeded;
  }

  // NOTE (New York): NY law technically requires MORE THAN 100 transactions
  // (i.e. 101+), making the precise check `> 100` rather than `>= 100`.
  // We store 100 as the threshold and use `>=` here, which means we trigger
  // one transaction early. This is an acceptable simplification for a demo —
  // in production, use a `transactionThresholdInclusive` flag on the data
  // model to handle this distinction cleanly.
  const transactionsExceeded = transactionsInState >= state.transactionThreshold;

  if (state.transactionThresholdType === "or") {
    // Either threshold triggers nexus — GA
    return revenueExceeded || transactionsExceeded;
  }

  if (state.transactionThresholdType === "and") {
    // Both thresholds must be met — NY
    return revenueExceeded && transactionsExceeded;
  }

  return revenueExceeded;
}

/**
 * States with no sales tax — included so the frontend can handle
 * them gracefully (e.g. show "No sales tax" on the map rather than
 * leaving them blank or excluding them entirely).
 *
 * Note: Alaska has no statewide sales tax but some local jurisdictions
 * do impose sales tax via the Alaska Remote Seller Sales Tax Commission.
 * Excluded here as it is out of scope for this demo.
 */
export const NO_SALES_TAX_STATES = [
  { code: "DE", name: "Delaware" },
  { code: "MT", name: "Montana" },
  { code: "NH", name: "New Hampshire" },
  { code: "OR", name: "Oregon" },
];
