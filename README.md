# DPS Desk Web

Plataforma de monitoreo y control remoto de terminales POS distribuidos.

El repositorio se compone de **tres** piezas que se hablan entre sí:

| Carpeta    | Qué es                                              | Stack                                        |
|------------|-----------------------------------------------------|----------------------------------------------|
| `backend/` | API REST + servidor de signaling WebSocket          | Node.js, Express, ws, Supabase               |
| `agent/`   | Aplicación Electron que corre en cada POS remoto    | Electron, ws, robotjs                        |
| `project/` | Consola web (admin) que ve toda la red              | React 18 (CDN), Babel standalone, HTML/CSS   |

```
┌────────────┐    HTTPS/WS    ┌──────────────┐   WS   ┌────────────┐
│  project/  │  ───────────►  │   backend/   │  ◄───► │   agent/   │
│ (consola)  │  ◄───────────  │ (signaling + │        │ (Electron, │
│            │                │  REST API)   │        │  POS real) │
└────────────┘                └──────┬───────┘        └────────────┘
                                     │
                                     ▼
                                  Supabase
                              (Postgres: empresas,
                               locales, pos, devices,
                               sessions)
```

## Requisitos

- **Node.js 18+** (probado en 20/22)
- Cuenta en **Supabase** con el esquema cargado (ver `backend/schema.sql`)
- **PowerShell / Bash** (Windows: ambos sirven)

## 1) Backend

```bash
cd backend
npm install
cp .env.example .env   # editar con tus claves de Supabase
npm start              # o "npm run dev" si tienes nodemon
```

Variables clave de `.env`:

```ini
PORT=4000
SUPABASE_URL=https://<tu-proyecto>.supabase.co
SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_KEY=<service-role-key>
JWT_SECRET=cambia_esto_en_prod
CORS_ORIGIN=*                              # en prod restringir
```

Verás:

```
╔═══════════════════════════════════════════════════════╗
║  DPSDESK API + WS Signaling                           ║
║  HTTP : http://localhost:4000                         ║
║  WS   : ws://localhost:4000/ws                        ║
╚═══════════════════════════════════════════════════════╝
```

Endpoints principales (todos también disponibles bajo `/api/...`):

| Método | Ruta                                       | Para qué |
|--------|--------------------------------------------|----------|
| POST   | `/api/auth/login`                          | Login (mock: cualquier user/pass no vacío) |
| GET    | `/api/auth/me`                             | Perfil del JWT actual |
| GET    | `/api/devices/empresas`                    | Lista empresas con métricas |
| GET    | `/api/devices/empresas/:id/locales`        | Locales de una empresa |
| GET    | `/api/devices/locales/:id/pos`             | POS de un local |
| GET    | `/api/devices/pos/:id`                     | Detalle POS o agent |
| GET    | `/api/devices/registered`                  | Agents Electron registrados |
| POST   | `/api/devices/register`                    | Registro de agent (lo llama Electron) |
| POST   | `/api/sessions`                            | Crea una sesión WebRTC |
| DELETE | `/api/sessions/:id`                        | Cierra sesión |
| WS     | `/ws`                                      | Signaling para agent ↔ navegador |

### Esquema Supabase

`backend/schema.sql` lista las tablas. Si Supabase ya tiene el esquema cargado (caso actual del proyecto), no es necesario correr nada — el backend solo lee/escribe.

## 2) Frontend (`project/`)

El frontend es **HTML + React por CDN** (sin build), apuntando al backend por `http://localhost:4000` por defecto.

### Forma rápida — abrir el HTML

Funciona, pero algunos navegadores bloquean `file://` para `fetch`. Si te aparece "Failed to fetch", usa la opción de servidor estático.

```
project/DPS DESK.html   ← doble click
```

### Forma recomendada — servidor estático

Cualquier servidor sirve. Las dos formas más simples:

```bash
# Opción A: con npx (sin instalar nada)
cd project
npx serve -l 8080 .

# Opción B: con Python
cd project
python -m http.server 8080
```

