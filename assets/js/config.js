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

  // Carrusel "Conoce nuestro mobiliario". Cada foto apunta a un artículo del catálogo (itemId):
  // el nombre, la descripción y el precio salen de ahí, así que solo hay que mantener los precios abajo.
  // Las fotos viven en assets/img/productos/ (formato 4:3, fondo blanco, de preferencia .webp).
  // Para agregar una, suma una línea; para ocultar el carrusel, deja la lista vacía.
  galeria: [
    { itemId: "s1", foto: "assets/img/productos/silla-napoli-blanca.webp", alt: "Silla plástica blanca con respaldo calado" },
    { itemId: "m1", foto: "assets/img/productos/mesa-plegable.webp", alt: "Mesa rectangular plegable blanca con patas metálicas" },
    { itemId: "t2", foto: "assets/img/productos/toldo-3x3.webp", alt: "Toldo blanco de 3 por 3 metros" },
    { itemId: "t3", foto: "assets/img/productos/toldo-6x3.webp", alt: "Toldo blanco de 6 por 3 metros" }
  ],

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
      id: "manteles",
      titulo: "Manteles",
      nota: "Precio por unidad, por evento",
      items: [
        { id: "mt1", nombre: "Mantel Rectangular", desc: "Para mesa rectangular", precio: 15, colores: ["Blanco", "Negro", "Rojo", "Otro"] },
        { id: "mt2", nombre: "Mantel Redondo", desc: "Para mesa redonda", precio: 25, colores: ["Blanco", "Negro", "Otro"] },
        { id: "mt3", nombre: "Mantel Coctelero", desc: "Para mesa coctelera", precio: 25, colores: ["Blanco", "Otro"] }
      ]
    },
    {
      id: "sobre-manteles",
      titulo: "Sobremanteles",
      nota: "Precio por unidad, por evento",
      items: [
        { id: "sm1", nombre: "Sobremantel Rectangular", desc: "Para mesa rectangular", precio: 15, colores: ["Rojo", "Gris", "Verde", "Otro"] },
        { id: "sm2", nombre: "Sobremantel Redondo", desc: "Para mesa redonda", precio: 25, colores: ["Celeste", "Negro", "Otro"] }
      ]
    }
  ]
};
