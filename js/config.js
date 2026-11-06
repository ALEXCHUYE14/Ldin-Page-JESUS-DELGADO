/* ==========================================================================
   CONFIGURACIÓN GLOBAL
   --------------------------------------------------------------------------
   1. Crea un proyecto en https://supabase.com
   2. Ejecuta supabase/schema.sql en el SQL Editor
   3. Copia aquí la "Project URL" y la "anon / publishable key"
      (Project Settings → API). La anon key es pública por diseño: la
      seguridad la garantizan las políticas RLS del schema.sql.
   Mientras estos valores sigan vacíos, el formulario funciona en
   MODO DEMO (simula el envío) para poder presentar la maqueta.
   ========================================================================== */
window.APP_CONFIG = {
  SUPABASE_URL: 'https://gognldebezzbsocntmup.supabase.co',          // ej. 'https://gognldebezzbsocntmup.supabase.co'
  SUPABASE_ANON_KEY: ' sb_publishable_KQXsGou1h44ury7hojlyvA_snp00GZ2',     // ej. 'eyJhbGciOi...' o 'sb_publishable_...'
  LEADS_TABLE: 'lead_cotizaciones',

  WHATSAPP_NUMBER: '51958634348',
  WHATSAPP_DEFAULT_TEXT: 'Hola Jesús, estoy interesado en cotizar una cobertura fotográfica.'
};
