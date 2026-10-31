import React, { useState } from 'react';
import { SkuRecord } from '../types/retail';
import { AlertTriangle, Layers, Flame } from 'lucide-react';

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
  const [showLegacyErp, setShowLegacyErp] = useState(true);
  const [showClassical, setShowClassical] = useState(true);
  const [showChronosRaw, setShowChronosRaw] = useState(false);
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
  const svgH = 265;
  const padL = 48;
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

  const chronosRawPoints = [
    `${getX(splitIndex)},${getY(anchorY)}`,
    ...simulatedForecast.map(
      (f, idx) => `${getX(splitIndex + 1 + idx)},${getY(f.chronosP50)}`
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

  const invSvgH = 165;
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
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
      {/* Header & Layer Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-3 border-b border-slate-200">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold">
              Probabilistic Routing &amp; De-Censoring Canvas
            </span>
            {totalCensoredUnits > 0 && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />+
                {totalCensoredUnits.toLocaleString()} Stockout-Censored Units Recovered
              </span>
            )}
            {activeLiveSignal && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-md bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-200">
                <Flame className="w-3.5 h-3.5 text-fuchsia-600" />
                Live Event Active: {activeLiveSignal.label}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Comparing <strong className="text-slate-800">Legacy ERP</strong> vs.{' '}
            <strong className="text-slate-800">StatsForecast</strong> vs.{' '}
            <strong className="text-indigo-700">
              Chronos-2 Quantiles (P10–P90) + Selective LLM Context
            </strong>
          </p>
        </div>

        {/* Toggle Pills */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <button
            onClick={() => setShowDeCensored(!showDeCensored)}
            className={`px-2.5 py-1 rounded-lg border transition flex items-center gap-1.5 cursor-pointer font-medium ${
              showDeCensored
                ? 'bg-amber-50 border-amber-300 text-amber-900'
                : 'bg-slate-50 border-slate-200 text-slate-400'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            De-Censored Demand
          </button>

          <button
            onClick={() => setShowLegacyErp(!showLegacyErp)}
            className={`px-2.5 py-1 rounded-lg border transition flex items-center gap-1.5 cursor-pointer font-medium ${
              showLegacyErp
                ? 'bg-rose-50 border-rose-300 text-rose-800'
                : 'bg-slate-50 border-slate-200 text-slate-400'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            Legacy ERP ({sku.metrics.legacyWape}% WAPE)
          </button>

          <button
            onClick={() => setShowClassical(!showClassical)}
            className={`px-2.5 py-1 rounded-lg border transition flex items-center gap-1.5 cursor-pointer font-medium ${
              showClassical
                ? 'bg-sky-50 border-sky-300 text-sky-800'
                : 'bg-slate-50 border-slate-200 text-slate-400'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-sky-500" />
            StatsForecast ({sku.metrics.statsForecastWape}% WAPE)
          </button>

          <button
            onClick={() => setShowChronosRaw(!showChronosRaw)}
            className={`px-2.5 py-1 rounded-lg border transition flex items-center gap-1.5 cursor-pointer font-medium ${
              showChronosRaw
                ? 'bg-violet-50 border-violet-300 text-violet-800'
                : 'bg-slate-50 border-slate-200 text-slate-400'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-violet-500" />
            Pure Chronos-2 ({sku.metrics.chronos2Wape}% WAPE)
          </button>

          <span className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-800 flex items-center gap-1.5 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-600" />
            ADDL Routed ({sku.metrics.addlWape}% WAPE)
          </span>
        </div>
      </div>

      {/* TOP CHART: DEMAND & PROBABILISTIC FORECAST FAN */}
      <div className="relative">
        <svg
          viewBox={`0 0 ${svgW} ${svgH}`}
          className="w-full h-auto select-none overflow-visible"
          onMouseLeave={() => setHoveredIndex(null)}
        >
          <defs>
            <linearGradient id="probFanGradLight" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.22" />
              <stop offset="50%" stopColor="#10b981" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.05" />
            </linearGradient>
            <linearGradient id="forecastBgGradLight" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#eef2ff" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#f8fafc" stopOpacity="0.4" />
            </linearGradient>
          </defs>

          {/* Shaded Forecast Horizon Background */}
          <rect
            x={getX(splitIndex)}
            y={padT}
            width={svgW - padR - getX(splitIndex)}
            height={plotH}
            fill="url(#forecastBgGradLight)"
            rx="4"
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
                  stroke="#e2e8f0"
                  strokeDasharray={pct === 0 ? undefined : '3 3'}
                  strokeWidth="1"
                />
                <text
                  x={padL - 8}
                  y={yPos + 4}
                  textAnchor="end"
                  className="fill-slate-500 text-[10px] font-mono"
                >
                  {val}
                </text>
              </g>
            );
          })}

          {/* Promo Window Vertical Highlights */}
          {recentHistory.map((h, i) =>
            h.isPromo ? (
              <g key={`hpromo-${i}`}>
                <rect
                  x={getX(i) - 10}
                  y={padT}
                  width={20}
                  height={plotH}
                  fill="#a855f7"
                  opacity="0.10"
                />
                <text
                  x={getX(i)}
                  y={padT + 10}
                  textAnchor="middle"
                  className="fill-purple-700 text-[8.5px] font-mono font-semibold uppercase"
                >
                  Promo
                </text>
              </g>
            ) : null
          )}
          {simulatedForecast.map((f, idx) => {
            const stepIdx = splitIndex + 1 + idx;
            return f.isPromo ? (
              <g key={`fpromo-${idx}`}>
                <rect
                  x={getX(stepIdx) - 12}
                  y={padT}
                  width={24}
                  height={plotH}
                  fill="#a855f7"
                  opacity="0.14"
                />
                <text
                  x={getX(stepIdx)}
                  y={padT + 10}
                  textAnchor="middle"
                  className="fill-purple-700 text-[9px] font-mono font-bold uppercase"
                >
                  Promo
                </text>
              </g>
            ) : null;
          })}

          {/* Divider line between History (W-1) and Forecast (W+1) */}
          <line
            x1={getX(splitIndex)}
            y1={padT - 6}
            x2={getX(splitIndex)}
            y2={padT + plotH}
            stroke="#4f46e5"
            strokeWidth="1.5"
            strokeDasharray="4 3"
          />
          <text
            x={getX(splitIndex) + 6}
            y={padT + 11}
            className="fill-indigo-700 text-[9.5px] font-mono font-bold"
          >
            TODAY → 12-WK HORIZON
          </text>

          {/* P10-P90 Prediction Interval Shaded Fan */}
          <polygon points={fanPolygonPoints} fill="url(#probFanGradLight)" />

          {/* Stockout-Censored Demand Recovery Bars & Markers */}
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
                    stroke="#d97706"
                    strokeWidth="4"
                    strokeLinecap="round"
                    opacity="0.85"
                  />
                  <circle
                    cx={x}
                    cy={yTrue}
                    r="4.5"
                    fill="#d97706"
                    stroke="#ffffff"
                    strokeWidth="1.5"
                  />
                  <text
                    x={x}
                    y={yTrue - 8}
                    textAnchor="middle"
                    className="fill-amber-800 text-[9px] font-mono font-bold"
                  >
                    +{h.censoredUnits} OOS
                  </text>
                </g>
              );
            })}

          {/* De-Censored Latent History Curve */}
          {showDeCensored && (
            <polyline
              fill="none"
              stroke="#d97706"
              strokeWidth="1.8"
              strokeDasharray="3 3"
              points={latentHistoryPoints}
            />
          )}

          {/* Observed POS Sales Solid Line */}
          <polyline
            fill="none"
            stroke="#334155"
            strokeWidth="2.3"
            points={observedHistoryPoints}
          />

          {/* Legacy ERP Forecast */}
          {showLegacyErp && (
            <polyline
              fill="none"
              stroke="#e11d48"
              strokeWidth="2"
              strokeDasharray="5 4"
              points={legacyForecastPoints}
            />
          )}

          {/* Classical StatsForecast */}
          {showClassical && (
            <polyline
              fill="none"
              stroke="#0284c7"
              strokeWidth="1.8"
              strokeDasharray="2 3"
              points={classicalForecastPoints}
            />
          )}

          {/* Pure Chronos-2 Unadjusted */}
          {showChronosRaw && (
            <polyline
              fill="none"
              stroke="#7c3aed"
              strokeWidth="1.8"
              points={chronosRawPoints}
            />
          )}

          {/* ADDL Final P50 Forecast */}
          <polyline
            fill="none"
            stroke="#059669"
            strokeWidth="2.8"
            points={addlP50Points}
          />

          {/* Target Quantile Decision Line */}
          {whatIfTargetQuantile !== 50 && (
            <polyline
              fill="none"
              stroke="#4f46e5"
              strokeWidth="2"
              strokeDasharray="4 2"
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
                r="3.2"
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
                  isHist ? 'fill-slate-500' : 'fill-indigo-700 font-semibold'
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
                    stroke="#475569"
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

        {/* Live Scrubbing Telemetry Banner */}
        {hoveredIndex !== null && (
          <div className="mt-1 px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
            {hoveredIndex <= splitIndex ? (
              <>
                <span className="text-slate-900 font-bold">
                  History {recentHistory[hoveredIndex].weekLabel}
                </span>
                <span className="text-slate-600">
                  POS Observed:{' '}
                  <strong className="text-slate-900">
                    {recentHistory[hoveredIndex].observedSales} u
                  </strong>
                </span>
                <span className="text-amber-800">
                  True Unconstrained Demand:{' '}
                  <strong>{recentHistory[hoveredIndex].trueLatentDemand} u</strong>
                  {recentHistory[hoveredIndex].isStockoutCensored &&
                    ` (+${recentHistory[hoveredIndex].censoredUnits} u Censored by OOS)`}
                </span>
                <span className="text-rose-700">
                  Legacy ERP Est: {recentHistory[hoveredIndex].erpHistoricalForecast} u
                </span>
              </>
            ) : (
              (() => {
                const f = simulatedForecast[hoveredIndex - splitIndex - 1];
                return (
                  <>
                    <span className="text-indigo-700 font-bold">
                      Forecast {f.weekLabel} {f.isPromo ? '(PROMO WINDOW)' : ''}
                    </span>
                    <span className="text-emerald-800">
                      ADDL P50: <strong>{f.simAddlP50} u</strong> [P10: {f.simAddlP10} –
                      P90: {f.simAddlP90}]
                    </span>
                    <span className="text-indigo-700">
                      Target P{whatIfTargetQuantile}:{' '}
                      <strong>{f.targetCurveValue} u</strong>
                    </span>
                    <span className="text-rose-700">
                      Legacy ERP: {f.legacyErpForecast} u
                    </span>
                    <span className="text-sky-700">
                      StatsForecast: {f.classicalForecast} u
                    </span>
                  </>
                );
              })()
            )}
          </div>
        )}
      </div>

      {/* BOTTOM CHART: 12-WEEK INVENTORY PROJECTION SAWTOOTH */}
      <div className="mt-4 pt-3 border-t border-slate-200">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-600" />
            <span className="text-xs font-bold text-slate-800">
              Forward 12-Week Inventory Sawtooth Projection (Status Quo vs. Approved AI
              Action)
            </span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span className="flex items-center gap-1.5 text-rose-700 font-medium">
              <span className="w-3 h-0.5 bg-rose-500 inline-block" />
              Status Quo (ERP Plan)
            </span>
            <span className="flex items-center gap-1.5 text-emerald-700 font-semibold">
              <span className="w-3 h-0.5 bg-emerald-600 inline-block" />
              After Approved ADDL Action
            </span>
            <span className="flex items-center gap-1.5 text-amber-700 font-medium">
              <span className="w-3 h-0.5 bg-amber-500 inline-block border-b border-dashed" />
              Safety Stock Floor
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
                  stroke="#e2e8f0"
                  strokeDasharray={pct === 0 ? undefined : '3 3'}
                  strokeWidth="1"
                />
                <text
                  x={padL - 8}
                  y={yPos + 4}
                  textAnchor="end"
                  className="fill-slate-500 text-[10px] font-mono"
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
            opacity="0.06"
          />

          {/* Safety Stock Floor Line */}
          <polyline
            fill="none"
            stroke="#d97706"
            strokeWidth="1.4"
            strokeDasharray="4 4"
            points={safetyFloorPoints}
          />

          {/* Status Quo Inventory Trajectory */}
          <polyline
            fill="none"
            stroke="#e11d48"
            strokeWidth="2.2"
            strokeDasharray="5 3"
            points={statusQuoInvPoints}
          />

          {/* Approved AI Action Inventory Trajectory */}
          <polyline
            fill="none"
            stroke="#059669"
            strokeWidth="2.6"
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
                  r="3"
                  fill="#059669"
                />
                {isOos && (
                  <g>
                    <circle
                      cx={getX(stepIdx)}
                      cy={getInvY(0)}
                      r="4.5"
                      fill="#e11d48"
                    />
                    <text
                      x={getX(stepIdx)}
                      y={getInvY(0) - 8}
                      textAnchor="middle"
                      className="fill-rose-700 text-[9px] font-mono font-bold"
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
    </div>
  );
};
