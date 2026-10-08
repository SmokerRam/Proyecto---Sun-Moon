/**
 * Generación del PDF de cotización con jsPDF (assets/vendor/jspdf.umd.min.js).
 *
 * SunMoon.pdf.generar(datos) recibe:
 *   {
 *     cliente: { nombre, tel, email, tipo, fecha (AAAA-MM-DD), horaEntrega (HH:MM), horaEvento (HH:MM), lugar, notas },
 *     lineas:  [{ grupo, nombre, cant, precio, sub }],
 *     total:   number
 *   }
 * y devuelve { doc, nombre } donde `doc` es la instancia de jsPDF.
 */
(function (SM) {
  "use strict";

  // Paleta oficial del Flyer Promo: azul marino #02033C, lavanda #807F9E y degradado del logo.
  var COLOR = {
    ink:  [2, 3, 60],
    sun:  [218, 116, 42],       // #DA742A, naranja profundo (texto sobre blanco)
    sunBright: [255, 168, 42],  // #FFA82A
    sunLight: [255, 204, 34],   // #FFCC22
    moon: [2, 3, 60],           // títulos de sección en azul marino
    gray: [74, 75, 120],
    line: [212, 212, 226],
    headBg: [236, 236, 244],
    onDark: [214, 214, 234]
  };

  var PAGE = { w: 215.9, h: 279.4, margin: 18 }; // carta, en mm

  function generar(datos) {
    var JsPDF = window.jspdf && window.jspdf.jsPDF;
    if (!JsPDF) { throw new Error("jsPDF no está cargado"); }

    var cfg = SM.config, u = SM.utils;
    var cliente = datos.cliente, lineas = datos.lineas;
    var doc = new JsPDF({ unit: "mm", format: "letter" });
    var W = PAGE.w, H = PAGE.h, M = PAGE.margin, y = 0;

    var numero = u.numCotizacion();
    var ahora = new Date();
    var emitida = u.fmtFechaCorta(ahora);
    var vence = u.fmtFechaCorta(new Date(ahora.getTime() + cfg.validezDias * 86400000));

    function color(fn, rgb) { doc[fn].apply(doc, rgb); }

    function encabezado() {
      color("setFillColor", COLOR.ink);
      doc.rect(0, 0, W, 38, "F");
      color("setFillColor", COLOR.sunBright);
      doc.rect(0, 38, W, 1.2, "F");

      // Logo oficial (PNG incrustado en assets/js/logo-data.js)
      var logo = SM.logoPdf, textoX = M;
      if (logo && logo.src) {
        var lh = 32, lw = lh * logo.w / logo.h;
        doc.addImage(logo.src, "PNG", M, 3, lw, lh);
        textoX = M + lw + 6;
      }

      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold"); doc.setFontSize(16);
      doc.text(cfg.negocio, textoX, 17);

      doc.setFont("helvetica", "normal"); doc.setFontSize(9.5);
      color("setTextColor", COLOR.onDark);
      doc.text("Alquiler de sillas, mesas, toldos y más", textoX, 23);

      doc.setFont("helvetica", "bold"); doc.setFontSize(11);
      color("setTextColor", COLOR.sunLight);
      doc.text("COTIZACIÓN", W - M, 15, { align: "right" });

      doc.setFont("helvetica", "normal"); doc.setFontSize(9.5);
      color("setTextColor", COLOR.onDark);
      doc.text("No. " + numero, W - M, 21, { align: "right" });
      doc.text("Emitida: " + emitida, W - M, 26, { align: "right" });

      y = 50;
    }

    function encabezadoTabla() {
      color("setFillColor", COLOR.headBg);
      doc.rect(M, y - 5, W - 2 * M, 8, "F");
      doc.setFont("helvetica", "bold"); doc.setFontSize(9.5);
      color("setTextColor", COLOR.ink);
      doc.text("Artículo", M + 2, y);
      doc.text("Cant.", 118, y, { align: "right" });
      doc.text("Precio", 152, y, { align: "right" });
      doc.text("Subtotal", W - M - 2, y, { align: "right" });
      y += 8;
    }

    function titulo(texto) {
      doc.setFont("helvetica", "bold"); doc.setFontSize(10);
      color("setTextColor", COLOR.moon);
      doc.text(texto, M, y);
      y += 5.5;
    }

    function nuevaPaginaSiHaceFalta(limite, conTabla) {
      if (y > H - limite) {
        doc.addPage();
        encabezado();
        if (conTabla) { encabezadoTabla(); }
      }
    }

    encabezado();

    // ---- Cliente y evento
    titulo("CLIENTE Y EVENTO");
    y += 0.5;
    var filas = [
      ["Cliente", cliente.nombre],
      ["Teléfono", cliente.tel],
      ["Correo", cliente.email],
      ["Evento", cliente.tipo],
      ["Fecha", u.fmtFecha(cliente.fecha)],
      ["Hora de entrega", cliente.horaEntrega ? u.fmtHora(cliente.horaEntrega) : ""],
      ["Hora del evento", cliente.horaEvento ? u.fmtHora(cliente.horaEvento) : ""],
      ["Lugar", cliente.lugar]
    ].filter(function (f) { return f[1]; }); // omite las filas de campos que no existen o están vacíos
    doc.setFontSize(10);
    filas.forEach(function (f) {
      doc.setFont("helvetica", "bold"); color("setTextColor", COLOR.gray);
      doc.text(f[0], M, y);
      doc.setFont("helvetica", "normal"); color("setTextColor", COLOR.ink);
      var texto = doc.splitTextToSize(f[1], W - 2 * M - 34);
      doc.text(texto, M + 34, y);
      y += 5.5 * texto.length;
    });
    y += 6;

    // ---- Tabla de artículos
    encabezadoTabla();
    var grupoActual = "";
    lineas.forEach(function (l) {
      nuevaPaginaSiHaceFalta(60, true);
      if (l.grupo !== grupoActual) {
        grupoActual = l.grupo;
        doc.setFont("helvetica", "bold"); doc.setFontSize(9);
        color("setTextColor", COLOR.sun);
        doc.text(l.grupo.toUpperCase(), M + 2, y);
        y += 5.5;
      }
      doc.setFont("helvetica", "normal"); doc.setFontSize(10);
      color("setTextColor", COLOR.ink);
      doc.text(l.nombre, M + 2, y);
      doc.text(String(l.cant), 118, y, { align: "right" });
      doc.text(u.money(l.precio), 152, y, { align: "right" });
      doc.text(u.money(l.sub), W - M - 2, y, { align: "right" });
      color("setDrawColor", COLOR.line);
      doc.line(M, y + 2.4, W - M, y + 2.4);
      y += 7;
    });

    // ---- Total
    nuevaPaginaSiHaceFalta(60, false);
    y += 4;
    color("setFillColor", COLOR.ink);
    doc.roundedRect(W - M - 78, y - 6, 78, 14, 2, 2, "F");
    doc.setFont("helvetica", "normal"); doc.setFontSize(10);
    color("setTextColor", COLOR.onDark);
    doc.text("TOTAL", W - M - 74, y + 3);
    doc.setFont("helvetica", "bold"); doc.setFontSize(15);
    color("setTextColor", COLOR.sunLight);
    doc.text(u.money(datos.total), W - M - 4, y + 3.6, { align: "right" });
    y += 18;

    // ---- Notas del cliente
    if (cliente.notas) {
      titulo("NOTAS DEL CLIENTE");
      doc.setFont("helvetica", "normal"); doc.setFontSize(10);
      color("setTextColor", COLOR.ink);
      var notas = doc.splitTextToSize(cliente.notas, W - 2 * M);
      doc.text(notas, M, y);
      y += 5 * notas.length + 4;
    }

    // ---- Condiciones
    nuevaPaginaSiHaceFalta(48, false);
    titulo("CONDICIONES");
    doc.setFont("helvetica", "normal"); doc.setFontSize(9);
    color("setTextColor", COLOR.gray);
    [
      "Precios por evento, en quetzales. No incluyen flete de entrega y recogida.",
      "Cotización válida hasta el " + vence + ". Sujeta a disponibilidad en la fecha del evento.",
      "El mobiliario se reserva al confirmar con " + cfg.negocio + "."
    ].forEach(function (t) {
      var s = doc.splitTextToSize("• " + t, W - 2 * M);
      doc.text(s, M, y);
      y += 4.6 * s.length;
    });

    // ---- Pie de página
    var paginas = doc.getNumberOfPages();
    var contacto = cfg.negocio + " · " + cfg.telefonoVisible + (cfg.correoVisible ? " · " + cfg.correoVisible : "");
    for (var i = 1; i <= paginas; i++) {
      doc.setPage(i);
      color("setDrawColor", COLOR.line);
      doc.line(M, H - 16, W - M, H - 16);
      doc.setFont("helvetica", "normal"); doc.setFontSize(8.5);
      color("setTextColor", COLOR.gray);
      doc.text(contacto, M, H - 10);
      doc.text("Página " + i + " de " + paginas, W - M, H - 10, { align: "right" });
    }

    return { doc: doc, nombre: "Cotizacion-" + numero + ".pdf" };
  }

  SM.pdf = { generar: generar };
})(window.SunMoon);