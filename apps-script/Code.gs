/**
 * Sun&Moon Eventos - envío de cotizaciones por correo (Google Apps Script).
 *
 * La página genera el PDF en el navegador y lo manda aquí en base64. Este script:
 *   1. valida los datos,
 *   2. envía siempre una copia con los datos del evento y el PDF al negocio,
 *   3. si el cliente dejó su correo, le envía también el PDF desde el Gmail que publique el script.
 *
 * Instalación: ver la sección "Envío por correo" del README.md.
 *
 * Como la dirección del script es pública, el correo que se envía al cliente usa una
 * plantilla fija (nadie puede mandar texto libre), hay un tope diario de envíos y se
 * limitan el tamaño del PDF y el largo de cada campo.
 */

var CONFIG = {
  NEGOCIO: "Sun&Moon Eventos",
  TELEFONO: "+502 5934 4700",

  // Correo que recibe la copia de cada cotización. Vacío = el propio Gmail que publica el script.
  CORREO_COPIA: "",

  // Cada cotización gasta 2 destinatarios (cliente + copia). Gmail permite cerca de 100 al día.
  MAX_COTIZACIONES_DIA: 40,

  MAX_PDF_BYTES: 3 * 1024 * 1024,
  ZONA_HORARIA: "America/Guatemala"
};

/** Sirve para comprobar desde el navegador que la implementación está activa. */
function doGet() {
  return json_({ ok: true, servicio: CONFIG.NEGOCIO + " - cotizaciones por correo" });
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);

    var d = leerDatos_(e);

    // Campo trampa para bots: las personas no lo ven ni lo llenan.
    if (d.hp) { return json_({ ok: true }); }

    reservarEnvio_();
    enviarCorreos_(d);
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err && err.message ? err.message : err) });
  } finally {
    try { lock.releaseLock(); } catch (x) { /* el bloqueo no se obtuvo */ }
  }
}

// ---------- Validación ----------

function texto_(v, max) {
  return String(v == null ? "" : v).replace(/[\u0000-\u001F\u007F]+/g, " ").trim().slice(0, max);
}

function leerDatos_(e) {
  if (!e || !e.postData || !e.postData.contents) { throw new Error("Solicitud vacía."); }
  var raw = JSON.parse(e.postData.contents);

  var d = {
    hp: texto_(raw.hp, 100),
    nombre: texto_(raw.nombre, 80),
    email: texto_(raw.email, 120).toLowerCase(),
    tel: texto_(raw.tel, 30),
    tipo: texto_(raw.tipo, 40),
    fecha: texto_(raw.fecha, 80),
    horaEntrega: texto_(raw.horaEntrega, 20),
    horaEvento: texto_(raw.horaEvento, 20),
    lugar: texto_(raw.lugar, 200),
    notas: texto_(raw.notas, 500),
    total: texto_(raw.total, 20),
    resumen: Array.isArray(raw.resumen) ? raw.resumen.slice(0, 40).map(function (l) { return texto_(l, 120); }) : [],
    pdfNombre: texto_(raw.pdfNombre, 60),
    pdfBase64: String(raw.pdfBase64 || "")
  };

  if (d.hp) { return d; }

  if (d.nombre.length < 2) { throw new Error("Falta el nombre."); }
  // El correo del cliente es opcional; si lo dejó, debe ser uno solo y válido.
  if (d.email && !/^[^\s@<>,;]+@[^\s@<>,;]+\.[^\s@<>,;]{2,}$/.test(d.email)) { throw new Error("El correo no es válido."); }
  if (!/^Cotizacion-[A-Za-z0-9-]+\.pdf$/.test(d.pdfNombre)) { d.pdfNombre = "Cotizacion.pdf"; }

  if (!d.pdfBase64 || d.pdfBase64.length > CONFIG.MAX_PDF_BYTES * 1.4) { throw new Error("El PDF falta o es demasiado grande."); }
  if (!/^[A-Za-z0-9+\/=]+$/.test(d.pdfBase64)) { throw new Error("El PDF no es válido."); }

  return d;
}

