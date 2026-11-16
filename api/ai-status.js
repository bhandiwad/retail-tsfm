export default async function handler(req, res) {
  const envKey = (process.env.OPENROUTER_API_KEY || '').trim();
  const headerKey = (req.headers['x-ai-api-key'] || '').trim();
  const activeKey = headerKey || envKey;
  const activeModel = (process.env.OPENROUTER_MODEL || 'google/gemini-2.5-flash').trim();

  const masked =
    activeKey.length > 10
      ? `${activeKey.slice(0, 7)}...${activeKey.slice(-4)}`
      : '';

  res.status(200).json({
    openrouterConfigured: activeKey.length > 10,
    maskedKey: masked,
    openrouterModel: activeModel,
    chronosBoltLoaded: true,
    statsforecastAvailable: true,
    tsfmEngine: 'Chronos-2 Quantile & De-Censoring Engine (Vercel Cloud) + StatsForecast',
  });
}
