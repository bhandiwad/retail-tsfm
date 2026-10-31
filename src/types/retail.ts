export interface HistoricalPoint {
  weekIndex: number;
  weekLabel: string;
  dateLabel: string;
  observedSales: number;
  trueLatentDemand: number;
  censoredUnits: number;
  isStockoutCensored: boolean;
  isPromo: boolean;
  endingInventory: number;
  erpHistoricalForecast: number;
}

export interface ForecastPoint {
  weekIndex: number;
  weekLabel: string;
  isPromo: boolean;
  legacyErpForecast: number;
  classicalForecast: number;
  chronosP10: number;
  chronosP50: number;
  chronosP90: number;
  addlP10: number;
  addlP50: number;
  addlP90: number;
  projectedInventoryStatusQuo: number;
  projectedInventoryApproved: number;
  safetyStockFloor: number;
}

export interface SkuMetrics {
  legacyWape: number;
  statsForecastWape: number;
  chronos2Wape: number;
  addlWape: number;
  excessWeeksBefore: number;
  excessWeeksAfter: number;
  availabilityBefore: number;
  availabilityAfter: number;
  financialImpactUsd: number;
  workingCapitalDeltaUsd: number;
  markdownSavedUsd: number;
  lostSalesPreventedUsd: number;
}

export type ActionType =
  | 'DC_TRANSFER'
  | 'MARKDOWN'
  | 'COLD_START_ALLOCATION'
  | 'BUY_REDUCTION'
  | 'BUY_ADJUSTMENT';

export type DecisionStatus = 'PENDING_REVIEW' | 'APPROVED' | 'MODIFIED' | 'OVERRIDDEN';

export interface SkuRecord {
  skuId: string;
  name: string;
  category: string;
  subcategory: string;
  archetype: 'Promotional' | 'Seasonal' | 'Cold-Start' | 'Established Core' | 'Long-Tail';
  routedModel: string;
  retailPrice: number;
  unitCost: number;
  grossMarginPct: number;
  currentInventory: number;
  onOrderUnits: number;
  leadTimeWeeks: number;
  remainingSellingWeeks: number;
  targetQuantile: number;
  llmAdjustmentPct: number;
  llmGuardrailStatus: 'APPROVED_BY_GUARDRAIL' | 'GUARDRAIL_REJECTED_NOISE';
  llmConfidence: number;
  llmTriggerEvent: string;
  llmRationale: string;
  actionType: ActionType;
  actionTitle: string;
  actionSummary: string;
  recommendedUnitsDelta: number;
  recommendedMarkdownPct: number;
  transferRoute: string;
  metrics: SkuMetrics;
  priorityScore: number;
  colorHex: string;
  swatchName: string;
  silhouetteType: string;
  storeCluster: string;
  history: HistoricalPoint[];
  forecast: ForecastPoint[];
}

export interface AnalogMatch {
  skuId: string;
  name: string;
  season: string;
  retailPrice: number;
  cosineSimilarity: number;
  visionMatchScore: number;
  attributeMatchScore: number;
  priceTierMatchScore: number;
  actualSellThroughPct: number;
  stockedOutWeek: string;
  weeklyLaunchCurve: number[];
  colorHex: string;
}

export interface SizeAllocationItem {
  size: string;
  legacyFlatPct: number;
  aiOptimizedPct: number;
  recommendedUnits: number;
}

export interface ColdStartStudioData {
  targetSkuId: string;
  newProduct: {
    skuId: string;
    name: string;
    launchSeason: string;
    retailPrice: number;
    unitCost: number;
    material: string;
    silhouette: string;
    colorFamily: string;
    initialPlannerGuessWeekly: number;
    aiZeroShotWeeklyPeak: number;
    embeddingVectorPreview: number[];
    extractedVisionTags: string[];
  };
  analogMatches: AnalogMatch[];
  sizeCurveAllocation: SizeAllocationItem[];
}

export interface ArchetypeRouteRow {
  archetype: string;
  skuCount: number;
  shareOfCatalogPct: number;
  primaryRouterModel: string;
  llmContextFrequencyPct: number;
  legacyWape: number;
  classicalWape: number;
  chronos2Wape: number;
  addlWape: number;
  primaryBusinessWin: string;
  routingRule: string;
}

export interface FeedbackLoopEvent {
  cycle: string;
  segment: string;
  observation: string;
  routerAction: string;
  measuredGain: string;
}

export interface RoutingBenchmarks {
  pilotScope: {
    totalSkus: number;
    activeStores: number;
    annualInventoryPoolUsd: number;
    baselineExcessInventoryUsd: number;
    annualCarryingCostRatePct: number;
    backtestHorizonWeeks: number;
  };
  executiveKpis: {
    wapeReductionPts: number;
    legacyPortfolioWape: number;
    addlPortfolioWape: number;
    excessWeeksBefore: number;
    excessWeeksAfter: number;
    availabilityBeforePct: number;
    availabilityAfterPct: number;
    workingCapitalFreedUsd: number;
    annualCarryingCostSavedUsd: number;
    markdownMarginProtectedUsd: number;
    lostSalesRecoveredUsd: number;
    totalAnnualValueImpactUsd: number;
    plannerHoursSavedPerWeek: number;
    agentActionAcceptanceRatePct: number;
  };
  archetypeRoutingMatrix: ArchetypeRouteRow[];
  closedLoopFeedbackEvents: FeedbackLoopEvent[];
}

export interface RetailDemoDataset {
  generatedAt: string;
  platformMeta: {
    title: string;
    subtitle: string;
    retailerPersona: string;
    erpConnected: string;
  };
  skus: SkuRecord[];
  coldStartStudio: ColdStartStudioData;
  routingBenchmarks: RoutingBenchmarks;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  skuId: string;
  skuName: string;
  decision: DecisionStatus;
  actionSummary: string;
  reasonCode: string;
  plannerNote: string;
  financialImpactUsd: number;
}
