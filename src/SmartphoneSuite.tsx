import React, { useState, useEffect } from 'react';
import rawSmartphoneData from './data/smartphoneDemoData.json';
import {
  SmartphoneDemoDataset,
  WhatsappMessage,
} from './types/smartphone';
import { ForecastCanvas } from './components/ForecastCanvas';
import { RealisticDataExplorer } from './components/RealisticDataExplorer';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Database,
  Factory,
  Loader2,
  MapPin,
  MessageCircle,
  PackageCheck,
  Send,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Store,
  TrendingUp,
  Truck,
  Wrench,
  X,
  Zap,
  AlertTriangle,
} from 'lucide-react';

const smartphoneDataset = rawSmartphoneData as unknown as SmartphoneDemoDataset;

const IS_LOCALHOST =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1');
const API_BASE =
  import.meta.env.VITE_API_BASE_URL ??
  (IS_LOCALHOST ? 'http://localhost:8005' : '');

export type SmartphoneMainTab =
  | 'city-explainer'
  | 'actions'
  | 'forecast'
  | 'warranty';

export type ActionSubTool = 'transfer' | 'whatsapp' | 'pitch';
export type ForecastSubMode = 'weekly' | 'launch';

export interface SmartphoneSuiteProps {
  onBackHome: () => void;
  onSwitchToFootwear: () => void;
  initialTab?: SmartphoneMainTab;
  initialActionTool?: ActionSubTool;
  initialForecastMode?: ForecastSubMode;
}

