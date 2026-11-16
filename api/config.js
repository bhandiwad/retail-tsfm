export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = req.body || {};
  const incomingKey = (body.openrouterApiKey || '').trim();
  const incomingModel = (body.openrouterModel || 'google/gemini-2.5-flash').trim();
  const envKey = (process.env.OPENROUTER_API_KEY || '').trim();

  const keyToTest =
    incomingKey && !incomingKey.includes('...') ? incomingKey : envKey;

  let testStatus = 'NOT_CONFIGURED';
  let testMessage = 'Enter a valid API key to enable live AI reasoning.';

  if (keyToTest && keyToTest.length > 10) {
    try {
      const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${keyToTest}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://retail-tsfm.vercel.app',
          'X-Title': "Pandita's Adaptive Demand Decision Layer",
        },
        body: JSON.stringify({
          model: incomingModel,
          messages: [
            { role: 'user', content: 'Respond with JSON: {"status": "online"}' },
          ],
          max_tokens: 25,
          temperature: 0.0,
        }),
      });

      if (resp.ok) {
        testStatus = 'VERIFIED_LIVE';
        testMessage = `Connected and verified live with model: ${incomingModel}`;
      } else {
        const errText = await resp.text();
        testStatus = 'AUTH_ERROR';
        testMessage = `API returned HTTP ${resp.status}: ${errText.slice(0, 140)}`;
      }
    } catch (err) {
      testStatus = 'CONNECTION_ERROR';
      testMessage = `Connection error: ${String(err).slice(0, 140)}`;
    }
  }

  const masked =
    keyToTest && keyToTest.length > 10
      ? `${keyToTest.slice(0, 7)}...${keyToTest.slice(-4)}`
      : '';

  return res.status(200).json({
    openrouterConfigured: Boolean(keyToTest && keyToTest.length > 10),
    maskedKey: masked,
    openrouterModel: incomingModel,
    testStatus,
    testMessage,
  });
}
