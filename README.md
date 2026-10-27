# Sun&Moon Eventos · Cotizador de mobiliario

Landing page para que los clientes cotizen el alquiler de sillas, mesas, toldos y otros artículos para su evento, y descarguen la cotización en PDF al momento. Es un sitio estático (HTML, CSS y JavaScript), sin servidor ni proceso de compilación.

## Funciones

- Catálogo por categorías (sillas, mesas, toldos y otros artículos) con precio fijo por evento.
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
| `envioCorreo.url` | URL de la aplicación web de Google Apps Script. Vacía = no se envía correo y el campo de correo no aparece |
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

## Envío por correo

La página tiene dos botones: **Generar cotización** y **Enviar por WhatsApp**. Al generar la cotización siempre se descarga el PDF y, si el envío por correo está configurado, también:

- Se envía una **copia al negocio** con los datos del cliente, los artículos y el PDF. Llega siempre.
- Si el cliente escribió su correo (campo opcional), se le envía **también a él** el PDF.

Si el PDF se descarga pero el correo falla, la página lo avisa y le sugiere escribir por WhatsApp.

No usa servidores propios: la página envía los datos a un script de Google Apps Script que publica el Gmail del negocio, y ese script manda los correos desde esa cuenta. Es gratis y no necesita dominio.

### Instalación (una sola vez, unos 10 minutos)

1. Entra a [script.google.com](https://script.google.com) con el **Gmail del negocio** (los correos saldrán desde esa cuenta) y crea un **Proyecto nuevo**.
2. Borra el contenido de `Code.gs` y pega el de [`apps-script/Code.gs`](apps-script/Code.gs). Revisa el bloque `CONFIG` de arriba: nombre del negocio, teléfono y, si quieres que la copia llegue a otro correo, `CORREO_COPIA`. Guarda.
3. Clic en **Implementar → Nueva implementación**. En el engranaje elige **Aplicación web** y configura:
   - **Ejecutar como:** Yo
   - **Quién tiene acceso:** Cualquier persona
4. Clic en **Implementar** y autoriza los permisos. Si Google avisa que la app no está verificada, elige **Avanzado → Ir a (nombre del proyecto)**; es tu propio script.
5. Copia la **URL de la aplicación web** (termina en `/exec`). Ábrela en el navegador: debe mostrar `{"ok":true,...}`.
6. Pégala en `assets/js/config.js`, en `envioCorreo.url`, y sube el cambio. Al recargar la página aparece el campo de correo (opcional). Mientras la URL esté vacía, ese campo no se muestra y el botón solo descarga el PDF.

Si más adelante cambias `Code.gs`, usa **Implementar → Administrar implementaciones → editar → Nueva versión**. La URL no cambia.

### Qué hay que saber

- Los correos salen desde el Gmail que publicó el script, con el nombre "Sun&Moon Eventos". Pueden caer en spam la primera vez; pide a los clientes que revisen esa carpeta.
- Gmail limita los envíos diarios (cerca de 100 destinatarios al día en cuentas gratuitas). Cada cotización usa 2 (cliente y copia), y el script se detiene en `MAX_COTIZACIONES_DIA` (40 por defecto) para no agotar la cuota.
- La URL del script queda a la vista en el código de la página. Para que no sirva para enviar spam, el correo al cliente usa una plantilla fija, se valida el correo y el PDF, y hay un campo trampa para bots y el tope diario. Si empiezan a llegar envíos falsos, se puede agregar Cloudflare Turnstile.
- Con un dominio propio se puede cambiar a Resend para enviar desde `cotizaciones@tudominio.com`. Solo cambia la parte del envío, no la página.

## Limitaciones actuales

- Sin la URL de Apps Script en `config.js`, el PDF solo se descarga en el dispositivo del cliente.
- WhatsApp no permite adjuntar el PDF por enlace, así que el cliente debe adjuntarlo manualmente.
- La página no consulta disponibilidad de inventario por fecha.

## Siguientes pasos previstos

- Calendario de eventos en vivo con la cantidad de mobiliario alquilado.
- Inventario disponible en tiempo real, incluyendo el que se libera al terminar cada evento.
- Envío del PDF por WhatsApp (por ejemplo con el menú de compartir del celular).

## Créditos

- [jsPDF](https://github.com/parallax/jsPDF), licencia MIT.
- Tipografías Bricolage Grotesque y Figtree, de Google Fonts.