export const SmartphoneSuite: React.FC<SmartphoneSuiteProps> = ({
  onBackHome,
  onSwitchToFootwear,
  initialTab = 'city-explainer',
  initialActionTool = 'whatsapp',
  initialForecastMode = 'weekly',
}) => {
  const [activeTab, setActiveTab] = useState<SmartphoneMainTab>(initialTab);
  const [actionTool, setActionTool] = useState<ActionSubTool>(initialActionTool);
  const [forecastMode, setForecastMode] =
    useState<ForecastSubMode>(initialForecastMode);
  const [showDataModal, setShowDataModal] = useState(false);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    setActionTool(initialActionTool);
  }, [initialActionTool]);

  useEffect(() => {
    setForecastMode(initialForecastMode);
  }, [initialForecastMode]);

  // Tab 1: City Sales Explainer State
  const [cityAId, setCityAId] = useState<string>('SURAT');
  const [cityBId, setCityBId] = useState<string>('LUCKNOW');
  const [liveCityAiResult, setLiveCityAiResult] = useState<{
    providerUsed: string;
    headline: string;
    summaryPlain: string;
    actionSteps: string[];
  } | null>(null);
  const [isRunningCityAi, setIsRunningCityAi] = useState(false);
  const [activatedLookalikes, setActivatedLookalikes] = useState<
    Record<string, boolean>
  >({});

  // Tab 2: Sell More Actions State
  const [approvedTransfers, setApprovedTransfers] = useState<
    Record<string, boolean>
  >({});
  const [selectedRetailerId, setSelectedRetailerId] =
    useState<string>('RET-LKO-1042');
  const [chatByRetailer, setChatByRetailer] = useState<
    Record<string, WhatsappMessage[]>
  >(() => {
    const init: Record<string, WhatsappMessage[]> = {};
    smartphoneDataset.retailerSlabs.forEach((r) => {
      init[r.retailerId] = r.whatsappPreview;
    });
    return init;
  });
  const [customWaInput, setCustomWaInput] = useState('');
  const [isSendingWa, setIsSendingWa] = useState(false);

  const [selectedBattlecardId, setSelectedBattlecardId] =
    useState<string>('vs-vivo-t3');
  const [pitchLang, setPitchLang] = useState<'hinglish' | 'en'>('hinglish');
  const [sharedBattlecardToast, setSharedBattlecardToast] = useState<
    string | null
  >(null);

  // Tab 3: Forecast & Launch State
  const [selectedForecastSkuId, setSelectedForecastSkuId] =
    useState<string>('ZEN-CRV-8-256-BK');
  const [promoLiftSlider, setPromoLiftSlider] = useState<number>(0);
  const [targetQuantileSlider, setTargetQuantileSlider] = useState<number>(80);
  const [approvedSkuOrders, setApprovedSkuOrders] = useState<
    Record<string, boolean>
  >({});
  const [launchApproved, setLaunchApproved] = useState(false);

  // Tab 4: Warranty & Factory Batch State
  const [selectedTicketId, setSelectedTicketId] = useState<string>('WA-90412');
  const [quarantinedBatches, setQuarantinedBatches] = useState<
    Record<string, boolean>
  >({});

  const cityA =
    smartphoneDataset.cities.find((c) => c.cityId === cityAId) ||
    smartphoneDataset.cities[0];
  const cityB =
    smartphoneDataset.cities.find((c) => c.cityId === cityBId) ||
    smartphoneDataset.cities[1];

  const pairKey = `${cityA.cityId}__${cityB.cityId}`;
  const reversePairKey = `${cityB.cityId}__${cityA.cityId}`;
  const prebuiltDiagnosis =
    smartphoneDataset.cityPairDiagnoses[pairKey] ||
    smartphoneDataset.cityPairDiagnoses[reversePairKey] ||
    null;

  const handleAskLiveCityAi = async () => {
    setIsRunningCityAi(true);
    try {
      const savedKey = localStorage.getItem('pandita_ai_api_key') || '';
      const resp = await fetch(`${API_BASE}/api/mobile/explain-cities`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(savedKey ? { 'x-ai-api-key': savedKey } : {}),
        },
        body: JSON.stringify({ cityA, cityB }),
      });
      if (resp.ok) {
        const data = await resp.json();
        setLiveCityAiResult(data);
        setIsRunningCityAi(false);
        return;
      }
    } catch {
      // Fallback if backend server isn't running
    }
    const caCurve = cityA.modelBreakdown['Curve 5G (₹18k)'];
    const cbCurve = cityB.modelBreakdown['Curve 5G (₹18k)'];
    setLiveCityAiResult({
      providerUsed: 'Built-in Retail Intelligence Engine',
      headline: `${cityA.cityName} activates ${caCurve.activatedUnits.toLocaleString()} units of Curve 5G vs ${cbCurve.activatedUnits.toLocaleString()} in ${cityB.cityName} due to EMI store mapping, Black 256GB stock, and shop margin differences.`,
      summaryPlain: `In ${cityA.cityName}, ${cityA.nbfcZeroDownShopsPct}% of stores have 0-down EMI active and ${caCurve.black256Stock} Black 256GB units in stock. In ${cityB.cityName}, 0% EMI store coverage is ${cityB.nbfcZeroDownShopsPct}%, Black 256GB stock is ${cbCurve.black256Stock} units, and rival shop margin is ₹${cbCurve.rivalMarginInr} vs ₹${cbCurve.effectiveShopMarginInr}.`,
      actionSteps: [
        `Replenish Curve 5G 8GB/256GB Black stock at ${cityB.distributorName} via nearest regional warehouse transfer.`,
        `Nudge ${cityB.cityName} shops within 4 phones of monthly Gold Slab (+₹350/unit bonus) on WhatsApp.`,
        `Enable Bajaj/TVS 0-down-payment QR codes across top general trade stores in ${cityB.cityName}.`,
      ],
    });
    setIsRunningCityAi(false);
  };

  const handleFixJump = (target: string) => {
    if (target === 'actions-transfer') {
      setActiveTab('actions');
      setActionTool('transfer');
    } else if (target === 'actions-whatsapp') {
      setActiveTab('actions');
      setActionTool('whatsapp');
    } else if (target === 'actions-pitch') {
      setActiveTab('actions');
      setActionTool('pitch');
    } else if (target === 'forecast') {
      setActiveTab('forecast');
      setForecastMode('weekly');
    } else if (target === 'warranty') {
      setActiveTab('warranty');
    }
  };

  const selectedRetailer =
    smartphoneDataset.retailerSlabs.find(
      (r) => r.retailerId === selectedRetailerId
    ) || smartphoneDataset.retailerSlabs[0];

  const handleSendShopkeeperMessage = async (msgText?: string) => {
    const textToSend = (msgText ?? customWaInput).trim();
    if (!textToSend) return;
    const nowTime = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    const shopMsg: WhatsappMessage = {
      sender: 'shopkeeper',
      time: nowTime,
      text: textToSend,
    };

    setChatByRetailer((prev) => ({
      ...prev,
      [selectedRetailer.retailerId]: [
        ...(prev[selectedRetailer.retailerId] || []),
        shopMsg,
      ],
    }));
    if (!msgText) setCustomWaInput('');
    setIsSendingWa(true);

    let replyText = '';
    try {
      const savedKey = localStorage.getItem('pandita_ai_api_key') || '';
      const resp = await fetch(`${API_BASE}/api/mobile/whatsapp-simulate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(savedKey ? { 'x-ai-api-key': savedKey } : {}),
        },
        body: JSON.stringify({
          retailer: selectedRetailer,
          shopkeeperMessage: textToSend,
        }),
      });
      if (resp.ok) {
        const data = await resp.json();
        replyText = data.reply;
      }
    } catch {
      // Offline fallback
    }

    if (!replyText) {
      replyText = `Bilkul ${selectedRetailer.ownerName} ji! 🙏 Aap abhi *${selectedRetailer.activatedUnits}/${selectedRetailer.targetUnits} activations* par hain — sirf *${selectedRetailer.gapUnits} phone* aur activate karte hi poore *₹${selectedRetailer.totalBonusUnlockedInr.toLocaleString()} ka Credit Note* aapke khate mein aa jayega 💰.\n\nMain *${selectedRetailer.distributorName}* ko abhi dispatch note bhej raha hoon — shaam 5:30 PM tak delivery ho jayegi!`;
    }

    const botMsg: WhatsappMessage = {
      sender: 'agent',
      time: nowTime,
      text: replyText,
    };
    setChatByRetailer((prev) => ({
      ...prev,
      [selectedRetailer.retailerId]: [
        ...(prev[selectedRetailer.retailerId] || []),
        botMsg,
      ],
    }));
    setIsSendingWa(false);
  };

  const selectedBattlecard =
    smartphoneDataset.counterBattlecards.find(
      (b) => b.id === selectedBattlecardId
    ) || smartphoneDataset.counterBattlecards[0];

  const selectedForecastSku =
    smartphoneDataset.forecastSkus.find(
      (s) => s.skuId === selectedForecastSkuId
    ) || smartphoneDataset.forecastSkus[0];

  const totalRecoveredTransferLakhs = smartphoneDataset.stockTransfers.reduce(
    (sum, t) =>
      approvedTransfers[t.transferId] ? sum + t.recoveredSalesLakhs : sum,
    0
  );

  const selectedTicket =
    smartphoneDataset.warrantyCases.find(
      (w) => w.ticketId === selectedTicketId
    ) || smartphoneDataset.warrantyCases[0];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col">
      {/* DATA TABLES MODAL */}
      {showDataModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-indigo-600" />
                <span className="text-sm font-bold text-slate-900">
                  Underlying Retail &amp; DMS Data Tables (Zenith Mobile India)
                </span>
              </div>
              <button
                onClick={() => setShowDataModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <RealisticDataExplorer dataset={smartphoneDataset} />
          </div>
        </div>
      )}

      {/* TOP HEADER BAR */}
      <header className="border-b border-slate-200/80 bg-white/95 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-[1560px] mx-auto px-5 lg:px-8 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={onBackHome}
              className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              All Demos
            </button>
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-xs font-mono font-bold text-white text-xs">
              P·AI
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-slate-900 tracking-tight">
                  Pandita's Adaptive Demand Decision Layer — Smartphones &amp; Channel AI
                </h1>
                <span className="hidden xl:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/70">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  DMS + SIM Activation Live
                </span>
              </div>
            </div>
          </div>

          {/* 4 Plain-English Tabs */}
          <nav className="hidden lg:flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl border border-slate-200/60">
            <button
              onClick={() => setActiveTab('city-explainer')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'city-explainer'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <MapPin className="w-3.5 h-3.5 text-indigo-600" />
              1. Why Cities Differ
            </button>
            <button
              onClick={() => setActiveTab('actions')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'actions'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-emerald-600" />
              2. Sell More Actions
            </button>
            <button
              onClick={() => setActiveTab('forecast')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'forecast'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 text-sky-600" />
              3. Demand &amp; New Launch
            </button>
            <button
              onClick={() => setActiveTab('warranty')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'warranty'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
              4. Home Warranty &amp; Quality
            </button>
          </nav>

          {/* Right Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowDataModal(true)}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition"
            >
              <Database className="w-3.5 h-3.5 text-sky-600" />
              Data Needed
            </button>
            <button
              onClick={onSwitchToFootwear}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold cursor-pointer transition"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              Footwear Demo
            </button>
          </div>
        </div>

        {/* Mobile Tab Bar */}
        <div className="lg:hidden flex overflow-x-auto gap-1 px-4 pb-2.5">
          {[
            { id: 'city-explainer', label: '1. Why Cities Differ' },
            { id: 'actions', label: '2. Sell More Actions' },
            { id: 'forecast', label: '3. Demand & Launch' },
            { id: 'warranty', label: '4. Warranty & Quality' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as SmartphoneMainTab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 cursor-pointer ${
                activeTab === t.id
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-[1560px] w-full mx-auto px-5 lg:px-8 py-6 space-y-6 flex-1">
        {/* ================================================================
            TAB 1: CITY SALES EXPLAINER ("WHY MODEL A SELLS HERE & B THERE")
           ================================================================ */}
        {activeTab === 'city-explainer' && (
          <div className="space-y-6 animate-fade-in">
            {/* Top Scenario Selector Bar */}
            <div className="card-surface rounded-2xl p-5 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/70 mb-1.5">
                  <MapPin className="w-3 h-3" />
                  City Sales Explainer Agent
                </div>
                <h2 className="text-lg font-bold text-slate-900">
                  Why Does One Phone Model Sell in City A, While a Different Model Sells in City B?
                </h2>
                <p className="text-xs text-slate-600 mt-0.5">
                  Combines distributor stock, SIM activations, shopkeeper margins vs. rivals, Bajaj/TVS 0% EMI store coverage, and field rep notes to explain regional gaps.
                </p>
              </div>

              {/* Preset Quick Pairs */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-semibold text-slate-500 mr-1">
                  Sample Stories:
                </span>
                <button
                  onClick={() => {
                    setCityAId('SURAT');
                    setCityBId('LUCKNOW');
                    setLiveCityAiResult(null);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border cursor-pointer transition ${
                    cityAId === 'SURAT' && cityBId === 'LUCKNOW'
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Surat vs. Lucknow (Margin &amp; Stockout)
                </button>
                <button
                  onClick={() => {
                    setCityAId('JAIPUR');
                    setCityBId('PATNA');
                    setLiveCityAiResult(null);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border cursor-pointer transition ${
                    cityAId === 'JAIPUR' && cityBId === 'PATNA'
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Jaipur vs. Patna (Service &amp; Credit Cap)
                </button>
                <button
                  onClick={() => {
                    setCityAId('SURAT');
                    setCityBId('INDORE');
                    setLiveCityAiResult(null);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border cursor-pointer transition ${
                    cityAId === 'SURAT' && cityBId === 'INDORE'
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Surat vs. Indore (Hidden Growth Twin)
                </button>
              </div>
            </div>

            {/* Side-by-Side City Pickers & Model Split Bars */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {[
                { city: cityA, setter: setCityAId, badge: 'City A' },
                { city: cityB, setter: setCityBId, badge: 'City B' },
              ].map(({ city, setter, badge }) => {
                const totalAct = Object.values(city.modelBreakdown).reduce(
                  (s, m) => s + m.activatedUnits,
                  0
                );
                return (
                  <div
                    key={badge}
                    className="card-surface rounded-2xl p-5 space-y-4"
                  >
                    <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
                      <div className="flex items-center gap-2.5">
                        <span className="px-2 py-0.5 rounded-md bg-slate-900 text-white font-mono text-[11px] font-bold">
                          {badge}
                        </span>
                        <select
                          value={city.cityId}
                          onChange={(e) => {
                            setter(e.target.value);
                            setLiveCityAiResult(null);
                          }}
                          className="text-base font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 cursor-pointer focus:outline-none focus:border-indigo-600"
                        >
                          {smartphoneDataset.cities.map((c) => (
                            <option key={c.cityId} value={c.cityId}>
                              {c.cityName} ({c.state})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="text-right">
                        <div className="text-[11px] text-slate-500">
                          30-Day City Revenue
                        </div>
                        <div className="text-sm font-mono font-bold text-slate-900">
                          ₹{city.monthlyRevenueInrLakhs} Lakhs
                        </div>
                      </div>
                    </div>

                    {/* Top Model Callout */}
                    <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-3 flex items-center justify-between">
                      <div>
                        <div className="text-[11px] font-medium text-slate-500">
                          #1 Bestselling Phone Here
                        </div>
                        <div className="text-sm font-bold text-indigo-700">
                          {city.topSellingModel} ({city.topModelSharePct}% of sales)
                        </div>
                      </div>
                      <div className="text-right text-[11px] text-slate-600">
                        <div>
                          Active Shops:{' '}
                          <strong className="font-mono text-slate-900">
                            {city.activeBillingShops}/{city.totalMobileShops}
                          </strong>
                        </div>
                        <div>
                          0% EMI Stores:{' '}
                          <strong
                            className={`font-mono ${
                              city.nbfcZeroDownShopsPct >= 60
                                ? 'text-emerald-700'
                                : 'text-rose-700'
                            }`}
                          >
                            {city.nbfcZeroDownShopsPct}%
                          </strong>
                        </div>
                      </div>
                    </div>

                    {/* 4-Model Sales Bars */}
                    <div className="space-y-2.5">
                      <div className="text-xs font-semibold text-slate-700">
                        30-Day Verified SIM Activations by Model:
                      </div>
                      {Object.entries(city.modelBreakdown).map(
                        ([modelName, m]) => {
                          const sharePct = Math.round(
                            (m.activatedUnits / Math.max(1, totalAct)) * 100
                          );
                          const isCurve = modelName.includes('Curve');
                          return (
                            <div key={modelName} className="space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-semibold text-slate-800">
                                  {modelName}
                                </span>
                                <span className="font-mono text-slate-700">
                                  <strong>
                                    {m.activatedUnits.toLocaleString()}
                                  </strong>{' '}
                                  units ({sharePct}%)
                                </span>
                              </div>
                              <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all ${
                                    isCurve ? 'bg-indigo-600' : 'bg-sky-500'
                                  }`}
                                  style={{ width: `${Math.max(5, sharePct)}%` }}
                                />
                              </div>
                            </div>
                          );
                        }
                      )}
                    </div>

                    {/* Ground Metrics Grid */}
                    <div className="grid grid-cols-3 gap-2.5 pt-2 border-t border-slate-100 text-xs">
                      <div className="rounded-xl bg-slate-50/80 p-2.5 border border-slate-200/60">
                        <div className="text-[10px] text-slate-500">
                          Curve Black 256GB Stock
                        </div>
                        <div
                          className={`font-mono font-bold text-sm mt-0.5 ${
                            city.modelBreakdown['Curve 5G (₹18k)']
                              .black256Stock <= 15
                              ? 'text-rose-600'
                              : 'text-emerald-700'
                          }`}
                        >
                          {
                            city.modelBreakdown['Curve 5G (₹18k)']
                              .black256Stock
                          }{' '}
                          units
                        </div>
                      </div>
                      <div className="rounded-xl bg-slate-50/80 p-2.5 border border-slate-200/60">
                        <div className="text-[10px] text-slate-500">
                          Shop Margin vs Rival
                        </div>
                        <div className="font-mono font-bold text-sm mt-0.5 text-slate-900">
                          ₹
                          {
                            city.modelBreakdown['Curve 5G (₹18k)']
                              .effectiveShopMarginInr
                          }{' '}
                          <span className="text-[11px] font-normal text-slate-500">
                            vs ₹
                            {
                              city.modelBreakdown['Curve 5G (₹18k)']
                                .rivalMarginInr
                            }
                          </span>
                        </div>
                      </div>
                      <div className="rounded-xl bg-slate-50/80 p-2.5 border border-slate-200/60">
                        <div className="text-[10px] text-slate-500">
                          Promoters / Repair SLA
                        </div>
                        <div className="font-mono font-bold text-sm mt-0.5 text-slate-900">
                          {city.inShopPromoters} staff ·{' '}
                          <span
                            className={
                              city.avgServiceTurnaroundDays > 3
                                ? 'text-rose-600'
                                : 'text-emerald-700'
                            }
                          >
                            {city.avgServiceTurnaroundDays}d
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Field Rep Notes */}
                    <div className="space-y-1.5">
                      <div className="text-[11px] font-semibold text-slate-500">
                        Recent Field Sales (TSE) WhatsApp Notes:
                      </div>
                      {city.fieldNotes.map((note, idx) => (
                        <div
                          key={idx}
                          className="text-xs bg-amber-50/60 border border-amber-200/70 rounded-xl px-3 py-2 text-slate-800"
                        >
                          “{note}”
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* AI Root-Cause Diagnosis Card */}
            <div className="card-surface rounded-2xl p-6 space-y-5 border-l-4 border-l-indigo-600">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">
                      Plain-English Root-Cause Breakdown
                    </span>
                  </div>
                  <h3 className="text-base md:text-lg font-bold text-slate-900 mt-1">
                    {prebuiltDiagnosis
                      ? prebuiltDiagnosis.headline
                      : liveCityAiResult?.headline ||
                        `Comparing ${cityA.cityName} vs. ${cityB.cityName} Ground Signals`}
                  </h3>
                  <p className="text-xs text-slate-600 mt-1">
                    {prebuiltDiagnosis
                      ? prebuiltDiagnosis.summaryPlain
                      : liveCityAiResult?.summaryPlain ||
                        'Click "Run Live AI Comparison" to generate an instant root-cause breakdown for this custom pair of cities.'}
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {prebuiltDiagnosis && (
                    <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-3.5 py-2 text-right">
                      <div className="text-[10px] font-semibold text-emerald-700 uppercase">
                        Recoverable Sales
                      </div>
                      <div className="text-sm font-mono font-bold text-emerald-800">
                        +₹{prebuiltDiagnosis.recoverableMonthlyRevenueLakhs}L / mo
                      </div>
                    </div>
                  )}
                  <button
                    onClick={handleAskLiveCityAi}
                    disabled={isRunningCityAi}
                    className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-60 transition"
                  >
                    {isRunningCityAi ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Analyzing DMS + Field Data...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        Run Live AI Comparison
                      </>
                    )}
                  </button>
                </div>
              </div>

              {liveCityAiResult && (
                <div className="rounded-xl bg-indigo-50/70 border border-indigo-200 p-4 space-y-2.5 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-900">
                      Live AI Analysis ({cityA.cityName} vs. {cityB.cityName})
                    </span>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-white border border-indigo-200 text-indigo-700">
                      {liveCityAiResult.providerUsed}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-slate-900">
                    {liveCityAiResult.headline}
                  </p>
                  <p className="text-xs text-slate-700">
                    {liveCityAiResult.summaryPlain}
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-1">
                    {liveCityAiResult.actionSteps.map((step, i) => (
                      <div
                        key={i}
                        className="rounded-lg bg-white border border-indigo-100 p-2.5 text-xs text-slate-800 flex items-start gap-2"
                      >
                        <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-mono text-[11px] font-bold flex items-center justify-center shrink-0">
                          {i + 1}
                        </span>
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {prebuiltDiagnosis && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {prebuiltDiagnosis.factors.map((f) => (
                    <div
                      key={f.rank}
                      className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 flex flex-col justify-between gap-3"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-900">
                            <span className="w-5 h-5 rounded-full bg-slate-900 text-white font-mono text-[11px] flex items-center justify-center">
                              {f.rank}
                            </span>
                            {f.title}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 shrink-0">
                            {f.impactSharePct}% of gap
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          {f.evidence}
                        </p>
                      </div>

                      <div className="pt-2.5 border-t border-slate-200/80 flex items-center justify-between gap-3">
                        <div className="text-[11px] font-medium text-emerald-800">
                          <strong>Fix:</strong> {f.fixAction}
                        </div>
                        <button
                          onClick={() => handleFixJump(f.targetTab)}
                          className="px-3 py-1.5 rounded-lg bg-white hover:bg-indigo-600 hover:text-white text-indigo-700 border border-indigo-200 text-xs font-semibold flex items-center gap-1 shrink-0 cursor-pointer transition"
                        >
                          Take Action
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Lookalike Cities Ready to Replicate Winning Playbook */}
            <div className="card-surface rounded-2xl p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Where Else Can We Copy Surat &amp; Jaipur&apos;s Success? (Similar Cities Finder)
                  </h3>
                  <p className="text-xs text-slate-600">
                    The agent scans other Indian cities with high Bajaj/TVS EMI shop readiness and matching buyer profiles where Curve 5G is currently under-stocked.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                {smartphoneDataset.lookalikeCities.map((lc) => {
                  const isApplied = !!activatedLookalikes[lc.city];
                  return (
                    <div
                      key={lc.city}
                      className="rounded-xl border border-slate-200 p-4 flex flex-col justify-between gap-3 bg-white hover:border-indigo-300 transition"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm text-slate-900">
                            {lc.city}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {lc.similarityScorePct}% Match to {lc.matchedTemplateCity}
                          </span>
                        </div>
                        <div className="rounded-lg bg-slate-50 p-2.5 border border-slate-100 flex items-center justify-between text-xs font-mono">
                          <div>
                            <div className="text-[10px] font-sans text-slate-500">
                              Current Sales
                            </div>
                            <div className="font-bold text-slate-700">
                              {lc.currentCurve5GUnits}/mo
                            </div>
                          </div>
                          <ArrowRight className="w-3.5 h-3.5 text-indigo-500" />
                          <div className="text-right">
                            <div className="text-[10px] font-sans text-slate-500">
                              Target Potential
                            </div>
                            <div className="font-bold text-indigo-700">
                              {lc.potentialCurve5GUnits}/mo
                            </div>
                          </div>
                        </div>
                        <p className="text-[11px] text-slate-600">
                          {lc.whyItMatches}
                        </p>
                      </div>

                      <div className="space-y-2 pt-2 border-t border-slate-100">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500">Projected Lift:</span>
                          <span className="font-mono font-bold text-emerald-700">
                            +₹{lc.revenueLiftLakhs} Lakhs/mo
                          </span>
                        </div>
                        <button
                          onClick={() =>
                            setActivatedLookalikes((prev) => ({
                              ...prev,
                              [lc.city]: !prev[lc.city],
                            }))
                          }
                          className={`w-full py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition ${
                            isApplied
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-900 hover:bg-indigo-600 text-white'
                          }`}
                        >
                          {isApplied ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              Allocation &amp; Slab Playbook Queued
                            </>
                          ) : (
                            'Copy Winning Playbook Here'
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ================================================================
            TAB 2: SELL MORE ACTIONS (STOCK MOVER, WHATSAPP, COUNTER PITCH)
           ================================================================ */}
        {activeTab === 'actions' && (
          <div className="space-y-5 animate-fade-in">
            {/* Sub-Tool Selector */}
            <div className="card-surface rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setActionTool('whatsapp')}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer transition ${
                    actionTool === 'whatsapp'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <MessageCircle className="w-4 h-4" />
                  Shopkeeper WhatsApp Assistant
                </button>
                <button
                  onClick={() => setActionTool('transfer')}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer transition ${
                    actionTool === 'transfer'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <Truck className="w-4 h-4" />
                  Stock Mover (Warehouse Transfers)
                </button>
                <button
                  onClick={() => setActionTool('pitch')}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer transition ${
                    actionTool === 'pitch'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <Store className="w-4 h-4" />
                  Counter Sales Helper (Beat Rival Phones)
                </button>
              </div>

              <div className="text-xs text-slate-500">
                Direct execution tools that turn regional insights into secondary &amp; counter sales
              </div>
            </div>

            {/* SUB-TOOL 1: SHOPKEEPER WHATSAPP ASSISTANT */}
            {actionTool === 'whatsapp' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Left Retailer List */}
                <div className="lg:col-span-5 card-surface rounded-2xl p-5 space-y-3.5">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Shops Close to Monthly Bonus Target (4 Days Left)
                    </h3>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Multi-brand mobile shops push whichever brand is closest to paying a slab bonus this week. Select a shop to view or test the WhatsApp assistant.
                    </p>
                  </div>

                  <div className="space-y-2.5">
                    {smartphoneDataset.retailerSlabs.map((ret) => {
                      const pct = Math.round(
                        (ret.activatedUnits / ret.targetUnits) * 100
                      );
                      const active =
                        ret.retailerId === selectedRetailer.retailerId;
                      return (
                        <div
                          key={ret.retailerId}
                          onClick={() => setSelectedRetailerId(ret.retailerId)}
                          className={`rounded-xl p-3.5 border cursor-pointer transition ${
                            active
                              ? 'border-emerald-500 bg-emerald-50/40 shadow-xs'
                              : 'border-slate-200 bg-white hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-sm font-bold text-slate-900">
                                {ret.shopName}
                              </div>
                              <div className="text-[11px] text-slate-500">
                                {ret.area} · Owner: {ret.ownerName}
                              </div>
                            </div>
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200">
                              Just {ret.gapUnits} phones away!
                            </span>
                          </div>

                          <div className="mt-2.5 space-y-1">
                            <div className="flex justify-between text-[11px]">
                              <span className="text-slate-600 font-medium">
                                {ret.slabName}:{' '}
                                <strong>
                                  {ret.activatedUnits}/{ret.targetUnits}
                                </strong>{' '}
                                SIMs activated
                              </span>
                              <span className="font-mono font-bold text-emerald-700">
                                Unlocks ₹
                                {ret.totalBonusUnlockedInr.toLocaleString()}
                              </span>
                            </div>
                            <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                              <div
                                className="h-full bg-emerald-500 rounded-full"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Right Interactive WhatsApp Simulator */}
                <div className="lg:col-span-7 card-surface rounded-2xl overflow-hidden flex flex-col border border-slate-200">
                  {/* WhatsApp Header */}
                  <div className="bg-[#075E54] text-white px-5 py-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-emerald-500/30 border border-white/30 flex items-center justify-center font-bold text-sm">
                        {selectedRetailer.shopName.charAt(0)}
                      </div>
                      <div>
                        <div className="text-sm font-bold">
                          {selectedRetailer.shopName} ({selectedRetailer.area})
                        </div>
                        <div className="text-[11px] text-emerald-100">
                          Zenith Vyapar WhatsApp Bot · Connected to{' '}
                          {selectedRetailer.distributorName} DMS
                        </div>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-mono bg-white/15">
                      {selectedRetailer.language}
                    </span>
                  </div>

                  {/* Chat Messages */}
                  <div className="bg-[#EFEAE2] p-4 space-y-3 min-h-[340px] max-h-[420px] overflow-y-auto flex-1">
                    {(chatByRetailer[selectedRetailer.retailerId] || []).map(
                      (m, idx) => (
                        <div
                          key={idx}
                          className={`flex ${
                            m.sender === 'shopkeeper'
                              ? 'justify-end'
                              : 'justify-start'
                          }`}
                        >
                          <div
                            className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-xs shadow-2xs whitespace-pre-line ${
                              m.sender === 'shopkeeper'
                                ? 'bg-[#DCF8C6] text-slate-900 rounded-tr-xs'
                                : 'bg-white text-slate-900 rounded-tl-xs'
                            }`}
                          >
                            <div className="text-[10px] font-bold text-slate-500 mb-0.5">
                              {m.sender === 'shopkeeper'
                                ? `${selectedRetailer.ownerName} (Shopkeeper)`
                                : 'Zenith Sales Assistant'}
                            </div>
                            <div className="leading-relaxed">{m.text}</div>
                            <div className="text-[10px] text-slate-400 text-right mt-1">
                              {m.time}
                            </div>
                          </div>
                        </div>
                      )
                    )}
                    {isSendingWa && (
                      <div className="flex justify-start">
                        <div className="bg-white rounded-2xl px-3.5 py-2 text-xs text-slate-500 flex items-center gap-2">
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                          Checking DMS slab ledger &amp; distributor stock...
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Quick Test Prompts + Input */}
                  <div className="bg-white p-3.5 border-t border-slate-200 space-y-2.5">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[11px] font-semibold text-slate-500">
                        Try replying as shopkeeper:
                      </span>
                      {[
                        'Agar aaj 4 Curve Black mangwa loon toh kitna payout milega?',
                        'Send 3 Power 5G Blue and 2 Curve Black tomorrow morning',
                        'Vivo wale ₹1500 margin de rahe hain, aapka kya hisab padega?',
                      ].map((sample, i) => (
                        <button
                          key={i}
                          onClick={() => handleSendShopkeeperMessage(sample)}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-[11px] text-slate-700 cursor-pointer transition"
                        >
                          “{sample}”
                        </button>
                      ))}
                    </div>

                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleSendShopkeeperMessage();
                      }}
                      className="flex items-center gap-2"
                    >
                      <input
                        type="text"
                        value={customWaInput}
                        onChange={(e) => setCustomWaInput(e.target.value)}
                        placeholder="Type a shopkeeper message in Hindi, Hinglish, or English..."
                        className="flex-1 rounded-xl bg-slate-50 border border-slate-200 px-3.5 py-2 text-xs focus:outline-none focus:border-emerald-600"
                      />
                      <button
                        type="submit"
                        disabled={isSendingWa}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition"
                      >
                        <Send className="w-3.5 h-3.5" />
                        Send
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {/* SUB-TOOL 2: STOCK MOVER (INTER-CITY TRANSFERS) */}
            {actionTool === 'transfer' && (
              <div className="card-surface rounded-2xl p-6 space-y-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Stock Mover — Fix Variant Stockouts Without Waiting for Factory Production
                    </h3>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Spots where a popular color/RAM variant is sitting unsold in one depot and moves it by road to a nearby city that ran out of stock.
                    </p>
                  </div>
                  <div className="rounded-xl bg-indigo-50 border border-indigo-200 px-4 py-2 text-right">
                    <div className="text-[10px] font-semibold text-indigo-700 uppercase">
                      Approved Sales Recovery
                    </div>
                    <div className="text-base font-mono font-bold text-indigo-900">
                      ₹{totalRecoveredTransferLakhs.toFixed(1)} Lakhs
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {smartphoneDataset.stockTransfers.map((trf) => {
                    const isDone = !!approvedTransfers[trf.transferId];
                    return (
                      <div
                        key={trf.transferId}
                        className="rounded-2xl border border-slate-200 p-5 flex flex-col justify-between gap-4 bg-white"
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                              {trf.transferId}
                            </span>
                            <span className="text-xs font-mono text-slate-500">
                              {trf.distanceKm} km · {trf.transitHours} hrs road
                            </span>
                          </div>

                          <div>
                            <div className="text-sm font-bold text-slate-900">
                              {trf.skuName}
                            </div>
                            <div className="text-[11px] font-mono text-slate-500">
                              SKU: {trf.skuId}
                            </div>
                          </div>

                          <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-3 space-y-2 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="text-slate-500">From:</span>
                              <span className="font-semibold text-slate-800">
                                {trf.fromCity} ({trf.fromExcessUnits} extra u)
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-slate-500">To:</span>
                              <span className="font-semibold text-rose-700">
                                {trf.toCity} ({trf.toStockLeft} left!)
                              </span>
                            </div>
                            <div className="flex items-center justify-between border-t border-slate-200 pt-2">
                              <span className="text-slate-500">
                                Quantity to Move:
                              </span>
                              <span className="font-mono font-bold text-indigo-700">
                                {trf.transferUnits} phones
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2.5 pt-2 border-t border-slate-100">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-500">
                              Transport: ₹{trf.logisticsCostInr.toLocaleString()}
                            </span>
                            <span className="font-mono font-bold text-emerald-700">
                              Saves ₹{trf.recoveredSalesLakhs} Lakhs
                            </span>
                          </div>
                          <button
                            onClick={() =>
                              setApprovedTransfers((prev) => ({
                                ...prev,
                                [trf.transferId]: !prev[trf.transferId],
                              }))
                            }
                            className={`w-full py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition ${
                              isDone
                                ? 'bg-emerald-600 text-white'
                                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                            }`}
                          >
                            {isDone ? (
                              <>
                                <CheckCircle2 className="w-4 h-4" />
                                Dispatch Chalan Sent to Warehouse
                              </>
                            ) : (
                              <>
                                <Truck className="w-4 h-4" />
                                Approve Transfer ({trf.transferUnits} Units)
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* SUB-TOOL 3: COUNTER SALES HELPER */}
            {actionTool === 'pitch' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                <div className="lg:col-span-4 card-surface rounded-2xl p-5 space-y-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Customer Walked In Asking For...
                    </h3>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Gives store staff a 30-second pitch card + spot exchange bonus to win undecided walk-in buyers.
                    </p>
                  </div>

                  <div className="space-y-2">
                    {smartphoneDataset.counterBattlecards.map((bc) => (
                      <button
                        key={bc.id}
                        onClick={() => {
                          setSelectedBattlecardId(bc.id);
                          setSharedBattlecardToast(null);
                        }}
                        className={`w-full text-left rounded-xl p-3.5 border cursor-pointer transition ${
                          bc.id === selectedBattlecard.id
                            ? 'border-amber-500 bg-amber-50/50 shadow-2xs'
                            : 'border-slate-200 bg-white hover:bg-slate-50'
                        }`}
                      >
                        <div className="text-xs font-bold text-slate-900">
                          vs. {bc.rivalPhone}
                        </div>
                        <div className="text-[11px] text-indigo-700 font-semibold mt-0.5">
                          Pitch: {bc.ourPhone}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Buyer cares about: {bc.customerPriority}
                        </div>
                      </button>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    <div className="text-xs font-semibold text-slate-700 mb-2">
                      Counter Language:
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setPitchLang('hinglish')}
                        className={`py-2 rounded-xl text-xs font-semibold border cursor-pointer ${
                          pitchLang === 'hinglish'
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-white text-slate-700 border-slate-200'
                        }`}
                      >
                        Hinglish (Store Counter)
                      </button>
                      <button
                        onClick={() => setPitchLang('en')}
                        className={`py-2 rounded-xl text-xs font-semibold border cursor-pointer ${
                          pitchLang === 'en'
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-white text-slate-700 border-slate-200'
                        }`}
                      >
                        Simple English
                      </button>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-8 card-surface rounded-2xl p-6 space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">
                        30-Second Counter Pitch Card
                      </span>
                      <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                        Flip {selectedBattlecard.rivalPhone} →{' '}
                        <span className="text-indigo-700">
                          {selectedBattlecard.ourPhone}
                        </span>
                      </h3>
                    </div>

                    {/* Shopkeeper Margin Comparison Box */}
                    <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-2.5">
                      <div className="text-[10px] font-bold uppercase text-emerald-800">
                        Shopkeeper Earns More Too
                      </div>
                      <div className="text-sm font-mono font-bold text-emerald-900">
                        ₹{selectedBattlecard.shopMarginOursInr} ours{' '}
                        <span className="text-xs font-normal text-slate-600">
                          vs ₹{selectedBattlecard.shopMarginRivalInr} rival
                        </span>
                      </div>
                      <div className="text-[10px] text-emerald-700">
                        {selectedBattlecard.marginBreakdownNote}
                      </div>
                    </div>
                  </div>

                  {/* 3 Pitch Bullets */}
                  <div className="space-y-3">
                    <div className="text-xs font-bold text-slate-700">
                      3 Things to Show the Customer Right Now:
                    </div>
                    {(pitchLang === 'hinglish'
                      ? selectedBattlecard.pitchPointsHinglish
                      : selectedBattlecard.pitchPointsEn
                    ).map((pt, idx) => (
                      <div
                        key={idx}
                        className="rounded-xl bg-slate-50 border border-slate-200/80 p-3.5 flex items-start gap-3"
                      >
                        <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-mono text-xs font-bold flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <p className="text-sm text-slate-800 leading-relaxed">
                          {pt}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Spot Closer Coupon */}
                  <div className="rounded-2xl bg-indigo-950 text-white p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="text-[11px] font-semibold text-indigo-300 uppercase">
                        Spot Closer Offer (Valid Today at Counter)
                      </div>
                      <div className="text-sm font-bold mt-0.5">
                        {selectedBattlecard.instantOfferDesc}
                      </div>
                      <div className="text-xs font-mono text-amber-300 mt-1">
                        Dealer Promo Code: {selectedBattlecard.instantOfferCode}
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        setSharedBattlecardToast(
                          `Sent pitch card + code ${selectedBattlecard.instantOfferCode} to 142 promoter & dealer WhatsApp numbers!`
                        )
                      }
                      className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold cursor-pointer shrink-0 transition"
                    >
                      Broadcast to City Promoters
                    </button>
                  </div>

                  {sharedBattlecardToast && (
                    <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs font-semibold text-emerald-800 flex items-center gap-2 animate-fade-in">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      {sharedBattlecardToast}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================================================================
            TAB 3: DEMAND FORECASTER & NEW PHONE LAUNCH PLANNER
           ================================================================ */}
        {activeTab === 'forecast' && (
          <div className="space-y-5 animate-fade-in">
            <div className="card-surface rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setForecastMode('weekly')}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer transition ${
                    forecastMode === 'weekly'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <TrendingUp className="w-4 h-4" />
                  Weekly Demand Forecaster (Stockout-Corrected)
                </button>
                <button
                  onClick={() => setForecastMode('launch')}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer transition ${
                    forecastMode === 'launch'
                      ? 'bg-fuchsia-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <PackageCheck className="w-4 h-4" />
                  New Phone Launch City Split (15,000 Units)
                </button>
              </div>
              <span className="text-xs text-slate-500">
                Powered by the same Weekly Demand Forecasting Engine as the Footwear &amp; Apparel demo
              </span>
            </div>

            {forecastMode === 'weekly' && (
              <div className="space-y-5">
                {/* SKU Selector Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {smartphoneDataset.forecastSkus.map((s) => {
                    const isSel = s.skuId === selectedForecastSku.skuId;
                    return (
                      <div
                        key={s.skuId}
                        onClick={() => {
                          setSelectedForecastSkuId(s.skuId);
                          setTargetQuantileSlider(s.targetQuantile);
                          setPromoLiftSlider(0);
                        }}
                        className={`card-surface rounded-2xl p-4 cursor-pointer border transition ${
                          isSel
                            ? 'border-indigo-600 ring-2 ring-indigo-600/15'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[11px] text-slate-500">
                            {s.skuId}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700">
                            Error: {s.metrics.legacyWape}% → {s.metrics.addlWape}%
                          </span>
                        </div>
                        <div className="text-sm font-bold text-slate-900 mt-1">
                          {s.name}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {s.subcategory} · Current Stock:{' '}
                          <strong className="font-mono text-slate-800">
                            {s.currentInventory.toLocaleString()} u
                          </strong>
                        </div>
                        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                          <span className="font-semibold text-indigo-700">
                            Order Adjustment:{' '}
                            {s.recommendedUnitsDelta > 0
                              ? `+${s.recommendedUnitsDelta}`
                              : s.recommendedUnitsDelta}{' '}
                            u
                          </span>
                          <span className="font-mono text-emerald-700 font-bold">
                            In-Stock: {s.metrics.availabilityAfter}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Plain-English Decision Banner + Sliders */}
                <div className="card-surface rounded-2xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                  <div className="space-y-1.5 max-w-3xl">
                    <div className="text-xs font-bold text-indigo-700 uppercase">
                      AI Recommendation · {selectedForecastSku.llmTriggerEvent}
                    </div>
                    <h3 className="text-base font-bold text-slate-900">
                      {selectedForecastSku.actionTitle}
                    </h3>
                    <p className="text-xs text-slate-600">
                      {selectedForecastSku.llmRationale}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 shrink-0">
                    <div className="w-44">
                      <div className="flex justify-between text-[11px] font-semibold text-slate-700 mb-1">
                        <span>Festival / EMI Lift</span>
                        <span className="font-mono text-indigo-700">
                          +{promoLiftSlider}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={35}
                        value={promoLiftSlider}
                        onChange={(e) =>
                          setPromoLiftSlider(Number(e.target.value))
                        }
                        className="w-full"
                      />
                    </div>

                    <button
                      onClick={() =>
                        setApprovedSkuOrders((prev) => ({
                          ...prev,
                          [selectedForecastSku.skuId]:
                            !prev[selectedForecastSku.skuId],
                        }))
                      }
                      className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition ${
                        approvedSkuOrders[selectedForecastSku.skuId]
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-900 hover:bg-indigo-600 text-white'
                      }`}
                    >
                      {approvedSkuOrders[selectedForecastSku.skuId] ? (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          Factory Batch Order Approved
                        </>
                      ) : (
                        'Approve Noida Factory Plan'
                      )}
                    </button>
                  </div>
                </div>

                {/* Full Probabilistic Forecast & Inventory Sawtooth Chart */}
                <ForecastCanvas
                  sku={selectedForecastSku}
                  whatIfPromoLiftPct={promoLiftSlider}
                  whatIfMarkdownPct={0}
                  whatIfTargetQuantile={targetQuantileSlider}
                  activeLiveSignal={null}
                />
              </div>
            )}

            {/* SUB-VIEW 2: NEW LAUNCH CITY ALLOCATION */}
            {forecastMode === 'launch' && (
              <div className="card-surface rounded-2xl p-6 space-y-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-fuchsia-700">
                      New Launch Planner — Day-1 City Allocation
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                      {smartphoneDataset.newLaunchPlan.modelName} · MOP ₹
                      {smartphoneDataset.newLaunchPlan.mopInr.toLocaleString()}
                    </h3>
                    <p className="text-xs text-slate-600 mt-0.5">
                      {smartphoneDataset.newLaunchPlan.expectedGainSummary}
                    </p>
                  </div>
                  <button
                    onClick={() => setLaunchApproved(!launchApproved)}
                    className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer shrink-0 transition ${
                      launchApproved
                        ? 'bg-emerald-600 text-white'
                        : 'bg-fuchsia-600 hover:bg-fuchsia-700 text-white'
                    }`}
                  >
                    {launchApproved ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        15,000-Unit Dispatch Plan Locked
                      </>
                    ) : (
                      'Approve Day-1 City Split'
                    )}
                  </button>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                        <th className="py-3 px-4">City</th>
                        <th className="py-3 px-4">0% EMI Ready Shops</th>
                        <th className="py-3 px-4">Old Equal Split</th>
                        <th className="py-3 px-4">AI Recommended Split</th>
                        <th className="py-3 px-4">Visual Comparison</th>
                        <th className="py-3 px-4">Plain-English Reason</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {smartphoneDataset.newLaunchPlan.cityAllocations.map(
                        (row) => {
                          const diff =
                            row.aiRecommendedUnits - row.equalSplitUnits;
                          return (
                            <tr key={row.city} className="hover:bg-slate-50/70">
                              <td className="py-3 px-4 font-bold text-slate-900">
                                {row.city}
                              </td>
                              <td className="py-3 px-4 font-mono">
                                {row.emiShopsPct}%
                              </td>
                              <td className="py-3 px-4 font-mono text-slate-500">
                                {row.equalSplitUnits.toLocaleString()} u
                              </td>
                              <td className="py-3 px-4 font-mono font-bold text-indigo-700">
                                {row.aiRecommendedUnits.toLocaleString()} u{' '}
                                <span
                                  className={`text-[11px] ${
                                    diff >= 0
                                      ? 'text-emerald-700'
                                      : 'text-amber-700'
                                  }`}
                                >
                                  ({diff >= 0 ? `+${diff}` : diff})
                                </span>
                              </td>
                              <td className="py-3 px-4 w-48">
                                <div className="space-y-1">
                                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-slate-400"
                                      style={{
                                        width: `${(row.equalSplitUnits / 4000) * 100}%`,
                                      }}
                                    />
                                  </div>
                                  <div className="h-2 bg-indigo-100 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-indigo-600"
                                      style={{
                                        width: `${(row.aiRecommendedUnits / 4000) * 100}%`,
                                      }}
                                    />
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-4 text-slate-600">
                                {row.reason}
                              </td>
                            </tr>
                          );
                        }
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================================================================
            TAB 4: HOME WARRANTY HELPER & FACTORY BATCH QUALITY ALERTS
           ================================================================ */}
        {activeTab === 'warranty' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 animate-fade-in">
            {/* Left: Doorstep Service-at-Home WhatsApp Triage */}
            <div className="lg:col-span-6 card-surface rounded-2xl p-6 space-y-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 mb-1.5">
                  <Wrench className="w-3 h-3" />
                  Home Warranty Helper (WhatsApp Triage)
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  Fix Software Settings Issues on WhatsApp Before Sending a Technician Home
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Protects your &ldquo;Free Service at Home&rdquo; promise by resolving settings complaints in 3 minutes and booking confirmed spare parts when hardware genuinely fails.
                </p>
              </div>

              <div className="space-y-2">
                {smartphoneDataset.warrantyCases.map((wc) => (
                  <button
                    key={wc.ticketId}
                    onClick={() => setSelectedTicketId(wc.ticketId)}
                    className={`w-full text-left rounded-xl p-3.5 border cursor-pointer transition ${
                      wc.ticketId === selectedTicket.ticketId
                        ? 'border-indigo-600 bg-indigo-50/40'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-900">
                        {wc.customerName} · {wc.phoneModel}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          wc.diagnosisOutcome === 'RESOLVED_ON_WHATSAPP'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {wc.diagnosisOutcome === 'RESOLVED_ON_WHATSAPP'
                          ? 'Solved on WhatsApp (₹650 Saved)'
                          : 'Home Visit Dispatched'}
                      </span>
                    </div>
                    <div className="text-xs text-slate-600 mt-1">
                      Issue: “{wc.issueReported}”
                    </div>
                  </button>
                ))}
              </div>

              {/* Selected Ticket Step-by-Step */}
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-3">
                <div className="flex items-center justify-between text-xs border-b border-slate-200 pb-2">
                  <span className="font-mono font-bold text-slate-800">
                    Ticket #{selectedTicket.ticketId} · IMEI:{' '}
                    {selectedTicket.imei}
                  </span>
                  <span className="text-emerald-700 font-semibold">
                    {selectedTicket.warrantyStatus}
                  </span>
                </div>
                <div className="space-y-2.5">
                  {selectedTicket.steps.map((st, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-xs">
                      <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-mono text-[11px] font-bold flex items-center justify-center shrink-0">
                        {i + 1}
                      </span>
                      <span className="text-slate-700 leading-relaxed">
                        {st}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Factory SMT Batch Early Warning */}
            <div className="lg:col-span-6 card-surface rounded-2xl p-6 space-y-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 mb-1.5">
                  <Factory className="w-3 h-3" />
                  Factory Batch Quality Alert
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  Link Field Complaints Directly Back to Noida SMT Production Batches
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Instead of waiting 45 days for monthly service spreadsheets, the agent groups IMEI complaints by factory line and vendor part lot every night.
                </p>
              </div>

              <div className="space-y-3.5">
                {smartphoneDataset.factoryBatchAlerts.map((b) => {
                  const isHeld = !!quarantinedBatches[b.batchId];
                  return (
                    <div
                      key={b.batchId}
                      className={`rounded-2xl border p-4 space-y-3 ${
                        b.severity === 'HIGH'
                          ? 'border-rose-200 bg-rose-50/30'
                          : 'border-slate-200 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {b.severity === 'HIGH' && (
                            <AlertTriangle className="w-4 h-4 text-rose-600" />
                          )}
                          <span className="font-mono font-bold text-sm text-slate-900">
                            Batch #{b.batchId} · {b.plantLine}
                          </span>
                        </div>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold ${
                            b.severity === 'HIGH'
                              ? 'bg-rose-600 text-white'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {b.spikeMultiplier} Complaint Rate
                        </span>
                      </div>

                      <div className="text-xs space-y-1 text-slate-700">
                        <div>
                          <strong>Phone SKU:</strong> {b.skuAffected} (
                          {b.unitsProduced.toLocaleString()} units built)
                        </div>
                        <div>
                          <strong>Suspected Part:</strong> {b.component}
                        </div>
                        <div>
                          <strong>9-Day Field Tickets:</strong>{' '}
                          <span className="font-mono font-bold text-rose-700">
                            {b.complaints9Days} claims
                          </span>{' '}
                          (normal baseline: {b.normalBaselineComplaints})
                        </div>
                      </div>

                      <div className="rounded-xl bg-white border border-slate-200 p-3 text-xs text-slate-700">
                        <strong>Suggested QA Action:</strong>{' '}
                        {b.recommendedFactoryAction}
                      </div>

                      <button
                        onClick={() =>
                          setQuarantinedBatches((prev) => ({
                            ...prev,
                            [b.batchId]: !prev[b.batchId],
                          }))
                        }
                        className={`w-full py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition ${
                          isHeld
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-900 hover:bg-indigo-600 text-white'
                        }`}
                      >
                        {isHeld ? (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            QA Hold Sent to Noida Line &amp; Spares Dispatched
                          </>
                        ) : (
                          'Hold Unshipped Vendor Lot & Pre-Ship Spares'
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
export default SmartphoneSuite;
