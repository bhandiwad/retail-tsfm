import React, { useState } from 'react';
import { SmartphoneDemoDataset } from '../types/smartphone';
import {
  Database,
  Download,
  CheckCircle2,
  MessageSquare,
  ShieldCheck,
  Store,
  Tag,
} from 'lucide-react';

interface RealisticDataExplorerProps {
  dataset: SmartphoneDemoDataset;
}

type TableTab = 'pricing' | 'cities' | 'slabs' | 'field' | 'warranty';

export const RealisticDataExplorer: React.FC<RealisticDataExplorerProps> = ({
  dataset,
}) => {
  const [activeTable, setActiveTable] = useState<TableTab>('cities');

  const downloadCsv = (filename: string, headers: string[], rows: (string | number)[][]) => {
    const escapeCell = (val: string | number) => {
      const s = String(val ?? '');
      return s.includes(',') || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const csv =
      headers.map(escapeCell).join(',') +
      '\n' +
      rows.map((r) => r.map(escapeCell).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCurrentTable = () => {
    if (activeTable === 'pricing') {
      downloadCsv(
        'sku_pricing_and_shop_margins.csv',
        [
          'SKU_Code',
          'Model_Family',
          'Variant',
          'MOP_INR',
          'Shop_Landing_Cost_INR',
          'Base_Shop_Margin_INR',
          'Base_Margin_Pct',
          'Monthly_Slab_Bonus_INR',
          'Rival_Model',
          'Rival_Shop_Margin_INR',
          'EMI_Buyer_Share_Pct',
        ],
        dataset.skuPricingMaster.map((r) => [
          r.skuId,
          r.modelFamily,
          r.variant,
          r.mopInr,
          r.shopLandingInr,
          r.baseShopMarginInr,
          r.baseShopMarginPct,
          r.monthlySlabBonusInr,
          r.rivalModel,
          r.rivalShopMarginInr,
          r.emiSharePct,
        ])
      );
    } else if (activeTable === 'cities') {
      const rows: (string | number)[][] = [];
      dataset.cities.forEach((c) => {
        Object.entries(c.modelBreakdown).forEach(([modelName, m]) => {
          rows.push([
            c.cityName,
            c.state,
            c.distributorName.trim(),
            c.totalMobileShops,
            c.activeBillingShops,
            modelName,
            m.billedUnits,
            m.activatedUnits,
            m.closingStock,
            m.black256Stock,
            m.effectiveShopMarginInr,
            m.rivalMarginInr,
            c.nbfcZeroDownShopsPct,
            c.inShopPromoters,
          ]);
        });
      });
      downloadCsv(
        'city_billing_vs_sim_activations.csv',
        [
          'City',
          'State',
          'Distributor',
          'Total_Shops',
          'Active_Billing_Shops',
          'Model',
          '30d_Billed_Units',
          '30d_SIM_Activations',
          'Distributor_Closing_Stock',
          'Top_Variant_Stock',
          'Our_Shop_Margin_INR',
          'Rival_Shop_Margin_INR',
          'Zero_Down_EMI_Shops_Pct',
          'In_Shop_Promoters',
        ],
        rows
      );
    } else if (activeTable === 'slabs') {
      downloadCsv(
        'shopkeeper_monthly_slab_tracker.csv',
        [
          'Retailer_ID',
          'Shop_Name',
          'Area_City',
          'Slab_Tier',
          'Monthly_Target_Units',
          'Verified_Activations',
          'Gap_Units',
          'Days_Left',
          'Credit_Note_Unlocked_INR',
        ],
        dataset.retailerSlabs.map((s) => [
          s.retailerId,
          s.shopName,
          s.area,
          s.slabName,
          s.targetUnits,
          s.activatedUnits,
          s.gapUnits,
          s.daysRemaining,
          s.totalBonusUnlockedInr,
        ])
      );
    } else if (activeTable === 'warranty') {
      downloadCsv(
        'factory_batch_and_warranty_alerts.csv',
        [
          'Batch_ID',
          'Plant_Line',
          'SKU',
          'Component_Lot',
          'Units_Produced',
          '9Day_Complaints',
          'Normal_Baseline',
          'Spike_Multiplier',
          'Severity',
        ],
        dataset.factoryBatchAlerts.map((b) => [
          b.batchId,
          b.plantLine,
          b.skuAffected,
          b.component,
          b.unitsProduced,
          b.complaints9Days,
          b.normalBaselineComplaints,
          b.spikeMultiplier,
          b.severity,
        ])
      );
    }
  };

  return (
    <div className="card-surface rounded-2xl p-6 space-y-5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-sky-50 text-sky-700 border border-sky-200/70 mb-2">
            <Database className="w-3 h-3" />
            Data Blueprint — Grounded in Indian DMS &amp; Retail Operations
          </div>
          <h3 className="text-lg font-bold text-slate-900">
            What Data Is Required? (Inspect Sample Tables)
          </h3>
          <p className="text-xs text-slate-600 mt-0.5">
            Starts Day 1 with 3 tables already inside your ERP/DMS, then layers field WhatsApp notes &amp; NBFC EMI store coverage to explain <em>why</em> sales vary by city.
          </p>
        </div>

        <button
          onClick={handleExportCurrentTable}
          className="self-start md:self-auto px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition shrink-0"
        >
          <Download className="w-3.5 h-3.5" />
          Download CSV Sample
        </button>
      </div>

      {/* 2-Tier Summary Pills */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="rounded-xl bg-emerald-50/60 border border-emerald-200/80 p-3.5 flex items-start gap-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <div className="text-xs font-bold text-slate-900">
              Tier 1: Already in Your ERP / DMS Today (Ready Day 1)
            </div>
            <p className="text-[11px] text-slate-600 mt-0.5">
              <strong>1)</strong> SKU Price &amp; Shop Margin Master · <strong>2)</strong> Distributor Stock &amp; Shop Billing · <strong>3)</strong> Daily SIM/IMEI Activation Logs &amp; Monthly Bonus Slabs.
            </p>
          </div>
        </div>
        <div className="rounded-xl bg-indigo-50/60 border border-indigo-200/80 p-3.5 flex items-start gap-3">
          <MessageSquare className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
          <div>
            <div className="text-xs font-bold text-slate-900">
              Tier 2: High-Signal Field Layer (Captured by Agents + Partner Feeds)
            </div>
            <p className="text-[11px] text-slate-600 mt-0.5">
              <strong>4)</strong> Bajaj/TVS 0% EMI Active Store List + Field Rep WhatsApp Rival Scheme Notes · <strong>5)</strong> Service Center &amp; WhatsApp Warranty Logs by Factory Batch.
            </p>
          </div>
        </div>
      </div>

      {/* Table Switcher Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 bg-slate-100/90 p-1.5 rounded-xl border border-slate-200/60">
        <button
          onClick={() => setActiveTable('cities')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
            activeTable === 'cities'
              ? 'bg-white text-slate-900 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Store className="w-3.5 h-3.5 text-indigo-600" />
          1. City Billing vs. SIM Activations (DMS + IMEI)
        </button>
        <button
          onClick={() => setActiveTable('pricing')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
            activeTable === 'pricing'
              ? 'bg-white text-slate-900 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Tag className="w-3.5 h-3.5 text-emerald-600" />
          2. Product Price &amp; Shop Margin Master
        </button>
        <button
          onClick={() => setActiveTable('slabs')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
            activeTable === 'slabs'
              ? 'bg-white text-slate-900 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />
          3. Shopkeeper Bonus Slab Ledger
        </button>
        <button
          onClick={() => setActiveTable('field')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
            activeTable === 'field'
              ? 'bg-white text-slate-900 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5 text-fuchsia-600" />
          4. Field Rep &amp; EMI Signals
        </button>
        <button
          onClick={() => setActiveTable('warranty')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
            activeTable === 'warranty'
              ? 'bg-white text-slate-900 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-rose-600" />
          5. Warranty &amp; Factory Batch Logs
        </button>
      </div>

      {/* Table 1: City Billing vs Activations */}
      {activeTable === 'cities' && (
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                <th className="py-2.5 px-3">City &amp; Distributor</th>
                <th className="py-2.5 px-3">Active Shops</th>
                <th className="py-2.5 px-3">Curve 5G (₹18k) SIM Activations</th>
                <th className="py-2.5 px-3">Power 5G (₹11.5k) SIM Activations</th>
                <th className="py-2.5 px-3">Black 256GB Stock</th>
                <th className="py-2.5 px-3">Our Margin vs Rival</th>
                <th className="py-2.5 px-3">0% EMI Shops</th>
                <th className="py-2.5 px-3">Promoters</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {dataset.cities.map((c) => {
                const crv = c.modelBreakdown['Curve 5G (₹18k)'];
                const pwr = c.modelBreakdown['Power 5G (₹11.5k)'];
                const marginBehind = crv.effectiveShopMarginInr < crv.rivalMarginInr;
                return (
                  <tr key={c.cityId} className="hover:bg-slate-50/80">
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-slate-900">{c.cityName}</div>
                      <div className="text-[11px] text-slate-500">{c.distributorName}</div>
                    </td>
                    <td className="py-2.5 px-3 font-mono">
                      {c.activeBillingShops}/{c.totalMobileShops}{' '}
                      <span className="text-slate-400">({c.storeCoveragePct}%)</span>
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-indigo-700">
                      {crv.activatedUnits.toLocaleString()}
                      <span className="text-[10px] font-normal text-slate-400 block">
                        of {crv.billedUnits.toLocaleString()} billed
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-sky-700">
                      {pwr.activatedUnits.toLocaleString()}
                      <span className="text-[10px] font-normal text-slate-400 block">
                        of {pwr.billedUnits.toLocaleString()} billed
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          crv.black256Stock <= 15
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {crv.black256Stock} units
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono">
                      <span className={marginBehind ? 'text-rose-700 font-semibold' : 'text-emerald-700 font-semibold'}>
                        ₹{crv.effectiveShopMarginInr}
                      </span>{' '}
                      <span className="text-slate-400">vs ₹{crv.rivalMarginInr}</span>
                    </td>
                    <td className="py-2.5 px-3 font-mono">
                      <span
                        className={
                          c.nbfcZeroDownShopsPct >= 65
                            ? 'text-emerald-700 font-semibold'
                            : 'text-amber-700 font-semibold'
                        }
                      >
                        {c.nbfcZeroDownShopsPct}%
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono">{c.inShopPromoters}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Table 2: Pricing & Margin Master */}
      {activeTable === 'pricing' && (
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                <th className="py-2.5 px-3">SKU Code</th>
                <th className="py-2.5 px-3">Model &amp; Variant</th>
                <th className="py-2.5 px-3">Selling Price (MOP)</th>
                <th className="py-2.5 px-3">Shop Landing Cost</th>
                <th className="py-2.5 px-3">Base Shop Margin</th>
                <th className="py-2.5 px-3">Monthly Slab Bonus</th>
                <th className="py-2.5 px-3">Rival Phone &amp; Margin</th>
                <th className="py-2.5 px-3">EMI Buyer %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {dataset.skuPricingMaster.map((r) => (
                <tr key={r.skuId} className="hover:bg-slate-50/80">
                  <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">{r.skuId}</td>
                  <td className="py-2.5 px-3">
                    <div className="font-bold text-slate-900">{r.modelFamily}</div>
                    <div className="text-[11px] text-slate-500">{r.variant}</div>
                  </td>
                  <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                    ₹{r.mopInr.toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-slate-700">
                    ₹{r.shopLandingInr.toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-emerald-700 font-semibold">
                    ₹{r.baseShopMarginInr} ({r.baseShopMarginPct}%)
                  </td>
                  <td className="py-2.5 px-3 font-mono text-indigo-700 font-semibold">
                    +₹{r.monthlySlabBonusInr}/unit
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="text-slate-800 font-medium">{r.rivalModel}</div>
                    <div className="text-[11px] font-mono text-slate-500">
                      Rival pays ₹{r.rivalShopMarginInr}/unit
                    </div>
                  </td>
                  <td className="py-2.5 px-3 font-mono">{r.emiSharePct}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Table 3: Shopkeeper Slab Ledger */}
      {activeTable === 'slabs' && (
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                <th className="py-2.5 px-3">Retailer ID</th>
                <th className="py-2.5 px-3">Shop &amp; Market</th>
                <th className="py-2.5 px-3">Monthly Slab Tier</th>
                <th className="py-2.5 px-3">SIMs Activated</th>
                <th className="py-2.5 px-3">Phones Needed</th>
                <th className="py-2.5 px-3">Credit Note Unlocked</th>
                <th className="py-2.5 px-3">Suggested Order</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {dataset.retailerSlabs.map((s) => (
                <tr key={s.retailerId} className="hover:bg-slate-50/80">
                  <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">{s.retailerId}</td>
                  <td className="py-2.5 px-3">
                    <div className="font-bold text-slate-900">{s.shopName}</div>
                    <div className="text-[11px] text-slate-500">{s.area}</div>
                  </td>
                  <td className="py-2.5 px-3 font-medium text-slate-800">{s.slabName}</td>
                  <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                    {s.activatedUnits} / {s.targetUnits}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200">
                      Just {s.gapUnits} more
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-mono font-bold text-emerald-700">
                    ₹{s.totalBonusUnlockedInr.toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3 text-slate-700">{s.recommendedOrder}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Table 4: Field Notes & EMI Coverage */}
      {activeTable === 'field' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {dataset.cities.map((c) => (
            <div key={c.cityId} className="rounded-xl border border-slate-200 p-3.5 bg-slate-50/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">
                  {c.cityName} ({c.state})
                </span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700">
                  0% EMI Shops: {c.nbfcZeroDownShopsPct}% · Promoters: {c.inShopPromoters}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                <strong>Buyer Profile:</strong> {c.buyerProfile}
              </p>
              <div className="space-y-1.5 pt-1">
                {c.fieldNotes.map((note, idx) => (
                  <div
                    key={idx}
                    className="text-[11px] bg-white border border-slate-200/80 rounded-lg p-2 text-slate-700"
                  >
                    “{note}”
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Table 5: Warranty & Factory Batch Logs */}
      {activeTable === 'warranty' && (
        <div className="space-y-3">
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                  <th className="py-2.5 px-3">Factory Batch ID</th>
                  <th className="py-2.5 px-3">Plant &amp; Line</th>
                  <th className="py-2.5 px-3">Model &amp; Component Lot</th>
                  <th className="py-2.5 px-3">9-Day RMA Tickets</th>
                  <th className="py-2.5 px-3">Spike Rate</th>
                  <th className="py-2.5 px-3">Recommended Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dataset.factoryBatchAlerts.map((b) => (
                  <tr key={b.batchId} className="hover:bg-slate-50/80">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{b.batchId}</td>
                    <td className="py-2.5 px-3 text-slate-700">{b.plantLine}</td>
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-slate-900">{b.skuAffected}</div>
                      <div className="text-[11px] text-slate-500">{b.component}</div>
                    </td>
                    <td className="py-2.5 px-3 font-mono">
                      <span className="font-bold text-rose-700">{b.complaints9Days}</span>{' '}
                      <span className="text-slate-400">(normal: {b.normalBaselineComplaints})</span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-bold ${
                          b.severity === 'HIGH'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {b.spikeMultiplier}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-[11px] text-slate-700 max-w-sm">
                      {b.recommendedFactoryAction}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
