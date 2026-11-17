import React, { useState } from 'react';
import { ColdStartStudioData } from '../types/retail';
import { FootwearVisual } from './FootwearVisual';
import {
  ScanEye,
  Cpu,
  CheckCircle2,
  ArrowUpRight,
  Layers,
  Ruler,
  TrendingUp,
} from 'lucide-react';

interface ColdStartStudioProps {
  data: ColdStartStudioData;
  onApproveColdStartAction: (
    skuId: string,
    summary: string,
    impactUsd: number
  ) => void;
  isApproved: boolean;
}

const CONCEPT_PRESETS = [
  {
    id: 'raffia-slide',
    skuId: 'TOMS-3109-OAT',
    name: 'Playa Raffia Woven Slide — Coastal Oat',
    silhouetteType: 'slide_sandal',
    colorHex: '#e2cfb4',
    price: 69.95,
    season: 'Spring / Resort Launch',
    material: 'Braided Natural Raffia Upper / OrthoLite Eco Footbed',
    plannerGuess: 240,
    aiPeak: 485,
    recommendedAddUnits: 1150,
    impactUsd: 54700,
    tags: [
      'Natural Woven Raffia Texture',
      'Wide Single-Band Vamp',
      'Resort / Warm-Weather Silhouette',
      'Neutral Earth-Tone Palette',
      'Flat Espadrille-Inspired Midsole',
    ],
  },
  {
    id: 'shearling-clog',
    skuId: 'TOMS-8810-ESP',
    name: 'Sierra Shearling Buckle Clog — Espresso Suede',
    silhouetteType: 'platform_mule',
    colorHex: '#6f4e37',
    price: 94.95,
    season: 'Fall / Holiday Drop',
    material: 'Water-Resistant Cow Suede / Faux Shearling Collar',
    plannerGuess: 310,
    aiPeak: 590,
    recommendedAddUnits: 1420,
    impactUsd: 72400,
    tags: [
      'Brushed Espresso Suede',
      'Exposed Shearling Lining',
      'Contoured Cork-Latex Midsole',
      'Brushed Brass Side Buckle',
      'Indoor-Outdoor Cozy Silhouette',
    ],
  },
  {
    id: 'hemp-slipon',
    skuId: 'TOMS-9104-OCN',
    name: 'Baja Washed Hemp Alpargata — Ocean Slate',
    silhouetteType: 'espadrille',
    colorHex: '#4a6fa5',
    price: 59.95,
    season: 'High Summer Capsule',
    material: '55% Organic Hemp / 45% Recycled Cotton Canvas',
    plannerGuess: 280,
    aiPeak: 430,
    recommendedAddUnits: 890,
    impactUsd: 41800,
    tags: [
      'Slub Hemp-Canvas Weave',
      'Pigment-Dyed Coastal Wash',
      'Heritage V-Gore Elastic',
      'Jute-Wrapped Foxing',
      'Ultra-Packable Travel Profile',
    ],
  },
];

