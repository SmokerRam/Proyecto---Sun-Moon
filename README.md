# Sun&Moon Eventos · Cotizador de mobiliario

Landing page para que los clientes cotizen el alquiler de sillas, mesas, toldos y otros artículos para su evento, y descarguen la cotización en PDF al momento. Es un sitio estático (HTML, CSS y JavaScript), sin servidor ni proceso de compilación.

## Funciones

- Catálogo por categorías (sillas, mesas, toldos y otros artículos) con precio fijo por evento.
- Formulario con nombre, teléfono, fecha, **hora de entrega**, **hora del evento**, tipo de evento, lugar y notas. La hora de entrega debe ser anterior a la del evento.
- Total calculado en tiempo real.
- PDF de cotización generado en el navegador con [jsPDF](https://github.com/parallax/jsPDF).
- Botón de WhatsApp con el resumen del pedido ya escrito.
- Identidad visual del Flyer Promo: logo oficial y paleta azul marino, lavanda y degradado naranja.
- Tema claro y oscuro según la preferencia del dispositivo.
- Diseño adaptable a celular.

## Estructura del proyecto

```
sun-moon-eventos/
├── index.html                  # Estructura de la página
├── assets/
│   ├── css/
│   │   └── styles.css          # Estilos, tokens de color y tipografía
│   ├── js/
│   │   ├── config.js           # Datos del negocio y catálogo de precios (editar aquí)
│   │   ├── utils.js            # Formato de moneda y fechas, número de cotización
│   │   ├── logo-data.js        # Logo en base64 para el PDF (se genera desde img/logo.png)
│   │   ├── pdf.js              # Generación del PDF
│   │   └── app.js              # Catálogo, formulario, validación y eventos
│   ├── img/
│   │   ├── logo.png            # Logo oficial Sun & Moon Eventos
│   │   └── favicon.png         # Icono de la pestaña (remolino del logo)
│   └── vendor/
│       └── jspdf.umd.min.js    # jsPDF 2.5.2 (MIT), incluido localmente
├── .gitignore
└── README.md
```

Los scripts se cargan en este orden y comparten el espacio `window.SunMoon`: `config.js`, `utils.js`, `logo-data.js`, jsPDF, `pdf.js`, `app.js`.

## Uso local

Abre `index.html` en el navegador. Para probarlo con un servidor local:

```bash
python3 -m http.server 8000
# luego abre http://localhost:8000
```

Las tipografías (Google Fonts) necesitan internet. Sin conexión, la página usa tipografías del sistema.

## Personalizar

Todo lo que cambia de un negocio a otro está en `assets/js/config.js`:

| Campo | Qué hace |
| --- | --- |
| `negocio` | Nombre que aparece en el PDF y en el mensaje de WhatsApp |
| `whatsapp` | Número con código de país, sin `+` ni espacios (ejemplo: `50255551234`) |
| `telefonoVisible`, `correoVisible` | Contacto mostrado en el pie y en el PDF |
| `validezDias` | Días de vigencia de la cotización |
| `grupos` | Categorías y artículos con su precio por evento |

Para agregar un artículo, añade un objeto a la lista `items` del grupo correspondiente con un `id` único, `nombre`, `desc` y `precio`.

Los colores y las tipografías están como variables al inicio de `assets/css/styles.css`. Paleta oficial:

| Color | Hex | Uso |
| --- | --- | --- |
| Azul marino | `#02033C` | Encabezado, pie, textos |
| Lavanda | `#807F9E` | Fondo de la página |
| Naranja del logo | `#FFCC22` → `#FFA82A` → `#DA742A` | Botones, acentos, degradado |

Si cambias `assets/img/logo.png`, regenera `assets/js/logo-data.js` (el PDF usa esa copia incrustada para funcionar también sin servidor).

> Los precios y el número de WhatsApp incluidos son de ejemplo.

## Limitaciones actuales

- El PDF se descarga en el dispositivo del cliente. No se envía por correo automáticamente; eso requiere un servicio externo (por ejemplo EmailJS o Resend) o un backend.
- WhatsApp no permite adjuntar el PDF por enlace, así que el cliente debe adjuntarlo manualmente.
- La página no consulta disponibilidad de inventario por fecha.

## Siguientes pasos previstos

- Calendario de eventos en vivo con la cantidad de mobiliario alquilado.
- Inventario disponible en tiempo real, incluyendo el que se libera al terminar cada evento.
- Envío de la cotización por correo.

## Créditos

- [jsPDF](https://github.com/parallax/jsPDF), licencia MIT.
- Tipografías Bricolage Grotesque y Figtree, de Google Fonts.
