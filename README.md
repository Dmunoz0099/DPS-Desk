# DPSDESK

Dashboard de monitoreo de dispositivos POS y control remoto vía RustDesk.

## Flujo principal

**Sidebar DPSDESK** → Seleccionar **Empresa** → Seleccionar **Local** → Elegir **POS** → **Control Remoto** (RustDesk Web con sidebar de info + toolbar)

## Stack

- **Frontend:** React + Vite + Tailwind CSS + React Router
- **Backend:** Node.js + Express + JWT (mock inicial)
- **Control remoto:** RustDesk Web Client embebido vía iframe

## Estructura

```
DPSDESK/
├── backend/      # API Express (devices, sessions, auth)
├── frontend/     # SPA React (Vite + Tailwind)
└── infra/        # Servidor RustDesk self-hosted (docker compose)
```

## Cómo funciona el control remoto

DPSDESK usa **deep links** (`rustdesk://`) que abren la app nativa de RustDesk
instalada en tu equipo de operador. Esto da:

- ✅ Performance nativo (vs WebRTC limitado del web client)
- ✅ Soporte completo: transferencia de archivos, audio, multi-monitor, Ctrl+Alt+Del
- ✅ Confiable (no depende de iframe/CSP/CORS)
- ✅ Funciona con servidor self-hosted

Flujo de una sesión:
1. Usuario click "Control Remoto" en DPSDESK
2. Frontend pide a `/sessions` con `posId`
3. Backend genera `rustdesk://connection/new/<ID>?password=<pwd>`
4. Frontend hace `window.location = deepLink` → se abre RustDesk
5. RustDesk conecta al POS vía tu servidor self-hosted

## Secciones en el Sidebar

- **DPSDESK:** Control de dispositivos (Empresa → Local → POS → Control Remoto)
- Deploy, Services, Monitor de Logs, Logs, Configuración (próximas versiones)

## Requisitos

- Node.js 18 o superior
- npm 9 o superior

## Instalación

Abre dos terminales (una para cada parte).

### 1) Backend

```bash
cd backend
npm install
cp .env.example .env    # opcional: ajustar puerto / RUSTDESK_WEB_URL
npm run dev             # http://localhost:4000
```

Endpoints disponibles:

- `GET  /devices` — totales + empresas con métricas
- `GET  /devices/empresas` — empresas
- `GET  /devices/empresas/:id/locales` — locales de una empresa
- `GET  /devices/locales/:id/pos` — POS de un local
- `GET  /devices/pos/:id` — detalle de un POS
- `POST /sessions` `{ posId }` — crea sesión y devuelve URL para iframe
- `POST /auth/login` `{ username, password }` — devuelve JWT (mock)

### 2) Frontend

```bash
cd frontend
npm install
npm run dev             # http://localhost:5173
```

Vite proxea `/api` → `http://localhost:4000`, así que no necesitas configurar variables de entorno en el frontend.

## Uso

1. Abre `http://localhost:5173`
2. Te redirige automáticamente a `/monitoreo`
3. Elige **Empresa → Local → POS**
4. Click en **Control Remoto** → abre `/remote/:posId` con el iframe del cliente RustDesk

## Integración con RustDesk real

### Setup mínimo para probar (con cliente RustDesk del usuario)

1. Tener RustDesk instalado en tu equipo de operador
2. El POS de prueba ya está registrado en `backend/data/mockData.js`:
   - **POS #1003** en `BARRIO SALUD → ISABEL RIQUELME`
   - RustDesk ID: `1372749711`
   - Password: `dps1003.,`
3. Inicia backend + frontend
4. Navega: DPSDESK → BARRIO SALUD → ISABEL RIQUELME → POS 1003 → Control Remoto
5. En la página Remote, click "🔗 Iniciar Control Remoto"
6. El navegador te pedirá permiso para abrir RustDesk → permite
7. RustDesk se abre y conecta automáticamente con el password

### Servidor self-hosted

Ver [`infra/README.md`](./infra/README.md) para desplegar tu propio servidor
RustDesk con Docker Compose en un VPS.

Pasos resumidos:
1. `cd infra && cp .env.example .env` (editar `RUSTDESK_PUBLIC_HOST`)
2. Subir a VPS, `docker compose up -d`
3. Configurar todos los POS para apuntar a tu servidor
4. Listo

## Tema claro / oscuro

Toggle en el header (icono sol/luna). La preferencia se guarda en `localStorage` (`dpsdesk-theme`).

## Próximos pasos sugeridos

- Reemplazar datos mock por base de datos real (PostgreSQL/Mongo).
- Agregar autenticación real (login form + protección de rutas con el JWT existente).
- Integrar SSE/WebSocket para estado en tiempo real de los POS.
- Historial y auditoría de sesiones de control remoto.