export const ColdStartStudio: React.FC<ColdStartStudioProps> = ({
  data,
  onApproveColdStartAction,
  isApproved,
}) => {
  const [selectedPresetIdx, setSelectedPresetIdx] = useState(0);
  const preset = CONCEPT_PRESETS[selectedPresetIdx];
  const scaleRatio = preset.aiPeak / 485;

  const svgW = 680;
  const svgH = 220;
  const padL = 44;
  const padR = 20;
  const padT = 20;
  const padB = 28;
  const plotW = svgW - padL - padR;
  const plotH = svgH - padT - padB;
  const maxY = 650;

  const getX = (wkIdx: number) => padL + (wkIdx / 11) * plotW;
  const getY = (val: number) =>
    padT + plotH - Math.min(1, Math.max(0, val / maxY)) * plotH;

  const zeroShotCurve = Array.from({ length: 12 }).map((_, i) => {
    const weighted =
      (data.analogMatches[0].weeklyLaunchCurve[i] * 0.5 +
        data.analogMatches[1].weeklyLaunchCurve[i] * 0.3 +
        data.analogMatches[2].weeklyLaunchCurve[i] * 0.2) *
      scaleRatio *
      1.08;
    return Math.round(weighted);
  });

  const zeroShotPoints = zeroShotCurve
    .map((val, i) => `${getX(i)},${getY(val)}`)
    .join(' ');

  const plannerFlatPoints = Array.from({ length: 12 })
    .map((_, i) => `${getX(i)},${getY(preset.plannerGuess)}`)
    .join(' ');

  return (
    <div className="space-y-5">
      {/* Studio Top Banner & Concept Switcher */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono uppercase tracking-wider bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-200 flex items-center gap-1.5 font-semibold">
                <ScanEye className="w-3.5 h-3.5" />
                New Product Launch Planner
              </span>
              <span className="text-xs text-slate-500 font-mono">
                Matches Look, Material &amp; Price to Similar Past Launches
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 mt-1">
              Predicting First-Season Sales for Brand-New Styles With Zero Past History
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">
              Select New Launch Style:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {CONCEPT_PRESETS.map((cp, idx) => (
                <button
                  key={cp.id}
                  onClick={() => setSelectedPresetIdx(idx)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition border cursor-pointer ${
                    selectedPresetIdx === idx
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {cp.name.split('—')[0].trim()}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 3-Column Cold-Start Pipeline */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-4">
          {/* Column 1: Multimodal Feature Extraction */}
          <div className="lg:col-span-4 bg-slate-50/80 border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono uppercase tracking-wider text-indigo-700 font-semibold flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5" />
                  1. Product Details &amp; Visual Tags
                </span>
                <span className="text-xs font-mono text-slate-500">
                  {preset.skuId}
                </span>
              </div>

              <div className="flex items-center gap-3.5 p-3 rounded-xl bg-white border border-slate-200">
                <FootwearVisual
                  silhouetteType={preset.silhouetteType}
                  colorHex={preset.colorHex}
                  size="lg"
                />
                <div className="min-w-0">
                  <div className="text-xs font-mono text-emerald-700 font-semibold">
                    {preset.season}
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 leading-snug mt-0.5">
                    {preset.name}
                  </h3>
                  <div className="text-xs text-slate-600 mt-1">
                    MSRP <strong className="text-slate-900">${preset.price}</strong>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                    {preset.material}
                  </div>
                </div>
              </div>

              <div className="mt-3.5">
                <div className="text-xs font-semibold text-slate-700 mb-1.5">
                  Detected Style &amp; Material Features:
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {preset.tags.map((tag, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[11px] text-slate-700 font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200">
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 mb-1">
                <span>Product Similarity Fingerprint</span>
                <span className="text-emerald-700 font-semibold">Matched</span>
              </div>
              <div className="grid grid-cols-8 gap-1">
                {data.newProduct.embeddingVectorPreview.map((v, i) => (
                  <div
                    key={i}
                    className="px-1 py-1 rounded bg-white border border-slate-200 text-center text-[10px] font-mono text-indigo-700 font-medium"
                  >
                    {v > 0 ? `+${v}` : v}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Column 2: Nearest Historical Look-Alike Priors */}
          <div className="lg:col-span-4 bg-slate-50/80 border border-slate-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono uppercase tracking-wider text-indigo-700 font-semibold flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" />
                2. Top 3 Similar Past Launches
              </span>
              <span className="text-[11px] text-slate-500">3-Yr Catalog Match</span>
            </div>

            <div className="space-y-2.5">
              {data.analogMatches.map((match, idx) => (
                <div
                  key={match.skuId}
                  className="p-3 rounded-xl bg-white border border-slate-200 hover:border-indigo-300 transition"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <FootwearVisual
                        silhouetteType={preset.silhouetteType}
                        colorHex={match.colorHex}
                        size="sm"
                      />
                      <div>
                        <span className="text-xs font-bold text-slate-900">
                          #{idx + 1} {match.name}
                        </span>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {match.season} • ${match.retailPrice} •{' '}
                          <span className="text-amber-700 font-medium">
                            {match.stockedOutWeek}
                          </span>
                        </div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-mono font-bold shrink-0">
                      {Math.round(match.cosineSimilarity * 100)}% Match
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-2.5 pt-2 border-t border-slate-100 text-[10px] font-mono text-slate-500">
                    <div>
                      Vision:{' '}
                      <strong className="text-slate-800">
                        {match.visionMatchScore}%
                      </strong>
                    </div>
                    <div>
                      Material:{' '}
                      <strong className="text-slate-800">
                        {match.attributeMatchScore}%
                      </strong>
                    </div>
                    <div>
                      Sell-Thru:{' '}
                      <strong className="text-emerald-700">
                        {match.actualSellThroughPct}%
                      </strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Column 3: Zero-Shot Launch Trajectory vs Flat Planner Guess */}
          <div className="lg:col-span-4 bg-slate-50/80 border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono uppercase tracking-wider text-emerald-700 font-semibold flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5" />
                  3. Predicted 12-Week Launch Sales
                </span>
                <span className="text-xs font-mono text-emerald-700 font-bold">
                  Peak: {preset.aiPeak} u/wk
                </span>
              </div>

              <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-auto bg-white rounded-lg border border-slate-200 p-1">
                {[0, 0.5, 1].map((pct, i) => {
                  const val = Math.round(maxY * pct);
                  const yPos = getY(val);
                  return (
                    <g key={i}>
                      <line
                        x1={padL}
                        y1={yPos}
                        x2={svgW - padR}
                        y2={yPos}
                        stroke="#e2e8f0"
                        strokeDasharray="3 3"
                      />
                      <text
                        x={padL - 6}
                        y={yPos + 4}
                        textAnchor="end"
                        className="fill-slate-500 text-[11px] font-mono"
                      >
                        {val}
                      </text>
                    </g>
                  );
                })}

                {data.analogMatches.map((m, idx) => {
                  const pts = m.weeklyLaunchCurve
                    .map((v, i) => `${getX(i)},${getY(v * scaleRatio)}`)
                    .join(' ');
                  return (
                    <polyline
                      key={m.skuId}
                      fill="none"
                      stroke="#6366f1"
                      strokeWidth="1.5"
                      opacity={0.45 - idx * 0.1}
                      points={pts}
                    />
                  );
                })}

                <polyline
                  fill="none"
                  stroke="#e11d48"
                  strokeWidth="2"
                  strokeDasharray="5 4"
                  points={plannerFlatPoints}
                />

                <polyline
                  fill="none"
                  stroke="#059669"
                  strokeWidth="3"
                  points={zeroShotPoints}
                />

                {Array.from({ length: 12 }).map((_, i) =>
                  i % 2 === 0 ? (
                    <text
                      key={i}
                      x={getX(i)}
                      y={svgH - 6}
                      textAnchor="middle"
                      className="fill-slate-500 text-[11px] font-mono"
                    >
                      Wk {i + 1}
                    </text>
                  ) : null
                )}
              </svg>

              <div className="flex items-center justify-between text-[11px] mt-1.5 px-1">
                <span className="flex items-center gap-1.5 text-rose-700 font-medium">
                  <span className="w-2.5 h-0.5 bg-rose-500 inline-block" />
                  Manual Flat Guess ({preset.plannerGuess} u/wk)
                </span>
                <span className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                  <span className="w-2.5 h-0.5 bg-emerald-600 inline-block" />
                  AI Launch Forecast
                </span>
              </div>
            </div>

            <div className="mt-3 p-3 rounded-xl bg-indigo-50/80 border border-indigo-200">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="text-xs font-bold text-slate-900">
                    Recommended Launch Allocation Boost:{' '}
                    <span className="text-emerald-700">
                      +{preset.recommendedAddUnits.toLocaleString()} Units
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-600 mt-0.5">
                    Prevents Week 4 core-size stockout • Protects{' '}
                    <strong className="text-emerald-700">
                      ${preset.impactUsd.toLocaleString()}
                    </strong>{' '}
                    margin
                  </div>
                </div>
                <button
                  onClick={() =>
                    onApproveColdStartAction(
                      preset.skuId,
                      `Approved Cold-Start Size-Curve Boost (+${preset.recommendedAddUnits} u) for ${preset.name}`,
                      preset.impactUsd
                    )
                  }
                  disabled={isApproved}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1 cursor-pointer shrink-0 ${
                    isApproved
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                  }`}
                >
                  {isApproved ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Approved
                    </>
                  ) : (
                    <>
                      Approve Allocation
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Card: AI Size-Curve Optimizer */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <Ruler className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Footwear Size-Curve Allocation Optimizer (US Women's 5.5 – 10.0)
            </h3>
          </div>
          <span className="text-xs text-slate-500">
            Shifts buy depth from slow-moving fringe sizes (5.5, 10.0) into
            high-velocity core sizes (7.0, 7.5, 8.0)
          </span>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-9 gap-2.5">
          {data.sizeCurveAllocation.map((sz) => {
            const deltaPct = +(sz.aiOptimizedPct - sz.legacyFlatPct).toFixed(1);
            const isCore = sz.aiOptimizedPct >= 15;
            return (
              <div
                key={sz.size}
                className={`p-3 rounded-xl border flex flex-col justify-between ${
                  isCore
                    ? 'bg-indigo-50/60 border-indigo-300'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-slate-900">
                    {sz.size}
                  </span>
                  {isCore && (
                    <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 font-semibold">
                      Core
                    </span>
                  )}
                </div>

                <div className="my-3 h-24 flex items-end justify-center gap-2 px-1">
                  <div className="flex flex-col items-center gap-1 w-full">
                    <div
                      className="w-full bg-slate-300 rounded-t"
                      style={{ height: `${Math.round(sz.legacyFlatPct * 4.2)}px` }}
                      title={`Legacy Flat: ${sz.legacyFlatPct}%`}
                    />
                    <span className="text-[9px] font-mono text-slate-500">ERP</span>
                  </div>
                  <div className="flex flex-col items-center gap-1 w-full">
                    <div
                      className={`w-full rounded-t ${
                        isCore ? 'bg-emerald-500' : 'bg-indigo-500'
                      }`}
                      style={{ height: `${Math.round(sz.aiOptimizedPct * 4.2)}px` }}
                      title={`AI Size Curve: ${sz.aiOptimizedPct}%`}
                    />
                    <span className="text-[9px] font-mono text-emerald-700 font-semibold">
                      AI
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 text-center">
                  <div className="text-xs font-mono font-bold text-slate-900">
                    {Math.round(sz.recommendedUnits * scaleRatio)} u
                  </div>
                  <div
                    className={`text-[10px] font-mono font-semibold ${
                      deltaPct > 0 ? 'text-emerald-700' : 'text-amber-700'
                    }`}
                  >
                    {deltaPct > 0 ? `+${deltaPct}%` : `${deltaPct}%`} vs ERP
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
