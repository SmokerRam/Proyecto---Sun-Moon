/**
 * Lógica de la página: catálogo, cantidades, formulario, validación,
 * botón de PDF y enlace de WhatsApp.
 */
(function (SM) {
  "use strict";

  var cfg = SM.config, u = SM.utils;
  var qty = {};
  var colores = {};
  var items = [];

  function $(id) { return document.getElementById(id); }
  // Devuelve "" si el campo no existe en el HTML, así se pueden quitar campos opcionales
  // (correo, notas, tipo de evento…) sin romper el PDF ni el enlace de WhatsApp.
  function val(id) {
    var el = $(id);
    return el && typeof el.value === "string" ? el.value.trim() : "";
  }

  // ---------- Catálogo ----------
  cfg.grupos.forEach(function (g) {
    g.items.forEach(function (it) {
      it.grupo = g.titulo;
      items.push(it);
      qty[it.id] = 0;
    });
  });

  function crearCatalogo() {
    var cat = $("catalog");

    cfg.grupos.forEach(function (g) {
      var sec = document.createElement("section");
      sec.className = "group";
      sec.innerHTML =
        "<button class=\"group-toggle\" type=\"button\" aria-expanded=\"" + (cat.children.length === 0 ? "true" : "false") + "\">" +
          "<span class=\"group-heading\"><span class=\"group-title\">" + g.titulo + "</span>" +
          "<small>" + g.nota + "</small></span><span class=\"group-chevron\" aria-hidden=\"true\">⌄</span>" +
        "</button><div class=\"items\"" + (cat.children.length === 0 ? "" : " hidden") + "></div>";
      var toggle = sec.querySelector(".group-toggle");
      var caja = sec.querySelector(".items");
      toggle.addEventListener("click", function () {
        var abierto = toggle.getAttribute("aria-expanded") === "true";
        toggle.setAttribute("aria-expanded", abierto ? "false" : "true");
        caja.hidden = abierto;
      });

      g.items.forEach(function (it) {
        var fila = document.createElement("div");
        fila.className = "item";
        fila.id = "row-" + it.id;
        var opcionesColor = "";
        if (Array.isArray(it.colores) && it.colores.length) {
          colores[it.id] = { valor: "", otro: "" };
          opcionesColor = "<div class=\"item-options\"><label for=\"color-" + it.id + "\">Color del mantel</label>" +
            "<select id=\"color-" + it.id + "\" data-color-id=\"" + it.id + "\"><option value=\"\">Selecciona un color</option>" +
            it.colores.map(function (c) { return "<option value=\"" + c + "\">" + c + "</option>"; }).join("") +
            "</select><input class=\"color-other\" id=\"otro-color-" + it.id + "\" data-other-id=\"" + it.id + "\" type=\"text\" maxlength=\"40\" placeholder=\"Escribe el color que necesitas\" aria-label=\"Otro color para " + it.nombre + "\" hidden></div>";
        }
        fila.innerHTML =
          "<div class=\"item-info\"><div class=\"nm\">" + it.nombre + "</div>" +
          "<div class=\"ds\">" + it.desc + "</div>" + opcionesColor +
          "<div class=\"pr\"><strong>" + u.money(it.precio) + "</strong> c/u · subtotal " +
          "<span id=\"sub-" + it.id + "\">" + u.money(0) + "</span></div></div>" +
          "<div class=\"stepper\" role=\"group\" aria-label=\"Cantidad de " + it.nombre + "\">" +
          "<button type=\"button\" data-id=\"" + it.id + "\" data-d=\"-1\" aria-label=\"Quitar uno\">−</button>" +
          "<input id=\"q-" + it.id + "\" type=\"number\" min=\"0\" max=\"9999\" inputmode=\"numeric\" value=\"0\" aria-label=\"Cantidad\">" +
          "<button type=\"button\" data-id=\"" + it.id + "\" data-d=\"1\" aria-label=\"Agregar uno\">+</button></div>";
        caja.appendChild(fila);
      });

      cat.appendChild(sec);
    });

    cat.addEventListener("click", function (e) {
      var b = e.target.closest("button[data-id]");
      if (!b) { return; }
      setCantidad(b.dataset.id, qty[b.dataset.id] + parseInt(b.dataset.d, 10));
    });
    cat.addEventListener("input", function (e) {
      if (e.target.matches("input[id^=q-]")) {
        setCantidad(e.target.id.slice(2), e.target.value);
      } else if (e.target.matches("input[data-other-id]")) {
        var otroId = e.target.getAttribute("data-other-id");
        colores[otroId].otro = e.target.value.trim();
        render();
      }
    });
    cat.addEventListener("change", function (e) {
      if (e.target.matches("select[data-color-id]")) {
        var colorId = e.target.getAttribute("data-color-id");
        colores[colorId].valor = e.target.value;
        var otro = $("otro-color-" + colorId);
        otro.hidden = e.target.value !== "Otro";
        if (e.target.value !== "Otro") { colores[colorId].otro = ""; otro.value = ""; }
        render();
      }
    });
  }

  function setCantidad(id, v) {
    v = Math.max(0, Math.min(9999, parseInt(v, 10) || 0));
    qty[id] = v;
    $("q-" + id).value = v;
    render();
  }

  // ---------- Selección y total ----------
  function seleccionados() {
    return items
      .filter(function (it) { return qty[it.id] > 0; })
      .map(function (it) {
        return {
          grupo: it.grupo,
          nombre: it.nombre,
          cant: qty[it.id],
          precio: it.precio,
          color: colores[it.id] ? (colores[it.id].valor === "Otro" ? colores[it.id].otro : colores[it.id].valor) : "",
          sub: qty[it.id] * it.precio
        };
      });
  }

  function total() {
    return seleccionados().reduce(function (acc, l) { return acc + l.sub; }, 0);
  }

  function render() {
    var sel = seleccionados();

    items.forEach(function (it) {
      $("sub-" + it.id).textContent = u.money(qty[it.id] * it.precio);
      $("row-" + it.id).classList.toggle("on", qty[it.id] > 0);
      if (colores[it.id]) {
        var selectColor = $("color-" + it.id);
        var otroColor = $("otro-color-" + it.id);
        if (selectColor) { selectColor.value = colores[it.id].valor; }
        if (otroColor) { otroColor.value = colores[it.id].otro; otroColor.hidden = colores[it.id].valor !== "Otro"; }
      }
    });

    var ul = $("lines");
    ul.innerHTML = sel.length ? "" : "<li class=\"empty\">Aún no has elegido artículos.</li>";
    sel.forEach(function (l) {
      var li = document.createElement("li");
      var detalle = l.cant + " × " + l.nombre + (l.color ? " · Color: " + l.color : "");
      var textoArticulo = document.createElement("span");
      var textoSubtotal = document.createElement("span");
      textoArticulo.textContent = detalle;
      textoSubtotal.textContent = u.money(l.sub);
      li.appendChild(textoArticulo);
      li.appendChild(textoSubtotal);
      ul.appendChild(li);
    });

    $("total").textContent = u.money(total());
    $("btn-wa").href = enlaceWhatsApp();
  }

  // ---------- Formulario ----------
  function datosCliente() {
    return {
      nombre: val("nombre"),
      tel: val("tel"),
      email: val("email"),
      tipo: val("tipo"),
      fecha: val("fecha"),
      horaEntrega: val("hentrega"),
      horaEvento: val("hevento"),
      lugar: val("lugar"),
      notas: val("notas")
    };
  }

  function setError(id, msg) {
    var e = $("e-" + id), campo = $(id);
    if (e) { e.textContent = msg || ""; }
    if (campo) { campo.setAttribute("aria-invalid", msg ? "true" : "false"); }
  }

  // ---------- Campos de hora (24 h) ----------
  // Un solo campo por hora. <input type="time"> muestra 12 h o 24 h según el teléfono o el navegador de
  // cada persona y la página no puede forzarlo, así que se usa el selector de hora de flatpickr
  // (el mismo del calendario): siempre en formato de 24 h, sin AM/PM. El valor queda como "HH:MM".
  // Si flatpickr no carga (sin internet), el campo pasa a ser el <input type="time"> nativo.
  function crearRelojes() {
    ["hentrega", "hevento"].forEach(function (id) {
      var campo = $(id);
      if (!campo) { return; }
      if (!window.flatpickr) { campo.type = "time"; campo.removeAttribute("placeholder"); return; }
      flatpickr(campo, {
        enableTime: true,
        noCalendar: true,
        dateFormat: "H:i",
        time_24hr: true,
        minuteIncrement: 5,
        defaultHour: 12,
        defaultMinute: 0,
        disableMobile: true,
        // Al abrir vacío, se muestra 12:00 ya escrito en el campo, para que lo que se ve sea lo que se envía.
        onOpen: function (seleccion, texto, fp) { if (!seleccion.length) { fp.setDate("12:00", true); } },
        // Se limpian los avisos de las dos horas: "la entrega debe ser antes del evento" depende de ambas.
        onChange: function () { setError("hentrega", ""); setError("hevento", ""); $("btn-wa").href = enlaceWhatsApp(); },
        // También al teclear o usar las flechas dentro del selector, que no siempre disparan onChange.
        onValueUpdate: function () { $("btn-wa").href = enlaceWhatsApp(); }
      });
    });
  }

  function setEstado(texto, clase) {
    var s = $("status");
    s.textContent = texto;
    s.className = "status " + (clase || "");
  }

  function validar() {
    var ok = true, primero = null;

    function revisar(id, condicion, mensaje) {
      if (!condicion) {
        setError(id, mensaje);
        ok = false;
        if (!primero) { primero = id; }
      } else {
        setError(id, "");
      }
    }

    revisar("nombre", val("nombre").length >= 2, "Escribe tu nombre.");
    revisar("tel", val("tel").replace(/\D/g, "").length >= 8, "Escribe un teléfono de 8 dígitos o más.");
    // El correo es opcional, pero si lo escriben debe estar completo.
    revisar("email", !val("email") || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(val("email")), "Revisa el correo: parece incompleto.");
    revisar("fecha", !!val("fecha") && val("fecha") >= u.hoyISO(), "Elige una fecha desde hoy en adelante.");
    revisar("hentrega", !!val("hentrega"), "Indica a qué hora quieres la entrega.");
    revisar("hevento", !!val("hevento"), "Indica a qué hora empieza el evento.");
    // Las horas son "HH:MM", así que se pueden comparar como texto. Solo se compara si ambas existen.
    if (val("hentrega") && val("hevento")) {
      revisar("hentrega", val("hentrega") < val("hevento"), "La entrega debe ser antes de la hora del evento.");
    }
    revisar("lugar", val("lugar").length >= 3, "Indica dónde será el evento.");

    items.forEach(function (it) {
      if (qty[it.id] > 0 && colores[it.id]) {
        var seleccion = colores[it.id];
        var valido = !!seleccion.valor && (seleccion.valor !== "Otro" || !!seleccion.otro);
        if (!valido) {
          ok = false;
          var campoColor = $(seleccion.valor === "Otro" ? "otro-color-" + it.id : "color-" + it.id);
          if (campoColor) { campoColor.setAttribute("aria-invalid", "true"); if (!primero) { primero = campoColor.id; } }
          setEstado("Selecciona el color de los manteles que agregaste al cotizador.", "bad");
        } else {
          var selColor = $("color-" + it.id), otroColor = $("otro-color-" + it.id);
          if (selColor) { selColor.removeAttribute("aria-invalid"); }
          if (otroColor) { otroColor.removeAttribute("aria-invalid"); }
        }
      }
    });

    if (seleccionados().length === 0) {
      ok = false;
      setEstado("Elige al menos un artículo para cotizar.", "bad");
    } else if (!ok) {
      setEstado("Revisa los campos marcados.", "bad");
    }

    if (primero) {
      var destino = $(primero);
      var fp = destino && destino._flatpickr;
      if (fp) {
        // Fecha y horas: se lleva el campo a la vista sin abrir el selector.
        (fp.altInput || destino).scrollIntoView({ behavior: "smooth", block: "center" });
      } else if (destino) {
        destino.focus();
      }
    }
    return ok;
  }

  // ---------- WhatsApp ----------
  function textoWhatsApp() {
    var c = datosCliente();
    var t = "Hola, quiero cotizar un evento con " + cfg.negocio + ".\n";
    if (c.nombre) { t += "Nombre: " + c.nombre + "\n"; }
    if (c.fecha) { t += "Fecha: " + u.fmtFecha(c.fecha) + "\n"; }
    if (c.horaEntrega) { t += "Hora de entrega: " + u.fmtHora(c.horaEntrega) + "\n"; }
    if (c.horaEvento) { t += "Hora del evento: " + u.fmtHora(c.horaEvento) + "\n"; }
    if (c.lugar) { t += "Lugar: " + c.lugar + "\n"; }
    t += "\n";
    seleccionados().forEach(function (l) {
      t += "• " + l.cant + " × " + l.nombre + (l.color ? " (Color: " + l.color + ")" : "") + " — " + u.money(l.sub) + "\n";
    });
    t += "\nTotal estimado: " + u.money(total());
    return t;
  }

  function enlaceWhatsApp() {
    return "https://wa.me/" + cfg.whatsapp + "?text=" + encodeURIComponent(textoWhatsApp());
  }

  // ---------- Librería de PDF ----------
  var JSPDF_RESPALDO = "https://cdn.jsdelivr.net/npm/jspdf@2.5.2/dist/jspdf.umd.min.js";

  // Si la copia local (assets/vendor) no cargó, intenta una vez desde internet.
  // callback(true) indica que la librería sigue sin estar disponible.
  function asegurarLibreriaPdf(callback) {
    if (window.jspdf && window.jspdf.jsPDF) { callback(false); return; }
    var s = document.createElement("script");
    s.src = JSPDF_RESPALDO;
    s.onload = function () { callback(!(window.jspdf && window.jspdf.jsPDF)); };
    s.onerror = function () { callback(true); };
    document.head.appendChild(s);
  }

  // ---------- Generar cotización: PDF + correo ----------
  function correoConfigurado() {
    return !!(cfg.envioCorreo && cfg.envioCorreo.url);
  }

  // Descarga el PDF y, si hay script configurado, lo envía por correo.
  function generarCotizacion() {
    if (!validar()) { return; }

    asegurarLibreriaPdf(function (faltaLibreria) {
      if (faltaLibreria) {
        setEstado("No se cargó la librería del PDF. Verifica que la carpeta assets/vendor esté junto a index.html o revisa tu conexión.", "bad");
        return;
      }

      var c = datosCliente();
      var lineas = seleccionados();
      var r;
      try {
        r = SM.pdf.generar({ cliente: c, lineas: lineas, total: total() });
        r.doc.save(r.nombre);
      } catch (err) {
        if (window.console) { console.error(err); }
        setEstado("No se pudo crear el PDF (" + (err && err.message ? err.message : err) + ").", "bad");
        return;
      }

      if (!correoConfigurado()) {
        setEstado("Listo. Se descargó " + r.nombre + ".", "ok");
        return;
      }
      enviarPorCorreo(r, c, lineas);
    });
  }

  function enviarPorCorreo(r, c, lineas) {
    var btn = $("btn-pdf");
    var payload;
    try {
      var uri = r.doc.output("datauristring"); // data:application/pdf;...;base64,XXXX
      payload = {
        hp: val("web"),
        nombre: c.nombre,
        email: c.email,
        tel: c.tel,
        tipo: c.tipo,
        fecha: u.fmtFecha(c.fecha),
        horaEntrega: u.fmtHora(c.horaEntrega),
        horaEvento: u.fmtHora(c.horaEvento),
        lugar: c.lugar,
        notas: c.notas,
        total: u.money(total()),
        resumen: lineas.map(function (l) { return l.cant + " × " + l.nombre + (l.color ? " (Color: " + l.color + ")" : "") + " — " + u.money(l.sub); }),
        pdfNombre: r.nombre,
        pdfBase64: uri.slice(uri.indexOf("base64,") + 7)
      };
      // Acta de entrega y devolución: documento interno, solo viaja al correo del negocio.
      // Si falla, la cotización se envía igual.
      try {
        var acta = SM.pdf.generarActa({ cliente: c, lineas: lineas, total: total(), numero: r.numero });
        var uriActa = acta.doc.output("datauristring");
        payload.actaNombre = acta.nombre;
        payload.actaBase64 = uriActa.slice(uriActa.indexOf("base64,") + 7);
      } catch (e2) {
        if (window.console) { console.error(e2); }
      }
    } catch (err) {
      if (window.console) { console.error(err); }
      setEstado("Se descargó " + r.nombre + ", pero no se pudo preparar el correo.", "bad");
      return;
    }

    var ctrl = window.AbortController ? new AbortController() : null;
    var corte = setTimeout(function () { if (ctrl) { ctrl.abort(); } }, 30000);
    btn.disabled = true;
    setEstado("Se descargó " + r.nombre + ". Enviando correo…", "");

    // La petición va al propio sitio (/api/cotizar), que la reenvía a Google por detrás.
    fetch(cfg.envioCorreo.url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: ctrl ? ctrl.signal : undefined
    })
      .then(function (res) { return res.json(); })
      .then(function (res) {
        if (!res || !res.ok) { throw new Error(res && res.error ? res.error : "Respuesta inesperada del servidor."); }
        setEstado(c.email
          ? "Listo. Se descargó " + r.nombre + " y enviamos una copia a " + c.email + ". Si no la ves, revisa la carpeta de spam."
          : "Listo. Se descargó " + r.nombre + " y enviamos tu cotización a " + cfg.negocio + ".", "ok");
      })
      .catch(function (err) {
        var motivo = err && err.name === "AbortError" ? "tardó demasiado" : (err && err.message ? err.message : err);
        setEstado("Se descargó " + r.nombre + ", pero no se pudo enviar el correo (" + motivo + "). Escríbenos por WhatsApp para confirmar.", "bad");
      })
      .then(function () { clearTimeout(corte); btn.disabled = false; });
  }

  // ---------- Eventos ----------
  function enlazarEventos() {
    $("btn-pdf").addEventListener("click", generarCotizacion);

    $("btn-wa").addEventListener("click", function (e) {
      if (!validar()) { e.preventDefault(); return; }
      this.href = enlaceWhatsApp();
      setEstado("Se abrirá WhatsApp con el resumen. Adjunta el PDF que descargaste.", "ok");
    });

    ["nombre", "tel", "fecha", "hentrega", "hevento", "lugar"].forEach(function (id) {
      var campo = $(id);
      if (campo) {
        campo.addEventListener("input", function () { $("btn-wa").href = enlaceWhatsApp(); });
      }
    });
  }

  // ---------- Inicio ----------
  function iniciar() {
    if ($("fecha")) {
      $("fecha").min = u.hoyISO();
      // Si el calendario no carga (sin internet o CDN bloqueado), queda el campo de texto normal.
      if (window.flatpickr) flatpickr("#fecha", {
        locale: "es",
        altInput: true,
        altFormat: "d/m/Y",
        dateFormat: "Y-m-d",
        minDate: u.hoyISO(),
        // En celular se usa este mismo calendario en vez del selector nativo: así el campo se ve igual
        // que los demás (con "dd/mm/aaaa" visible) y no se sale de su columna en iPhone.
        disableMobile: true
      });
    }
    crearRelojes();
    $("contact").textContent = cfg.telefonoVisible + (cfg.correoVisible ? " · " + cfg.correoVisible : "");
    // El correo y su botón solo aparecen cuando config.js tiene la URL del Apps Script.
    $("campo-email").hidden = !correoConfigurado();
    crearCatalogo();
    enlazarEventos();
    render();
  }

  iniciar();
})(window.SunMoon);