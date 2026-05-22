export default async function handler(req, res) {
  
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  
  const sbUrl = process.env.SUPABASE_URL;
  const sbKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  const cloudflareZoneId = process.env.CLOUDFLARE_ZONE_ID || process.env.CF_ZONE_ID || process.env.CLOUDFLARE_ZONE_TAG;
  const cloudflareApiToken = process.env.CLOUDFLARE_API_TOKEN || process.env.CF_API_TOKEN;
  const analyticsDays = Math.max(1, Math.min(365, Number(process.env.CLOUDFLARE_ANALYTICS_DAYS || 30) || 30));

  if (!sbUrl || !sbKey) {
    console.error("Faltan las variables de entorno en Vercel");
    return res.status(500).json({ error: 'Configuración de servidor incompleta' });
  }

  function buildDate(value) {
    return value.toISOString().slice(0, 10);
  }

  async function fetchCloudflareUniqueVisitors() {
    if (!cloudflareZoneId || !cloudflareApiToken) {
      throw new Error('Faltan las variables de Cloudflare para sincronizar');
    }

    const end = new Date();
    const start = new Date(end);
    start.setDate(end.getDate() - analyticsDays);

    const query = `query VisitorCount($zoneTag: String!, $start: Date!, $end: Date!) { viewer { zones(filter: { zoneTag: $zoneTag }) { httpRequests1dGroups(limit: 1000, filter: { date_geq: $start, date_leq: $end, requestSource: \"eyeball\" }) { uniq { uniques } } } } }`;

    const response = await fetch('https://api.cloudflare.com/client/v4/graphql', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${cloudflareApiToken}`,
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify({
        query,
        variables: {
          zoneTag: cloudflareZoneId,
          start: buildDate(start),
          end: buildDate(end)
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(`Cloudflare GraphQL error: ${response.status} ${errorText}`);
    }

    const payload = await response.json();
    if (payload?.errors?.length) {
      throw new Error(payload.errors[0]?.message || 'Cloudflare GraphQL returned an error');
    }

    const groups = payload?.data?.viewer?.zones?.[0]?.httpRequests1dGroups;
    const total = Array.isArray(groups)
      ? groups.reduce((sum, group) => sum + (Number(group?.uniq?.uniques ?? 0) || 0), 0)
      : 0;

    return total;
  }

  async function readCurrentSupabaseValue(counterRowId) {
    const headers = {
      'apikey': sbKey,
      'Authorization': `Bearer ${sbKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    };

    const readResponse = await fetch(
      `${sbUrl}/rest/v1/visitas?id=eq.${counterRowId}&select=id,contador&limit=1`,
      { headers }
    );

    if (!readResponse.ok) {
      const errText = await readResponse.text();
      throw new Error(`Error Supabase Read: ${errText}`);
    }

    const data = await readResponse.json();
    return { headers, data };
  }

  async function writeSupabaseValue(counterRowId, value, headers) {
    const upsertHeaders = {
      ...headers,
      'Prefer': 'return=minimal,resolution=merge-duplicates'
    };

    const response = await fetch(`${sbUrl}/rest/v1/visitas`, {
      method: 'POST',
      headers: upsertHeaders,
      body: JSON.stringify({ id: counterRowId, contador: value })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Error Supabase Write: ${errText}`);
    }
  }

  try {
    const syncMode = String(req.query?.sync ?? req.query?.import ?? '').toLowerCase();
    const incrementParam = req.query?.increment;
    const shouldIncrement = !['0','false','no'].includes(String(incrementParam ?? '').toLowerCase());
    const counterRowId = 1;

    const { headers, data } = await readCurrentSupabaseValue(counterRowId);

    if (syncMode === 'cloudflare' || syncMode === 'cf') {
      const cloudflareTotal = await fetchCloudflareUniqueVisitors();
      const currentValue = data.length > 0
        ? (typeof data[0].contador === 'number' ? data[0].contador : Number(data[0].contador) || 0)
        : 0;
      const nextValue = Math.max(currentValue, cloudflareTotal);
      await writeSupabaseValue(counterRowId, nextValue, headers);
      return res.status(200).json({ total: nextValue, source: 'cloudflare->supabase', cloudflareTotal });
    }

    let nuevoValor = 0;

    if (data.length === 0) {
      const initialValue = shouldIncrement ? 1 : 0;

      await writeSupabaseValue(counterRowId, initialValue, headers);

      nuevoValor = initialValue;
    } else {
      const valorActual =
        typeof data[0].contador === 'number'
          ? data[0].contador
          : Number(data[0].contador) || 0;

      nuevoValor = valorActual;

      if (shouldIncrement) {
        const actualizado = valorActual + 1;
        const updateResponse = await fetch(`${sbUrl}/rest/v1/visitas?id=eq.${counterRowId}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ contador: actualizado })
        });

        if (!updateResponse.ok) {
           const errText = await updateResponse.text();
           throw new Error(`Error Supabase Update: ${errText}`);
        }

        nuevoValor = actualizado;
      }
    }

    
    return res.status(200).json({ total: nuevoValor, source: 'supabase' });

  } catch (error) {
    console.error("CRITICAL ERROR:", error);
    return res.status(500).json({ error: error.message });
  }
}