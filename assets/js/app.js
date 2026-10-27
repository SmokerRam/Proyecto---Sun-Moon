/**
 * Lógica de la página: catálogo, cantidades, formulario, validación,
 * botón de PDF y enlace de WhatsApp.
 */
(function (SM) {
  "use strict";

  var cfg = SM.config, u = SM.utils;
  var qty = {};
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
      sec.innerHTML = "<h2>" + g.titulo + " <small>" + g.nota + "</small></h2><div class=\"items\"></div>";
      var caja = sec.querySelector(".items");

      g.items.forEach(function (it) {
        var fila = document.createElement("div");
        fila.className = "item";
        fila.id = "row-" + it.id;
        fila.innerHTML =
          "<div>" +
            "<div class=\"nm\">" + it.nombre + "</div>" +
            "<div class=\"ds\">" + it.desc + "</div>" +
            "<div class=\"pr\"><strong>" + u.money(it.precio) + "</strong> c/u · subtotal " +
              "<span id=\"sub-" + it.id + "\">" + u.money(0) + "</span></div>" +
          "</div>" +
          "<div class=\"stepper\" role=\"group\" aria-label=\"Cantidad de " + it.nombre + "\">" +
            "<button type=\"button\" data-id=\"" + it.id + "\" data-d=\"-1\" aria-label=\"Quitar uno\">−</button>" +
            "<input id=\"q-" + it.id + "\" type=\"number\" min=\"0\" max=\"9999\" inputmode=\"numeric\" value=\"0\" aria-label=\"Cantidad\">" +
            "<button type=\"button\" data-id=\"" + it.id + "\" data-d=\"1\" aria-label=\"Agregar uno\">+</button>" +
          "</div>";
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
    });

    var ul = $("lines");
    ul.innerHTML = sel.length ? "" : "<li class=\"empty\">Aún no has elegido artículos.</li>";
    sel.forEach(function (l) {
      var li = document.createElement("li");
      li.innerHTML = "<span>" + l.cant + " × " + l.nombre + "</span><span>" + u.money(l.sub) + "</span>";
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

    if (seleccionados().length === 0) {
      ok = false;
      setEstado("Elige al menos un artículo para cotizar.", "bad");
    } else if (!ok) {
      setEstado("Revisa los campos marcados.", "bad");
    }

    if (primero) { $(primero).focus(); }
    return ok;
  }

  // ---------- WhatsApp ----------
  function textoWhatsApp() {
    var c = datosCliente();
    var t = "Hola, quiero cotizar un evento con " + cfg.negocio + ".\n";
    if (c.nombre) { t += "Nombre: " + c.nombre + "\n"; }
    if (c.fecha)  { t += "Fecha: " + u.fmtFecha(c.fecha) + "\n"; }
    if (c.horaEntrega) { t += "Hora de entrega: " + u.fmtHora(c.horaEntrega) + "\n"; }
    if (c.horaEvento)  { t += "Hora del evento: " + u.fmtHora(c.horaEvento) + "\n"; }
    if (c.lugar)  { t += "Lugar: " + c.lugar + "\n"; }
    t += "\n";
    seleccionados().forEach(function (l) {
      t += "• " + l.cant + " × " + l.nombre + " — " + u.money(l.sub) + "\n";
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
        resumen: lineas.map(function (l) { return l.cant + " × " + l.nombre + " — " + u.money(l.sub); }),
        pdfNombre: r.nombre,
        pdfBase64: uri.slice(uri.indexOf("base64,") + 7)
      };
    } catch (err) {
      if (window.console) { console.error(err); }
      setEstado("Se descargó " + r.nombre + ", pero no se pudo preparar el correo.", "bad");
      return;
    }

    var ctrl = window.AbortController ? new AbortController() : null;
    var corte = setTimeout(function () { if (ctrl) { ctrl.abort(); } }, 30000);
    btn.disabled = true;
    setEstado("Se descargó " + r.nombre + ". Enviando correo…", "");

    // text/plain evita la petición previa (preflight) que Apps Script no responde.
    fetch(cfg.envioCorreo.url, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
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
    if ($("fecha")) { $("fecha").min = u.hoyISO(); }
    $("contact").textContent = cfg.telefonoVisible + (cfg.correoVisible ? " · " + cfg.correoVisible : "");
    // El correo y su botón solo aparecen cuando config.js tiene la URL del Apps Script.
    $("campo-email").hidden = !correoConfigurado();
    crearCatalogo();
    enlazarEventos();
    render();
  }

  iniciar();
})(window.SunMoon);