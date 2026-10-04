/**
 * Configuración del negocio y catálogo de precios.
 * Es el único archivo que hay que editar para cambiar datos de contacto o precios.
 */
window.SunMoon = window.SunMoon || {};

window.SunMoon.config = {
  negocio: "Sun&Moon Eventos",

  // Número con código de país, sin "+" ni espacios (ejemplo: 502 + 8 dígitos).
  whatsapp: "50237956338",

  // Se muestran en el pie de la página y en el PDF.
  telefonoVisible: "+502 3795 6338",
  correoVisible: "",

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
        { id: "m1", nombre: "Mesa rectangular", desc: "Para 8 personas", precio: 25 },
        { id: "m2", nombre: "Mesa redonda", desc: "Para 10 personas", precio: 35 },
        { id: "m3", nombre: "Mesa alta de cóctel", desc: "Para recepciones", precio: 40 }
      ]
    },
    {
      id: "toldos",
      titulo: "Toldos",
      nota: "Precio por toldo, por evento",
      items: [
        { id: "t1", nombre: "Toldo 3 × 3 m", desc: "Cubre 1 o 2 mesas", precio: 250 }
      ]
    },
    {
      id: "otros",
      titulo: "Otros artículos",
      nota: "Precio por unidad, por evento",
      items: [
        { id: "o1", nombre: "Mantel", desc: "Para mesa rectangular o redonda", precio: 15 }
      ]
    }
  ]
};
