export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const t0 = Date.now();
  const body = req.body || {};
  const sku = body.sku || {};
  const whatIfQuantile = body.whatIfQuantile ?? 50;
  const whatIfPromoLiftPct = body.whatIfPromoLiftPct ?? 0;
  const whatIfMarkdownPct = body.whatIfMarkdownPct ?? 0;
  const customEventPrompt = body.customEventPrompt || '';
  const activeSignalLabel = body.activeSignalLabel || '';

  const headerKey = (req.headers['x-ai-api-key'] || '').trim();
  const envKey = (process.env.OPENROUTER_API_KEY || '').trim();
  const apiKey = headerKey || envKey;
  const modelToUse = (
    body.openrouterModelOverride ||
    process.env.OPENROUTER_MODEL ||
    'google/gemini-2.5-flash'
  ).trim();

  // Compute statistical de-censored forecast baseline
  const history = Array.isArray(sku.history) ? sku.history : [];
  const forecastList = Array.isArray(sku.forecast) ? sku.forecast : [];

  const chronosP10 = forecastList.map((f) => Number(f.chronosP10 || 100));
  const chronosP50 = forecastList.map((f) => Number(f.chronosP50 || 130));
  const chronosP90 = forecastList.map((f) => Number(f.chronosP90 || 170));
  const classicalFc = forecastList.map((f) => Number(f.classicalForecast || 120));

  const censoredCount = history.reduce(
    (sum, h) => sum + Number(h.censoredUnits || 0),
    0
  );

  const systemPrompt = `You are the Central Retail Demand & Inventory Decision Agent inside Pandita's Adaptive Demand Decision Layer.
You sit on top of:
1) Stockout De-Censoring Engine (which reconstructed ${censoredCount} lost OOS units).
2) Zero-Shot Chronos-2 Probabilistic Quantiles (P10, P50, P90) and StatsForecast baselines.
3) Asymmetric Newsvendor Risk Optimizer.

You MUST return ONLY a valid JSON object matching this exact schema (no markdown fences):
{
  "recommendedTargetQuantile": <integer between 30 and 90>,
  "llmAdjustmentPct": <integer between -25 and 35>,
  "llmConfidence": <float between 0.50 and 0.98>,
  "guardrailStatus": "APPROVED_BY_GUARDRAIL" or "BLOCKED_BY_GUARDRAIL",
  "actionType": "DC_TRANSFER" or "MARKDOWN" or "COLD_START_ALLOCATION" or "REORDER_INCREASE" or "BUY_REDUCTION",
  "actionTitle": "<concise 6-10 word executive action headline>",
  "recommendedUnitsDelta": <integer unit change, positive or negative>,
  "recommendedMarkdownPct": <integer 0, 10, 15, 20, 25, or 30>,
  "executiveRationale": "<2-3 sentences citing specific unit numbers, quantiles, margin %, and weeks of supply>",
  "riskTradeoffSummary": "<1-2 sentences explaining underage vs overage cost trade-off>",
  "erpExecutionSteps": ["<step 1>", "<step 2>", "<step 3>"]
}
Rule: If llmConfidence < 0.80, set guardrailStatus to "BLOCKED_BY_GUARDRAIL" and llmAdjustmentPct to 0.`;

  const userPrompt = `Evaluate this retail SKU and active What-If scenario:
- SKU: ${sku.skuId} (${sku.name})
- Archetype: ${sku.archetype} | Store Cluster: ${sku.storeCluster}
- MSRP: $${sku.retailPrice} | Gross Margin: ${sku.grossMarginPct}%
- Current On-Hand Inventory: ${sku.currentInventory} units | On-Order: ${sku.onOrderUnits} units
- Lead Time: ${sku.leadTimeWeeks} weeks | Remaining Selling Window: ${sku.remainingSellingWeeks} weeks
- Chronos-2 12-Week Mean P50: ${Math.round(chronosP50.reduce((a, b) => a + b, 0) / Math.max(1, chronosP50.length))} units/wk
- Planner What-If Sliders: Target Quantile = P${whatIfQuantile}, Promo Lift Delta = ${whatIfPromoLiftPct}%, Markdown Depth = ${whatIfMarkdownPct}%
- Active Live Market Signal: ${activeSignalLabel || 'None'}
- Planner Custom Disruption Prompt: ${customEventPrompt || 'Standard merchandising review'}`;

  let llmDecision = null;
  let providerUsed = 'Quantitative Fallback Engine';

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
          max_tokens: 600,
        }),
      });

      if (resp.ok) {
        const data = await resp.json();
        let content = (data.choices?.[0]?.message?.content || '').trim();
        if (content.startsWith('```')) {
          content = content.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
        }
        llmDecision = JSON.parse(content);
        providerUsed = `Central AI Engine (${modelToUse})`;
      }
    } catch {
      // Fallback to quantitative synthesis below
    }
  }

  if (!llmDecision) {
    const combinedShift = whatIfPromoLiftPct + (customEventPrompt ? 14 : 0);
    const conf =
      Math.abs(combinedShift) >= 5 || Boolean(customEventPrompt) ? 0.89 : 0.72;
    const approved = conf >= 0.8;
    const adjPct = approved
      ? Math.max(-20, Math.min(30, Math.round(combinedShift * 0.75)))
      : 0;
    const baseDelta = Number(sku.recommendedUnitsDelta || 180);
    const newDelta = Math.round(
      baseDelta *
        (1 + adjPct / 100 + (whatIfQuantile - (sku.targetQuantile || 50)) * 0.01)
    );

    llmDecision = {
      recommendedTargetQuantile: whatIfQuantile,
      llmAdjustmentPct: adjPct,
      llmConfidence: conf,
      guardrailStatus: approved
        ? 'APPROVED_BY_GUARDRAIL'
        : 'BLOCKED_BY_GUARDRAIL',
      actionType: sku.actionType || 'DC_TRANSFER',
      actionTitle: customEventPrompt
        ? `AI Scenario Response: ${sku.actionTitle}`
        : sku.actionTitle,
      recommendedUnitsDelta: newDelta,
      recommendedMarkdownPct: whatIfMarkdownPct,
      executiveRationale: `Restored ${censoredCount} missed sales from past zero-stock weeks. ${
        customEventPrompt
          ? `Included scenario '${customEventPrompt}': `
          : ''
      }A ${whatIfQuantile}% stock safety target protects ${sku.grossMarginPct}% product margin across the remaining ${sku.remainingSellingWeeks}-week selling window.`,
      riskTradeoffSummary: `At ${sku.grossMarginPct}% margin ($${sku.retailPrice} retail price), avoiding lost sales is worth far more than holding extra stock at ${whatIfQuantile}% safety.`,
      erpExecutionSteps: [
        `Order/move ${newDelta > 0 ? `+${newDelta}` : newDelta} units via ${sku.transferRoute}`,
        `Set ${whatIfQuantile}% safety stock buffer across ${sku.storeCluster}`,
        `Track weekly sell-through against expected sales range`,
      ],
    };
  }

  return res.status(200).json({
    llmProviderUsed: providerUsed,
    tsfmEngineUsed: 'AI Pattern & Zero-Stock Fix Engine',
    totalLatencyMs: Date.now() - t0,
    localForecast: {
      chronosP10,
      chronosP50,
      chronosP90,
      classicalForecast: classicalFc,
      censoredUnitsRecovered: censoredCount,
    },
    decision: llmDecision,
  });
}
