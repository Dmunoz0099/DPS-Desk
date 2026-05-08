// Estado por defecto de window.MOCK.
//
// Network (COMPANIES / LOCALES / DEVICES) viene del backend vía window.API.
// Si el backend está caído, la consola muestra vacío — no inventamos datos.
//
// EVENTS y CONN_SERIES siguen siendo demo locales porque todavía no hay
// endpoints en el backend para actividad/serie de conectividad.

const COMPANIES = [];
const LOCALES = [];
const DEVICES = [];

// Recent events / activity log (demo)
const EVENTS = [];

// 24h connectivity series — placeholder neutral
const CONN_SERIES = Array.from({ length: 24 }, () => 0);

// Estructura jerárquica que la pantalla Network usa. Vacía hasta que
// api.js termine de hacer fetch — todos los componentes deben aguantar
// COMPANIES_FULL=[] sin reventar.
const COMPANIES_FULL = [];

window.MOCK = { COMPANIES, LOCALES, DEVICES, EVENTS, CONN_SERIES, COMPANIES_FULL };
