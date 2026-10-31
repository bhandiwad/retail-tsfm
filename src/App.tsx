import React, { useState, useMemo, useEffect } from 'react';
import rawDataset from './data/retailDemoData.json';
import {
  RetailDemoDataset,
  SkuRecord,
  DecisionStatus,
  AuditLogEntry,
} from './types/retail';
import { FootwearVisual } from './components/FootwearVisual';
import { ForecastCanvas } from './components/ForecastCanvas';
import { ColdStartStudio } from './components/ColdStartStudio';
import { RoutingAndRoiView } from './components/RoutingAndRoiView';
import { PlannerCopilot } from './components/PlannerCopilot';
import { DataConnectorHub } from './components/DataConnectorHub';
import {
  Sparkles,
  ShieldCheck,
  Sliders,
  TrendingUp,
  Layers,
  Cpu,
  Flame,
  RotateCcw,
  Check,
  X,
  Clock,
  DollarSign,
  PackageCheck,
  Activity,
  Lock,
  Database,
  Loader2,
  KeyRound,
  Download,
  CheckCircle2,
  Settings2,
  AlertCircle,
} from 'lucide-react';

const initialDataset = rawDataset as unknown as RetailDemoDataset;
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8005';

type ActiveTab = 'workspace' | 'coldstart' | 'routing' | 'connectors';

const OPENROUTER_MODELS = [
  { id: 'google/gemini-2.5-flash', label: 'Google Gemini 2.5 Flash (Fast & Sharp)' },
  { id: 'anthropic/claude-3.7-sonnet', label: 'Anthropic Claude 3.7 Sonnet (Deep Reasoning)' },
  { id: 'anthropic/claude-sonnet-4', label: 'Anthropic Claude Sonnet 4' },
  { id: 'openai/gpt-4o', label: 'OpenAI GPT-4o' },
  { id: 'openai/gpt-4o-mini', label: 'OpenAI GPT-4o Mini' },
  { id: 'deepseek/deepseek-chat-v3-0324', label: 'DeepSeek V3 (0324)' },
  { id: 'meta-llama/llama-3.3-70b-instruct', label: 'Meta Llama 3.3 70B Instruct' },
];

const MARKET_CONTEXT_EVENTS = [
  {
    id: 'tiktok-viral',
    label: 'Social PDP Velocity Spike (+22% Coastal Demand)',
    demandLiftPct: 22,
    leadTimeShiftWeeks: 0,
  },
  {
    id: 'port-delay',
    label: 'ASN Transit Delay (+1 Wk Inbound Lead Time)',
    demandLiftPct: 0,
    leadTimeShiftWeeks: 1,
  },
  {
    id: 'warm-anomaly',
    label: 'NOAA Warm Anomaly (+12% Resort / -14% Weather Boot)',
    demandLiftPct: 12,
    leadTimeShiftWeeks: 0,
  },
  {
    id: 'competitor-oos',
    label: 'Dept. Store Competitor Stockout (+16% Search Share)',
    demandLiftPct: 16,
    leadTimeShiftWeeks: 0,
  },
];

const OVERRIDE_REASONS = [
  'Vendor Minimum Order Quantity (MOQ) Constraint',
  'Brand Equity Protection — Hold Full MSRP (No Markdown)',
  'Store Visual Merchandising Floor-Set Requirement',
  'Warehouse Labor / Transfer Capacity Cap This Week',
];

interface LiveAgentSynthesisResult {
  llmProviderUsed: string;
  tsfmEngineUsed: string;
  totalLatencyMs: number;
  riskTradeoffSummary: string;
  erpExecutionSteps: string[];
}

