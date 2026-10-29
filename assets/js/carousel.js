/**
 * Carrusel "Conoce nuestro mobiliario".
 * Las fotos y los artículos salen de config.galeria; el nombre, la descripción y el precio se leen
 * del catálogo, así que no hay que repetirlos. El deslizamiento es nativo (scroll-snap), por eso
 * funciona con el dedo, el trackpad y el teclado; este archivo solo agrega botones, puntos y avance automático.
 */
(function (SM) {
  "use strict";

  var cfg = SM.config, u = SM.utils;
  var seccion = document.getElementById("galeria");
  var track = document.getElementById("car-track");
  var puntos = document.getElementById("car-dots");
  var btnPrev = document.getElementById("car-prev");
  var btnNext = document.getElementById("car-next");
  var btnPausa = document.getElementById("car-pause");

  if (!seccion || !track) { return; }
  if (!Array.isArray(cfg.galeria) || !cfg.galeria.length) { seccion.hidden = true; return; }

  var INTERVALO = 5500;
  var reducido = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  var ICONO_PAUSA = "<svg width=\"14\" height=\"14\" viewBox=\"0 0 14 14\" aria-hidden=\"true\"><rect x=\"2\" y=\"1\" width=\"3.5\" height=\"12\" rx=\"1\" fill=\"currentColor\"/><rect x=\"8.5\" y=\"1\" width=\"3.5\" height=\"12\" rx=\"1\" fill=\"currentColor\"/></svg>";
  var ICONO_PLAY = "<svg width=\"14\" height=\"14\" viewBox=\"0 0 14 14\" aria-hidden=\"true\"><path d=\"M3 1.5v11l9-5.5z\" fill=\"currentColor\"/></svg>";

  var timer = null;
  var pausadoPorUsuario = false;
  var visible = true;
  var cuadro = 0;

  function el(tag, clase, texto) {
    var n = document.createElement(tag);
    if (clase) { n.className = clase; }
    if (texto) { n.textContent = texto; }
    return n;
  }

  function buscar(id) {
    for (var i = 0; i < cfg.grupos.length; i++) {
      for (var j = 0; j < cfg.grupos[i].items.length; j++) {
        if (cfg.grupos[i].items[j].id === id) { return { item: cfg.grupos[i].items[j], grupo: cfg.grupos[i] }; }
      }
    }
    return null;
  }

  // ---------- Diapositivas ----------
  var slides = [];
  cfg.galeria.forEach(function (f) {
    var hit = buscar(f.itemId);
    if (!hit) { return; }

    var s = el("article", "slide");
    s.setAttribute("role", "group");
    s.setAttribute("aria-roledescription", "diapositiva");

    var fig = el("div", "slide-img");
    var img = document.createElement("img");
    img.src = f.foto;
    img.alt = f.alt || hit.item.nombre;
    img.width = 1200;
    img.height = 900;
    img.decoding = "async";
    fig.appendChild(img);
    fig.appendChild(el("span", "slide-tag", hit.grupo.titulo));

    var cuerpo = el("div", "slide-body");
    cuerpo.appendChild(el("h3", "", hit.item.nombre));
    cuerpo.appendChild(el("p", "slide-desc", hit.item.desc));

    var pie = el("div", "slide-foot");
    var precio = el("div", "slide-price", u.money(hit.item.precio));
    precio.appendChild(el("small", "", " por evento"));
    var cta = el("button", "slide-cta", "Cotizar este artículo");
    cta.type = "button";
    cta.addEventListener("click", function () {
      if (SM.irAlArticulo) { SM.irAlArticulo(f.itemId); } else { location.hash = "#cotizador"; }
    });
    pie.appendChild(precio);
    pie.appendChild(cta);
    cuerpo.appendChild(pie);

    s.appendChild(fig);
    s.appendChild(cuerpo);
    track.appendChild(s);
    slides.push(s);
  });

  if (!slides.length) { seccion.hidden = true; return; }
  slides.forEach(function (s, i) { s.setAttribute("aria-label", (i + 1) + " de " + slides.length); });

  // ---------- Posición ----------
  function maximo() { return Math.max(0, track.scrollWidth - track.clientWidth); }
  function paso() { return slides.length > 1 ? slides[1].offsetLeft - slides[0].offsetLeft : track.clientWidth; }
  // "Páginas": con 2 fotos a la vez en pantalla ancha hay una menos que fotos.
  function paginas() { return maximo() <= 2 ? 1 : Math.round(maximo() / paso()) + 1; }
  function paginaActual() {
    if (track.scrollLeft >= maximo() - 2) { return paginas() - 1; }
    return Math.min(paginas() - 1, Math.round(track.scrollLeft / paso()));
  }
  function ir(p) {
    var destino = Math.max(0, Math.min(p, paginas() - 1));
    track.scrollTo({ left: Math.min(destino * paso(), maximo()), behavior: reducido ? "auto" : "smooth" });
  }

  function crearPuntos() {
    puntos.innerHTML = "";
    var n = paginas();
    puntos.hidden = n <= 1;
    for (var i = 0; i < n; i++) {
      (function (idx) {
        var b = el("button", "car-dot");
        b.type = "button";
        b.setAttribute("aria-label", "Ir a la página " + (idx + 1) + " de " + n);
        b.addEventListener("click", function () { ir(idx); });
        puntos.appendChild(b);
      })(i);
    }
    actualizar();
  }

  function actualizar() {
    var p = paginaActual(), n = paginas();
    var dots = puntos.children;
    for (var i = 0; i < dots.length; i++) {
      if (i === p) { dots[i].setAttribute("aria-current", "true"); } else { dots[i].removeAttribute("aria-current"); }
    }
    btnPrev.disabled = p <= 0;
    btnNext.disabled = p >= n - 1;
  }

  // ---------- Avance automático ----------
  function avanzar() {
    var p = paginaActual();
    ir(p >= paginas() - 1 ? 0 : p + 1);
  }
  function detener() { clearInterval(timer); timer = null; }
  function arrancar() {
    detener();
    if (reducido || pausadoPorUsuario || !visible || document.hidden || paginas() <= 1) { return; }
    timer = setInterval(avanzar, INTERVALO);
  }

  function pintarPausa() {
    btnPausa.innerHTML = pausadoPorUsuario ? ICONO_PLAY : ICONO_PAUSA;
    btnPausa.setAttribute("aria-label", pausadoPorUsuario ? "Reanudar el avance automático" : "Pausar el avance automático");
    track.setAttribute("aria-live", pausadoPorUsuario ? "polite" : "off");
  }

  // ---------- Eventos ----------
  btnPrev.addEventListener("click", function () { ir(paginaActual() - 1); });
  btnNext.addEventListener("click", function () { ir(paginaActual() + 1); });
  btnPausa.addEventListener("click", function () {
    pausadoPorUsuario = !pausadoPorUsuario;
    pintarPausa();
    arrancar();
  });

  track.addEventListener("scroll", function () {
    if (cuadro) { return; }
    cuadro = requestAnimationFrame(function () { cuadro = 0; actualizar(); });
  }, { passive: true });

  // Con el mouse, el dedo o el teclado encima, el carrusel no se mueve solo.
  seccion.addEventListener("mouseenter", detener);
  seccion.addEventListener("mouseleave", arrancar);
  seccion.addEventListener("focusin", detener);
  seccion.addEventListener("focusout", arrancar);
  seccion.addEventListener("touchstart", detener, { passive: true });
  seccion.addEventListener("touchend", function () { setTimeout(arrancar, 6000); }, { passive: true });
  document.addEventListener("visibilitychange", arrancar);

  if (window.IntersectionObserver) {
    new IntersectionObserver(function (entradas) {
      visible = entradas[0].isIntersecting;
      arrancar();
    }, { threshold: 0.25 }).observe(seccion);
  }

  var redim = null;
  window.addEventListener("resize", function () {
    clearTimeout(redim);
    redim = setTimeout(function () { crearPuntos(); arrancar(); }, 150);
  });

  // ---------- Inicio ----------
  if (reducido) { btnPausa.hidden = true; }
  pintarPausa();
  crearPuntos();
  arrancar();
})(window.SunMoon);
