// ============================================================
//  UAS Manager — Service Worker v2.1
//  Fonctionne sur GitHub Pages (/UAS-MANAGER/) et Capacitor (/)
// ============================================================

const CACHE_NAME = 'uas-manager-v2.1.0';

// Détection automatique du chemin de base (GitHub Pages vs Capacitor)
const BASE = (() => {
  const m = self.location.pathname.match(/^(\/[^/]+)\/sw\.js$/);
  return (m && m[1] !== '/capacitor') ? m[1] : '';
})();

const PAGES = [
  'index.html', 'config.html', 'vols.html', 'maintenance.html',
  'checklist.html', 'rex.html', 'meteo.html', 'adsb.html',
  'zones.html', 'notification.html', 'planificateur.html', 'clients.html',
  'rapport.html', 'dashboard.html', 'statistiques.html', 'briefing.html',
  'bilans.html', 'dji_logs.html', 'replay.html', 'formations.html',
  'alertes.html', 'rgpd.html', 'privacy.html', 'manifest.json'
];

const STATIC_ASSETS = [
  BASE + '/',
  ...PAGES.map(p => BASE + '/' + p)
];

// APIs externes — réseau uniquement, jamais en cache
const NETWORK_ONLY_DOMAINS = [
  'api.checkwx.com',
  'api.openweathermap.org',
  'opensky-network.org',
  'sofia-briefing.aviation-civile.gouv.fr',
  'api.adsb.lol',
  'api.airplanes.live',
  'data.hellosky.net',
  'alphatango.aviation-civile.gouv.fr',
];

// ── Installation ─────────────────────────────────────────────
self.addEventListener('install', event => {
  console.log('[SW] Installation v2.1.0 — BASE:', BASE || '(root)');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => Promise.allSettled(
        STATIC_ASSETS.map(url =>
          cache.add(url).catch(e => console.warn('[SW] Skip:', url, e.message))
        )
      ))
      .then(() => self.skipWaiting())
  );
});

// ── Activation & nettoyage anciens caches ────────────────────
self.addEventListener('activate', event => {
  console.log('[SW] Activation v2.1.0');
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// ── Fetch : stratégie hybride ─────────────────────────────────
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // APIs externes → réseau uniquement
  if (NETWORK_ONLY_DOMAINS.some(d => url.hostname.includes(d))) {
    event.respondWith(fetch(event.request).catch(() => new Response('', {status: 503})));
    return;
  }

  // Tuiles cartographiques → cache avec revalidation
  const isMapTile = ['geopf.fr','openstreetmap.org','arcgisonline.com','opentopomap.org']
    .some(d => url.hostname.includes(d));

  if (isMapTile && event.request.method === 'GET') {
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        return fetch(event.request).then(resp => {
          if (resp && resp.status === 200 && resp.type !== 'opaque') {
            caches.open(CACHE_NAME).then(c => c.put(event.request, resp.clone()));
          }
          return resp;
        }).catch(() => new Response('', {status: 503}));
      })
    );
    return;
  }

  // Assets statiques → Cache-First + revalidation en arrière-plan
  if (event.request.method === 'GET') {
    event.respondWith(
      caches.match(event.request).then(cached => {
        const networkFetch = fetch(event.request).then(resp => {
          if (resp && resp.status === 200) {
            caches.open(CACHE_NAME).then(c => c.put(event.request, resp.clone()));
          }
          return resp;
        }).catch(() => null);

        return cached || networkFetch.then(r => r || caches.match(BASE + '/index.html'));
      })
    );
  }
});

// ── Messages depuis l'app ─────────────────────────────────────
self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
  if (event.data?.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});