Luego abre <http://localhost:8080/DPS%20DESK.html>.

### Cambiar la URL del backend desde el navegador

Si tu backend no está en `localhost:4000`, en la consola del navegador:

```js
localStorage.setItem('DPS_API_URL', 'http://otra-url:4000');
location.reload();
```

### Login

Mientras el backend tenga el login mock (`routes/auth.js`), **cualquier email/password no vacío sirve**. El backend devuelve un JWT que se guarda en `localStorage` y se reenvía como `Authorization: Bearer ...` en cada request.

Si el backend está caído, el frontend cae a los datos mock de `data.js` y muestra una advertencia en consola — la UI sigue siendo navegable.

## 3) Agent Electron (`agent/`)

El agent corre en cada POS remoto: se registra en el backend, abre WS y queda esperando que un browser pida conectarse.

```bash
cd agent
npm install
cp .env.example .env   # apuntar al backend
npm start
```

Variables clave de `agent/.env`:

```ini
SIGNALING_URL=ws://localhost:4000
BACKEND_HTTP_URL=http://localhost:4000
# POS_ID=...   # opcional: ID fijo en vez del UUID generado
```

El primer arranque genera un `pos_id` (UUID) persistente y registra el dispositivo vía `POST /api/devices/register`. A partir de ahí aparece en `GET /api/devices/registered` y, por tanto, en el frontend bajo la empresa virtual **Agent DPS**.

## Flujo end-to-end de prueba

1. Levanta `backend/` (puerto 4000).
2. Levanta `project/` con un static server (puerto 8080).
3. Abre <http://localhost:8080/DPS%20DESK.html> y haz login (cualquier credencial).
4. (Opcional) Levanta el `agent/` Electron — debería aparecer en el dashboard.
5. En **Empresas → Agent DPS → Remote**, click *Conectar vía DPS DESK* en cualquier agent online.
   - El frontend llama `POST /api/sessions`.
   - El backend persiste la sesión en Supabase (`sessions`) y devuelve `sessionId`.
   - El modal muestra el `sessionId` real y al cerrar dispara `DELETE /api/sessions/:id`.

## Estructura del repo

```
dpsdesk-web/
├── README.md                 ← este archivo
├── backend/
│   ├── server.js             ← API + WS signaling
│   ├── schema.sql            ← referencia del esquema Supabase
│   ├── db/supabase.js        ← cliente y queries
│   ├── routes/
│   │   ├── auth.js
│   │   ├── devices.js
│   │   └── sessions.js
│   └── middleware/auth.js
├── agent/
│   ├── main.js               ← proceso principal Electron
│   ├── src/                  ← signaling, posId, input, logger
│   └── renderer.html / .js   ← captura de pantalla + WebRTC
└── project/
    ├── DPS DESK.html         ← entry HTML
    ├── api.js                ← cliente del backend (window.API)
    ├── data.js               ← mocks (fallback si no hay backend)
    ├── app.jsx               ← composición + login + modal sesión
    ├── login.jsx
    ├── dashboard.jsx
    ├── network.jsx
    ├── config.jsx
    ├── shell.jsx             ← Sidebar + TopNav
    ├── icons.jsx
    ├── tweaks-panel.jsx      ← panel de design tokens en vivo
    ├── styles.css
    └── v2/                   ← rediseño alternativo (en exploración)
```

## Troubleshooting

- **CORS**: si el navegador bloquea las llamadas, revisa `CORS_ORIGIN` del backend. En dev, `*` funciona para cualquier origen.
- **`Failed to fetch` con `file://`**: usa un static server (ver arriba).
- **Backend no se conecta a Supabase**: confirma `SUPABASE_URL` y que `SUPABASE_SERVICE_KEY` (no la anon) esté seteada para escrituras.
- **El agent Electron no aparece en la consola**: revisa `agent/.env` (`BACKEND_HTTP_URL` y `SIGNALING_URL`) y los logs en `%APPDATA%/dps-desk/logs` (Windows).
