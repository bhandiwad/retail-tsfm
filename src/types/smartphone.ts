import { SkuRecord } from './retail';

export interface SkuPricingRow {
  skuId: string;
  modelFamily: string;
  variant: string;
  segment: string;
  mrpInr: number;
  mopInr: number;
  distributorPriceInr: number;
  shopLandingInr: number;
  baseShopMarginInr: number;
  baseShopMarginPct: number;
  monthlySlabBonusInr: number;
  rivalModel: string;
  rivalShopMarginInr: number;
  emiSharePct: number;
  keySellingPoint: string;
  colorHex: string;
}

export interface CityModelMetrics {
  billedUnits: number;
  activatedUnits: number;
  closingStock: number;
  black256Stock: number;
  effectiveShopMarginInr: number;
  rivalMarginInr: number;
  emiConversionPct: number;
}

export interface CityRecord {
  cityId: string;
  cityName: string;
  state: string;
  region: string;
  tier: string;
  distributorName: string;
  totalMobileShops: number;
  activeBillingShops: number;
  storeCoveragePct: number;
  nbfcZeroDownShopsPct: number;
  inShopPromoters: number;
  avgServiceTurnaroundDays: number;
  topSellingModel: string;
  topModelSharePct: number;
  buyerProfile: string;
  monthlyRevenueInrLakhs: number;
  modelBreakdown: Record<string, CityModelMetrics>;
  fieldNotes: string[];
}

export interface CityDiagnosisFactor {
  rank: number;
  title: string;
  impactSharePct: number;
  lostUnitsEst: number;
  evidence: string;
  fixAction: string;
  targetTab: string;
}

export interface CityPairDiagnosis {
  headline: string;
  summaryPlain: string;
  recoverableMonthlyUnits: number;
  recoverableMonthlyRevenueLakhs: number;
  factors: CityDiagnosisFactor[];
}

export interface LookalikeCity {
  city: string;
  matchedTemplateCity: string;
  similarityScorePct: number;
  currentCurve5GUnits: number;
  potentialCurve5GUnits: number;
  emiReadyShopsPct: number;
  whyItMatches: string;
  recommendedAction: string;
  revenueLiftLakhs: number;
}

export interface StockTransferItem {
  transferId: string;
  skuId: string;
  skuName: string;
  fromCity: string;
  fromWos: number;
  fromExcessUnits: number;
  toCity: string;
  toStockLeft: number;
  stockoutDays: number;
  distanceKm: number;
  transitHours: number;
  transferUnits: number;
  logisticsCostInr: number;
  recoveredSalesLakhs: number;
  status: string;
}

export interface WhatsappMessage {
  sender: 'agent' | 'shopkeeper';
  time: string;
  text: string;
}

export interface RetailerSlabRecord {
  retailerId: string;
  shopName: string;
  area: string;
  ownerName: string;
  language: string;
  slabName: string;
  targetUnits: number;
  activatedUnits: number;
  gapUnits: number;
  daysRemaining: number;
  bonusPerUnitInr: number;
  totalBonusUnlockedInr: number;
  recommendedOrder: string;
  distributorName: string;
  whatsappPreview: WhatsappMessage[];
}

export interface CounterBattlecard {
  id: string;
  rivalPhone: string;
  ourPhone: string;
  customerPriority: string;
  shopMarginOursInr: number;
  shopMarginRivalInr: number;
  marginBreakdownNote: string;
  pitchPointsEn: string[];
  pitchPointsHinglish: string[];
  instantOfferCode: string;
  instantOfferDesc: string;
}

export interface LaunchCityAllocation {
  city: string;
  equalSplitUnits: number;
  aiRecommendedUnits: number;
  emiShopsPct: number;
  reason: string;
}

export interface NewLaunchPlan {
  modelName: string;
  mopInr: number;
  factoryPlant: string;
  matchedPastModels: {
    name: string;
    similarityPct: number;
    first4WkSellThroughPct: number;
  }[];
  expectedGainSummary: string;
  cityAllocations: LaunchCityAllocation[];
}

export interface WarrantyCase {
  ticketId: string;
  customerName: string;
  phoneModel: string;
  imei: string;
  warrantyStatus: string;
  issueReported: string;
  language: string;
  diagnosisOutcome: 'RESOLVED_ON_WHATSAPP' | 'HOME_SERVICE_DISPATCHED';
  costSavedInr: number;
  steps: string[];
}

export interface FactoryBatchAlert {
  batchId: string;
  plantLine: string;
  skuAffected: string;
  component: string;
  unitsProduced: number;
  complaints9Days: number;
  normalBaselineComplaints: number;
  spikeMultiplier: string;
  severity: 'HIGH' | 'WATCH';
  recommendedFactoryAction: string;
}

export interface SmartphoneDemoDataset {
  brandMeta: {
    brandName: string;
    tagline: string;
    activeMonth: string;
    dataSourcesConnected: string[];
  };
  skuPricingMaster: SkuPricingRow[];
  cities: CityRecord[];
  cityPairDiagnoses: Record<string, CityPairDiagnosis>;
  lookalikeCities: LookalikeCity[];
  stockTransfers: StockTransferItem[];
  retailerSlabs: RetailerSlabRecord[];
  counterBattlecards: CounterBattlecard[];
  newLaunchPlan: NewLaunchPlan;
  warrantyCases: WarrantyCase[];
  factoryBatchAlerts: FactoryBatchAlert[];
  forecastSkus: SkuRecord[];
}
