/* global React */
const { useState, useEffect, useRef, useMemo } = React;

// --- Tiny inline SVG icon set (no external dep) ---
const Icon = ({ name, size = 16, stroke = 1.75, className = '', style }) => {
  const paths = {
    dashboard: <><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></>,
    network:   <><circle cx="12" cy="5" r="2.5"/><circle cx="5" cy="19" r="2.5"/><circle cx="19" cy="19" r="2.5"/><path d="M12 7.5v3M10 12 6.5 17M14 12l3.5 5"/></>,
    settings:  <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8L4.2 7a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/></>,
    bell:      <><path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></>,
    sun:       <><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></>,
    moon:      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z"/>,
    search:    <><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></>,
    plus:      <><path d="M12 5v14M5 12h14"/></>,
    chevronR:  <path d="m9 6 6 6-6 6"/>,
    chevronD:  <path d="m6 9 6 6 6-6"/>,
    chevronL:  <path d="m15 6-6 6 6 6"/>,
    arrowRt:   <><path d="M5 12h14M13 5l7 7-7 7"/></>,
    monitor:   <><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></>,
    server:    <><rect x="3" y="3" width="18" height="7" rx="1.5"/><rect x="3" y="14" width="18" height="7" rx="1.5"/><path d="M7 6.5h.01M7 17.5h.01"/></>,
    building:  <><rect x="4" y="3" width="16" height="18" rx="1.5"/><path d="M9 9h.01M15 9h.01M9 13h.01M15 13h.01M9 17h.01M15 17h.01"/></>,
    store:     <><path d="M3 9 4.5 4h15L21 9M3 9v11h18V9M3 9h18M9 14h6"/></>,
    laptop:    <><rect x="3" y="4" width="18" height="12" rx="2"/><path d="M2 20h20"/></>,
    user:      <><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>,
    users:     <><circle cx="9" cy="8" r="3.5"/><path d="M2 21a7 7 0 0 1 14 0"/><circle cx="17" cy="8" r="3"/><path d="M22 21a5.5 5.5 0 0 0-5.5-5.5"/></>,
    logout:    <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></>,
    lock:      <><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></>,
    mail:      <><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/></>,
    eye:       <><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></>,
    eyeOff:    <><path d="m4 4 16 16"/><path d="M9.6 5.2A10 10 0 0 1 12 5c6 0 10 7 10 7a17 17 0 0 1-3 3.7"/><path d="M14.1 14.1A3 3 0 0 1 9.9 9.9"/><path d="M2 12s2-3.5 5.4-5.6"/></>,
    google:    <><path fill="#4285F4" d="M21.35 11.1H12v3.2h5.36c-.23 1.4-1.66 4.1-5.36 4.1-3.23 0-5.86-2.67-5.86-5.96S8.77 6.5 12 6.5c1.84 0 3.07.78 3.78 1.45l2.58-2.5C16.79 3.96 14.6 3 12 3 6.93 3 2.83 7.05 2.83 12.1S6.93 21.2 12 21.2c6.93 0 9.5-4.86 9.5-7.36 0-.5-.05-.92-.15-1.74Z"/></>,
    refresh:   <><path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/></>,
    download:  <><path d="M12 4v12M6 12l6 6 6-6M4 21h16"/></>,
    upload:    <><path d="M12 20V8M6 12l6-6 6 6M4 3h16"/></>,
    terminal:  <><path d="m4 7 5 5-5 5M11 17h9"/></>,
    file:      <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></>,
    link:      <><path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1"/><path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/></>,
    moreH:     <><circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/></>,
    edit:      <><path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></>,
    trash:     <><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6"/></>,
    check:     <path d="m5 13 4 4L19 7"/>,
    x:         <><path d="M18 6 6 18M6 6l18 18"/></>,
    info:      <><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></>,
    activity:  <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>,
    shield:    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/>,
    key:       <><circle cx="8" cy="15" r="4"/><path d="m21 2-9.6 9.6M15.5 7.5l3 3L22 7l-3-3"/></>,
    cpu:       <><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 15h3M1 9h3M1 15h3"/></>,
    globe:     <><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2c2.5 3 4 6.5 4 10s-1.5 7-4 10c-2.5-3-4-6.5-4-10s1.5-7 4-10Z"/></>,
    zap:       <path d="m13 2-9 12h7l-1 8 9-12h-7l1-8Z"/>,
    map:       <><path d="m1 5 7-3 8 3 7-3v17l-7 3-8-3-7 3z"/><path d="M8 2v18M16 5v18"/></>,
    filter:    <path d="M3 4h18l-7 9v6l-4-2v-4z"/>,
    shieldCk:  <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/></>,
    bolt:      <path d="M12 2 4 14h7l-1 8 9-12h-7l1-8Z"/>,
    history:   <><circle cx="12" cy="12" r="10"/><path d="M12 7v5l3 2"/></>,
    sliders:   <><path d="M4 6h16M4 12h16M4 18h16"/><circle cx="8" cy="6" r="2"/><circle cx="14" cy="12" r="2"/><circle cx="6" cy="18" r="2"/></>,
    layers:    <><path d="m12 2 10 6-10 6L2 8z"/><path d="m2 16 10 6 10-6"/><path d="m2 12 10 6 10-6"/></>,
    bell0:     <><path d="M6 8a6 6 0 0 1 12 0"/><path d="M18 8c0 7 3 9 3 9H3s3-2 3-9"/><path d="m2 2 20 20"/></>,
  };
  const p = paths[name];
  if (!p) return null;
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>{p}</svg>
  );
};

window.Icon = Icon;
