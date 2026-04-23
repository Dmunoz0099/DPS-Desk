# DPSDESK — Servidor RustDesk Self-Hosted

Esta carpeta contiene la infraestructura para correr tu propio servidor RustDesk
(`hbbs` + `hbbr`) en un VPS, lo cual te da:

- Control total sobre las conexiones de tus POS
- Sin dependencia de servidores públicos de RustDesk
- Menor latencia (idealmente VPS en LATAM)
- Auditoría y logs centralizados
- Capacidad de rotar la clave de encriptación

---

## Requisitos

- VPS con Ubuntu 22.04 (1 vCPU, 1 GB RAM, 10 GB disco — basta)
- IP pública fija o dominio apuntando a la IP
- Puertos abiertos en firewall (ver más abajo)
- Docker y Docker Compose instalados

## Puertos a abrir en el firewall del VPS

| Puerto | Protocolo | Servicio | Uso |
|--------|-----------|----------|-----|
| 21115 | TCP | hbbs | NAT type test |
| 21116 | TCP | hbbs | TCP hole punching, conexión |
| 21116 | UDP | hbbs | ID registration, heartbeat |
| 21117 | TCP | hbbr | Relay |
| 21118 | TCP | hbbs | Web client (opcional) |
| 21119 | TCP | hbbr | Web client (opcional) |

```bash
# UFW (Ubuntu)
sudo ufw allow 21115:21119/tcp
sudo ufw allow 21116/udp
sudo ufw reload
```

---

## Despliegue paso a paso

### 1) Subir archivos al VPS

```bash
# Desde tu máquina local
scp -r infra/ usuario@TU_VPS:/opt/dpsdesk-server/
ssh usuario@TU_VPS
cd /opt/dpsdesk-server/
```

### 2) Configurar el host público

```bash
cp .env.example .env
nano .env  # Cambiar RUSTDESK_PUBLIC_HOST por tu IP/dominio
```

### 3) Levantar los servicios

```bash
docker compose up -d
docker compose logs -f
```

Verás algo como:
```
hbbs  | Listening on tcp/udp :21116, tcp :21115, tcp :21118
hbbr  | Listening on tcp :21117, tcp :21119
```

### 4) Obtener la clave pública

Después del primer arranque se genera una clave en `./data/id_ed25519.pub`.
Guárdala — la necesitarás para configurar los POS:

```bash
cat ./data/id_ed25519.pub
# ej: AbcDef123456789...XYZ=
```

---

## Configurar los POS (clientes RustDesk)

En cada POS donde quieras tener control remoto:

### 1) Instalar RustDesk

Descarga desde https://github.com/rustdesk/rustdesk/releases (versión 1.2.x estable).
Instala como **servicio** para que arranque con Windows.

### 2) Apuntar el cliente al servidor self-hosted

**Opción A — Via UI:**
- Abrir RustDesk → ☰ → Configuración de red → ID/Servidor de relay
- ID Server: `tu.dominio.cl:21116` (o IP)
- Relay Server: `tu.dominio.cl:21117`
- Key: pegar el contenido de `id_ed25519.pub`
- API Server: dejar vacío

**Opción B — Via instalador silencioso (recomendado para masivo):**

```bat
REM En Windows, ejecutar como admin
rustdesk.exe --install-idd
rustdesk.exe --config <BASE64_DEL_CONFIG>
```

Donde el config es un JSON codificado en base64 con:
```json
{
  "host": "tu.dominio.cl",
  "key": "AbcDef123456789...XYZ="
}
```

### 3) Configurar password permanente en el POS

```
RustDesk → Configuración → Seguridad → Establecer password permanente
```

Este password es el que el backend de DPSDESK envía en el deep link.
**Guárdalo en la BD** (en el campo `rustdeskPassword` de cada POS).

### 4) Obtener el ID del POS

El ID de 9 dígitos aparece en la pantalla principal de RustDesk.
**Guárdalo en la BD** (en el campo `rustdeskId` de cada POS).

---

## Conectar DPSDESK al servidor self-hosted

En el equipo donde ejecutas DPSDESK como **operador**:

1. Instalar RustDesk (como cliente, no como servicio)
2. Configurarlo igual que los POS (apuntando a tu servidor)
3. Listo: cuando hagas click en "Iniciar Control Remoto" en DPSDESK,
   se abrirá RustDesk y conectará al POS via tu servidor

---

## Verificar la conexión

```bash
# En el POS, ver logs de RustDesk
# Windows: %APPDATA%\RustDesk\log\
# Linux: ~/.config/rustdesk/

# En el VPS, ver conexiones activas
docker compose logs hbbs | grep "ID:"
```

---

## Backup

La carpeta `./data/` contiene las claves del servidor.
Si la pierdes, todos los POS tendrán que reconfigurarse con la nueva clave.

```bash
tar -czf rustdesk-backup-$(date +%F).tar.gz ./data/
```

---

## Próximos pasos sugeridos

- **HTTPS:** Si quieres usar el web client, agregar nginx + Let's Encrypt
- **API Server:** RustDesk Pro permite gestionar usuarios/dispositivos via API
- **Monitoreo:** Conectar Prometheus al endpoint `/api/stats` de hbbs
- **Multi-tenant:** Separar empresas en diferentes redes/keys
