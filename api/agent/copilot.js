export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = req.body || {};
  const query = body.query || '';
  const selectedSku = body.selectedSku || {};
  const portfolioSummary = Array.isArray(body.portfolioSummary)
    ? body.portfolioSummary
    : [];

  const headerKey = (req.headers['x-ai-api-key'] || '').trim();
  const envKey = (process.env.OPENROUTER_API_KEY || '').trim();
  const apiKey = headerKey || envKey;
  const modelToUse = (
    body.openrouterModelOverride ||
    process.env.OPENROUTER_MODEL ||
    'google/gemini-2.5-flash'
  ).trim();

  const systemPrompt = `You are the Merchandising & Inventory AI Copilot inside Pandita's Adaptive Demand Decision Layer.
Answer the retail planner's question concisely using the live SKU and portfolio telemetry provided.
Return ONLY a valid JSON object matching this exact schema (no markdown fences):
{
  "answer": "<clear 2-4 sentence executive answer citing specific SKU IDs, unit counts, WAPE %, quantiles, and dollar impacts>",
  "highlightMetrics": [
    {"label": "<metric 1>", "value": "<val 1>"},
    {"label": "<metric 2>", "value": "<val 2>"},
    {"label": "<metric 3>", "value": "<val 3>"}
  ],
  "relatedSkuId": "<relevant SKU ID from the portfolio>"
}`;

  const userPrompt = `Planner Question: "${query}"
Currently Selected SKU: ${JSON.stringify({
    skuId: selectedSku.skuId,
    name: selectedSku.name,
    archetype: selectedSku.archetype,
    retailPrice: selectedSku.retailPrice,
    grossMarginPct: selectedSku.grossMarginPct,
    currentInventory: selectedSku.currentInventory,
    remainingSellingWeeks: selectedSku.remainingSellingWeeks,
    targetQuantile: selectedSku.targetQuantile,
    routedModel: selectedSku.routedModel,
    llmGuardrailStatus: selectedSku.llmGuardrailStatus,
    llmConfidence: selectedSku.llmConfidence,
    llmRationale: selectedSku.llmRationale,
    actionTitle: selectedSku.actionTitle,
    metrics: selectedSku.metrics,
  })}
Portfolio Exception Summary: ${JSON.stringify(portfolioSummary)}`;

  if (apiKey && apiKey.length > 10) {
    try {
      const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://retail-tsfm.vercel.app',
          'X-Title': "Pandita's Adaptive Demand Decision Layer",
        },
        body: JSON.stringify({
          model: modelToUse,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.2,
          max_tokens: 500,
        }),
      });

      if (resp.ok) {
        const data = await resp.json();
        let content = (data.choices?.[0]?.message?.content || '').trim();
        if (content.startsWith('```')) {
          content = content.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
        }
        const parsed = JSON.parse(content);
        return res.status(200).json({
          providerUsed: `Central AI Engine (${modelToUse})`,
          answer: parsed.answer,
          highlightMetrics: parsed.highlightMetrics || [],
          relatedSkuId: parsed.relatedSkuId || selectedSku.skuId,
        });
      }
    } catch {
      // Fallback below
    }
  }

  return res.status(200).json({
    providerUsed: 'Quantitative Decision Engine',
    answer: `For ${selectedSku.name} (${selectedSku.skuId}), routing through ${selectedSku.routedModel} reduces 12-week WAPE from ${selectedSku.metrics?.legacyWape}% (Legacy ERP) to ${selectedSku.metrics?.addlWape}%. Executing "${selectedSku.actionTitle}" lifts availability from ${selectedSku.metrics?.availabilityBefore}% to ${selectedSku.metrics?.availabilityAfter}% and captures $${(selectedSku.metrics?.financialImpactUsd || 0).toLocaleString()} in net margin & working capital impact.`,
    highlightMetrics: [
      { label: 'Target Quantile', value: `P${selectedSku.targetQuantile}` },
      { label: 'Routed WAPE', value: `${selectedSku.metrics?.addlWape}%` },
      {
        label: 'Net Impact',
        value: `$${(selectedSku.metrics?.financialImpactUsd || 0).toLocaleString()}`,
      },
    ],
    relatedSkuId: selectedSku.skuId,
  });
}
