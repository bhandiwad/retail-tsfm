export async function POST(request) {
  try {
    const body = await request.json();
    const ca = body.cityA || {};
    const cb = body.cityB || {};

    const headerKey = (request.headers.get('x-ai-api-key') || '').trim();
    const envKey = (process.env.OPENROUTER_API_KEY || '').trim();
    const apiKey = headerKey || envKey;
    const modelToUse = (
      body.openrouterModelOverride ||
      process.env.OPENROUTER_MODEL ||
      'google/gemini-2.5-flash'
    ).trim();

    const systemPrompt = `You are a plain-English Indian Smartphone Retail Sales Analyst.
Compare City A and City B using the exact store coverage, SIM activations, Black 256GB stock, shopkeeper margin vs rival margin, Bajaj/TVS 0% EMI store coverage, promoter count, and service turnaround days provided.
Keep language simple, direct, and free of academic jargon.
Respond ONLY with valid JSON (no markdown fences):
{
  "headline": "<1 clear sentence explaining why different models win in the two cities>",
  "summaryPlain": "<2 simple sentences summarizing what is happening on the ground>",
  "actionSteps": [
    "<action 1 with concrete numbers>",
    "<action 2 with concrete numbers>",
    "<action 3 with concrete numbers>"
  ]
}`;

    const userPrompt = `Compare these two Indian smartphone markets:
City A (${ca.cityName}, ${ca.state}):
- Active Shops: ${ca.activeBillingShops}/${ca.totalMobileShops}, 0% EMI Shops: ${ca.nbfcZeroDownShopsPct}%, Promoters: ${ca.inShopPromoters}, Service Wait: ${ca.avgServiceTurnaroundDays} days
- Top Model: ${ca.topSellingModel}
- Model Breakdown: ${JSON.stringify(ca.modelBreakdown || {})}
- Field Notes: ${JSON.stringify(ca.fieldNotes || [])}

City B (${cb.cityName}, ${cb.state}):
- Active Shops: ${cb.activeBillingShops}/${cb.totalMobileShops}, 0% EMI Shops: ${cb.nbfcZeroDownShopsPct}%, Promoters: ${cb.inShopPromoters}, Service Wait: ${cb.avgServiceTurnaroundDays} days
- Top Model: ${cb.topSellingModel}
- Model Breakdown: ${JSON.stringify(cb.modelBreakdown || {})}
- Field Notes: ${JSON.stringify(cb.fieldNotes || [])}`;

    if (apiKey && apiKey.length > 10) {
      const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://retail-tsfm.vercel.app',
          'X-Title': 'Retail AI Suite',
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
        return Response.json({
          providerUsed: `Live AI (${modelToUse})`,
          headline: parsed.headline,
          summaryPlain: parsed.summaryPlain,
          actionSteps: parsed.actionSteps || [],
        });
      }
    }

    const caCurve = ca.modelBreakdown?.['Curve 5G (₹18k)'] || {};
    const cbCurve = cb.modelBreakdown?.['Curve 5G (₹18k)'] || {};
    return Response.json({
      providerUsed: 'Retail Intelligence Engine',
      headline: `${ca.cityName} activates ${(caCurve.activatedUnits || 0).toLocaleString()} units of Curve 5G vs ${(cbCurve.activatedUnits || 0).toLocaleString()} in ${cb.cityName} due to EMI store mapping, Black 256GB stock, and shopkeeper margin gaps.`,
      summaryPlain: `In ${ca.cityName}, ${ca.nbfcZeroDownShopsPct}% of stores offer 0-down-payment EMI and hold ${caCurve.black256Stock ?? 0} Black 256GB units. In ${cb.cityName}, only ${cb.nbfcZeroDownShopsPct}% of stores have 0% EMI mapped, Black 256GB stock is ${cbCurve.black256Stock ?? 0} units, and rival shop margin is ₹${cbCurve.rivalMarginInr ?? 1480} vs ₹${cbCurve.effectiveShopMarginInr ?? 1169}.`,
      actionSteps: [
        `Move 300+ units of Curve 5G Black 256GB into ${cb.distributorName || cb.cityName} within 24–48 hours.`,
        `Send WhatsApp Monthly Bonus Nudge (+₹350/unit) to active ${cb.cityName} shops within 4 phones of target.`,
        `Enable Bajaj/TVS 0-down-payment QR mapping across top 150 ${cb.cityName} retail counters.`,
      ],
    });
  } catch (err) {
    console.error('explain-cities error:', err);
    return Response.json(
      { error: 'Failed to analyze city comparison' },
      { status: 500 }
    );
  }
}
