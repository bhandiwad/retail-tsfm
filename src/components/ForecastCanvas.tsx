import React, { useState } from 'react';
import { SkuRecord } from '../types/retail';
import { AlertTriangle, Flame, TrendingUp, Layers } from 'lucide-react';

interface ForecastCanvasProps {
  sku: SkuRecord;
  whatIfPromoLiftPct: number;
  whatIfMarkdownPct: number;
  whatIfTargetQuantile: number;
  activeLiveSignal: {
    id: string;
    label: string;
    demandLiftPct: number;
    leadTimeShiftWeeks: number;
  } | null;
}

export const ForecastCanvas: React.FC<ForecastCanvasProps> = ({
  sku,
  whatIfPromoLiftPct,
  whatIfMarkdownPct,
  whatIfTargetQuantile,
  activeLiveSignal,
}) => {
  const [chartMode, setChartMode] = useState<'demand' | 'inventory' | 'both'>('both');
  const [showLegacyErp, setShowLegacyErp] = useState(true);
  const [showClassical, setShowClassical] = useState(false);
  const [showDeCensored, setShowDeCensored] = useState(true);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const recentHistory = sku.history.slice(-14);
  const forecastHorizon = sku.forecast;

  const quantileShiftMultiplier =
    1.0 + ((whatIfTargetQuantile - sku.targetQuantile) / 100) * 0.45;
  const promoDeltaMultiplier = 1.0 + whatIfPromoLiftPct / 100;
  const markdownElasticityMultiplier =
    whatIfMarkdownPct > 0 ? 1.0 + (whatIfMarkdownPct / 15) * 0.32 : 1.0;
  const liveSignalMultiplier = activeLiveSignal
    ? 1.0 + activeLiveSignal.demandLiftPct / 100
    : 1.0;

  const combinedSimMultiplier =
    promoDeltaMultiplier * markdownElasticityMultiplier * liveSignalMultiplier;

  const simulatedForecast = forecastHorizon.map((fp, idx) => {
    const simAddlP50 = Math.round(fp.addlP50 * combinedSimMultiplier);
    const simAddlP10 = Math.round(fp.addlP10 * combinedSimMultiplier);
    const simAddlP90 = Math.round(fp.addlP90 * combinedSimMultiplier);

    let targetCurveValue = simAddlP50;
    if (whatIfTargetQuantile >= 50) {
      const ratio = (whatIfTargetQuantile - 50) / 40;
      targetCurveValue = Math.round(
        simAddlP50 + ratio * (simAddlP90 - simAddlP50)
      );
    } else {
      const ratio = (50 - whatIfTargetQuantile) / 40;
      targetCurveValue = Math.round(
        simAddlP50 - ratio * (simAddlP50 - simAddlP10)
      );
    }

    const effectiveLeadTime = Math.max(
      1,
      sku.leadTimeWeeks + (activeLiveSignal?.leadTimeShiftWeeks || 0)
    );
    const scaleFactor =
      idx + 1 >= effectiveLeadTime ? quantileShiftMultiplier : 1.0;
    const simInvApproved = Math.max(
      0,
      Math.round(
        (fp.projectedInventoryApproved * scaleFactor) /
          Math.max(0.85, liveSignalMultiplier * 0.92)
      )
    );

    return {
      ...fp,
      simAddlP10,
      simAddlP50,
      simAddlP90,
      targetCurveValue,
      simInvApproved,
    };
  });

  const totalSteps = recentHistory.length + simulatedForecast.length;
  const splitIndex = recentHistory.length - 1;

  const allDemandValues: number[] = [];
  recentHistory.forEach((h) => {
    allDemandValues.push(h.observedSales, h.trueLatentDemand);
  });
  simulatedForecast.forEach((f) => {
    allDemandValues.push(
      f.simAddlP90,
      f.legacyErpForecast,
      f.classicalForecast,
      f.targetCurveValue
    );
  });
  const maxDemandY =
    Math.ceil((Math.max(...allDemandValues, 100) * 1.15) / 50) * 50;

  const svgW = 860;
  const svgH = 260;
  const padL = 46;
  const padR = 24;
  const padT = 22;
  const padB = 30;
  const plotW = svgW - padL - padR;
  const plotH = svgH - padT - padB;

  const getX = (stepIdx: number) =>
    padL + (stepIdx / (totalSteps - 1)) * plotW;
  const getY = (val: number) =>
    padT + plotH - Math.min(1, Math.max(0, val / maxDemandY)) * plotH;

  const observedHistoryPoints = recentHistory
    .map((h, i) => `${getX(i)},${getY(h.observedSales)}`)
    .join(' ');

  const latentHistoryPoints = recentHistory
    .map((h, i) => `${getX(i)},${getY(h.trueLatentDemand)}`)
    .join(' ');

  const lastHistPoint = recentHistory[recentHistory.length - 1];
  const anchorY = showDeCensored
    ? lastHistPoint.trueLatentDemand
    : lastHistPoint.observedSales;

  const legacyForecastPoints = [
    `${getX(splitIndex)},${getY(lastHistPoint.observedSales)}`,
    ...simulatedForecast.map(
      (f, idx) => `${getX(splitIndex + 1 + idx)},${getY(f.legacyErpForecast)}`
    ),
  ].join(' ');

  const classicalForecastPoints = [
    `${getX(splitIndex)},${getY(anchorY)}`,
    ...simulatedForecast.map(
      (f, idx) => `${getX(splitIndex + 1 + idx)},${getY(f.classicalForecast)}`
    ),
  ].join(' ');

  const addlP50Points = [
    `${getX(splitIndex)},${getY(anchorY)}`,
    ...simulatedForecast.map(
      (f, idx) => `${getX(splitIndex + 1 + idx)},${getY(f.simAddlP50)}`
    ),
  ].join(' ');

  const targetQuantilePoints = [
    `${getX(splitIndex)},${getY(anchorY)}`,
    ...simulatedForecast.map(
      (f, idx) => `${getX(splitIndex + 1 + idx)},${getY(f.targetCurveValue)}`
    ),
  ].join(' ');

  const fanUpper = [
    `${getX(splitIndex)},${getY(anchorY)}`,
    ...simulatedForecast.map(
      (f, idx) => `${getX(splitIndex + 1 + idx)},${getY(f.simAddlP90)}`
    ),
  ];
  const fanLower = [
    ...simulatedForecast
      .map((f, idx) => `${getX(splitIndex + 1 + idx)},${getY(f.simAddlP10)}`)
      .reverse(),
    `${getX(splitIndex)},${getY(anchorY)}`,
  ];
  const fanPolygonPoints = [...fanUpper, ...fanLower].join(' ');

  const invSvgH = 170;
  const invPlotH = invSvgH - padT - padB;
  const allInvValues = [
    sku.currentInventory,
    ...simulatedForecast.flatMap((f) => [
      f.projectedInventoryStatusQuo,
      f.simInvApproved,
      f.safetyStockFloor,
    ]),
  ];
  const maxInvY =
    Math.ceil((Math.max(...allInvValues, 200) * 1.15) / 100) * 100;
  const getInvY = (val: number) =>
    padT + invPlotH - Math.min(1, Math.max(0, val / maxInvY)) * invPlotH;

  const statusQuoInvPoints = [
    `${getX(splitIndex)},${getInvY(sku.currentInventory)}`,
    ...simulatedForecast.map(
      (f, idx) =>
        `${getX(splitIndex + 1 + idx)},${getInvY(f.projectedInventoryStatusQuo)}`
    ),
  ].join(' ');

  const approvedInvPoints = [
    `${getX(splitIndex)},${getInvY(sku.currentInventory)}`,
    ...simulatedForecast.map(
      (f, idx) => `${getX(splitIndex + 1 + idx)},${getInvY(f.simInvApproved)}`
    ),
  ].join(' ');

  const safetyFloorPoints = [
    `${getX(splitIndex)},${getInvY(simulatedForecast[0]?.safetyStockFloor || 200)}`,
    ...simulatedForecast.map(
      (f, idx) => `${getX(splitIndex + 1 + idx)},${getInvY(f.safetyStockFloor)}`
    ),
  ].join(' ');

  const totalCensoredUnits = recentHistory.reduce(
    (acc, h) => acc + h.censoredUnits,
    0
  );

  return (
    <div className="card-surface rounded-2xl p-6 animate-fade-in">
      {/* Clean Header & View Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 mb-4 border-b border-slate-100">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h3 className="text-base font-bold text-slate-900">
              Weekly Sales Forecast &amp; Stock Projection
            </h3>
            {totalCensoredUnits > 0 && (
              <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200/80">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                +{totalCensoredUnits.toLocaleString()} Missed Stockout Sales Restored
              </span>
            )}
            {activeLiveSignal && (
              <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/80">
                <Flame className="w-3.5 h-3.5 text-indigo-600" />
                {activeLiveSignal.label}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Move your cursor over any week to compare actual past sales, missed stockout demand, and the next 12 weeks
          </p>
        </div>

        {/* Clean Chart Mode Switcher */}
        <div className="flex items-center gap-2">
          <div className="inline-flex bg-slate-100/90 p-1 rounded-xl border border-slate-200/70 text-xs">
            <button
              onClick={() => setChartMode('both')}
              className={`px-3 py-1 rounded-lg font-semibold transition cursor-pointer ${
                chartMode === 'both'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Both Charts
            </button>
            <button
              onClick={() => setChartMode('demand')}
              className={`px-3 py-1 rounded-lg font-semibold transition flex items-center gap-1 cursor-pointer ${
                chartMode === 'demand'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              Sales Forecast
            </button>
            <button
              onClick={() => setChartMode('inventory')}
              className={`px-3 py-1 rounded-lg font-semibold transition flex items-center gap-1 cursor-pointer ${
                chartMode === 'inventory'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Stock Level
            </button>
          </div>
        </div>
      </div>

      {/* Subtle Layer Legend Bar */}
      {(chartMode === 'demand' || chartMode === 'both') && (
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50/90 text-emerald-800 font-semibold border border-emerald-200/80">
              <span className="w-2 h-2 rounded-full bg-emerald-600" />
              AI Forecast ({sku.metrics.addlWape}% Error)
            </span>

            <button
              onClick={() => setShowLegacyErp(!showLegacyErp)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition cursor-pointer font-medium ${
                showLegacyErp
                  ? 'bg-rose-50/80 border-rose-200 text-rose-800'
                  : 'bg-slate-50 border-slate-200 text-slate-400'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              Old ERP Forecast ({sku.metrics.legacyWape}% Error)
            </button>

            <button
              onClick={() => setShowDeCensored(!showDeCensored)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition cursor-pointer font-medium ${
                showDeCensored
                  ? 'bg-amber-50/80 border-amber-200 text-amber-900'
                  : 'bg-slate-50 border-slate-200 text-slate-400'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              Missed Sales (Zero Stock)
            </button>

            <button
              onClick={() => setShowClassical(!showClassical)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition cursor-pointer font-medium ${
                showClassical
                  ? 'bg-sky-50/80 border-sky-200 text-sky-800'
                  : 'bg-slate-50 border-slate-200 text-slate-400'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-sky-500" />
              Basic Math ({sku.metrics.statsForecastWape}% Error)
            </button>
          </div>

          <span className="text-[11px] font-mono text-slate-400">
            Shaded Band: Expected Low-to-High Sales Range
          </span>
        </div>
      )}

      {/* DEMAND FORECAST FAN SVG */}
      {(chartMode === 'demand' || chartMode === 'both') && (
        <div className="relative">
          <svg
            viewBox={`0 0 ${svgW} ${svgH}`}
            className="w-full h-auto select-none overflow-visible"
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <defs>
              <linearGradient id="probFanGradLight" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" stopOpacity="0.18" />
                <stop offset="50%" stopColor="#10b981" stopOpacity="0.12" />
                <stop offset="100%" stopColor="#6366f1" stopOpacity="0.04" />
              </linearGradient>
              <linearGradient id="forecastBgGradLight" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#f8fafc" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#f1f5f9" stopOpacity="0.45" />
              </linearGradient>
            </defs>

            {/* Forecast Horizon Background */}
            <rect
              x={getX(splitIndex)}
              y={padT}
              width={svgW - padR - getX(splitIndex)}
              height={plotH}
              fill="url(#forecastBgGradLight)"
              rx="6"
            />

            {/* Horizontal Y-Grid Lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
              const val = Math.round(maxDemandY * pct);
              const yPos = getY(val);
              return (
                <g key={i}>
                  <line
                    x1={padL}
                    y1={yPos}
                    x2={svgW - padR}
                    y2={yPos}
                    stroke="#f1f5f9"
                    strokeWidth="1"
                  />
                  <text
                    x={padL - 10}
                    y={yPos + 4}
                    textAnchor="end"
                    className="fill-slate-400 text-[10px] font-mono"
                  >
                    {val}
                  </text>
                </g>
              );
            })}

            {/* Promo Window Highlights */}
            {simulatedForecast.map((f, idx) => {
              const stepIdx = splitIndex + 1 + idx;
              return f.isPromo ? (
                <g key={`fpromo-${idx}`}>
                  <rect
                    x={getX(stepIdx) - 12}
                    y={padT}
                    width={24}
                    height={plotH}
                    fill="#6366f1"
                    opacity="0.08"
                    rx="4"
                  />
                  <text
                    x={getX(stepIdx)}
                    y={padT + 11}
                    textAnchor="middle"
                    className="fill-indigo-600 text-[8.5px] font-mono font-semibold uppercase"
                  >
                    Promo
                  </text>
                </g>
              ) : null;
            })}

            {/* Divider line between History and Forecast */}
            <line
              x1={getX(splitIndex)}
              y1={padT - 4}
              x2={getX(splitIndex)}
              y2={padT + plotH}
              stroke="#94a3b8"
              strokeWidth="1.2"
              strokeDasharray="4 4"
            />
            <text
              x={getX(splitIndex) + 8}
              y={padT + 11}
              className="fill-slate-500 text-[9.5px] font-mono font-medium"
            >
              12-WEEK FORECAST HORIZON →
            </text>

            {/* P10-P90 Prediction Interval Shaded Fan */}
            <polygon points={fanPolygonPoints} fill="url(#probFanGradLight)" />

            {/* Stockout-Censored Demand Recovery Markers */}
            {showDeCensored &&
              recentHistory.map((h, i) => {
                if (!h.isStockoutCensored) return null;
                const x = getX(i);
                const yObs = getY(h.observedSales);
                const yTrue = getY(h.trueLatentDemand);
                return (
                  <g key={`censor-${i}`}>
                    <line
                      x1={x}
                      y1={yObs}
                      x2={x}
                      y2={yTrue}
                      stroke="#f59e0b"
                      strokeWidth="3"
                      strokeLinecap="round"
                      opacity="0.85"
                    />
                    <circle
                      cx={x}
                      cy={yTrue}
                      r="4"
                      fill="#f59e0b"
                      stroke="#ffffff"
                      strokeWidth="1.5"
                    />
                  </g>
                );
              })}

            {/* De-Censored Latent History Curve */}
            {showDeCensored && (
              <polyline
                fill="none"
                stroke="#f59e0b"
                strokeWidth="1.75"
                strokeDasharray="3 3"
                points={latentHistoryPoints}
              />
            )}

            {/* Observed POS Sales Solid Line */}
            <polyline
              fill="none"
              stroke="#334155"
              strokeWidth="2.2"
              points={observedHistoryPoints}
            />

            {/* Legacy ERP Forecast */}
            {showLegacyErp && (
              <polyline
                fill="none"
                stroke="#f43f5e"
                strokeWidth="1.8"
                strokeDasharray="5 4"
                points={legacyForecastPoints}
              />
            )}

            {/* Classical StatsForecast */}
            {showClassical && (
              <polyline
                fill="none"
                stroke="#0ea5e9"
                strokeWidth="1.75"
                strokeDasharray="2 3"
                points={classicalForecastPoints}
              />
            )}

            {/* ADDL Final P50 Forecast */}
            <polyline
              fill="none"
              stroke="#059669"
              strokeWidth="2.6"
              points={addlP50Points}
            />

            {/* Target Quantile Decision Line */}
            {whatIfTargetQuantile !== 50 && (
              <polyline
                fill="none"
                stroke="#4f46e5"
                strokeWidth="2"
                strokeDasharray="4 3"
                points={targetQuantilePoints}
              />
            )}

            {/* Forecast Data Nodes */}
            {simulatedForecast.map((f, idx) => {
              const stepIdx = splitIndex + 1 + idx;
              return (
                <circle
                  key={`node-${idx}`}
                  cx={getX(stepIdx)}
                  cy={getY(f.simAddlP50)}
                  r="3"
                  fill="#059669"
                  stroke="#ffffff"
                  strokeWidth="1.5"
                />
              );
            })}

            {/* X-Axis Labels */}
            {Array.from({ length: totalSteps }).map((_, stepIdx) => {
              const isHist = stepIdx <= splitIndex;
              const label = isHist
                ? recentHistory[stepIdx].weekLabel
                : simulatedForecast[stepIdx - splitIndex - 1].weekLabel;
              if (
                stepIdx % 2 !== 0 &&
                stepIdx !== splitIndex &&
                stepIdx !== totalSteps - 1
              )
                return null;
              return (
                <text
                  key={`xlbl-${stepIdx}`}
                  x={getX(stepIdx)}
                  y={svgH - 8}
                  textAnchor="middle"
                  className={`text-[10px] font-mono ${
                    isHist ? 'fill-slate-400' : 'fill-slate-600 font-medium'
                  }`}
                >
                  {label}
                </text>
              );
            })}

            {/* Hover Scrub Columns */}
            {Array.from({ length: totalSteps }).map((_, stepIdx) => {
              const x = getX(stepIdx);
              const colW = plotW / totalSteps;
              return (
                <g key={`hover-${stepIdx}`}>
                  {hoveredIndex === stepIdx && (
                    <line
                      x1={x}
                      y1={padT}
                      x2={x}
                      y2={padT + plotH}
                      stroke="#6366f1"
                      strokeWidth="1"
                      strokeDasharray="2 2"
                    />
                  )}
                  <rect
                    x={x - colW / 2}
                    y={padT}
                    width={colW}
                    height={plotH}
                    fill="transparent"
                    className="cursor-crosshair"
                    onMouseEnter={() => setHoveredIndex(stepIdx)}
                  />
                </g>
              );
            })}
          </svg>

          {/* Clean Floating Telemetry Pill */}
          <div className="mt-2 h-8 px-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs font-mono text-slate-600">
            {hoveredIndex === null ? (
              <span className="text-slate-400 font-sans text-xs">
                Move cursor across chart to see weekly sales &amp; stock numbers
              </span>
            ) : hoveredIndex <= splitIndex ? (
              <>
                <span className="text-slate-900 font-semibold">
                  {recentHistory[hoveredIndex].weekLabel} (Past Week)
                </span>
                <span>
                  Actual Sales: <strong className="text-slate-900">{recentHistory[hoveredIndex].observedSales} u</strong>
                </span>
                <span className="text-amber-700">
                  True Demand: <strong>{recentHistory[hoveredIndex].trueLatentDemand} u</strong>
                  {recentHistory[hoveredIndex].isStockoutCensored &&
                    ` (+${recentHistory[hoveredIndex].censoredUnits} u missed)`}
                </span>
                <span className="text-rose-600">
                  Old ERP: {recentHistory[hoveredIndex].erpHistoricalForecast} u
                </span>
              </>
            ) : (
              (() => {
                const f = simulatedForecast[hoveredIndex - splitIndex - 1];
                return (
                  <>
                    <span className="text-indigo-700 font-semibold">
                      {f.weekLabel} {f.isPromo ? '• Promo' : ''}
                    </span>
                    <span className="text-emerald-700">
                      AI Forecast: <strong>{f.simAddlP50} u</strong> (Range: {f.simAddlP10}–{f.simAddlP90})
                    </span>
                    <span className="text-indigo-700">
                      Safety Target ({whatIfTargetQuantile}%): <strong>{f.targetCurveValue} u</strong>
                    </span>
                    <span className="text-rose-600">
                      Old ERP: {f.legacyErpForecast} u
                    </span>
                  </>
                );
              })()
            )}
          </div>
        </div>
      )}

      {/* BOTTOM CHART: 12-WEEK INVENTORY PROJECTION SAWTOOTH */}
      {(chartMode === 'inventory' || chartMode === 'both') && (
        <div className={`${chartMode === 'both' ? 'mt-6 pt-5 border-t border-slate-100' : ''}`}>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <span className="text-xs font-bold text-slate-800">
              12-Week Stock Projection (Without Action vs. With AI Plan)
            </span>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5 text-emerald-700 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" />
                With AI Plan
              </span>
              <span className="flex items-center gap-1.5 text-rose-600 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                Without Action
              </span>
              <span className="flex items-center gap-1.5 text-amber-700 font-medium">
                <span className="w-2.5 h-0.5 bg-amber-500 inline-block" />
                Minimum Safe Stock
              </span>
            </div>
          </div>

          <svg viewBox={`0 0 ${svgW} ${invSvgH}`} className="w-full h-auto select-none">
            {[0, 0.5, 1].map((pct, i) => {
              const val = Math.round(maxInvY * pct);
              const yPos = getInvY(val);
              return (
                <g key={i}>
                  <line
                    x1={padL}
                    y1={yPos}
                    x2={svgW - padR}
                    y2={yPos}
                    stroke="#f1f5f9"
                    strokeWidth="1"
                  />
                  <text
                    x={padL - 10}
                    y={yPos + 4}
                    textAnchor="end"
                    className="fill-slate-400 text-[10px] font-mono"
                  >
                    {val}
                  </text>
                </g>
              );
            })}

            {/* Stockout Risk Zone below Safety Stock Floor */}
            <rect
              x={getX(splitIndex)}
              y={getInvY(simulatedForecast[0]?.safetyStockFloor || 200)}
              width={svgW - padR - getX(splitIndex)}
              height={
                padT +
                invPlotH -
                getInvY(simulatedForecast[0]?.safetyStockFloor || 200)
              }
              fill="#f43f5e"
              opacity="0.04"
            />

            {/* Safety Stock Floor Line */}
            <polyline
              fill="none"
              stroke="#f59e0b"
              strokeWidth="1.4"
              strokeDasharray="4 4"
              points={safetyFloorPoints}
            />

            {/* Status Quo Inventory Trajectory */}
            <polyline
              fill="none"
              stroke="#f43f5e"
              strokeWidth="2"
              strokeDasharray="5 3"
              points={statusQuoInvPoints}
            />

            {/* Approved AI Action Inventory Trajectory */}
            <polyline
              fill="none"
              stroke="#059669"
              strokeWidth="2.5"
              points={approvedInvPoints}
            />

            {simulatedForecast.map((f, idx) => {
              const stepIdx = splitIndex + 1 + idx;
              const isOos = f.projectedInventoryStatusQuo === 0;
              return (
                <g key={`inv-pt-${idx}`}>
                  <circle
                    cx={getX(stepIdx)}
                    cy={getInvY(f.simInvApproved)}
                    r="2.8"
                    fill="#059669"
                  />
                  {isOos && (
                    <g>
                      <circle
                        cx={getX(stepIdx)}
                        cy={getInvY(0)}
                        r="4"
                        fill="#e11d48"
                      />
                      <text
                        x={getX(stepIdx)}
                        y={getInvY(0) - 8}
                        textAnchor="middle"
                        className="fill-rose-600 text-[9px] font-mono font-bold"
                      >
                        OOS
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      )}
    </div>
  );
};
