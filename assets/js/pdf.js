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

    // ---- Cliente y evento (dos columnas)
    titulo("CLIENTE Y EVENTO");
    y += 0.5;
    var filasCliente = [
      ["Cliente", cliente.nombre],
      ["Teléfono", cliente.tel],
      ["Correo", cliente.email],
      ["Evento", cliente.tipo],
      ["Fecha", u.fmtFecha(cliente.fecha)],
      ["Lugar", cliente.lugar],
      ["Hora de entrega", cliente.horaEntrega ? u.fmtHora(cliente.horaEntrega) : ""],
      ["Hora del evento", cliente.horaEvento ? u.fmtHora(cliente.horaEvento) : ""]
    ];

    var anchoTotalCliente = W - 2 * M;
    var separacionCliente = 8;
    var anchoColCliente = (anchoTotalCliente - separacionCliente) / 2;
    var xColCliente = [M, M + anchoColCliente + separacionCliente];
    var anchoEtiqueta = 32;
    var altoLineaCliente = 4.6;
    doc.setFontSize(9.5);

    // Cada fila visual contiene dos datos. Si algún dato está vacío, se omite sin
    // desplazar el resto de las etiquetas ni afectar los datos usados por el PDF.
    var paresCliente = [
      [filasCliente[0], filasCliente[1]],
      [filasCliente[2], filasCliente[3]],
      [filasCliente[4], filasCliente[5]],
      [filasCliente[6], filasCliente[7]]
    ];

    paresCliente.forEach(function (par) {
      var alturas = [0, 0];
      par.forEach(function (f, indice) {
        if (!f || !f[1]) { return; }
        var anchoValor = anchoColCliente - anchoEtiqueta - 3;
        doc.setFont("helvetica", "normal");
        var texto = doc.splitTextToSize(String(f[1]), anchoValor);
        alturas[indice] = texto.length;
        doc.setFont("helvetica", "bold");
        color("setTextColor", COLOR.gray);
        doc.text(f[0], xColCliente[indice], y);
        doc.setFont("helvetica", "normal");
        color("setTextColor", COLOR.ink);
        doc.text(texto, xColCliente[indice] + anchoEtiqueta, y);
      });
      y += altoLineaCliente * Math.max(1, alturas[0], alturas[1]) + 1.2;
    });
    y += 8;

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
      if (l.color) {
        doc.setFont("helvetica", "normal"); doc.setFontSize(8);
        color("setTextColor", COLOR.gray);
        doc.text("Color: " + l.color, M + 2, y + 4);
      }
      doc.setFont("helvetica", "normal"); doc.setFontSize(10);
      color("setTextColor", COLOR.ink);
      doc.text(String(l.cant), 118, y, { align: "right" });
      doc.text(u.money(l.precio), 152, y, { align: "right" });
      doc.text(u.money(l.sub), W - M - 2, y, { align: "right" });
      color("setDrawColor", COLOR.line);
      doc.line(M, y + (l.color ? 6.4 : 2.4), W - M, y + (l.color ? 6.4 : 2.4));
      y += l.color ? 11 : 7;
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
      "Los costos especificados en esta cotización ya incluyen impuestos y envío al lugar de entrega.",
      "Se debe cancelar el 50% de la totalidad del evento por medio de transferencia bancaria, para reservar su mobiliario.",
      "Si se presenta algún daño (quemadura, quiebre, rajadura u otros) en el mobiliario y equipo entregado se cobrará 10 veces el valor del alquiler."
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

    return { doc: doc, nombre: "Cotizacion-" + numero + ".pdf", numero: numero };
  }

  /**
   * Acta de entrega y devolución de mobiliario (documento interno para imprimir y firmar).
   * Mismo estilo que la cotización. Recibe los mismos datos que generar() más `numero`
   * (el de la cotización, para poder relacionar ambos documentos).
   * Devuelve { doc, nombre }.
   */
  function generarActa(datos) {
    var JsPDF = window.jspdf && window.jspdf.jsPDF;
    if (!JsPDF) { throw new Error("jsPDF no está cargado"); }

    var cfg = SM.config, u = SM.utils;
    var cliente = datos.cliente, lineas = datos.lineas;
    var numero = datos.numero || u.numCotizacion();
    var doc = new JsPDF({ unit: "mm", format: "letter" });
    var W = PAGE.w, H = PAGE.h, M = PAGE.margin, y = 0;

    function color(fn, rgb) { doc[fn].apply(doc, rgb); }

    function encabezado() {
      color("setFillColor", COLOR.ink);
      doc.rect(0, 0, W, 38, "F");
      color("setFillColor", COLOR.sunBright);
      doc.rect(0, 38, W, 1.2, "F");

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
      doc.text("ENTREGA Y DEVOLUCIÓN", W - M, 15, { align: "right" });
      doc.setFont("helvetica", "normal"); doc.setFontSize(9.5);
      color("setTextColor", COLOR.onDark);
      doc.text("Cotización No. " + numero, W - M, 21, { align: "right" });
      y = 50;
    }

    // Columnas de la tabla (x de inicio de cada una; los números van alineados a la derecha).
    var X = { no: M + 2, desc: M + 11, color: 104, cant: 138, pu: 160, pt: W - M - 2 };
    function encabezadoTabla() {
      color("setFillColor", COLOR.headBg);
      doc.rect(M, y - 5, W - 2 * M, 8, "F");
      doc.setFont("helvetica", "bold"); doc.setFontSize(9.5);
      color("setTextColor", COLOR.ink);
      doc.text("No.", X.no, y);
      doc.text("Descripción", X.desc, y);
      doc.text("Color", X.color, y);
      doc.text("Cant.", X.cant, y, { align: "right" });
      doc.text("P. unitario", X.pu, y, { align: "right" });
      doc.text("P. total", X.pt, y, { align: "right" });
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

    doc.setFont("helvetica", "bold"); doc.setFontSize(13);
    color("setTextColor", COLOR.ink);
    doc.text("Acta de entrega y devolución de mobiliario", M, y);
    y += 8;
    doc.setFont("helvetica", "normal"); doc.setFontSize(10);
    color("setTextColor", COLOR.gray);
    doc.text("Con la presente acta se hace entrega del siguiente mobiliario y equipo en alquiler:", M, y);
    y += 9;

    // ---- Cliente y evento (dos columnas, igual que la cotización; sin correo: es un documento interno)
    titulo("CLIENTE Y EVENTO");
    y += 0.5;
    var pares = [
      [filasCliente[0], filasCliente[1]],
      [filasCliente[2], filasCliente[3]],
      [filasCliente[4], filasCliente[5]],
      [filasCliente[6], filasCliente[7]]
    ];
    var sep = 8, anchoCol = (W - 2 * M - sep) / 2, xCol = [M, M + anchoCol + sep], anchoEtiq = 32;
    doc.setFontSize(9.5);
    pares.forEach(function (par) {
      var alturas = [0, 0];
      par.forEach(function (f, k) {
        if (!f[1]) { return; }
        doc.setFont("helvetica", "normal");
        var texto = doc.splitTextToSize(String(f[1]), anchoCol - anchoEtiq - 3);
        alturas[k] = texto.length;
        doc.setFont("helvetica", "bold"); color("setTextColor", COLOR.gray);
        doc.text(f[0], xCol[k], y);
        doc.setFont("helvetica", "normal"); color("setTextColor", COLOR.ink);
        doc.text(texto, xCol[k] + anchoEtiq, y);
      });
      y += 4.6 * Math.max(1, alturas[0], alturas[1]) + 1.2;
    });
    y += 8;

    // ---- Tabla: solo los artículos pedidos en la cotización
    encabezadoTabla();
    var total = 0, n = lineas.length;
    for (var i = 0; i < n; i++) {
      nuevaPaginaSiHaceFalta(40, true);
      var l = lineas[i];
      doc.setFont("helvetica", "normal"); doc.setFontSize(10);
      color("setTextColor", COLOR.ink);
      doc.text(String(i + 1), X.no, y);
      total += l.sub;
      doc.text(doc.splitTextToSize(l.nombre, X.color - X.desc - 3)[0], X.desc, y);
      if (l.color) { doc.text(doc.splitTextToSize(String(l.color), X.cant - X.color - 12)[0], X.color, y); }
      doc.text(String(l.cant), X.cant, y, { align: "right" });
      doc.text(u.money(l.precio), X.pu, y, { align: "right" });
      doc.text(u.money(l.sub), X.pt, y, { align: "right" });
      color("setDrawColor", COLOR.line);
      doc.line(M, y + 2.4, W - M, y + 2.4);
      y += 7;
    }

    // ---- Total
    nuevaPaginaSiHaceFalta(40, false);
    y += 6;
    color("setFillColor", COLOR.ink);
    doc.roundedRect(W - M - 78, y - 6, 78, 14, 2, 2, "F");
    doc.setFont("helvetica", "normal"); doc.setFontSize(10);
    color("setTextColor", COLOR.onDark);
    doc.text("TOTAL", W - M - 74, y + 3);
    doc.setFont("helvetica", "bold"); doc.setFontSize(15);
    color("setTextColor", COLOR.sunLight);
    doc.text(u.money(datos.total != null ? datos.total : total), W - M - 4, y + 3.6, { align: "right" });
    y += 15;

    // ---- Notas
    nuevaPaginaSiHaceFalta(68, false);
    titulo("NOTAS");
    doc.setFont("helvetica", "normal"); doc.setFontSize(9);
    color("setTextColor", COLOR.gray);
    var nota = doc.splitTextToSize("• Si se presenta algún daño (quemadura, quiebre, rajadura u otros) en el mobiliario y equipo entregado se cobrará 10 veces el valor del alquiler.", W - 2 * M);
    doc.text(nota, M, y);
    y += 4.6 * nota.length + 12;

    // ---- Firmas: recibido (entrega) y devolución
    function bloqueFirmas(sufijo) {
      var ancho = (W - 2 * M - 2 * 8) / 3;
      ["Nombre", "Firma", "DPI"].forEach(function (t, k) {
        var x = M + k * (ancho + 8);
        color("setDrawColor", COLOR.ink);
        doc.line(x, y, x + ancho, y);
        doc.setFont("helvetica", "normal"); doc.setFontSize(9);
        color("setTextColor", COLOR.gray);
        doc.text(t + " " + sufijo, x + ancho / 2, y + 5, { align: "center" });
      });
      y += 19;
    }
    bloqueFirmas("recibido");
    bloqueFirmas("devolución");

    // ---- Pie de página
    var paginas = doc.getNumberOfPages();
    var contacto = cfg.negocio + " · " + cfg.telefonoVisible + (cfg.correoVisible ? " · " + cfg.correoVisible : "");
    for (var p = 1; p <= paginas; p++) {
      doc.setPage(p);
      color("setDrawColor", COLOR.line);
      doc.line(M, H - 16, W - M, H - 16);
      doc.setFont("helvetica", "normal"); doc.setFontSize(8.5);
      color("setTextColor", COLOR.gray);
      doc.text(contacto, M, H - 10);
      doc.text("Página " + p + " de " + paginas, W - M, H - 10, { align: "right" });
    }

    return { doc: doc, nombre: "Entrega-Devolucion-" + numero + ".pdf" };
  }

  SM.pdf = { generar: generar, generarActa: generarActa };
})(window.SunMoon);