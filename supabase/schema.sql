-- =============================================================================
--  JESÚS DELGADO · FOTOGRAFÍA — Esquema de leads (Supabase / PostgreSQL)
--  Ejecutar en: Supabase Dashboard → SQL Editor → New query → Run
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.lead_cotizaciones (
  id            BIGSERIAL PRIMARY KEY,
  nombre        TEXT NOT NULL CHECK (char_length(nombre) BETWEEN 2 AND 120),
  telefono      TEXT NOT NULL CHECK (telefono ~ '^[+0-9 ()-]{6,30}$'),
  tipo_evento   TEXT NOT NULL CHECK (tipo_evento IN (
                  'Boda','Preboda','Quince Años','Evento Social','Bautizo',
                  'Retrato','Gestación','Comercial','Otro')),
  fecha_evento  DATE,
  lugar_evento  TEXT CHECK (char_length(lugar_evento) <= 200),
  mensaje       TEXT CHECK (char_length(mensaje) <= 2000),
  paquete       TEXT CHECK (char_length(paquete) <= 60),          -- paquete elegido en "Cotizar este paquete"
  origen        TEXT NOT NULL DEFAULT 'landing'                   -- formulario_reserva | modal_disponibilidad
                  CHECK (char_length(origen) <= 40),
  estado        TEXT NOT NULL DEFAULT 'nuevo' CHECK (estado IN (
                  'nuevo','contactado','cotizado','reservado','descartado')),
  creado_en     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.lead_cotizaciones IS 'Solicitudes de cotización recibidas desde la landing page.';

-- Índices para el panel / CRM
CREATE INDEX IF NOT EXISTS idx_leads_creado_en ON public.lead_cotizaciones (creado_en DESC);
CREATE INDEX IF NOT EXISTS idx_leads_estado    ON public.lead_cotizaciones (estado);
CREATE INDEX IF NOT EXISTS idx_leads_fecha     ON public.lead_cotizaciones (fecha_evento);

-- -----------------------------------------------------------------------------
--  SEGURIDAD (Row Level Security)
--  El navegador usa la anon key → solo puede INSERTAR leads nuevos.
--  Nadie con la anon key puede leer, editar ni borrar datos.
--  Jesús los ve desde el Dashboard (Table Editor) o con la service_role key.
-- -----------------------------------------------------------------------------
ALTER TABLE public.lead_cotizaciones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "web_puede_insertar_leads" ON public.lead_cotizaciones;
CREATE POLICY "web_puede_insertar_leads"
  ON public.lead_cotizaciones
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (estado = 'nuevo');

REVOKE ALL ON public.lead_cotizaciones FROM anon;
GRANT INSERT (nombre, telefono, tipo_evento, fecha_evento, lugar_evento, mensaje, paquete, origen)
  ON public.lead_cotizaciones TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.lead_cotizaciones_id_seq TO anon, authenticated;

-- -----------------------------------------------------------------------------
--  (Opcional) Vista rápida de leads de los últimos 30 días para el panel
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.leads_recientes
WITH (security_invoker = true) AS
SELECT id, creado_en, nombre, telefono, tipo_evento, fecha_evento, lugar_evento, paquete, estado
FROM public.lead_cotizaciones
WHERE creado_en > NOW() - INTERVAL '30 days'
ORDER BY creado_en DESC;
