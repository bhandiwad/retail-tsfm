import React, { useState } from 'react';
import { SkuRecord, AuditLogEntry } from '../types/retail';
import {
  Bot,
  Send,
  Sparkles,
  History,
  ArrowRight,
  Loader2,
  Cpu,
} from 'lucide-react';

interface PlannerCopilotProps {
  skus: SkuRecord[];
  selectedSku: SkuRecord;
  onSelectSku: (skuId: string) => void;
  auditLogs: AuditLogEntry[];
  openrouterModel: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  providerBadge?: string;
  highlightMetrics?: { label: string; value: string }[];
  relatedSkuId?: string;
}

const IS_LOCALHOST =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1');
const API_BASE =
  import.meta.env.VITE_API_BASE_URL ??
  (IS_LOCALHOST ? 'http://localhost:8005' : '');

const PRESET_QUERIES = [
  'Which products might run out of stock during upcoming promotions?',
  'Why did AI ignore the unverified rumor on Navy Slip-Ons?',
  'Compare a 15% early discount vs. waiting for late-season clearance',
  'What is the risk of ordering too little vs. too much on this item?',
];

export const PlannerCopilot: React.FC<PlannerCopilotProps> = ({
  skus,
  selectedSku,
  onSelectSku,
  auditLogs,
  openrouterModel,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'copilot' | 'audit'>(
    'copilot'
  );
  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      providerBadge: 'AI Planning Assistant',
      text: `Tracking 168 items across 120 stores and online sales. ${skus.length} items need your review today. Ask any question about weekly sales forecasts, missed stockout demand, order quantities, or discount timing.`,
      highlightMetrics: [
        { label: 'Items to Review', value: `${skus.length} Items` },
        { label: 'Savings Opportunity', value: '$352,400+' },
        { label: 'Noise Filtered', value: '2 Rumors Ignored' },
      ],
    },
  ]);

  const handleSend = async (queryText?: string) => {
    const q = (queryText ?? inputQuery).trim();
    if (!q || isLoading) return;
    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      text: q,
    };
    setMessages((prev) => [...prev, userMsg]);
    if (!queryText) setInputQuery('');
    setIsLoading(true);

    try {
      const portfolioSummary = skus.map((s) => ({
        skuId: s.skuId,
        name: s.name,
        archetype: s.archetype,
        legacyWape: s.metrics.legacyWape,
        addlWape: s.metrics.addlWape,
        actionTitle: s.actionTitle,
        financialImpactUsd: s.metrics.financialImpactUsd,
      }));

      const savedKey = localStorage.getItem('pandita_ai_api_key') || '';
      const resp = await fetch(`${API_BASE}/api/agent/copilot`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(savedKey ? { 'x-ai-api-key': savedKey } : {}),
        },
        body: JSON.stringify({
          query: q,
          selectedSku,
          portfolioSummary,
          openrouterModelOverride: openrouterModel,
        }),
      });

      if (resp.ok) {
        const data = await resp.json();
        const assistantMsg: ChatMessage = {
          id: `a-${Date.now()}`,
          role: 'assistant',
          providerBadge: data.providerUsed || 'Central AI Decision Engine',
          text: data.answer,
          highlightMetrics: data.highlightMetrics,
          relatedSkuId: data.relatedSkuId,
        };
        setMessages((prev) => [...prev, assistantMsg]);
        setIsLoading(false);
        return;
      }
    } catch {
      // Fallback if backend is unreachable
    }

    const fallbackMsg: ChatMessage = {
      id: `a-${Date.now()}`,
      role: 'assistant',
      providerBadge: 'Quantitative Decision Engine',
      text: `For ${selectedSku.name} (${selectedSku.skuId}), routing through ${selectedSku.routedModel} reduces 12-week WAPE from ${selectedSku.metrics.legacyWape}% (Legacy ERP) to ${selectedSku.metrics.addlWape}%. Executing "${selectedSku.actionTitle}" lifts availability from ${selectedSku.metrics.availabilityBefore}% to ${selectedSku.metrics.availabilityAfter}% and reduces excess supply from ${selectedSku.metrics.excessWeeksBefore} wks to ${selectedSku.metrics.excessWeeksAfter} wks ($${selectedSku.metrics.financialImpactUsd.toLocaleString()} net impact).`,
      highlightMetrics: [
        { label: 'Target Quantile', value: `P${selectedSku.targetQuantile}` },
        {
          label: 'Net Business Impact',
          value: `$${selectedSku.metrics.financialImpactUsd.toLocaleString()}`,
        },
      ],
      relatedSkuId: selectedSku.skuId,
    };
    setMessages((prev) => [...prev, fallbackMsg]);
    setIsLoading(false);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col h-full">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setActiveSubTab('copilot')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === 'copilot'
                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Bot className="w-3.5 h-3.5 text-indigo-600" />
            Ask AI Assistant
          </button>
          <button
            onClick={() => setActiveSubTab('audit')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === 'audit'
                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <History className="w-3.5 h-3.5 text-emerald-600" />
            Approval Log ({auditLogs.length})
          </button>
        </div>

        <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold flex items-center gap-1">
          <Cpu className="w-3 h-3" />
          {openrouterModel.split('/').pop()}
        </span>
      </div>

      {activeSubTab === 'copilot' ? (
        <div className="flex flex-col flex-1 justify-between gap-3">
          <div className="flex flex-wrap gap-1.5">
            {PRESET_QUERIES.map((pq, i) => (
              <button
                key={i}
                onClick={() => handleSend(pq)}
                disabled={isLoading}
                className="text-left px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 text-[11px] text-slate-700 font-medium transition cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-3 h-3 inline mr-1 text-indigo-600" />
                {pq}
              </button>
            ))}
          </div>

          <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`p-3 rounded-xl text-xs leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-indigo-50 border border-indigo-200 text-indigo-950 ml-6 font-medium'
                    : 'bg-slate-50 border border-slate-200 text-slate-800'
                }`}
              >
                {m.providerBadge && (
                  <div className="text-[10px] font-mono text-indigo-700 font-semibold mb-1 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-indigo-600" />
                    {m.providerBadge}
                  </div>
                )}
                <div className="whitespace-pre-line">{m.text}</div>
                {m.highlightMetrics && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2.5 pt-2 border-t border-slate-200">
                    {m.highlightMetrics.map((hm, idx) => (
                      <div
                        key={idx}
                        className="bg-white px-2 py-1 rounded border border-slate-200"
                      >
                        <div className="text-[10px] text-slate-500">
                          {hm.label}
                        </div>
                        <div className="text-xs font-mono font-bold text-emerald-700">
                          {hm.value}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {m.relatedSkuId && (
                  <button
                    onClick={() => onSelectSku(m.relatedSkuId!)}
                    className="mt-2 inline-flex items-center gap-1 text-[11px] font-mono font-semibold text-indigo-700 hover:text-indigo-900 cursor-pointer"
                  >
                    Inspect {m.relatedSkuId} in Canvas{' '}
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-indigo-700 font-medium flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                Checking sales history &amp; stock levels...
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2 pt-1"
          >
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="Ask about stockouts, order quantities, extra stock, or any product..."
              className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              disabled={isLoading}
              className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1 cursor-pointer disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      ) : (
        <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
          {auditLogs.length === 0 ? (
            <div className="text-xs text-slate-500 py-8 text-center">
              No planner decisions logged yet.
            </div>
          ) : (
            auditLogs.map((entry) => (
              <div
                key={entry.id}
                className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-slate-900">
                    {entry.skuId} • {entry.skuName.split('—')[0]}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      entry.decision === 'APPROVED'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : entry.decision === 'MODIFIED'
                        ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                        : 'bg-amber-100 text-amber-800 border border-amber-200'
                    }`}
                  >
                    {entry.decision}
                  </span>
                </div>
                <div className="text-slate-700">{entry.actionSummary}</div>
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 pt-1 border-t border-slate-200">
                  <span>Reason: {entry.reasonCode}</span>
                  <span className="text-emerald-700 font-semibold">
                    Impact: ${entry.financialImpactUsd.toLocaleString()}
                  </span>
                  <span>{entry.timestamp}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
