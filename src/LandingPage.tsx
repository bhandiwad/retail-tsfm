import React from 'react';
import rawSmartphoneData from './data/smartphoneDemoData.json';
import { SmartphoneDemoDataset } from './types/smartphone';
import { RealisticDataExplorer } from './components/RealisticDataExplorer';
import {
  ActionSubTool,
  ForecastSubMode,
  SmartphoneMainTab,
} from './SmartphoneSuite';
import {
  ArrowRight,
  CheckCircle2,
  MapPin,
  MessageCircle,
  PackageCheck,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  Sparkles,
  Store,
  TrendingUp,
  Truck,
} from 'lucide-react';

const smartphoneDataset = rawSmartphoneData as unknown as SmartphoneDemoDataset;

export interface LandingPageProps {
  onOpenSmartphoneDemo: (
    tab?: SmartphoneMainTab,
    actionTool?: ActionSubTool,
    forecastMode?: ForecastSubMode
  ) => void;
  onOpenFootwearDemo: (
    tab?: 'workspace' | 'coldstart' | 'routing' | 'connectors'
  ) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onOpenSmartphoneDemo,
  onOpenFootwearDemo,
}) => {
  const retailAgents = [
    {
      num: '01',
      name: 'Demand Forecaster',
      tag: 'Forecasting Core',
      icon: TrendingUp,
      accent: 'text-indigo-600 bg-indigo-50 border-indigo-200/80',
      whatItDoes:
        'Predicts weekly sales per product and warehouse—even when past weeks hit zero stock—and recommends exact buy quantities.',
      businessWin: 'Cuts forecast error from ~30% to ~14% and prevents stockouts on bestsellers.',
      ctaLabel: 'Demo Forecaster',
      onClick: () => onOpenFootwearDemo('workspace'),
    },
    {
      num: '02',
      name: 'City Sales Explainer',
      tag: 'Regional Sales Insights',
      icon: MapPin,
      accent: 'text-sky-600 bg-sky-50 border-sky-200/80',
      whatItDoes:
        'Explains why Model A sells well in Surat while Model B sells better in Lucknow by checking shop margins, variant stock, 0% EMI stores, and field notes.',
      businessWin: 'Turns "we don’t know why cities differ" into a clear city-by-city recovery plan.',
      ctaLabel: 'Demo City Explainer',
      onClick: () => onOpenSmartphoneDemo('city-explainer'),
    },
    {
      num: '03',
      name: 'Stock Mover',
      tag: 'Inventory Allocation',
      icon: Truck,
      accent: 'text-violet-600 bg-violet-50 border-violet-200/80',
      whatItDoes:
        'Spots when a fast-moving color/RAM variant is out of stock in one city while sitting unsold in a nearby depot, and creates a transfer chalan.',
      businessWin: 'Recovers lost sales within 24–48 hours without waiting for a new factory batch.',
      ctaLabel: 'Demo Stock Mover',
      onClick: () => onOpenSmartphoneDemo('actions', 'transfer'),
    },
    {
      num: '04',
      name: 'Shopkeeper WhatsApp Assistant',
      tag: 'Distributor & Dealer Sales',
      icon: MessageCircle,
      accent: 'text-emerald-600 bg-emerald-50 border-emerald-200/80',
      whatItDoes:
        'Messages shopkeepers in Hindi/Hinglish when they are 2–4 units away from their monthly bonus slab and books restock orders directly on WhatsApp.',
      businessWin: 'Gets multi-brand shopkeepers to push your product over rivals before month-end.',
      ctaLabel: 'Demo WhatsApp Bot',
      onClick: () => onOpenSmartphoneDemo('actions', 'whatsapp'),
    },
    {
      num: '05',
      name: 'Counter Sales Helper',
      tag: 'In-Shop Conversion',
      icon: Store,
      accent: 'text-amber-600 bg-amber-50 border-amber-200/80',
      whatItDoes:
        'Gives store staff a 3-point comparison card, shop margin proof, and an instant old-phone exchange code when a buyer asks for a rival phone.',
      businessWin: 'Converts undecided walk-in buyers right at the retail counter.',
      ctaLabel: 'Demo Counter Pitch',
      onClick: () => onOpenSmartphoneDemo('actions', 'pitch'),
    },
    {
      num: '06',
      name: 'New Launch Planner',
      tag: 'Day-1 Allocation',
      icon: PackageCheck,
      accent: 'text-fuchsia-600 bg-fuchsia-50 border-fuchsia-200/80',
      whatItDoes:
        'Decides how many units of a newly launched model should go to each city and store cluster based on past similar launches and EMI readiness.',
      businessWin: 'Prevents launch-week shortages in strong markets and dead stock in mismatch cities.',
      ctaLabel: 'Demo Launch Split',
      onClick: () => onOpenSmartphoneDemo('forecast', 'whatsapp', 'launch'),
    },
    {
      num: '07',
      name: 'Home Warranty & Quality Helper',
      tag: 'Service & Factory Loop',
      icon: ShieldCheck,
      accent: 'text-rose-600 bg-rose-50 border-rose-200/80',
      whatItDoes:
        'Resolves common software settings complaints on WhatsApp before sending a technician home, and flags faulty factory batches within days.',
      businessWin: 'Lowers doorstep service costs and catches supplier part issues early.',
      ctaLabel: 'Demo Warranty & QA',
      onClick: () => onOpenSmartphoneDemo('warranty'),
    },
  ];

  const scrollToData = () => {
    const el = document.getElementById('data-blueprint-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col">
      {/* HEADER */}
      <header className="border-b border-slate-200/80 bg-white/95 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-[1440px] mx-auto px-5 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center font-mono font-bold text-white text-xs shadow-xs">
              P·AI
            </div>
            <div>
              <div className="text-base font-bold text-slate-900 tracking-tight">
                Pandita's Adaptive Demand Decision Layer
              </div>
              <div className="text-[11px] text-slate-500 hidden sm:block">
                Retail AI Suite · Demand Forecasting · City Sales Insights · Store &amp; Channel Execution
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={scrollToData}
              className="hidden md:inline-flex px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer transition"
            >
              What Data Is Needed?
            </button>
            <button
              onClick={() => onOpenFootwearDemo('workspace')}
              className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 text-xs font-semibold cursor-pointer transition"
            >
              Footwear Demo
            </button>
            <button
              onClick={() => onOpenSmartphoneDemo('city-explainer')}
              className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs transition"
            >
              Smartphones Demo
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1440px] w-full mx-auto px-5 lg:px-8 py-8 space-y-10 flex-1">
        {/* HERO SECTION */}
        <section className="text-center max-w-3xl mx-auto space-y-4 pt-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/80">
            <Sparkles className="w-3.5 h-3.5" />
            Pandita's Retail AI · Plugs Into Your Existing ERP, DMS &amp; WhatsApp Network
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Forecast Demand Accurately. Understand Why Cities Differ. Help Every Shop Sell More.
          </h1>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Standard dashboards only show <em>what</em> sold last month. Our AI agents connect store billing, stockouts, shopkeeper margins, EMI coverage, and field updates to explain <strong>why</strong> sales shift—and automatically trigger stock transfers, dealer target nudges, and counter pitches.
          </p>
        </section>

        {/* TWO CLICKABLE PRODUCT DEMOS */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* PRODUCT DEMO 1: SMARTPHONES & CONSUMER ELECTRONICS */}
          <div className="card-surface card-surface-interactive rounded-2xl p-6 border-2 border-indigo-600/20 flex flex-col justify-between gap-5 relative overflow-hidden">
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-600 text-white">
                  <Smartphone className="w-3.5 h-3.5" />
                  Showcase 1 · Consumer Electronics &amp; Mobile
                </span>
                <span className="text-xs font-mono text-slate-500">
                  Sample Brand: Zenith Mobile India
                </span>
              </div>

              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Smartphones &amp; General Trade Distribution AI
                </h2>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Built for multi-brand offline retail (Tier-1/2/3 cities), distributors, and D2C brands managing ₹6,500–₹25,000 devices, monthly dealer slabs, and doorstep warranty.
                </p>
              </div>

              <div className="space-y-2 text-xs text-slate-700">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Why Model A Sells Here &amp; Model B Sells There:</strong> Live Surat vs. Lucknow &amp; Jaipur vs. Patna root-cause analyzer.
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Sell-More Execution:</strong> Hinglish WhatsApp shopkeeper slab nudges, inter-depot variant transfers, and 30-second rival counter pitch cards.
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Home Warranty &amp; Factory QA:</strong> WhatsApp settings triage + Noida SMT batch defect early warning.
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3 text-xs font-mono text-slate-600">
                <span>6 Indian Cities</span>
                <span>·</span>
                <span>5 Real DMS Tables</span>
                <span>·</span>
                <span>WhatsApp Live Sim</span>
              </div>
              <button
                onClick={() => onOpenSmartphoneDemo('city-explainer')}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-xs transition"
              >
                Open Smartphones Demo
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* PRODUCT DEMO 2: FOOTWEAR & LIFESTYLE FORECASTING CORE */}
          <div className="card-surface card-surface-interactive rounded-2xl p-6 flex flex-col justify-between gap-5">
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-600 text-white">
                  <ShoppingBag className="w-3.5 h-3.5" />
                  Showcase 2 · Demand &amp; Stock Planning
                </span>
                <span className="text-xs font-mono text-slate-500">
                  168-Item Retail Benchmark
                </span>
              </div>

              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Weekly Sales Forecasting &amp; Inventory Planner
                </h2>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Our core forecasting engine that fixes past zero-stock weeks, predicts weekly demand ranges, plans new product launches, and tests your own CSV sales files.
                </p>
              </div>

              <div className="space-y-2 text-xs text-slate-700">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Zero-Stock Correction:</strong> Rebuilds true lost demand on weeks when inventory ran out so next season isn&apos;t under-ordered.
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Interactive What-If &amp; Cold-Start Studio:</strong> Test promo lifts, markdown timing, and size/variant curves live.
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Upload Any Historical CSV:</strong> Benchmark your own SKU sales history in seconds.
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3 text-xs font-mono text-slate-600">
                <span>29.8% → 16.4% Error</span>
                <span>·</span>
                <span>96.8% In-Stock</span>
                <span>·</span>
                <span>CSV Upload Ready</span>
              </div>
              <button
                onClick={() => onOpenFootwearDemo('workspace')}
                className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-xs transition"
              >
                Open Forecasting Demo
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>

        {/* FULL LIST OF 7 RETAIL AGENTS */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Full List of Retail AI Agents (Click Any Agent to Demo Live)
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Simple, modular agents across demand planning, regional distribution, shopkeeper engagement, and after-sales service.
              </p>
            </div>
            <span className="text-xs font-mono text-slate-500">
              7 Plain-English Agents · End-to-End Value Chain
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {retailAgents.map((ag) => {
              const IconComp = ag.icon;
              return (
                <div
                  key={ag.num}
                  onClick={ag.onClick}
                  className="card-surface card-surface-interactive rounded-2xl p-5 flex flex-col justify-between gap-4 cursor-pointer"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div
                        className={`w-9 h-9 rounded-xl border flex items-center justify-center ${ag.accent}`}
                      >
                        <IconComp className="w-4 h-4" />
                      </div>
                      <span className="text-[11px] font-mono font-bold text-slate-400">
                        AGENT {ag.num}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                        {ag.tag}
                      </span>
                      <h3 className="text-sm font-bold text-slate-900 mt-0.5">
                        {ag.name}
                      </h3>
                      <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                        {ag.whatItDoes}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2.5 pt-3 border-t border-slate-100">
                    <div className="text-[11px] font-medium text-emerald-800 bg-emerald-50/70 border border-emerald-200/60 rounded-lg px-2.5 py-1.5">
                      {ag.businessWin}
                    </div>
                    <div className="flex items-center justify-between text-xs font-bold text-indigo-600">
                      <span>{ag.ctaLabel}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* DATA REQUIREMENTS & LIVE SAMPLE DATA EXPLORER */}
        <section id="data-blueprint-section" className="pt-2">
          <RealisticDataExplorer dataset={smartphoneDataset} />
        </section>
      </main>
    </div>
  );
};
export default LandingPage;