/** Cuenta las cotizaciones del día y corta cuando se llega al tope. */
function reservarEnvio_() {
  var props = PropertiesService.getScriptProperties();
  var hoy = Utilities.formatDate(new Date(), CONFIG.ZONA_HORARIA, "yyyy-MM-dd");
  var dia = props.getProperty("dia");
  var n = dia === hoy ? Number(props.getProperty("n") || 0) : 0;

  if (n >= CONFIG.MAX_COTIZACIONES_DIA) {
    throw new Error("Se alcanzó el límite de envíos de hoy. Descarga el PDF o escríbenos por WhatsApp.");
  }
  props.setProperty("dia", hoy);
  props.setProperty("n", String(n + 1));
}

// ---------- Envío ----------

function esc_(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function enviarCorreos_(d) {
  var pdf = Utilities.newBlob(Utilities.base64Decode(d.pdfBase64), "application/pdf", d.pdfNombre);
  if (pdf.getBytes().length > CONFIG.MAX_PDF_BYTES) { throw new Error("El PDF es demasiado grande."); }

  var propio = Session.getEffectiveUser().getEmail();
  var copia = CONFIG.CORREO_COPIA || propio;

  var filas = [
    ["Evento", d.tipo],
    ["Fecha", d.fecha],
    ["Hora de entrega", d.horaEntrega],
    ["Hora del evento", d.horaEvento],
    ["Lugar", d.lugar]
  ].filter(function (f) { return f[1]; });

  var detalleTxt = filas.map(function (f) { return f[0] + ": " + f[1]; }).join("\n");
  var detalleHtml = filas.map(function (f) {
    return "<tr><td style=\"padding:2px 12px 2px 0;color:#4A4B78\">" + esc_(f[0]) + "</td><td><b>" + esc_(f[1]) + "</b></td></tr>";
  }).join("");

  // 1) Copia para el negocio: siempre se envía, con todos los datos de contacto.
  var aviso = {
    to: copia,
    name: CONFIG.NEGOCIO + " (cotizaciones)",
    subject: "Nueva cotización: " + d.nombre + (d.fecha ? " - " + d.fecha : ""),
    body: "Nueva cotización generada desde la página.\n\n" +
      "Cliente: " + d.nombre + "\nTeléfono: " + d.tel + "\nCorreo: " + (d.email || "(no dejó correo)") + "\n" +
      detalleTxt + "\n\n" +
      (d.resumen.length ? "Artículos:\n" + d.resumen.join("\n") + "\n\n" : "") +
      "Total estimado: " + d.total + "\n" +
      (d.notas ? "\nNotas del cliente: " + d.notas + "\n" : ""),
    attachments: [pdf]
  };
  if (d.email) { aviso.replyTo = d.email; }
  MailApp.sendEmail(aviso);

  // 2) Correo al cliente, con plantilla fija, solo si dejó su correo.
  if (!d.email) { return; }
  MailApp.sendEmail({
    to: d.email,
    replyTo: copia,
    name: CONFIG.NEGOCIO,
    subject: "Tu cotización de " + CONFIG.NEGOCIO,
    body: "Hola " + d.nombre + ",\n\n" +
      "Gracias por cotizar con " + CONFIG.NEGOCIO + ". Adjuntamos tu cotización en PDF" +
      (d.total ? " por un total estimado de " + d.total : "") + ".\n\n" +
      detalleTxt + "\n\n" +
      "Para confirmar tu reserva, responde este correo o escríbenos por WhatsApp al " + CONFIG.TELEFONO + ".\n" +
      "La cotización está sujeta a disponibilidad en la fecha del evento.\n\n" + CONFIG.NEGOCIO,
    htmlBody: "<div style=\"font-family:Arial,sans-serif;color:#02033C;max-width:560px\">" +
      "<p>Hola " + esc_(d.nombre) + ",</p>" +
      "<p>Gracias por cotizar con <b>" + esc_(CONFIG.NEGOCIO) + "</b>. Adjuntamos tu cotización en PDF" +
      (d.total ? " por un total estimado de <b>" + esc_(d.total) + "</b>" : "") + ".</p>" +
      "<table style=\"font-size:14px\">" + detalleHtml + "</table>" +
      "<p>Para confirmar tu reserva, responde este correo o escríbenos por WhatsApp al <b>" + esc_(CONFIG.TELEFONO) + "</b>.<br>" +
      "<span style=\"color:#4A4B78;font-size:13px\">La cotización está sujeta a disponibilidad en la fecha del evento.</span></p>" +
      "<p style=\"color:#DA742A\"><b>" + esc_(CONFIG.NEGOCIO) + "</b></p></div>",
    attachments: [pdf]
  });
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
