/* ==========================================================================
   SUPABASE · Cliente + servicio de leads
   Expone window.LeadService.submit(payload) → Promise<{ ok, demo, error }>
   ========================================================================== */
(function () {
  const raw = window.APP_CONFIG || {};
  // Limpia espacios accidentales al pegar las claves
  const cfg = Object.assign({}, raw, {
    SUPABASE_URL: String(raw.SUPABASE_URL || '').trim(),
    SUPABASE_ANON_KEY: String(raw.SUPABASE_ANON_KEY || '').trim()
  });
  const hasKeys = Boolean(cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY);
  let client = null;

  if (hasKeys && window.supabase && typeof window.supabase.createClient === 'function') {
    client = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
  } else if (!hasKeys) {
    console.info('[LeadService] Supabase sin configurar → MODO DEMO. Edita js/config.js.');
  }

  const clean = (v, max) => {
    if (v === undefined || v === null) return null;
    const s = String(v).trim().replace(/\s+/g, ' ');
    return s ? s.slice(0, max) : null;
  };

  /** Normaliza el payload al esquema de la tabla lead_cotizaciones */
  function toRow(data) {
    return {
      nombre: clean(data.nombre, 120),
      telefono: clean(data.telefono, 30),
      tipo_evento: clean(data.tipo_evento, 40),
      fecha_evento: data.fecha_evento || null,
      lugar_evento: clean(data.lugar_evento, 200),
      mensaje: data.mensaje ? String(data.mensaje).trim().slice(0, 2000) || null : null,
      paquete: clean(data.paquete, 60),
      origen: clean(data.origen, 40) || 'landing'
    };
  }

  async function submit(data) {
    const row = toRow(data);

    if (!client) {
      // Modo demo: simula latencia de red para la presentación
      await new Promise(r => setTimeout(r, 1100));
      console.table(row);
      return { ok: true, demo: true };
    }

    // Sin .select(): el rol anon solo tiene permiso de INSERT (ver RLS)
    const { error } = await client.from(cfg.LEADS_TABLE || 'lead_cotizaciones').insert(row);
    if (error) {
      console.error('[LeadService]', error);
      return { ok: false, error };
    }
    return { ok: true };
  }

  window.LeadService = { submit, isLive: () => Boolean(client) };
})();
