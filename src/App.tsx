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
  ChevronDown,
  ChevronUp,
  Bot,
  LineChart,
} from 'lucide-react';

const initialDataset = rawDataset as unknown as RetailDemoDataset;
const IS_LOCALHOST =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1');
const API_BASE =
  import.meta.env.VITE_API_BASE_URL ??
  (IS_LOCALHOST ? 'http://localhost:8005' : '');

type ActiveTab = 'workspace' | 'coldstart' | 'routing' | 'connectors';
type SkuWorkspaceSubTab = 'trajectory' | 'simulator' | 'copilot';

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
    label: 'Social Velocity Spike (+22% Coastal)',
    demandLiftPct: 22,
    leadTimeShiftWeeks: 0,
  },
  {
    id: 'port-delay',
    label: 'ASN Transit Delay (+1 Wk Lead Time)',
    demandLiftPct: 0,
    leadTimeShiftWeeks: 1,
  },
  {
    id: 'warm-anomaly',
    label: 'NOAA Warm Anomaly (+12% Resort)',
    demandLiftPct: 12,
    leadTimeShiftWeeks: 0,
  },
  {
    id: 'competitor-oos',
    label: 'Competitor Stockout (+16% Search)',
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
  const [skuSubTab, setSkuSubTab] = useState<SkuWorkspaceSubTab>('trajectory');
  const [showPipelineDetails, setShowPipelineDetails] = useState<boolean>(false);

  const [selectedSkuId, setSelectedSkuId] = useState<string>(
    initialDataset.skus[0].skuId
  );
  const [archetypeFilter, setArchetypeFilter] = useState<string>('ALL');

  // AI Engine Configuration State
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

  useEffect(() => {
    const savedKey = localStorage.getItem('pandita_ai_api_key') || '';
    const savedModel = localStorage.getItem('pandita_ai_model') || '';
    if (savedModel) {
      setOpenrouterModel(savedModel);
    }
    fetch(`${API_BASE}/api/ai-status`, {
      headers: savedKey ? { 'x-ai-api-key': savedKey } : {},
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          setOpenrouterConfigured(
            Boolean(data.openrouterConfigured || savedKey.length > 10)
          );
          if (data.maskedKey) {
            setOpenrouterApiKeyInput(data.maskedKey);
          }
          if (data.openrouterModel && !savedModel) {
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
    const trimmedKey = openrouterApiKeyInput.trim();
    if (trimmedKey && !trimmedKey.includes('...')) {
      localStorage.setItem('pandita_ai_api_key', trimmedKey);
    }
    localStorage.setItem('pandita_ai_model', modelToSave);

    try {
      const resp = await fetch(`${API_BASE}/api/config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(localStorage.getItem('pandita_ai_api_key')
            ? { 'x-ai-api-key': localStorage.getItem('pandita_ai_api_key')! }
            : {}),
        },
        body: JSON.stringify({
          openrouterApiKey: trimmedKey,
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

  const handleRunCentralLlmWhatIf = async (overridePrompt?: string) => {
    setIsRunningLlmAgent(true);
    const promptToUse =
      overridePrompt !== undefined ? overridePrompt : customScenarioPrompt;

    try {
      const savedKey = localStorage.getItem('pandita_ai_api_key') || '';
      const resp = await fetch(`${API_BASE}/api/agent/what-if`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(savedKey ? { 'x-ai-api-key': savedKey } : {}),
        },
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
        return 'bg-indigo-50 text-indigo-700 border-indigo-200/80';
      case 'MARKDOWN':
        return 'bg-amber-50 text-amber-800 border-amber-200/80';
      case 'COLD_START_ALLOCATION':
        return 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200/80';
      case 'BUY_REDUCTION':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200/80';
      default:
        return 'bg-sky-50 text-sky-700 border-sky-200/80';
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col">
      {/* AI ENGINE CONFIGURATION MODAL */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/35 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                  <KeyRound className="w-4 h-4 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Central AI Reasoning Engine
                  </h3>
                  <p className="text-xs text-slate-500">
                    Configure API credentials &amp; active reasoning model
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowConfigModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveOpenRouterConfig} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                  AI Engine API Key
                </label>
                <input
                  type="password"
                  value={openrouterApiKeyInput}
                  onChange={(e) => setOpenrouterApiKeyInput(e.target.value)}
                  placeholder="Enter API key..."
                  className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3.5 py-2.5 text-xs font-mono text-slate-900 focus:outline-none focus:border-indigo-600 focus:bg-white transition"
                />
                <p className="text-[11px] text-slate-500 mt-1.5">
                  Powers the Scenario Simulator, Selective Context Guardrail, and Merchandising Copilot.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                  Active Reasoning Model
                </label>
                <select
                  value={openrouterModel}
                  onChange={(e) => {
                    setOpenrouterModel(e.target.value);
                    setCustomModelInput('');
                  }}
                  className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3.5 py-2.5 text-xs font-medium text-slate-900 focus:outline-none focus:border-indigo-600 focus:bg-white transition"
                >
                  {OPENROUTER_MODELS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  Custom Model Identifier (Optional)
                </label>
                <input
                  type="text"
                  value={customModelInput}
                  onChange={(e) => setCustomModelInput(e.target.value)}
                  placeholder="Optional custom model ID..."
                  className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3.5 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-indigo-600 focus:bg-white transition"
                />
              </div>

              {configFeedback && (
                <div
                  className={`p-3.5 rounded-xl text-xs font-medium flex items-start gap-2.5 border ${
                    configFeedback.status === 'VERIFIED_LIVE' ||
                    configFeedback.status === 'SAVED'
                      ? 'bg-emerald-50/80 border-emerald-200 text-emerald-800'
                      : 'bg-rose-50/80 border-rose-200 text-rose-800'
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

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowConfigModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer transition"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={isSavingConfig}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-60 transition"
                >
                  {isSavingConfig ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      Save &amp; Verify
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CLEAN SINGLE-TIER HEADER BAR */}
      <header className="border-b border-slate-200/80 bg-white/90 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-[1560px] mx-auto px-5 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Brand Title */}
          <div className="flex items-center gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-xs font-mono font-bold text-white text-xs tracking-wider">
              P·AI
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-base font-bold text-slate-900 tracking-tight">
                  Pandita's Adaptive Demand Decision Layer
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/70">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  {dataSourceBadge.split('+')[0].trim()}
                </span>
              </div>
            </div>
          </div>

          {/* Sleek Center Segmented Navigation */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl border border-slate-200/60">
            <button
              onClick={() => setActiveTab('workspace')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'workspace'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-indigo-600" />
              Exception Inbox
              <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-indigo-50 text-indigo-700">
                {skus.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('coldstart')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'coldstart'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-fuchsia-600" />
              Cold-Start Studio
            </button>
            <button
              onClick={() => setActiveTab('routing')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'routing'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-emerald-600" />
              Model Routing &amp; ROI
            </button>
            <button
              onClick={() => setActiveTab('connectors')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'connectors'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Database className="w-3.5 h-3.5 text-sky-600" />
              Data &amp; Connectors
            </button>
          </nav>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleExportErpExecutionCsv}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs transition"
              title="Export Approved Orders for ERP"
            >
              <Download className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden sm:inline">Export PO Sheet</span>
              <span className="px-1.5 py-0.2 rounded-md bg-emerald-50 text-emerald-700 font-mono text-[10px]">
                {approvedCount}/{skus.length}
              </span>
            </button>

            <button
              onClick={() => setShowConfigModal(true)}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 bg-slate-50/80 hover:bg-slate-100 text-slate-700 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Settings2 className="w-3.5 h-3.5 text-indigo-600" />
              <span>AI Engine</span>
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT CONTAINER */}
      <main className="max-w-[1560px] w-full mx-auto px-5 lg:px-8 py-6 flex-1 space-y-6">
        {/* BREATHABLE 4-METRIC EXECUTIVE KPI RIBBON */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card-surface rounded-2xl p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs font-medium text-slate-500">
              <span>Excess Weeks of Supply</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-emerald-600" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <div className="text-2xl font-bold text-slate-900 font-mono tracking-tight">
                4.8w <span className="text-slate-300 font-sans font-normal mx-0.5">→</span>{' '}
                <span className="text-emerald-600">2.3w</span>
              </div>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                $1.12M Cash Freed
              </span>
            </div>
          </div>

          <div className="card-surface rounded-2xl p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs font-medium text-slate-500">
              <span>Peak &amp; Promo In-Stock Rate</span>
              <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center">
                <PackageCheck className="w-4 h-4 text-indigo-600" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <div className="text-2xl font-bold text-slate-900 font-mono tracking-tight">
                91.6% <span className="text-slate-300 font-sans font-normal mx-0.5">→</span>{' '}
                <span className="text-indigo-600">96.8%</span>
              </div>
              <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">
                +5.2 pts Lift
              </span>
            </div>
          </div>

          <div className="card-surface rounded-2xl p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs font-medium text-slate-500">
              <span>12-Week Forecast Error (WAPE)</span>
              <div className="w-7 h-7 rounded-lg bg-fuchsia-50 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-fuchsia-600" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <div className="text-2xl font-bold text-slate-900 font-mono tracking-tight">
                29.8% <span className="text-slate-300 font-sans font-normal mx-0.5">→</span>{' '}
                <span className="text-emerald-600">16.4%</span>
              </div>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                -13.4 pt Error
              </span>
            </div>
          </div>

          <div className="card-surface rounded-2xl p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs font-medium text-slate-500">
              <span>Exception Queue Progress</span>
              <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center">
                <Clock className="w-4 h-4 text-amber-600" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <div className="text-2xl font-bold text-slate-900 font-mono tracking-tight">
                {approvedCount}/{skus.length}{' '}
                <span className="text-xs font-sans font-medium text-slate-400">
                  Reviewed
                </span>
              </div>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-mono">
                ${(approvedValueCaptured / 1000).toFixed(1)}K Captured
              </span>
            </div>
          </div>
        </div>

        {/* VIEW SWITCHER */}
        {activeTab === 'coldstart' ? (
          <div className="animate-fade-in">
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
          </div>
        ) : activeTab === 'routing' ? (
          <div className="animate-fade-in">
            <RoutingAndRoiView benchmarks={initialDataset.routingBenchmarks} />
          </div>
        ) : activeTab === 'connectors' ? (
          <div className="animate-fade-in">
            <DataConnectorHub
              onIngestCustomSkus={handleIngestCustomSkus}
              onJumpToWorkspace={(skuId) => handleSelectSku(skuId)}
              existingSkusCount={skus.length}
            />
          </div>
        ) : (
          /* TAB 1: STREAMLINED EXCEPTION COMMAND CENTER */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-fade-in">
            {/* LEFT COLUMN: CLEAN SCANNABLE EXCEPTION INBOX (4 cols) */}
            <div className="lg:col-span-4 card-surface rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Exception Inbox
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {skus.length} SKUs needing action • 161 auto-managed
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                  +${(totalExceptionOpportunityUsd / 1000).toFixed(0)}K Value
                </span>
              </div>

              {/* Clean Archetype Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
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
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer shrink-0 ${
                      archetypeFilter === arch
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200/70'
                    }`}
                  >
                    {arch === 'ALL' ? 'All' : arch}
                  </button>
                ))}
              </div>

              {/* Streamlined Exception Cards List */}
              <div className="space-y-2.5 max-h-[680px] overflow-y-auto pr-1">
                {filteredSkus.map((sku) => {
                  const isSelected = sku.skuId === selectedSku.skuId;
                  const status = decisions[sku.skuId] || 'PENDING_REVIEW';
                  return (
                    <div
                      key={sku.skuId}
                      onClick={() => handleSelectSku(sku.skuId)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-50/40 border-indigo-500 shadow-xs ring-1 ring-indigo-500/20'
                          : 'bg-white border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/40'
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <FootwearVisual
                          silhouetteType={sku.silhouetteType}
                          colorHex={sku.colorHex}
                          size="sm"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] font-medium text-slate-400">
                              {sku.archetype}
                            </span>
                            <span className="text-xs font-mono font-bold text-emerald-700">
                              +${(sku.metrics.financialImpactUsd / 1000).toFixed(1)}K
                            </span>
                          </div>

                          <h3 className="text-sm font-bold text-slate-900 truncate mt-0.5">
                            {sku.name}
                          </h3>

                          <div className="flex items-center justify-between gap-2 mt-2">
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${getActionBadgeStyle(
                                sku.actionType
                              )}`}
                            >
                              {sku.actionType.replace(/_/g, ' ')}
                            </span>

                            {status !== 'PENDING_REVIEW' ? (
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                  status === 'APPROVED'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : status === 'MODIFIED'
                                    ? 'bg-indigo-100 text-indigo-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                <Check className="w-2.5 h-2.5" />
                                {status}
                              </span>
                            ) : (
                              <span className="text-[11px] font-mono text-slate-400">
                                WAPE {sku.metrics.addlWape}%
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/60 flex items-center gap-3">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div className="text-xs text-slate-600 leading-relaxed">
                    <strong className="text-slate-900">161 stable SKUs</strong> are automatically replenished within safety corridors.
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: FOCUSED SKU DECISION WORKSPACE (8 cols) */}
            <div className="lg:col-span-8 space-y-5">
              {/* STEP 1: THE EXECUTIVE DECISION BRIEF */}
              <div className="card-surface rounded-2xl p-6">
                {/* Product Header + Primary Approval Actions */}
                <div className="flex flex-wrap items-start justify-between gap-4 pb-5 border-b border-slate-100">
                  <div className="flex items-center gap-4">
                    <FootwearVisual
                      silhouetteType={selectedSku.silhouetteType}
                      colorHex={selectedSku.colorHex}
                      swatchName={selectedSku.swatchName}
                      size="lg"
                    />
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-mono font-semibold text-indigo-600">
                          {selectedSku.skuId}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-xs font-medium text-slate-600">
                          {selectedSku.archetype}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-xs text-slate-500">
                          ${selectedSku.retailPrice} MSRP ({selectedSku.grossMarginPct}% Margin)
                        </span>
                      </div>

                      <h2 className="text-xl font-bold text-slate-900 mt-1">
                        {selectedSku.name}
                      </h2>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1.5">
                        <span>
                          Cluster: <strong className="text-slate-800">{selectedSku.storeCluster}</strong>
                        </span>
                        <span>•</span>
                        <span>
                          On-Hand: <strong className="text-slate-800 font-mono">{selectedSku.currentInventory.toLocaleString()} u</strong>
                        </span>
                        <span>•</span>
                        <span>
                          Window Left: <strong className="text-amber-700 font-mono">{selectedSku.remainingSellingWeeks} wks</strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Clean Primary CTA Buttons */}
                  <div className="flex items-center gap-2.5">
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
                      className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-2 shadow-xs transition cursor-pointer"
                    >
                      <Check className="w-4 h-4 stroke-[2.5]" />
                      {decisions[selectedSku.skuId] === 'APPROVED'
                        ? 'Approved'
                        : whatIfQuantile !== selectedSku.targetQuantile ||
                          whatIfPromoLiftPct !== 0
                        ? 'Approve Modified Order'
                        : 'Approve Recommendation'}
                    </button>

                    <button
                      onClick={() => setShowOverridePrompt(!showOverridePrompt)}
                      className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5 text-slate-500" />
                      Override
                    </button>
                  </div>
                </div>

                {/* Mandatory Governance Reason Drawer (Only when overriding) */}
                {showOverridePrompt && (
                  <div className="my-4 p-4 rounded-xl bg-rose-50/70 border border-rose-200 flex flex-wrap items-center justify-between gap-3 animate-fade-in">
                    <div className="flex items-center gap-2 text-xs text-rose-900">
                      <Lock className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>
                        <strong>Governance Log:</strong> Select reason code to record override:
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        value={selectedOverrideReason}
                        onChange={(e) =>
                          setSelectedOverrideReason(e.target.value)
                        }
                        className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 font-medium"
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
                        className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold cursor-pointer"
                      >
                        Confirm Override
                      </button>
                    </div>
                  </div>
                )}

                {/* AI Recommendation & 3 Key Outcomes */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mt-5">
                  <div className="md:col-span-7 p-4 rounded-xl bg-indigo-50/45 border border-indigo-100 flex flex-col justify-between">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-600">
                        Recommended Action • Target P{whatIfQuantile}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-white text-indigo-700 border border-indigo-200/60">
                        {simulatedActionMetrics.adjustedUnits > 0
                          ? `+${simulatedActionMetrics.adjustedUnits.toLocaleString()} Units`
                          : `${simulatedActionMetrics.adjustedUnits.toLocaleString()} Units`}
                      </span>
                    </div>
                    <div className="text-base font-bold text-slate-900 mt-1.5">
                      {selectedSku.actionTitle}
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      {selectedSku.actionSummary}
                    </p>
                  </div>

                  {/* 3 Crisp Business Impact Cards */}
                  <div className="md:col-span-5 grid grid-cols-3 gap-2.5">
                    <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/60 flex flex-col justify-between">
                      <span className="text-[11px] text-slate-500 font-medium">
                        In-Stock
                      </span>
                      <div className="text-base font-mono font-bold text-slate-900 mt-1">
                        {simulatedActionMetrics.availAfter}%
                      </div>
                      <span className="text-[10px] font-mono text-emerald-600 font-medium">
                        was {selectedSku.metrics.availabilityBefore}%
                      </span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/60 flex flex-col justify-between">
                      <span className="text-[11px] text-slate-500 font-medium">
                        Excess WOS
                      </span>
                      <div className="text-base font-mono font-bold text-slate-900 mt-1">
                        {simulatedActionMetrics.excessAfter}w
                      </div>
                      <span className="text-[10px] font-mono text-indigo-600 font-medium">
                        was {selectedSku.metrics.excessWeeksBefore}w
                      </span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200/70 flex flex-col justify-between">
                      <span className="text-[11px] text-emerald-800 font-medium">
                        Net Impact
                      </span>
                      <div className="text-base font-mono font-bold text-emerald-700 mt-1">
                        +${(simulatedActionMetrics.impactUsd / 1000).toFixed(1)}K
                      </div>
                      <span className="text-[10px] text-emerald-700 font-medium">
                        Margin + Cash
                      </span>
                    </div>
                  </div>
                </div>

                {/* Collapsible "Why AI Recommends This" Pipeline Disclosure */}
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => setShowPipelineDetails(!showPipelineDetails)}
                    className="w-full flex items-center justify-between text-xs text-slate-600 hover:text-slate-900 py-1 cursor-pointer transition"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <Cpu className="w-3.5 h-3.5 text-indigo-600" />
                      <span className="font-semibold text-slate-800">
                        AI Reasoning:
                      </span>
                      <span className="text-slate-600 truncate max-w-xl">
                        {selectedSku.llmTriggerEvent}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-slate-100 text-slate-700">
                        {selectedSku.routedModel}
                      </span>
                    </div>
                    <span className="inline-flex items-center gap-1 text-indigo-600 font-semibold shrink-0">
                      {showPipelineDetails ? (
                        <>
                          Hide 4-Stage Pipeline <ChevronUp className="w-3.5 h-3.5" />
                        </>
                      ) : (
                        <>
                          Inspect 4-Stage AI Pipeline <ChevronDown className="w-3.5 h-3.5" />
                        </>
                      )}
                    </span>
                  </button>

                  {showPipelineDetails && (
                    <div className="mt-3 pt-3 border-t border-slate-100 space-y-3 animate-fade-in">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                          <div className="text-[10px] font-mono text-slate-400">
                            1. De-Censoring
                          </div>
                          <div className="text-xs font-bold text-slate-900 mt-0.5">
                            {selectedSku.history.some((h) => h.isStockoutCensored)
                              ? 'OOS Censored Days Reconstructed'
                              : 'Clean Unconstrained POS'}
                          </div>
                        </div>

                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                          <div className="text-[10px] font-mono text-slate-400">
                            2. Champion Router
                          </div>
                          <div className="text-xs font-bold text-indigo-700 mt-0.5 truncate">
                            {activeLiveSynthesis?.tsfmEngineUsed ||
                              selectedSku.routedModel}
                          </div>
                        </div>

                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                          <div className="text-[10px] font-mono text-slate-400">
                            3. Context Guardrail
                          </div>
                          <div className="text-xs font-bold text-slate-900 mt-0.5">
                            {selectedSku.llmGuardrailStatus ===
                            'APPROVED_BY_GUARDRAIL'
                              ? `Conf ${selectedSku.llmConfidence} (${
                                  selectedSku.llmAdjustmentPct > 0
                                    ? `+${selectedSku.llmAdjustmentPct}%`
                                    : `${selectedSku.llmAdjustmentPct}%`
                                })`
                              : `Conf ${selectedSku.llmConfidence} (Held 0%)`}
                          </div>
                        </div>

                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                          <div className="text-[10px] font-mono text-slate-400">
                            4. Newsvendor Target
                          </div>
                          <div className="text-xs font-bold text-emerald-700 mt-0.5">
                            P{whatIfQuantile} Quantile
                          </div>
                        </div>
                      </div>

                      <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/70 text-xs text-slate-700 leading-relaxed space-y-2">
                        <p>{selectedSku.llmRationale}</p>
                        {activeLiveSynthesis && (
                          <div className="pt-2 border-t border-slate-200/70 grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <div className="text-[10px] font-mono uppercase text-indigo-700 font-bold mb-1">
                                Risk Trade-Off:
                              </div>
                              <p className="text-[11px] text-slate-600">
                                {activeLiveSynthesis.riskTradeoffSummary}
                              </p>
                            </div>
                            <div>
                              <div className="text-[10px] font-mono uppercase text-emerald-700 font-bold mb-1">
                                ERP Execution Steps:
                              </div>
                              <ul className="space-y-1 text-[11px] text-slate-600">
                                {activeLiveSynthesis.erpExecutionSteps.map(
                                  (st, idx) => (
                                    <li key={idx} className="flex items-start gap-1.5">
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
                  )}
                </div>
              </div>

              {/* STEP 2: FOCUSED WORKSPACE MODE BAR (PROGRESSIVE DISCLOSURE) */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="inline-flex bg-slate-200/60 p-1 rounded-xl border border-slate-200/80">
                  <button
                    onClick={() => setSkuSubTab('trajectory')}
                    className={`px-4 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-2 cursor-pointer ${
                      skuSubTab === 'trajectory'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <LineChart className="w-3.5 h-3.5 text-indigo-600" />
                    1. Forecast &amp; Inventory Curves
                  </button>

                  <button
                    onClick={() => setSkuSubTab('simulator')}
                    className={`px-4 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-2 cursor-pointer ${
                      skuSubTab === 'simulator'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Sliders className="w-3.5 h-3.5 text-emerald-600" />
                    2. What-If &amp; AI Scenario Simulator
                  </button>

                  <button
                    onClick={() => setSkuSubTab('copilot')}
                    className={`px-4 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-2 cursor-pointer ${
                      skuSubTab === 'copilot'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Bot className="w-3.5 h-3.5 text-fuchsia-600" />
                    3. Ask AI Copilot &amp; Audit Log
                  </button>
                </div>

                {skuSubTab === 'trajectory' && (
                  <button
                    onClick={() => setSkuSubTab('simulator')}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Simulate Promo, Weather, or Supply Chain Shock →
                  </button>
                )}
              </div>

              {/* SUB-VIEW 1: CLEAN FORECAST & INVENTORY TRAJECTORY */}
              {skuSubTab === 'trajectory' && (
                <ForecastCanvas
                  sku={selectedSku}
                  whatIfPromoLiftPct={whatIfPromoLiftPct}
                  whatIfMarkdownPct={whatIfMarkdownPct}
                  whatIfTargetQuantile={whatIfQuantile}
                  activeLiveSignal={activeLiveSignal}
                />
              )}

              {/* SUB-VIEW 2: INTERACTIVE WHAT-IF & AI SCENARIO SIMULATOR */}
              {skuSubTab === 'simulator' && (
                <div className="space-y-5 animate-fade-in">
                  <div className="card-surface rounded-2xl p-6 space-y-5">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4">
                      <div>
                        <h3 className="text-base font-bold text-slate-900">
                          Interactive What-If &amp; Disruption Simulator
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Test live market events, custom natural-language scenarios, or service quantile shifts
                        </p>
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
                        className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-medium text-slate-600 flex items-center gap-1.5 cursor-pointer transition"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> Reset Parameters
                      </button>
                    </div>

                    {/* Quick Market Context Chips */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-2">
                        Quick Market &amp; Supply Chain Signals
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {MARKET_CONTEXT_EVENTS.map((sig) => (
                          <button
                            key={sig.id}
                            onClick={() => {
                              const nextId =
                                activeLiveSignalId === sig.id ? null : sig.id;
                              setActiveLiveSignalId(nextId);
                              if (nextId) {
                                setCustomScenarioPrompt(sig.label);
                              }
                            }}
                            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition border flex items-center gap-1.5 cursor-pointer ${
                              activeLiveSignalId === sig.id
                                ? 'bg-indigo-600 border-indigo-600 text-white shadow-2xs'
                                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            <Flame className="w-3.5 h-3.5" />
                            {sig.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Custom Scenario Prompt + Sliders */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-2">
                      {/* Left: Natural Language Event Box */}
                      <div className="md:col-span-6 p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between space-y-3">
                        <div className="space-y-2">
                          <label className="block text-xs font-bold text-slate-800">
                            Simulate Custom Retail Disruption via Central AI
                          </label>
                          <textarea
                            rows={3}
                            value={customScenarioPrompt}
                            onChange={(e) =>
                              setCustomScenarioPrompt(e.target.value)
                            }
                            placeholder="e.g., Influencer campaign drives +25% coastal demand while port congestion delays inbound ASN by 1 week..."
                            className="w-full rounded-xl bg-white border border-slate-200 px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                        <button
                          onClick={() => handleRunCentralLlmWhatIf()}
                          disabled={isRunningLlmAgent}
                          className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition cursor-pointer disabled:opacity-60"
                        >
                          {isRunningLlmAgent ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Synthesizing Quantiles &amp; Guardrail...
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4" />
                              Run AI Scenario Synthesis
                            </>
                          )}
                        </button>
                      </div>

                      {/* Right: 3 Clean Parameter Sliders */}
                      <div className="md:col-span-6 space-y-4">
                        <div>
                          <div className="flex justify-between text-xs mb-1.5">
                            <span className="text-slate-700 font-medium">
                              Target Service Quantile (Asymmetric Risk)
                            </span>
                            <span className="font-mono font-bold text-indigo-600">
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
                            className="w-full cursor-pointer"
                          />
                          <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                            <span>P35 (Lean End-of-Season)</span>
                            <span>P85 (Protect Peak Margin)</span>
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-xs mb-1.5">
                            <span className="text-slate-700 font-medium">
                              Promotional / Traffic Lift Delta
                            </span>
                            <span className="font-mono font-bold text-emerald-600">
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
                            className="w-full cursor-pointer"
                          />
                        </div>

                        <div>
                          <div className="flex justify-between text-xs mb-1.5">
                            <span className="text-slate-700 font-medium">
                              Price Markdown Depth
                            </span>
                            <span className="font-mono font-bold text-amber-600">
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
                            className="w-full cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Live Chart Below Simulator so User Sees Curves Shift Immediately */}
                  <ForecastCanvas
                    sku={selectedSku}
                    whatIfPromoLiftPct={whatIfPromoLiftPct}
                    whatIfMarkdownPct={whatIfMarkdownPct}
                    whatIfTargetQuantile={whatIfQuantile}
                    activeLiveSignal={activeLiveSignal}
                  />
                </div>
              )}

              {/* SUB-VIEW 3: MERCHANDISING AI COPILOT & GOVERNANCE LOG */}
              {skuSubTab === 'copilot' && (
                <div className="animate-fade-in">
                  <PlannerCopilot
                    skus={skus}
                    selectedSku={selectedSku}
                    onSelectSku={(id) => {
                      handleSelectSku(id);
                      setSkuSubTab('trajectory');
                    }}
                    auditLogs={auditLogs}
                    openrouterModel={
                      customModelInput.trim() || openrouterModel
                    }
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
export default App;
