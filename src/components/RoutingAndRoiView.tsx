import React, { useState } from 'react';
import { RoutingBenchmarks } from '../types/retail';
import {
  GitBranch,
  RefreshCw,
  Award,
  CheckCircle2,
  Sliders,
} from 'lucide-react';

interface RoutingAndRoiViewProps {
  benchmarks: RoutingBenchmarks;
}

export const RoutingAndRoiView: React.FC<RoutingAndRoiViewProps> = ({
  benchmarks,
}) => {
  const [avgInventoryM, setAvgInventoryM] = useState<number>(10);
  const [overstockPct, setOverstockPct] = useState<number>(25);
  const [carryingCostPct, setCarryingCostPct] = useState<number>(25);
  const [annualSalesM, setAnnualSalesM] = useState<number>(45);

  const totalExcessInventoryUsd =
    avgInventoryM * 1_000_000 * (overstockPct / 100);
  const annualCarryingCostExposureUsd =
    totalExcessInventoryUsd * (carryingCostPct / 100);

  const workingCapitalFreedUsd = Math.round(totalExcessInventoryUsd * 0.448);
  const carryingCostSavedUsd = Math.round(annualCarryingCostExposureUsd * 0.448);
  const markdownMarginSavedUsd = Math.round(totalExcessInventoryUsd * 0.154);
  const recoveredLostSalesMarginUsd = Math.round(
    annualSalesM * 1_000_000 * 0.04 * 0.34 * 0.58
  );
  const totalAnnualRecurringBenefitUsd =
    carryingCostSavedUsd + markdownMarginSavedUsd + recoveredLostSalesMarginUsd;

  return (
    <div className="space-y-6">
      {/* Top Row: Archetype Routing Matrix & WAPE Leaderboard */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1.5 font-semibold">
                <GitBranch className="w-3.5 h-3.5" />
                Forecast Accuracy by Product Type
              </span>
              <span className="text-xs font-mono text-slate-500">
                168-SKU Benchmark • 12-Week Test
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 mt-1">
              Why Using the Right Forecast Method Per Product Type Cuts Error in Half
            </h2>
          </div>

          <div className="flex items-center gap-3 bg-emerald-50/70 border border-emerald-200 px-3.5 py-2 rounded-xl">
            <Award className="w-5 h-5 text-emerald-600" />
            <div className="text-xs">
              <div className="text-slate-600">Forecast Error Improved</div>
              <div className="font-mono font-bold text-emerald-700 text-sm">
                29.8% → 16.4% (-13.4 pts)
              </div>
            </div>
          </div>
        </div>

        {/* Routing Table */}
        <div className="overflow-x-auto mt-4">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-[11px] font-mono uppercase text-slate-500 bg-slate-50/80">
                <th className="py-2.5 px-3">Product Group</th>
                <th className="py-2.5 px-3">Items</th>
                <th className="py-2.5 px-3">Forecast Method Used</th>
                <th className="py-2.5 px-3 text-center">Market Signal Applied</th>
                <th className="py-2.5 px-3 text-right">Old ERP Error</th>
                <th className="py-2.5 px-3 text-right">Basic Math</th>
                <th className="py-2.5 px-3 text-right">Base AI</th>
                <th className="py-2.5 px-3 text-right text-emerald-700">Our Full AI</th>
                <th className="py-2.5 px-3">Business Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {benchmarks.archetypeRoutingMatrix.map((row) => {
                const gain = +(row.legacyWape - row.addlWape).toFixed(1);
                return (
                  <tr
                    key={row.archetype}
                    className="hover:bg-slate-50 transition group"
                  >
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900">{row.archetype}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {row.routingRule}
                      </div>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-700">
                      {row.skuCount}{' '}
                      <span className="text-slate-400">
                        ({row.shareOfCatalogPct}%)
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-1 rounded-md bg-indigo-50/80 border border-indigo-200 font-mono text-[11px] text-indigo-800 font-medium">
                        {row.primaryRouterModel}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center font-mono">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                          row.llmContextFrequencyPct > 50
                            ? 'bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-200'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {row.llmContextFrequencyPct}% of wks
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-rose-600 font-medium">
                      {row.legacyWape}%
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-sky-700">
                      {row.classicalWape}%
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-violet-700">
                      {row.chronos2Wape}%
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700">
                      {row.addlWape}%{' '}
                      <span className="text-[10px] text-emerald-600 block">
                        (-{gain} pts)
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="text-emerald-700 font-semibold">
                        {row.primaryBusinessWin}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Middle Row: Closed-Loop Feedback Ledger (Step 6) + Interactive Working Capital Calculator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Closed-Loop Measurement & Auto-Routing Ledger */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <RefreshCw className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-mono uppercase tracking-wider text-emerald-700 font-semibold">
                Continuous Learning
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Improves Automatically From Real Store Sales Every Month
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Tracks actual stockouts, extra slow stock, and discounts each cycle and automatically adjusts future order weights.
            </p>

            <div className="space-y-3 mt-4">
              {benchmarks.closedLoopFeedbackEvents.map((ev, i) => (
                <div
                  key={i}
                  className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono font-bold text-indigo-700">
                      {ev.cycle} • {ev.segment}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">
                      Auto-Updated
                    </span>
                  </div>
                  <p className="text-xs text-slate-700">
                    <strong className="text-slate-900">Observed Outcome:</strong>{' '}
                    {ev.observation}
                  </p>
                  <p className="text-xs text-indigo-800">
                    <strong className="text-indigo-900">System Update:</strong>{' '}
                    {ev.routerAction}
                  </p>
                  <div className="pt-1 text-[11px] font-mono text-emerald-700 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Verified Gain: {ev.measuredGain}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 p-3 rounded-xl bg-indigo-50/70 border border-indigo-200 text-xs text-slate-700">
            <strong className="text-slate-900">Industry Evidence Benchmark:</strong>{' '}
            Decathlon’s Chronos-2 deployment demonstrated an{' '}
            <span className="text-emerald-700 font-bold">
              11–15 point WAPE reduction at 12 weeks
            </span>
            , translating to ~0.3 days inventory reduction and +0.3 pts availability
            per point of accuracy gain.
          </div>
        </div>

        {/* Interactive Retailer Working Capital & ROI Simulator */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-indigo-600" />
                  <span className="text-xs font-mono uppercase tracking-wider text-indigo-700 font-semibold">
                    Live Retailer Value &amp; Working Capital Simulator
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">
                  Quantify Cash Freed &amp; Margin Protected on Your Inventory Pool
                </h3>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-mono font-semibold">
                Overlay PoC Ready
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-4">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-slate-700 font-medium">
                    Average Inventory Value
                  </span>
                  <span className="font-mono font-bold text-slate-900">
                    ${avgInventoryM}M
                  </span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={150}
                  step={5}
                  value={avgInventoryM}
                  onChange={(e) => setAvgInventoryM(Number(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1">
                  <span>$5M (Single Category)</span>
                  <span>$150M (Full Chain)</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-slate-700 font-medium">
                    Annual Category / Brand Sales
                  </span>
                  <span className="font-mono font-bold text-slate-900">
                    ${annualSalesM}M
                  </span>
                </div>
                <input
                  type="range"
                  min={20}
                  max={500}
                  step={10}
                  value={annualSalesM}
                  onChange={(e) => setAnnualSalesM(Number(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1">
                  <span>$20M</span>
                  <span>$500M</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-slate-700 font-medium">
                    Baseline Overstock Distortion %
                  </span>
                  <span className="font-mono font-bold text-amber-700">
                    {overstockPct}%
                  </span>
                </div>
                <input
                  type="range"
                  min={15}
                  max={35}
                  step={1}
                  value={overstockPct}
                  onChange={(e) => setOverstockPct(Number(e.target.value))}
                  className="w-full accent-amber-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1">
                  <span>15% Lean</span>
                  <span>25% Retail Avg</span>
                  <span>35% Heavy</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-slate-700 font-medium">
                    Annual Carrying Cost % of Inv.
                  </span>
                  <span className="font-mono font-bold text-rose-700">
                    {carryingCostPct}% / yr
                  </span>
                </div>
                <input
                  type="range"
                  min={18}
                  max={32}
                  step={1}
                  value={carryingCostPct}
                  onChange={(e) => setCarryingCostPct(Number(e.target.value))}
                  className="w-full accent-rose-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1">
                  <span>18%</span>
                  <span>25% Standard</span>
                  <span>32%</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200">
                <div className="text-[11px] text-emerald-800 font-medium">
                  Working Capital Freed
                </div>
                <div className="text-lg font-mono font-bold text-emerald-700 mt-1">
                  ${(workingCapitalFreedUsd / 1_000_000).toFixed(2)}M
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  Cash released from excess stock
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[11px] text-slate-600 font-medium">
                  Carrying Cost Saved
                </div>
                <div className="text-lg font-mono font-bold text-slate-900 mt-1">
                  ${Math.round(carryingCostSavedUsd / 1000).toLocaleString()}K
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  Annual holding &amp; storage relief
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[11px] text-slate-600 font-medium">
                  Markdown Margin Saved
                </div>
                <div className="text-lg font-mono font-bold text-indigo-700 mt-1">
                  ${Math.round(markdownMarginSavedUsd / 1000).toLocaleString()}K
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  Early shallow vs late clearance
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[11px] text-slate-600 font-medium">
                  Stockout Margin Recovered
                </div>
                <div className="text-lg font-mono font-bold text-amber-700 mt-1">
                  ${Math.round(recoveredLostSalesMarginUsd / 1000).toLocaleString()}K
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  Promo &amp; peak availability lift
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 p-4 rounded-xl bg-gradient-to-r from-indigo-50 via-white to-emerald-50 border border-indigo-200 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-xs font-mono uppercase tracking-wider text-indigo-700 font-bold">
                Fast 4-Week Pilot • Works With Your Current ERP
              </div>
              <div className="text-sm font-bold text-slate-900 mt-0.5">
                Start With 1 Product Category (50–200 Items) • No System Replacement Needed
              </div>
              <div className="text-xs text-slate-600 mt-1">
                Target pilot outcome: 10+ point forecast accuracy improvement &amp;{' '}
                <strong className="text-emerald-700">
                  ${(totalAnnualRecurringBenefitUsd / 1_000_000).toFixed(2)}M/yr
                </strong>{' '}
                estimated annual cash and margin gain.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