export function App() {
  const [skus, setSkus] = useState<SkuRecord[]>(initialDataset.skus);
  const [dataSourceBadge, setDataSourceBadge] = useState<string>(
    initialDataset.platformMeta.erpConnected
  );
  const [activeTab, setActiveTab] = useState<ActiveTab>('workspace');
  const [selectedSkuId, setSelectedSkuId] = useState<string>(
    initialDataset.skus[0].skuId
  );
  const [archetypeFilter, setArchetypeFilter] = useState<string>('ALL');

  // OpenRouter & AI Configuration State
  const [showConfigModal, setShowConfigModal] = useState<boolean>(false);
  const [openrouterConfigured, setOpenrouterConfigured] =
    useState<boolean>(false);
  const [openrouterApiKeyInput, setOpenrouterApiKeyInput] =
    useState<string>('');
  const [openrouterModel, setOpenrouterModel] = useState<string>(
    'google/gemini-2.5-flash'
  );
  const [customModelInput, setCustomModelInput] = useState<string>('');
  const [isSavingConfig, setIsSavingConfig] = useState<boolean>(false);
  const [configFeedback, setConfigFeedback] = useState<{
    status: string;
    message: string;
  } | null>(null);

  const [customScenarioPrompt, setCustomScenarioPrompt] = useState<string>('');
  const [isRunningLlmAgent, setIsRunningLlmAgent] = useState<boolean>(false);
  const [liveSynthesisBySku, setLiveSynthesisBySku] = useState<
    Record<string, LiveAgentSynthesisResult>
  >({});

  // Load OpenRouter & Chronos status from backend on mount
  useEffect(() => {
    fetch(`${API_BASE}/api/ai-status`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          setOpenrouterConfigured(Boolean(data.openrouterConfigured));
          if (data.maskedKey) {
            setOpenrouterApiKeyInput(data.maskedKey);
          }
          if (data.openrouterModel) {
            setOpenrouterModel(data.openrouterModel);
          }
        }
      })
      .catch(() => {
        // Ignore if backend is still starting
      });
  }, []);

  const handleSaveOpenRouterConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingConfig(true);
    setConfigFeedback(null);
    const modelToSave = customModelInput.trim() || openrouterModel;

    try {
      const resp = await fetch(`${API_BASE}/api/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          openrouterApiKey: openrouterApiKeyInput.trim(),
          openrouterModel: modelToSave,
          testConnection: true,
        }),
      });
      if (resp.ok) {
        const res = await resp.json();
        setOpenrouterConfigured(Boolean(res.openrouterConfigured));
        setOpenrouterModel(res.openrouterModel);
        if (res.maskedKey) {
          setOpenrouterApiKeyInput(res.maskedKey);
        }
        setConfigFeedback({
          status: res.testStatus,
          message: res.testMessage,
        });
      }
    } catch {
      setConfigFeedback({
        status: 'ERROR',
        message: 'Could not reach local AI backend on port 8005.',
      });
    } finally {
      setIsSavingConfig(false);
    }
  };

  const [decisions, setDecisions] = useState<Record<string, DecisionStatus>>({
    'TOMS-1001-SGE': 'PENDING_REVIEW',
    'TOMS-2044-TER': 'PENDING_REVIEW',
    'TOMS-3109-OAT': 'PENDING_REVIEW',
    'TOMS-4012-NVY': 'PENDING_REVIEW',
    'TOMS-5088-OLV': 'PENDING_REVIEW',
    'TOMS-6021-BLSH': 'PENDING_REVIEW',
    'TOMS-7099-SUN': 'PENDING_REVIEW',
  });

  const [showOverridePrompt, setShowOverridePrompt] = useState<boolean>(false);
  const [selectedOverrideReason, setSelectedOverrideReason] = useState<string>(
    OVERRIDE_REASONS[0]
  );

  const selectedSku = useMemo(
    () => skus.find((s) => s.skuId === selectedSkuId) || skus[0],
    [skus, selectedSkuId]
  );

  const [whatIfQuantile, setWhatIfQuantile] = useState<number>(
    initialDataset.skus[0].targetQuantile
  );
  const [whatIfPromoLiftPct, setWhatIfPromoLiftPct] = useState<number>(0);
  const [whatIfMarkdownPct, setWhatIfMarkdownPct] = useState<number>(
    initialDataset.skus[0].recommendedMarkdownPct
  );
  const [activeLiveSignalId, setActiveLiveSignalId] = useState<string | null>(
    null
  );

  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([
    {
      id: 'init-1',
      timestamp: 'Today 08:42 AM',
      skuId: 'TOMS-1092-BLK',
      skuName: "Women's Classic Alpargata — Black",
      decision: 'APPROVED',
      actionSummary:
        'Auto-replenished 420 units via StatsForecast + Chronos-2 ensemble',
      reasonCode: 'High-Confidence Routine Replenishment',
      plannerNote: 'Accepted with 1-click review',
      financialImpactUsd: 18400,
    },
  ]);

  const handleSelectSku = (skuId: string) => {
    const found = skus.find((s) => s.skuId === skuId);
    if (!found) return;
    setSelectedSkuId(skuId);
    setWhatIfQuantile(found.targetQuantile);
    setWhatIfPromoLiftPct(0);
    setWhatIfMarkdownPct(found.recommendedMarkdownPct);
    setShowOverridePrompt(false);
    if (activeTab !== 'workspace') {
      setActiveTab('workspace');
    }
  };

  const handleIngestCustomSkus = (
    newSkus: SkuRecord[],
    sourceLabel: string
  ) => {
    setSkus((prev) => {
      const existingIds = new Set(newSkus.map((n) => n.skuId));
      const filteredPrev = prev.filter((p) => !existingIds.has(p.skuId));
      return [...newSkus, ...filteredPrev];
    });
    setDataSourceBadge(
      `Validated Feed (${sourceLabel}) + ${initialDataset.platformMeta.erpConnected}`
    );
  };

  const activeLiveSignal = useMemo(
    () =>
      MARKET_CONTEXT_EVENTS.find((s) => s.id === activeLiveSignalId) || null,
    [activeLiveSignalId]
  );

  // Run Central OpenRouter LLM + Chronos-Bolt Reasoning
  const handleRunCentralLlmWhatIf = async (overridePrompt?: string) => {
    setIsRunningLlmAgent(true);
    const promptToUse =
      overridePrompt !== undefined ? overridePrompt : customScenarioPrompt;

    try {
      const resp = await fetch(`${API_BASE}/api/agent/what-if`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sku: selectedSku,
          whatIfQuantile,
          whatIfPromoLiftPct,
          whatIfMarkdownPct,
          customEventPrompt: promptToUse,
          activeSignalLabel: activeLiveSignal?.label || null,
          openrouterModelOverride: customModelInput.trim() || openrouterModel,
        }),
      });

      if (resp.ok) {
        const data = await resp.json();
        const dec = data.decision;
        const fc = data.localForecast;

        setWhatIfQuantile(dec.recommendedTargetQuantile || whatIfQuantile);
        setWhatIfMarkdownPct(
          dec.recommendedMarkdownPct !== undefined
            ? dec.recommendedMarkdownPct
            : whatIfMarkdownPct
        );

        setSkus((prev) =>
          prev.map((item) => {
            if (item.skuId !== selectedSku.skuId) return item;
            const updatedForecast = item.forecast.map((fp, idx) => {
              const p10 = fc?.chronosP10?.[idx] ?? fp.chronosP10;
              const p50 = fc?.chronosP50?.[idx] ?? fp.chronosP50;
              const p90 = fc?.chronosP90?.[idx] ?? fp.chronosP90;
              const mult = 1 + (dec.llmAdjustmentPct || 0) / 100;
              return {
                ...fp,
                chronosP10: p10,
                chronosP50: p50,
                chronosP90: p90,
                addlP10: Math.round(p10 * mult),
                addlP50: Math.round(p50 * mult),
                addlP90: Math.round(p90 * mult),
              };
            });

            return {
              ...item,
              targetQuantile:
                dec.recommendedTargetQuantile || item.targetQuantile,
              llmAdjustmentPct: dec.llmAdjustmentPct ?? item.llmAdjustmentPct,
              llmConfidence: dec.llmConfidence ?? item.llmConfidence,
              llmGuardrailStatus:
                dec.guardrailStatus || item.llmGuardrailStatus,
              llmTriggerEvent:
                promptToUse.trim() ||
                activeLiveSignal?.label ||
                item.llmTriggerEvent,
              llmRationale: dec.executiveRationale || item.llmRationale,
              actionType: dec.actionType || item.actionType,
              actionTitle: dec.actionTitle || item.actionTitle,
              recommendedUnitsDelta:
                dec.recommendedUnitsDelta ?? item.recommendedUnitsDelta,
              recommendedMarkdownPct:
                dec.recommendedMarkdownPct ?? item.recommendedMarkdownPct,
              forecast: updatedForecast,
            };
          })
        );

        setLiveSynthesisBySku((prev) => ({
          ...prev,
          [selectedSku.skuId]: {
            llmProviderUsed: data.llmProviderUsed,
            tsfmEngineUsed: data.tsfmEngineUsed,
            totalLatencyMs: data.totalLatencyMs,
            riskTradeoffSummary: dec.riskTradeoffSummary || '',
            erpExecutionSteps: dec.erpExecutionSteps || [],
          },
        }));
      }
    } catch {
      // Ignore if backend is unreachable
    } finally {
      setIsRunningLlmAgent(false);
    }
  };

  // Export ERP Execution Packet CSV for SAP S/4HANA / Blue Yonder / Merch Operations
  const handleExportErpExecutionCsv = () => {
    const headers = [
      'SKU_ID',
      'Style_Name',
      'Archetype',
      'Governance_Status',
      'Action_Type',
      'Target_Quantile',
      'Recommended_Units_Delta',
      'Markdown_Trigger_Pct',
      'Execution_Route',
      'Legacy_ERP_WAPE_Pct',
      'ADDL_Routed_WAPE_Pct',
      'Projected_Availability_Pct',
      'Projected_Excess_Weeks',
      'Net_Financial_Impact_USD',
    ];
    const rows = skus.map((s) => [
      s.skuId,
      `"${s.name.replace(/"/g, '""')}"`,
      s.archetype,
      decisions[s.skuId] || 'PENDING_REVIEW',
      s.actionType,
      `P${s.targetQuantile}`,
      s.recommendedUnitsDelta,
      `${s.recommendedMarkdownPct}%`,
      `"${s.transferRoute}"`,
      s.metrics.legacyWape,
      s.metrics.addlWape,
      s.metrics.availabilityAfter,
      s.metrics.excessWeeksAfter,
      s.metrics.financialImpactUsd,
    ]);

    const csvContent =
      headers.join(',') + '\n' + rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pandita_addl_erp_execution_orders.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredSkus = useMemo(() => {
    if (archetypeFilter === 'ALL') return skus;
    return skus.filter((s) => s.archetype === archetypeFilter);
  }, [skus, archetypeFilter]);

  const simulatedActionMetrics = useMemo(() => {
    const qDelta = whatIfQuantile - selectedSku.targetQuantile;
    const signalLift = activeLiveSignal ? activeLiveSignal.demandLiftPct : 0;
    const totalPctShift =
      qDelta * 0.45 + whatIfPromoLiftPct * 0.8 + signalLift * 0.9;

    const baseUnits = selectedSku.recommendedUnitsDelta;
    const adjustedUnits = Math.round(
      baseUnits * (1 + totalPctShift / 100) +
        (baseUnits === 0 ? totalPctShift * 8 : 0)
    );

    const availAfter = Math.min(
      99.6,
      Math.max(
        82.0,
        +(
          selectedSku.metrics.availabilityAfter +
          qDelta * 0.08 +
          (whatIfPromoLiftPct > 0 ? 0.4 : 0)
        ).toFixed(1)
      )
    );

    const excessAfter = Math.max(
      0.5,
      +(
        selectedSku.metrics.excessWeeksAfter +
        qDelta * 0.03 -
        (whatIfMarkdownPct - selectedSku.recommendedMarkdownPct) * 0.06
      ).toFixed(1)
    );

    const impactUsd = Math.round(
      selectedSku.metrics.financialImpactUsd *
        (1 + Math.abs(totalPctShift) * 0.006)
    );

    return {
      adjustedUnits,
      availAfter,
      excessAfter,
      impactUsd,
    };
  }, [
    selectedSku,
    whatIfQuantile,
    whatIfPromoLiftPct,
    whatIfMarkdownPct,
    activeLiveSignal,
  ]);

  const recordDecision = (
    sku: SkuRecord,
    status: DecisionStatus,
    reasonCode: string,
    customSummary?: string
  ) => {
    setDecisions((prev) => ({ ...prev, [sku.skuId]: status }));
    const newEntry: AuditLogEntry = {
      id: `audit-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
      skuId: sku.skuId,
      skuName: sku.name,
      decision: status,
      actionSummary:
        customSummary ||
        `${sku.actionTitle} (Target P${whatIfQuantile}, Units: ${
          simulatedActionMetrics.adjustedUnits > 0
            ? `+${simulatedActionMetrics.adjustedUnits}`
            : simulatedActionMetrics.adjustedUnits
        })`,
      reasonCode,
      plannerNote:
        status === 'APPROVED'
          ? 'Approved AI-drafted recommendation'
          : status === 'MODIFIED'
          ? `Modified parameters (P${whatIfQuantile}, Markdown ${whatIfMarkdownPct}%)`
          : `Overridden: ${reasonCode}`,
      financialImpactUsd: simulatedActionMetrics.impactUsd,
    };
    setAuditLogs((prev) => [newEntry, ...prev]);
    setShowOverridePrompt(false);
  };

  const approvedCount = Object.values(decisions).filter(
    (d) => d === 'APPROVED' || d === 'MODIFIED'
  ).length;

  const approvedValueCaptured = skus.reduce((sum, s) => {
    const st = decisions[s.skuId];
    return st === 'APPROVED' || st === 'MODIFIED'
      ? sum + s.metrics.financialImpactUsd
      : sum;
  }, 0);

  const totalExceptionOpportunityUsd = skus.reduce(
    (sum, s) => sum + s.metrics.financialImpactUsd,
    0
  );

  const activeLiveSynthesis = liveSynthesisBySku[selectedSku.skuId];

  const getActionBadgeStyle = (type: SkuRecord['actionType']) => {
    switch (type) {
      case 'DC_TRANSFER':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'MARKDOWN':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'COLD_START_ALLOCATION':
        return 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200';
      case 'BUY_REDUCTION':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default:
        return 'bg-sky-50 text-sky-700 border-sky-200';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* AI ENGINE CONFIGURATION MODAL */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-indigo-600" />
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Central AI Reasoning Engine Configuration
                  </h3>
                  <p className="text-xs text-slate-500">
                    Configure API credentials &amp; active reasoning model (persists to <code className="text-indigo-700">.env</code>)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowConfigModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveOpenRouterConfig} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  AI Engine API Key
                </label>
                <input
                  type="password"
                  value={openrouterApiKeyInput}
                  onChange={(e) => setOpenrouterApiKeyInput(e.target.value)}
                  placeholder="Enter API key..."
                  className="w-full rounded-xl bg-slate-50 border border-slate-300 px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-indigo-600"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Powers the Central AI Scenario Engine, Selective Context Guardrail, and
                  Merchandising Copilot.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Active Reasoning Model
                </label>
                <select
                  value={openrouterModel}
                  onChange={(e) => {
                    setOpenrouterModel(e.target.value);
                    setCustomModelInput('');
                  }}
                  className="w-full rounded-xl bg-slate-50 border border-slate-300 px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:border-indigo-600"
                >
                  {OPENROUTER_MODELS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Custom Model Identifier (Optional):
                </label>
                <input
                  type="text"
                  value={customModelInput}
                  onChange={(e) => setCustomModelInput(e.target.value)}
                  placeholder="Optional custom model ID..."
                  className="w-full rounded-xl bg-slate-50 border border-slate-300 px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-indigo-600"
                />
              </div>

              {configFeedback && (
                <div
                  className={`p-3 rounded-xl text-xs font-medium flex items-start gap-2 border ${
                    configFeedback.status === 'VERIFIED_LIVE' ||
                    configFeedback.status === 'SAVED'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-rose-50 border-rose-200 text-rose-800'
                  }`}
                >
                  {configFeedback.status === 'VERIFIED_LIVE' ||
                  configFeedback.status === 'SAVED' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <span>{configFeedback.message}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowConfigModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={isSavingConfig}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-60"
                >
                  {isSavingConfig ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Verifying AI Engine...
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      Save &amp; Verify Connection
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TOP SYSTEM BAR (PRODUCTION ENTERPRISE HEADER) */}
      <header className="border-b border-slate-200 bg-white/95 backdrop-blur-md sticky top-0 z-30 shadow-2xs">
        <div className="max-w-[1600px] mx-auto px-4 lg:px-6 py-3 flex flex-wrap items-center justify-between gap-4">
          {/* Brand & Connected Enterprise Stack */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-emerald-600 flex items-center justify-center shadow-sm font-mono font-bold text-white text-sm">
              P-AI
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900">
                  Pandita's Adaptive Demand Decision Layer
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                  ERP &amp; Planning Overlay
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-0.5">
                <span>
                  Connected:{' '}
                  <strong className="text-slate-700 font-mono">
                    {dataSourceBadge}
                  </strong>
                </span>
                <span>•</span>
                <span className="text-indigo-700 font-medium">
                  Chronos-2 Quantiles + Central AI Decision Engine
                </span>
              </div>
            </div>
          </div>

          {/* Primary View Navigation Tabs + AI Config Button */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setActiveTab('workspace')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'workspace'
                    ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                Exception Command Center ({skus.length})
              </button>
              <button
                onClick={() => setActiveTab('coldstart')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'coldstart'
                    ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                Cold-Start Launch Studio
              </button>
              <button
                onClick={() => setActiveTab('routing')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'routing'
                    ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                Model Routing &amp; P&amp;L Impact
              </button>
              <button
                onClick={() => setActiveTab('connectors')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'connectors'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-indigo-700 bg-indigo-50/70 hover:bg-indigo-100/80 border border-indigo-200/60'
                }`}
              >
                <Database className="w-3.5 h-3.5" />
                Data Ingestion &amp; ERP Connectors
              </button>
            </div>

            {/* Subtle AI Engine Settings Button */}
            <button
              onClick={() => setShowConfigModal(true)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold border transition flex items-center gap-1.5 cursor-pointer ${
                openrouterConfigured
                  ? 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                  : 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100'
              }`}
            >
              <Settings2 className="w-3.5 h-3.5" />
              AI Engine
            </button>
          </div>
        </div>

        {/* LIVE MARKET & SUPPLY CHAIN CONTEXT FEED BAR */}
        <div className="bg-slate-50/90 border-t border-slate-200">
          <div className="max-w-[1600px] mx-auto px-4 lg:px-6 py-2 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 overflow-x-auto">
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-600 font-bold flex items-center gap-1 shrink-0">
                <Flame className="w-3.5 h-3.5 text-indigo-600" />
                Live Market &amp; Supply Chain Signals:
              </span>
              {MARKET_CONTEXT_EVENTS.map((sig) => (
                <button
                  key={sig.id}
                  onClick={() => {
                    const nextId = activeLiveSignalId === sig.id ? null : sig.id;
                    setActiveLiveSignalId(nextId);
                    if (nextId) {
                      setCustomScenarioPrompt(sig.label);
                    }
                  }}
                  className={`px-2.5 py-0.5 rounded-md text-[11px] font-mono transition border cursor-pointer shrink-0 ${
                    activeLiveSignalId === sig.id
                      ? 'bg-indigo-600 border-indigo-600 text-white font-semibold'
                      : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {sig.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-slate-500">
                Approved Actions: <strong className="text-emerald-700">{approvedCount}/{skus.length}</strong>
              </span>
              <button
                onClick={handleExportErpExecutionCsv}
                className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 text-[11px] font-semibold flex items-center gap-1 cursor-pointer shadow-2xs"
              >
                <Download className="w-3 h-3 text-indigo-600" />
                Export ERP Execution Sheet (CSV)
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT CONTAINER */}
      <main className="max-w-[1600px] w-full mx-auto px-4 lg:px-6 py-5 flex-1 space-y-5">
        {/* EXECUTIVE PORTFOLIO P&L & INVENTORY HEALTH RIBBON */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 font-semibold">
                Excess Weeks of Supply (WOS)
              </span>
              <DollarSign className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="my-1.5 flex items-baseline justify-between">
              <div className="text-2xl font-mono font-bold text-slate-900">
                4.8 <span className="text-slate-400 text-base">→</span>{' '}
                <span className="text-emerald-600">2.3 wks</span>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                $1.12M Cash Freed
              </span>
            </div>
            <div className="text-[11px] text-slate-500 border-t border-slate-100 pt-1.5">
              Eliminates $280K/yr holding cost &amp; $385K late clearance markdowns
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 font-semibold">
                Promo &amp; Peak Service Level (In-Stock %)
              </span>
              <PackageCheck className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="my-1.5 flex items-baseline justify-between">
              <div className="text-2xl font-mono font-bold text-slate-900">
                91.6% <span className="text-slate-400 text-base">→</span>{' '}
                <span className="text-indigo-600">96.8%</span>
              </div>
              <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                +5.2 pts Lift
              </span>
            </div>
            <div className="text-[11px] text-slate-500 border-t border-slate-100 pt-1.5">
              Protects $412K in high-margin sales across core footwear sizes
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 font-semibold">
                Management-by-Exception Coverage
              </span>
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <div className="my-1.5 flex items-baseline justify-between">
              <div className="text-2xl font-mono font-bold text-slate-900">
                {skus.length}{' '}
                <span className="text-xs font-normal text-slate-500">
                  Exceptions / {161 + skus.length} SKUs
                </span>
              </div>
              <span className="text-xs font-mono font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                95.8% Auto-Managed
              </span>
            </div>
            <div className="text-[11px] text-slate-500 border-t border-slate-100 pt-1.5">
              161 stable series within corridor • 18.5 planner hrs/wk saved
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 font-semibold">
                12-Week Out-of-Sample WAPE
              </span>
              <TrendingUp className="w-4 h-4 text-fuchsia-600" />
            </div>
            <div className="my-1.5 flex items-baseline justify-between">
              <div className="text-2xl font-mono font-bold text-slate-900">
                29.8% <span className="text-slate-400 text-base">→</span>{' '}
                <span className="text-emerald-600">16.4%</span>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                -13.4 pt Error
              </span>
            </div>
            <div className="text-[11px] text-slate-500 border-t border-slate-100 pt-1.5">
              Approved Execution Value:{' '}
              <strong className="text-emerald-700 font-mono">
                ${approvedValueCaptured.toLocaleString()}
              </strong>{' '}
              of ${(totalExceptionOpportunityUsd / 1000).toFixed(1)}K
            </div>
          </div>
        </div>

        {/* VIEW SWITCHER */}
        {activeTab === 'coldstart' ? (
          <ColdStartStudio
            data={initialDataset.coldStartStudio}
            onApproveColdStartAction={(skuId, summary) => {
              const target = skus.find((s) => s.skuId === skuId) || skus[2];
              recordDecision(
                target,
                'APPROVED',
                'Multimodal Look-Alike Prior + Size Curve Fit',
                summary
              );
            }}
            isApproved={decisions['TOMS-3109-OAT'] === 'APPROVED'}
          />
        ) : activeTab === 'routing' ? (
          <RoutingAndRoiView benchmarks={initialDataset.routingBenchmarks} />
        ) : activeTab === 'connectors' ? (
          <DataConnectorHub
            onIngestCustomSkus={handleIngestCustomSkus}
            onJumpToWorkspace={(skuId) => handleSelectSku(skuId)}
            existingSkusCount={skus.length}
          />
        ) : (
          /* TAB 1: EXCEPTION COMMAND CENTER */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* LEFT COLUMN: EXCEPTION-FIRST QUEUE (4 cols) */}
            <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold text-slate-900">
                      Prioritized Inventory Exceptions
                    </h2>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold">
                      {skus.length} Active
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Ranked by net gross margin &amp; working capital impact
                  </p>
                </div>
                <span className="text-[11px] font-mono text-emerald-700 font-bold">
                  ${(totalExceptionOpportunityUsd / 1000).toFixed(1)}K At Stake
                </span>
              </div>

              {/* Archetype Filter Pills */}
              <div className="flex flex-wrap gap-1">
                {[
                  'ALL',
                  'Promotional',
                  'Seasonal',
                  'Cold-Start',
                  'Established Core',
                  'Long-Tail',
                ].map((arch) => (
                  <button
                    key={arch}
                    onClick={() => setArchetypeFilter(arch)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-mono transition cursor-pointer ${
                      archetypeFilter === arch
                        ? 'bg-indigo-600 text-white font-semibold'
                        : 'bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200'
                    }`}
                  >
                    {arch === 'ALL' ? `All (${skus.length})` : arch}
                  </button>
                ))}
              </div>

              {/* Exception Cards List */}
              <div className="space-y-2.5 max-h-[760px] overflow-y-auto pr-1">
                {filteredSkus.map((sku) => {
                  const isSelected = sku.skuId === selectedSku.skuId;
                  const status = decisions[sku.skuId] || 'PENDING_REVIEW';
                  return (
                    <div
                      key={sku.skuId}
                      onClick={() => handleSelectSku(sku.skuId)}
                      className={`p-3 rounded-xl border transition cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-50/60 border-indigo-500 shadow-xs ring-1 ring-indigo-500/30'
                          : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <FootwearVisual
                          silhouetteType={sku.silhouetteType}
                          colorHex={sku.colorHex}
                          size="sm"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[10px] font-mono text-slate-500 font-medium">
                              {sku.skuId} • {sku.archetype}
                            </span>
                            <span className="text-xs font-mono font-bold text-emerald-700">
                              +$
                              {(sku.metrics.financialImpactUsd / 1000).toFixed(
                                1
                              )}
                              K
                            </span>
                          </div>
                          <h3 className="text-xs font-bold text-slate-900 truncate mt-0.5">
                            {sku.name}
                          </h3>

                          <div className="flex flex-wrap items-center gap-1.5 mt-2">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold border ${getActionBadgeStyle(
                                sku.actionType
                              )}`}
                            >
                              {sku.actionType.replace(/_/g, ' ')}
                            </span>

                            {sku.llmGuardrailStatus ===
                            'APPROVED_BY_GUARDRAIL' ? (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-200">
                                AI Context{' '}
                                {sku.llmAdjustmentPct > 0
                                  ? `+${sku.llmAdjustmentPct}%`
                                  : `${sku.llmAdjustmentPct}%`}
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-slate-100 text-slate-700 border border-slate-200">
                                Guardrail: 0% Adjust
                              </span>
                            )}

                            {status !== 'PENDING_REVIEW' && (
                              <span
                                className={`ml-auto px-1.5 py-0.5 rounded text-[9.5px] font-mono font-bold ${
                                  status === 'APPROVED'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : status === 'MODIFIED'
                                    ? 'bg-indigo-100 text-indigo-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {status}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 mt-2.5 pt-2 border-t border-slate-100 text-[10px] font-mono text-slate-500">
                        <div>
                          WAPE:{' '}
                          <span className="text-rose-600 line-through">
                            {sku.metrics.legacyWape}%
                          </span>{' '}
                          <strong className="text-emerald-700">
                            {sku.metrics.addlWape}%
                          </strong>
                        </div>
                        <div>
                          In-Stock:{' '}
                          <strong className="text-slate-800">
                            {sku.metrics.availabilityBefore}%→
                            {sku.metrics.availabilityAfter}%
                          </strong>
                        </div>
                        <div className="text-right">
                          Excess:{' '}
                          <strong className="text-slate-800">
                            {sku.metrics.excessWeeksBefore}→
                            {sku.metrics.excessWeeksAfter}w
                          </strong>
                        </div>
                      </div>
                    </div>
                  );
                })}

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                  <div className="text-xs font-bold text-slate-800 flex items-center justify-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    161 Remaining SKUs Within Optimal Inventory Corridor
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Auto-replenished via StatsForecast + Chronos-2 ensemble with zero
                    manual overrides needed.
                  </p>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: SKU DECISION CARD + CENTRAL LLM REASONING + CANVAS (8 cols) */}
            <div className="lg:col-span-8 space-y-4">
              {/* 1. HERO RECOMMENDATION & HUMAN-IN-THE-LOOP APPROVAL CARD */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-slate-200">
                  <div className="flex items-center gap-4">
                    <FootwearVisual
                      silhouetteType={selectedSku.silhouetteType}
                      colorHex={selectedSku.colorHex}
                      swatchName={selectedSku.swatchName}
                      size="lg"
                    />
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-mono text-indigo-700 font-bold">
                          {selectedSku.skuId}
                        </span>
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-mono bg-slate-100 text-slate-800 font-medium border border-slate-200">
                          Archetype: {selectedSku.archetype}
                        </span>
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-mono bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold">
                          Target Quantile: P{whatIfQuantile}
                        </span>
                        <span className="text-xs text-slate-500">
                          MSRP{' '}
                          <strong className="text-slate-900">
                            ${selectedSku.retailPrice}
                          </strong>{' '}
                          ({selectedSku.grossMarginPct}% GM)
                        </span>
                      </div>

                      <h2 className="text-lg font-bold text-slate-900 mt-1">
                        {selectedSku.name}
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Cluster:{' '}
                        <span className="text-slate-800 font-medium">
                          {selectedSku.storeCluster}
                        </span>{' '}
                        • On-Hand:{' '}
                        <strong className="text-slate-900">
                          {selectedSku.currentInventory.toLocaleString()} u
                        </strong>{' '}
                        • On-Order:{' '}
                        <strong className="text-slate-900">
                          {selectedSku.onOrderUnits.toLocaleString()} u
                        </strong>{' '}
                        • Selling Window Left:{' '}
                        <strong className="text-amber-700">
                          {selectedSku.remainingSellingWeeks} wks
                        </strong>
                      </p>
                    </div>
                  </div>

                  {/* Human-in-the-Loop Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() =>
                        recordDecision(
                          selectedSku,
                          whatIfQuantile !== selectedSku.targetQuantile ||
                            whatIfPromoLiftPct !== 0
                            ? 'MODIFIED'
                            : 'APPROVED',
                          'Quantified ROI & Inventory Corridor Verified'
                        )
                      }
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                    >
                      <Check className="w-4 h-4 stroke-[2.5]" />
                      {decisions[selectedSku.skuId] === 'APPROVED'
                        ? 'Approved (Update)'
                        : whatIfQuantile !== selectedSku.targetQuantile ||
                          whatIfPromoLiftPct !== 0
                        ? 'Approve Modified Action'
                        : 'Approve Recommendation'}
                    </button>

                    <button
                      onClick={() => setShowOverridePrompt(!showOverridePrompt)}
                      className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5 text-rose-600" />
                      Override with Reason
                    </button>
                  </div>
                </div>

                {/* Mandatory Reason Logging Drawer when Overriding */}
                {showOverridePrompt && (
                  <div className="my-3 p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-xs text-rose-900">
                      <Lock className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>
                        <strong>Human-in-the-Loop Governance:</strong> Select
                        mandatory reason code to log override for closed-loop
                        feedback:
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        value={selectedOverrideReason}
                        onChange={(e) =>
                          setSelectedOverrideReason(e.target.value)
                        }
                        className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-medium"
                      >
                        {OVERRIDE_REASONS.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() =>
                          recordDecision(
                            selectedSku,
                            'OVERRIDDEN',
                            selectedOverrideReason,
                            `Planner Overrode AI Action — Held Status Quo ERP Plan`
                          )
                        }
                        className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold cursor-pointer"
                      >
                        Confirm Override &amp; Log
                      </button>
                    </div>
                  </div>
                )}

                {/* Drafted Action Banner + Quantified Impact Delta */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mt-4">
                  <div className="md:col-span-7 p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-200">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-indigo-700 font-bold">
                        Drafted ERP Execution Order ({selectedSku.transferRoute})
                      </span>
                      <span className="text-xs font-mono font-bold text-emerald-700">
                        {simulatedActionMetrics.adjustedUnits > 0
                          ? `+${simulatedActionMetrics.adjustedUnits.toLocaleString()} Units`
                          : `${simulatedActionMetrics.adjustedUnits.toLocaleString()} Units`}
                      </span>
                    </div>
                    <div className="text-sm font-bold text-slate-900 mt-1">
                      {selectedSku.actionTitle}
                    </div>
                    <p className="text-xs text-slate-600 mt-1">
                      {selectedSku.actionSummary}
                    </p>
                  </div>

                  {/* Quantified Business Outcome Pill Box */}
                  <div className="md:col-span-5 grid grid-cols-3 gap-2">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                      <span className="text-[10px] text-slate-500 font-medium">
                        Availability
                      </span>
                      <div className="text-sm font-mono font-bold text-emerald-700 mt-1">
                        {selectedSku.metrics.availabilityBefore}% →{' '}
                        {simulatedActionMetrics.availAfter}%
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">
                        In-Stock Rate
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                      <span className="text-[10px] text-slate-500 font-medium">
                        Excess Supply
                      </span>
                      <div className="text-sm font-mono font-bold text-indigo-700 mt-1">
                        {selectedSku.metrics.excessWeeksBefore}w →{' '}
                        {simulatedActionMetrics.excessAfter}w
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">
                        End of Window
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex flex-col justify-between">
                      <span className="text-[10px] text-emerald-800 font-medium">
                        Net $ Impact
                      </span>
                      <div className="text-sm font-mono font-bold text-emerald-700 mt-1">
                        +${(simulatedActionMetrics.impactUsd / 1000).toFixed(1)}K
                      </div>
                      <span className="text-[10px] font-mono text-emerald-700">
                        Margin + Cash
                      </span>
                    </div>
                  </div>
                </div>

                {/* 4-STAGE DECISION PIPELINE & CENTRAL LLM RATIONALE */}
                <div className="mt-4 pt-4 border-t border-slate-200">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-3">
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="text-[10px] font-mono text-slate-500">
                        1. Intake &amp; De-Censoring
                      </div>
                      <div className="text-xs font-bold text-slate-900 mt-0.5">
                        {selectedSku.history.some((h) => h.isStockoutCensored)
                          ? 'OOS Censored Days Reconstructed'
                          : 'Clean Unconstrained POS'}
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="text-[10px] font-mono text-slate-500">
                        2. Probabilistic Router
                      </div>
                      <div className="text-xs font-bold text-indigo-700 mt-0.5 truncate">
                        {activeLiveSynthesis?.tsfmEngineUsed ||
                          selectedSku.routedModel}
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="text-[10px] font-mono text-slate-500">
                        3. Central LLM Guardrail
                      </div>
                      <div
                        className={`text-xs font-bold mt-0.5 ${
                          selectedSku.llmGuardrailStatus ===
                          'APPROVED_BY_GUARDRAIL'
                            ? 'text-fuchsia-700'
                            : 'text-emerald-700'
                        }`}
                      >
                        {selectedSku.llmGuardrailStatus ===
                        'APPROVED_BY_GUARDRAIL'
                          ? `Conf ${selectedSku.llmConfidence} ≥ 0.80 (${
                              selectedSku.llmAdjustmentPct > 0
                                ? `+${selectedSku.llmAdjustmentPct}%`
                                : `${selectedSku.llmAdjustmentPct}%`
                            })`
                          : `Conf ${selectedSku.llmConfidence} < 0.80 (Held at 0%)`}
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="text-[10px] font-mono text-slate-500">
                        4. Asymmetric Risk Target
                      </div>
                      <div className="text-xs font-bold text-emerald-700 mt-0.5">
                        P{whatIfQuantile} Quantile •{' '}
                        {selectedSku.remainingSellingWeeks}w Window
                      </div>
                    </div>
                  </div>

                  {/* Explainable Rationale Box */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs leading-relaxed space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-mono text-[11px] text-fuchsia-700 font-bold flex items-center gap-1.5">
                        <Cpu className="w-3.5 h-3.5" />
                        Context Signal: {selectedSku.llmTriggerEvent}
                      </span>
                      <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold">
                        {activeLiveSynthesis
                          ? `${activeLiveSynthesis.llmProviderUsed} (${activeLiveSynthesis.totalLatencyMs}ms)`
                          : `Central LLM (${openrouterModel.split('/').pop()})`}
                      </span>
                    </div>
                    <p className="text-slate-700">{selectedSku.llmRationale}</p>

                    {activeLiveSynthesis && (
                      <div className="pt-2 border-t border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                          <div className="text-[10px] font-mono uppercase text-indigo-700 font-bold mb-1">
                            Newsvendor Asymmetric Risk Trade-Off:
                          </div>
                          <p className="text-[11px] text-slate-700">
                            {activeLiveSynthesis.riskTradeoffSummary}
                          </p>
                        </div>
                        <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                          <div className="text-[10px] font-mono uppercase text-emerald-700 font-bold mb-1">
                            ERP Write-Back Execution Steps:
                          </div>
                          <ul className="space-y-1 text-[11px] text-slate-700">
                            {activeLiveSynthesis.erpExecutionSteps.map(
                              (st, idx) => (
                                <li
                                  key={idx}
                                  className="flex items-start gap-1.5"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                  <span>{st}</span>
                                </li>
                              )
                            )}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 2. INTERACTIVE PROBABILISTIC FORECAST & INVENTORY SAWTOOTH CANVAS */}
              <ForecastCanvas
                sku={selectedSku}
                whatIfPromoLiftPct={whatIfPromoLiftPct}
                whatIfMarkdownPct={whatIfMarkdownPct}
                whatIfTargetQuantile={whatIfQuantile}
                activeLiveSignal={activeLiveSignal}
              />

              {/* 3. BOTTOM SPLIT: CENTRAL LLM SCENARIO ENGINE + NATURAL LANGUAGE COPILOT */}
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
                {/* Central LLM What-If & Disruption Reasoning Engine (5 cols) */}
                <div className="xl:col-span-5 bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200">
                      <div className="flex items-center gap-2">
                        <Sliders className="w-4 h-4 text-indigo-600" />
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                          Central LLM Scenario &amp; What-If Engine
                        </h3>
                      </div>
                      <button
                        onClick={() => {
                          setWhatIfQuantile(selectedSku.targetQuantile);
                          setWhatIfPromoLiftPct(0);
                          setWhatIfMarkdownPct(
                            selectedSku.recommendedMarkdownPct
                          );
                          setActiveLiveSignalId(null);
                          setCustomScenarioPrompt('');
                        }}
                        className="text-[11px] font-mono text-slate-500 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" /> Reset
                      </button>
                    </div>

                    {/* Custom Unstructured Disruption Prompt for Central AI Engine */}
                    <div className="mb-3 p-3 rounded-xl bg-indigo-50/60 border border-indigo-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="block text-[11px] font-bold text-indigo-950">
                          Evaluate Market / Supply Chain Event via Central AI:
                        </label>
                      </div>
                      <textarea
                        rows={2}
                        value={customScenarioPrompt}
                        onChange={(e) => setCustomScenarioPrompt(e.target.value)}
                        placeholder="Describe any promo change, weather shift, vendor delay, or competitor stockout..."
                        className="w-full rounded-lg bg-white border border-indigo-200 px-2.5 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
                      />
                      <button
                        onClick={() => handleRunCentralLlmWhatIf()}
                        disabled={isRunningLlmAgent}
                        className="w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-2xs transition cursor-pointer disabled:opacity-60"
                      >
                        {isRunningLlmAgent ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            Synthesizing Context &amp; Quantiles...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5" />
                            Run AI Context &amp; Quantile Synthesis
                          </>
                        )}
                      </button>
                    </div>

                    <div className="space-y-3">
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-700 font-medium">
                            Target Service Quantile (Asymmetric Risk)
                          </span>
                          <span className="font-mono font-bold text-indigo-700">
                            P{whatIfQuantile}
                          </span>
                        </div>
                        <input
                          type="range"
                          min={30}
                          max={90}
                          step={5}
                          value={whatIfQuantile}
                          onChange={(e) =>
                            setWhatIfQuantile(Number(e.target.value))
                          }
                          className="w-full accent-indigo-600 cursor-pointer"
                        />
                        <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-0.5">
                          <span>P35 (Lean / End-of-Season)</span>
                          <span>P85 (Protect Promo Margin)</span>
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-700 font-medium">
                            Promotional / Traffic Lift Delta
                          </span>
                          <span className="font-mono font-bold text-emerald-700">
                            {whatIfPromoLiftPct >= 0
                              ? `+${whatIfPromoLiftPct}%`
                              : `${whatIfPromoLiftPct}%`}
                          </span>
                        </div>
                        <input
                          type="range"
                          min={-20}
                          max={35}
                          step={5}
                          value={whatIfPromoLiftPct}
                          onChange={(e) =>
                            setWhatIfPromoLiftPct(Number(e.target.value))
                          }
                          className="w-full accent-emerald-600 cursor-pointer"
                        />
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-700 font-medium">
                            Price Markdown Depth (Elasticity Simulation)
                          </span>
                          <span className="font-mono font-bold text-amber-700">
                            {whatIfMarkdownPct}% Off
                          </span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={40}
                          step={5}
                          value={whatIfMarkdownPct}
                          onChange={(e) =>
                            setWhatIfMarkdownPct(Number(e.target.value))
                          }
                          className="w-full accent-amber-600 cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 p-2.5 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-between text-xs">
                    <span className="text-slate-700 font-medium">
                      Simulated Execution Quantity:
                    </span>
                    <span className="font-mono font-bold text-emerald-700">
                      {simulatedActionMetrics.adjustedUnits > 0
                        ? `+${simulatedActionMetrics.adjustedUnits} u`
                        : `${simulatedActionMetrics.adjustedUnits} u`}{' '}
                      (${(simulatedActionMetrics.impactUsd / 1000).toFixed(1)}K
                      Net Value)
                    </span>
                  </div>
                </div>

                {/* Natural Language Planner Copilot & Governance Audit Log (7 cols) */}
                <div className="xl:col-span-7">
                  <PlannerCopilot
                    skus={skus}
                    selectedSku={selectedSku}
                    onSelectSku={handleSelectSku}
                    auditLogs={auditLogs}
                    openrouterModel={
                      customModelInput.trim() || openrouterModel
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
export default App;
