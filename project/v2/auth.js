/* global google, msal */
//
// OAuth client configuration for DPS Desk SPA.
//
// Where to get the Client IDs:
//   Google     -> https://console.cloud.google.com/apis/credentials
//                 Create "OAuth 2.0 Client ID", type "Web application".
//                 Authorized JavaScript origins: http://localhost:5173 (dev) + production origin.
//                 (No client secret needed: this is a public SPA using implicit token flow.)
//
//   Microsoft  -> https://portal.azure.com/ -> App registrations -> New registration
//                 Platform: "Single-page application" (SPA, not "Web").
//                 Redirect URI: http://localhost:5173/DPS%20DESK%20v2.html  (dev) + production URL.
//
// Two ways to set the IDs:
//   (a) Edit the placeholders below.
//   (b) From the browser devtools console (no rebuild needed):
//         localStorage.setItem('AUTH_GOOGLE_CLIENT_ID',    '12345-xyz.apps.googleusercontent.com')
//         localStorage.setItem('AUTH_MICROSOFT_CLIENT_ID', '00000000-0000-0000-0000-000000000000')
//         localStorage.setItem('AUTH_MICROSOFT_AUTHORITY', 'https://login.microsoftonline.com/<tenant-id-or-common>')

const _ls = (k) => { try { return localStorage.getItem(k) || ''; } catch (e) { return ''; } };

window.AUTH_CONFIG = {
  google: {
    clientId: _ls('AUTH_GOOGLE_CLIENT_ID') || 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com',
    scopes: 'openid email profile',
  },
  microsoft: {
    clientId: _ls('AUTH_MICROSOFT_CLIENT_ID') || 'YOUR_MICROSOFT_CLIENT_ID',
    // 'common' lets any Microsoft account sign in. Replace with your tenant id for org-only.
    authority: _ls('AUTH_MICROSOFT_AUTHORITY') || 'https://login.microsoftonline.com/common',
    redirectUri: window.location.origin + window.location.pathname,
    scopes: ['openid', 'profile', 'email', 'User.Read'],
  },
};

const _isPlaceholder = (v) => !v || v.indexOf('YOUR_') === 0 || v.indexOf('.YOUR_') !== -1;

window.AUTH = {
  isGoogleConfigured() {
    return !_isPlaceholder(window.AUTH_CONFIG.google.clientId);
  },
  isMicrosoftConfigured() {
    return !_isPlaceholder(window.AUTH_CONFIG.microsoft.clientId);
  },

  signInWithGoogle() {
    return new Promise((resolve, reject) => {
      if (!this.isGoogleConfigured()) {
        return reject(new Error('Falta GOOGLE_CLIENT_ID. Configúralo en auth.js o en localStorage (AUTH_GOOGLE_CLIENT_ID).'));
      }
      if (!window.google || !google.accounts || !google.accounts.oauth2) {
        return reject(new Error('Google Identity Services no cargó. Revisa conexión a accounts.google.com.'));
      }
      const tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: window.AUTH_CONFIG.google.clientId,
        scope: window.AUTH_CONFIG.google.scopes,
        callback: async (resp) => {
          if (resp.error) return reject(new Error(resp.error_description || resp.error));
          try {
            const r = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: { Authorization: 'Bearer ' + resp.access_token },
            });
            if (!r.ok) return reject(new Error('No se pudo leer el perfil de Google.'));
            const u = await r.json();
            resolve({
              provider: 'google',
              name: u.name || u.email,
              email: u.email,
              picture: u.picture || null,
              accessToken: resp.access_token,
            });
          } catch (e) {
            reject(e);
          }
        },
        error_callback: (err) => reject(new Error((err && (err.message || err.type)) || 'Cancelado')),
      });
      tokenClient.requestAccessToken({ prompt: 'select_account' });
    });
  },

  _msalInstance: null,
  async _getMsal() {
    if (!window.msal || !msal.PublicClientApplication) {
      throw new Error('MSAL no cargó. Revisa el script de @azure/msal-browser.');
    }
    if (!this._msalInstance) {
      const cfg = window.AUTH_CONFIG.microsoft;
      this._msalInstance = new msal.PublicClientApplication({
        auth: {
          clientId: cfg.clientId,
          authority: cfg.authority,
          redirectUri: cfg.redirectUri,
        },
        cache: { cacheLocation: 'localStorage' },
      });
      if (typeof this._msalInstance.initialize === 'function') {
        await this._msalInstance.initialize();
      }
    }
    return this._msalInstance;
  },

  async signInWithMicrosoft() {
    if (!this.isMicrosoftConfigured()) {
      throw new Error('Falta MICROSOFT_CLIENT_ID. Configúralo en auth.js o en localStorage (AUTH_MICROSOFT_CLIENT_ID).');
    }
    const instance = await this._getMsal();
    const result = await instance.loginPopup({
      scopes: window.AUTH_CONFIG.microsoft.scopes,
      prompt: 'select_account',
    });
    if (!result || !result.account) throw new Error('Sesión no establecida.');
    instance.setActiveAccount(result.account);
    return {
      provider: 'microsoft',
      name: result.account.name || result.account.username,
      email: result.account.username,
      picture: null,
      accessToken: result.accessToken,
      idToken: result.idToken,
    };
  },

  async signOut() {
    try {
      if (this._msalInstance) {
        const acct = this._msalInstance.getActiveAccount();
        if (acct) await this._msalInstance.logoutPopup({ account: acct });
      }
    } catch (e) { /* ignore */ }
  },
};
