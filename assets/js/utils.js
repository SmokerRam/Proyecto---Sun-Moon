/**
 * Funciones de apoyo compartidas: formato de moneda, fechas y número de cotización.
 */
(function (SM) {
  "use strict";

  function money(n) {
    return SM.config.moneda + n.toLocaleString("es-GT", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  // "2026-10-24" -> "sábado, 24 de octubre de 2026"
  function fmtFecha(iso) {
    var p = iso.split("-");
    var d = new Date(+p[0], +p[1] - 1, +p[2]);
    return d.toLocaleDateString("es-GT", {
      weekday: "long", day: "numeric", month: "long", year: "numeric"
    });
  }

  // "15:30" -> "3:30 p. m."
  function fmtHora(hhmm) {
    var p = hhmm.split(":");
    var d = new Date(2000, 0, 1, +p[0], +p[1]);
    return d.toLocaleTimeString("es-GT", { hour: "numeric", minute: "2-digit", hour12: true });
  }

  // "04 de octubre de 2026"
  function fmtFechaCorta(date) {
    return date.toLocaleDateString("es-GT", {
      day: "2-digit", month: "long", year: "numeric"
    });
  }

  // SM-AAMMDD-HHMM
  function numCotizacion() {
    var d = new Date();
    var z = function (n) { return String(n).padStart(2, "0"); };
    return "SM-" + String(d.getFullYear()).slice(2) + z(d.getMonth() + 1) + z(d.getDate()) +
           "-" + z(d.getHours()) + z(d.getMinutes());
  }

  // Fecha de hoy (zona local) en formato AAAA-MM-DD, para el atributo min del campo fecha.
  function hoyISO() {
    var h = new Date();
    h.setMinutes(h.getMinutes() - h.getTimezoneOffset());
    return h.toISOString().slice(0, 10);
  }

  SM.utils = {
    money: money,
    fmtFecha: fmtFecha,
    fmtHora: fmtHora,
    fmtFechaCorta: fmtFechaCorta,
    numCotizacion: numCotizacion,
    hoyISO: hoyISO
  };
})(window.SunMoon);
