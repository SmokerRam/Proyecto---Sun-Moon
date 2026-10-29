# Sun&Moon Eventos · Cotizador de mobiliario

Landing page para que los clientes cotizen el alquiler de sillas, mesas, toldos y otros artículos para su evento, y descarguen la cotización en PDF al momento. Es un sitio estático (HTML, CSS y JavaScript, sin compilación) que se publica en Cloudflare Workers; un Worker mínimo reenvía el envío por correo a Google Apps Script.

## Funciones

- **Carrusel "Conoce nuestro mobiliario"** con fotos de los productos, su precio y un botón que lleva al artículo en el cotizador. Se desliza con el dedo, tiene flechas, puntos y avance automático (se pausa al tocarlo o al pasar el mouse, y no se mueve solo si el dispositivo pide menos animaciones). Se configura en `galeria` de `config.js`.
- Catálogo por categorías desplegables (sillas, mesas, toldos y otros artículos) con precio fijo por evento. Los artículos con `colores` en `config.js` (los manteles) piden elegir color, o escribir otro, y se muestra en la cotización y en el acta.
- Formulario con nombre, teléfono, fecha, **hora de entrega**, **hora del evento**, tipo de evento, lugar y notas. La hora de entrega debe ser anterior a la del evento.
- Total calculado en tiempo real.
- PDF de cotización generado en el navegador con [jsPDF](https://github.com/parallax/jsPDF).
- Envío de la cotización por correo, con el PDF adjunto, mediante Google Apps Script y un Gmail del negocio (opcional, ver [Envío por correo](#envío-por-correo)).
- Botón de WhatsApp con el resumen del pedido ya escrito.
- Identidad visual del Flyer Promo: logo oficial y paleta azul marino, lavanda y degradado naranja.
- Tema claro y oscuro según la preferencia del dispositivo.
- Diseño adaptable a celular.

## Estructura del proyecto

```
sun-moon-eventos/
├── index.html                  # Estructura de la página
├── worker/
│   └── index.js                # Worker de Cloudflare: sirve el sitio y reenvía POST /api/cotizar
├── apps-script/
│   └── Code.gs                 # Script de Google que envía la cotización por correo
├── assets/
│   ├── css/
│   │   └── styles.css          # Estilos, tokens de color y tipografía
│   ├── js/
│   │   ├── config.js           # Datos del negocio y catálogo de precios (editar aquí)
│   │   ├── utils.js            # Formato de moneda y fechas, número de cotización
│   │   ├── logo-data.js        # Logo en base64 para el PDF (se genera desde img/logo.png)
│   │   ├── pdf.js              # Generación del PDF
│   │   ├── app.js              # Catálogo, formulario, validación y eventos
│   │   └── carousel.js         # Carrusel de fotos del mobiliario
│   ├── img/
│   │   ├── logo.png            # Logo oficial Sun & Moon Eventos
│   │   ├── favicon.png         # Icono de la pestaña (remolino del logo)
│   │   └── productos/          # Fotos del carrusel (4:3, fondo blanco, .webp)
│   └── vendor/
│       └── jspdf.umd.min.js    # jsPDF 2.5.2 (MIT), incluido localmente
├── wrangler.jsonc              # Configuración del Worker (nombre, dominios, assets)
├── .assetsignore               # Archivos del repo que no se publican en el sitio
├── .gitignore
└── README.md
```

Los scripts se cargan en este orden y comparten el espacio `window.SunMoon`: `config.js`, `utils.js`, `logo-data.js`, jsPDF, `pdf.js`, `app.js`, `carousel.js`.

## Uso local

Para ver la página y el PDF basta un servidor estático (el envío por correo no funcionará, porque `/api/cotizar` solo existe en el Worker):

```bash
python3 -m http.server 8000
# luego abre http://localhost:8000
```

Para probar también el Worker en local, crea un archivo `.dev.vars` (no se sube a Git) con `APPS_SCRIPT_URL=...` y, si usas clave, `SCRIPT_TOKEN=...`, y ejecuta `npx wrangler dev`.

Las tipografías (Google Fonts) necesitan internet. Sin conexión, la página usa tipografías del sistema.

## Personalizar

Todo lo que cambia de un negocio a otro está en `assets/js/config.js`:

| Campo | Qué hace |
| --- | --- |
| `negocio` | Nombre que aparece en el PDF y en el mensaje de WhatsApp |
| `whatsapp` | Número con código de país, sin `+` ni espacios (ejemplo: `50255551234`) |
| `telefonoVisible`, `correoVisible` | Contacto mostrado en el pie y en el PDF |
| `envioCorreo.url` | Ruta del envío por correo (`/api/cotizar`, la del Worker). Vacía = no se envía correo y el campo de correo no aparece |
| `validezDias` | Días de vigencia de la cotización |
| `galeria` | Fotos del carrusel: `itemId` (artículo del catálogo, de donde salen nombre y precio), `foto` y `alt` |
| `grupos` | Categorías y artículos con su precio por evento |

Para agregar un artículo, añade un objeto a la lista `items` del grupo correspondiente con un `id` único, `nombre`, `desc` y `precio`.

Para agregar una foto al carrusel, guárdala en `assets/img/productos/` (recomendado: 1200 × 900 px, producto centrado sobre fondo blanco, `.webp`) y suma una línea a `galeria` con el `itemId` del artículo.

Los colores y las tipografías están como variables al inicio de `assets/css/styles.css`. Paleta oficial:

| Color | Hex | Uso |
| --- | --- | --- |
| Azul marino | `#02033C` | Encabezado, pie, textos |
| Lavanda | `#807F9E` | Fondo de la página |
| Naranja del logo | `#FFCC22` → `#FFA82A` → `#DA742A` | Botones, acentos, degradado |

Si cambias `assets/img/logo.png`, regenera `assets/js/logo-data.js` (el PDF usa esa copia incrustada para funcionar también sin servidor).

> Los precios y el número de WhatsApp incluidos son de ejemplo.

## Envío por correo

La página tiene dos botones: **Generar cotización** y **Enviar por WhatsApp**. Al generar la cotización siempre se descarga el PDF y, si el envío por correo está configurado, también:

- Se envía una **copia al negocio** con los datos del cliente, los artículos y el PDF. Llega siempre.
- Si el cliente escribió su correo (campo opcional), se le envía **también a él** el PDF.
- Al correo del negocio se adjunta además el **acta de entrega y devolución** (PDF con el mismo estilo, solo con los artículos de la cotización, columna de color y espacios para nombre, firma y DPI de quien recibe y de quien devuelve). Es un documento interno: **no se descarga ni se envía al cliente**.

Si el PDF se descarga pero el correo falla, la página lo avisa y le sugiere escribir por WhatsApp.

Cómo funciona: el navegador envía la cotización (datos y PDF) a `/api/cotizar`, en el mismo dominio de la página. El Worker ([`worker/index.js`](worker/index.js)) la valida y la reenvía a un script de Google Apps Script, que manda los correos desde el Gmail del negocio. Es gratis y no necesita dominio propio para el correo. Que el navegador solo hable con su propio dominio evita los bloqueos entre sitios de Safari en iPhone, y la URL del script queda como secreto en Cloudflare en vez de estar en el código público.

### Instalación (una sola vez)

**1. Google Apps Script**

1. Entra a [script.google.com](https://script.google.com) con el **Gmail del negocio** (los correos saldrán desde esa cuenta) y crea un **Proyecto nuevo**.
2. Borra el contenido de `Code.gs` y pega el de [`apps-script/Code.gs`](apps-script/Code.gs). Revisa el bloque `CONFIG`: nombre del negocio, teléfono y, si quieres que la copia llegue a otro correo, `CORREO_COPIA`. Guarda.
3. **Implementar → Nueva implementación → Aplicación web**, con **Ejecutar como: Yo** y **Quién tiene acceso: Cualquier persona**. Autoriza los permisos (si Google avisa que la app no está verificada: **Avanzado → Ir a (proyecto)**; es tu propio script).
4. Copia la **URL de la aplicación web** (termina en `/exec`). Ábrela en el navegador: debe mostrar `{"ok":true,...}`.

**2. Cloudflare (Worker)**

1. En el Worker, **Configuración → Variables y secretos → Agregar**, tipo **Secreto**: `APPS_SCRIPT_URL` con la URL del paso anterior. Si no existe, el Worker responde "El envío por correo no está configurado".
2. (Recomendado) Agrega otro secreto `SCRIPT_TOKEN` con una clave larga y aleatoria, y en Apps Script, **Configuración del proyecto → Propiedades del script**, crea `TOKEN` con el mismo valor. Así el script rechaza cualquier solicitud que no venga del Worker, aunque alguien conozca su URL.
3. Los secretos se mantienen entre despliegues. Si cambias `Code.gs`, usa **Implementar → Administrar implementaciones → editar → Nueva versión** (la URL no cambia).

El nombre del Worker en `wrangler.jsonc` debe coincidir con el del Worker en Cloudflare, y `assets.run_worker_first` hace que solo `/api/*` pase por el código; el resto son archivos estáticos. `.assetsignore` evita publicar el código del Worker, el script de Google y el README.

### Qué hay que saber

- Los correos salen desde el Gmail que publicó el script, con el nombre "Sun&Moon Eventos". Pueden caer en spam la primera vez; pide a los clientes que revisen esa carpeta.
- Gmail limita los envíos diarios (cerca de 100 destinatarios al día en cuentas gratuitas). Cada cotización usa 2 (cliente y copia), y el script se detiene en `MAX_COTIZACIONES_DIA` (40 por defecto).
- Protecciones: el Worker solo acepta POST desde su propio dominio, limita el tamaño y no devuelve detalles internos; el script usa plantilla fija para el cliente, valida correo y PDF, tiene campo trampa para bots, tope diario y la clave opcional `TOKEN`. Si aun así llegan envíos falsos, se puede agregar Cloudflare Turnstile.
- Si una URL anterior del script estuvo en el historial de Git, ya no es secreta: define `TOKEN` o crea una implementación nueva del script y actualiza `APPS_SCRIPT_URL`.
- Con un dominio verificado se puede cambiar a Resend para enviar desde `cotizaciones@tudominio.com`. Solo cambia el Worker y el script, no la página.

## Limitaciones actuales

- Si el Worker no tiene `APPS_SCRIPT_URL`, el PDF se descarga pero el correo no se envía y la página lo avisa.
- WhatsApp no permite adjuntar el PDF por enlace, así que el cliente debe adjuntarlo manualmente.
- La página no consulta disponibilidad de inventario por fecha.

## Siguientes pasos previstos

- Calendario de eventos en vivo con la cantidad de mobiliario alquilado.
- Inventario disponible en tiempo real, incluyendo el que se libera al terminar cada evento.
- Envío del PDF por WhatsApp (por ejemplo con el menú de compartir del celular).

## Créditos

- [jsPDF](https://github.com/parallax/jsPDF), licencia MIT.
- Tipografías Bricolage Grotesque y Figtree, de Google Fonts.
