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
  const sbKey = process.env.SUPABASE_SERVICE_KEY;

  if (!sbUrl || !sbKey) {
    console.error("Faltan las variables de entorno en Vercel");
    return res.status(500).json({ error: 'Configuración de servidor incompleta' });
  }

  try {
    
    const incrementParam = req.query?.increment;
    const shouldIncrement = !['0','false','no'].includes(String(incrementParam ?? '').toLowerCase());

    const headers = {
        'apikey': sbKey,
        'Authorization': `Bearer ${sbKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
    };

    
    const readResponse = await fetch(`${sbUrl}/rest/v1/visitas?select=id,contador&limit=1`, { headers });
    
    if (!readResponse.ok) {
        const errText = await readResponse.text();
        throw new Error(`Error Supabase Read: ${errText}`);
    }

    const data = await readResponse.json();
    let nuevoValor = 0;

    if (data.length === 0) {
      if (shouldIncrement) {
        await fetch(`${sbUrl}/rest/v1/visitas`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ contador: 1 })
        });
        nuevoValor = 1;
      }
    } else {
      const idFila = data[0].id; 
      const valorActual =
        typeof data[0].contador === 'number'
          ? data[0].contador
          : Number(data[0].contador) || 0;

      nuevoValor = valorActual;

      if (shouldIncrement) {
        const actualizado = valorActual + 1;
        const updateResponse = await fetch(`${sbUrl}/rest/v1/visitas?id=eq.${idFila}`, {
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

    
    return res.status(200).json({ total: nuevoValor });

  } catch (error) {
    console.error("CRITICAL ERROR:", error);
    return res.status(500).json({ error: error.message });
  }
}