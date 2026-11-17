export async function POST(request) {
  try {
    const body = await request.json();
    const ret = body.retailer || {};
    const shopkeeperMessage = body.shopkeeperMessage || '';

    const headerKey = (request.headers.get('x-ai-api-key') || '').trim();
    const envKey = (process.env.OPENROUTER_API_KEY || '').trim();
    const apiKey = headerKey || envKey;
    const modelToUse = (
      body.openrouterModelOverride ||
      process.env.OPENROUTER_MODEL ||
      'google/gemini-2.5-flash'
    ).trim();

    const systemPrompt = `You are a helpful WhatsApp Sales Assistant for Zenith Mobile talking to an Indian mobile shopkeeper.
Use friendly Hinglish or simple English matching the shopkeeper's message.
Reference their exact monthly slab target, how many units away they are, the exact ₹ bonus credit note they unlock, and distributor delivery timing. Keep it concise (3-5 short lines with WhatsApp formatting).`;

    const userPrompt = `Shop: ${ret.shopName} (${ret.area}), Owner: ${ret.ownerName}
Distributor: ${ret.distributorName}
Monthly Slab: ${ret.slabName} | Target: ${ret.targetUnits} | Activated so far: ${ret.activatedUnits} | Gap: ${ret.gapUnits} phones
Total Credit Note Unlocked at Target: ₹${ret.totalBonusUnlockedInr} (₹${ret.bonusPerUnitInr}/phone)
Shopkeeper just sent: "${shopkeeperMessage}"
Write the WhatsApp reply.`;

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
          temperature: 0.3,
          max_tokens: 350,
        }),
      });

      if (resp.ok) {
        const data = await resp.json();
        const reply = (data.choices?.[0]?.message?.content || '').trim();
        if (reply) {
          return Response.json({
            providerUsed: `Live AI (${modelToUse})`,
            reply,
          });
        }
      }
    }

    return Response.json({
      providerUsed: 'WhatsApp Channel Assistant',
      reply: `Bilkul ${ret.ownerName || 'Sir'} ji! 🙏 Aap abhi *${ret.activatedUnits}/${ret.targetUnits} activations* par hain — sirf *${ret.gapUnits} phone* aur activate karte hi poore *₹${Number(ret.totalBonusUnlockedInr || 8750).toLocaleString()} ka Credit Note* aapke account mein jud jayega 💰.\n\nMain abhi *${ret.distributorName}* ko dispatch note bhej raha hoon (aaj shaam 5:30 PM tak delivery)!`,
    });
  } catch (err) {
    console.error('whatsapp-simulate error:', err);
    return Response.json(
      { error: 'Failed to simulate WhatsApp message' },
      { status: 500 }
    );
  }
}
