/**
 * Worker de Sun&Moon Eventos.
 *
 * - La página estática se sirve directo desde Cloudflare (ver "assets" en wrangler.jsonc).
 * - POST /api/cotizar recibe la cotización del navegador y la reenvía al script de Google
 *   Apps Script, que es quien envía los correos. Así el navegador solo habla con este mismo
 *   dominio (sin peticiones entre sitios, que Safari puede bloquear) y la URL del script
 *   queda guardada como secreto en vez de estar en el código público.
 *
 * Secretos (panel de Cloudflare → Worker → Configuración → Variables y secretos):
 *   APPS_SCRIPT_URL  URL de la aplicación web de Apps Script (termina en /exec)
 *   SCRIPT_TOKEN     (opcional) clave compartida; debe ser igual a la propiedad TOKEN del script
 */

const MAX_BYTES = 700 * 1024; // un PDF de cotización pesa unos 70 KB; esto deja mucho margen
const TIMEOUT_MS = 25000;

function json(obj, status = 200, extra = {}) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...extra }
  });
}

// Lee el cuerpo sin pasar del tope. Devuelve null si es más grande.
async function leerCuerpo(request) {
  if (Number(request.headers.get("content-length") || 0) > MAX_BYTES) { return null; }
  if (!request.body) { return ""; }

  const lector = request.body.getReader();
  const partes = [];
  let total = 0;
  for (;;) {
    const { done, value } = await lector.read();
    if (done) { break; }
    total += value.byteLength;
    if (total > MAX_BYTES) { await lector.cancel(); return null; }
    partes.push(value);
  }
  const todo = new Uint8Array(total);
  let pos = 0;
  for (const p of partes) { todo.set(p, pos); pos += p.byteLength; }
  return new TextDecoder().decode(todo);
}

async function cotizar(request, env, url) {
  if (request.method !== "POST") {
    return json({ ok: false, error: "Método no permitido." }, 405, { allow: "POST" });
  }

  // Solo se acepta desde esta misma página.
  // (Origin; si el navegador no lo manda, se usa Referer.)
  let origen = "";
  try { origen = new URL(request.headers.get("origin") || request.headers.get("referer") || "").host; } catch (e) { /* sin origen válido */ }
  if (origen !== url.host) {
    return json({ ok: false, error: "Origen no permitido." }, 403);
  }

  if (!env.APPS_SCRIPT_URL) {
    console.error(JSON.stringify({ evento: "cotizacion", error: "falta APPS_SCRIPT_URL" }));
    return json({ ok: false, error: "El envío por correo no está configurado." }, 500);
  }

  const texto = await leerCuerpo(request);
  if (texto === null) { return json({ ok: false, error: "La cotización es demasiado grande." }, 413); }

  let datos;
  try { datos = JSON.parse(texto); } catch (e) { return json({ ok: false, error: "Solicitud no válida." }, 400); }
  if (!datos || typeof datos !== "object" || Array.isArray(datos)) {
    return json({ ok: false, error: "Solicitud no válida." }, 400);
  }

  if (env.SCRIPT_TOKEN) { datos.token = env.SCRIPT_TOKEN; } else { delete datos.token; }

  let respuesta;
  try {
    // Apps Script contesta con una redirección; fetch la sigue y trae el resultado.
    respuesta = await fetch(env.APPS_SCRIPT_URL, {
      method: "POST",
      headers: { "content-type": "text/plain;charset=utf-8" },
      body: JSON.stringify(datos),
      redirect: "follow",
      signal: AbortSignal.timeout(TIMEOUT_MS)
    });
  } catch (e) {
    console.error(JSON.stringify({ evento: "cotizacion", error: "sin respuesta del script", detalle: String(e && e.name) }));
    return json({ ok: false, error: "No se pudo contactar el servicio de correo." }, 502);
  }

  let resultado;
  try { resultado = JSON.parse(await respuesta.text()); } catch (e) { resultado = null; }
  if (!resultado || typeof resultado.ok !== "boolean") {
    console.error(JSON.stringify({ evento: "cotizacion", error: "respuesta inesperada", estado: respuesta.status }));
    return json({ ok: false, error: "El servicio de correo no respondió como se esperaba." }, 502);
  }

  console.log(JSON.stringify({ evento: "cotizacion", ok: resultado.ok }));
  // Solo se devuelve lo necesario; no se reenvía nada más del script.
  return json(resultado.ok ? { ok: true } : { ok: false, error: String(resultado.error || "No se pudo enviar el correo.").slice(0, 200) });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/cotizar") { return cotizar(request, env, url); }
    if (url.pathname.startsWith("/api/")) { return json({ ok: false, error: "No encontrado." }, 404); }
    return env.ASSETS.fetch(request);
  }
};
