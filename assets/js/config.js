/**
 * Configuración del negocio y catálogo de precios.
 * Es el único archivo que hay que editar para cambiar datos de contacto o precios.
 */
window.SunMoon = window.SunMoon || {};

window.SunMoon.config = {
  negocio: "Sun&Moon Eventos",

  // Número con código de país, sin "+" ni espacios (ejemplo: 502 + 8 dígitos).
  whatsapp: "50259344700",

  // Se muestran en el pie de la página y en el PDF.
  telefonoVisible: "+502 5934 4700",
  correoVisible: "sun.moon.eventosgt@gmail.com",

  // Envío de la cotización por correo. La página llama a /api/cotizar (el Worker de Cloudflare de este
  // mismo sitio, ver worker/index.js), que lo reenvía a Google Apps Script (apps-script/Code.gs).
  // La URL del script ya no va aquí: se guarda como secreto APPS_SCRIPT_URL en Cloudflare.
  // Si dejas la url vacía, no se envía correo y el campo de correo no aparece (solo se descarga el PDF).
  envioCorreo: {
    url: "/api/cotizar"
  },

  validezDias: 7,
  moneda: "Q",

  // Precios fijos por unidad, por evento.
  grupos: [
    {
      id: "sillas",
      titulo: "Sillas",
      nota: "Precio por silla, por evento",
      items: [
        { id: "s1", nombre: "Silla plástica blanca", desc: "Apilable, ideal para cualquier evento", precio: 4 }
      ]
    },
    {
      id: "mesas",
      titulo: "Mesas",
      nota: "Precio por mesa, por evento",
      items: [
        { id: "m1", nombre: "Mesa rectangular", desc: "Para 8 personas", precio: 35 },
        { id: "m2", nombre: "Mesa redonda", desc: "Para 10 personas", precio: 75 },     
        { id: "m4", nombre: "Mesa para niños", desc: "Para 8 niños", precio: 35 },
        { id: "m3", nombre: "Mesa alta de cóctel", desc: "Para recepciones", precio: 50 }
      ]
    },
    {
      id: "toldos",
      titulo: "Toldos",
      nota: "Precio por toldo, por evento",
      items: [
        { id: "t1", nombre: "Toldo 3 × 2 m", desc: "Cubre 1 o 2 mesas", precio: 130 },
        { id: "t2", nombre: "Toldo 3 × 3 m", desc: "Cubre 2 o 3 mesas", precio: 165 },
        { id: "t3", nombre: "Toldo 6 × 3 m", desc: "Cubre 3 o 4 mesas", precio: 300 }
      ]
    },
    {
      id: "otros",
      titulo: "Otros artículos",
      nota: "Precio por unidad, por evento",
      items: [
        { id: "o1", nombre: "Mantel Rectangular", desc: "Para mesa rectangular", precio: 15, colores: ["Blanco", "Negro", "Rojo", "Azul", "Rosado", "Dorado", "Plateado", "Verde", "Beige", "Otro"] },
        { id: "o2", nombre: "Mantel Redondo", desc: "Para mesa redonda", precio: 75, colores: ["Blanco", "Negro", "Rojo", "Azul", "Rosado", "Dorado", "Plateado", "Verde", "Beige", "Otro"] },
        { id: "o3", nombre: "Mantel Coctelero", desc: "Para mesa coctelera", precio: 50, colores: ["Blanco", "Negro", "Rojo", "Azul", "Rosado", "Dorado", "Plateado", "Verde", "Beige", "Otro"] }
      ]
    }
  ]
};
