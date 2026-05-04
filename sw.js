// ============================================================
//  UAS Manager — Service Worker v2.0
//  Stratégie : Cache-First pour assets statiques
//              Network-First pour APIs externes
// ============================================================

const CACHE_NAME = 'uas-manager-v2.0.0';

const STATIC_ASSETS = [
  '/UAS-MANAGER/',
  '/UAS-MANAGER/index.html',
  '/UAS-MANAGER/config.html',
  '/UAS-MANAGER/vols.html',
  '/UAS-MANAGER/maintenance.html',
  '/UAS-MANAGER/checklist.html',
  '/UAS-MANAGER/rex.html',
  '/UAS-MANAGER/meteo.html',
  '/UAS-MANAGER/adsb.html',
  '/UAS-MANAGER/zones.html',
  '/UAS-MANAGER/notification.html',
  '/UAS-MANAGER/planificateur.html',
  '/UAS-MANAGER/clients.html',
  '/UAS-MANAGER/rapport.html',
  '/UAS-MANAGER/dashboard.html',
  '/UAS-MANAGER/statistiques.html',
  '/UAS-MANAGER/briefing.html',
  '/UAS-MANAGER/bilans.html',
  '/UAS-MANAGER/dji_logs.html',
  '/UAS-MANAGER/replay.html',
  '/UAS-MANAGER/formations.html',
  '/UAS-MANAGER/alertes.html',
  '/UAS-MANAGER/rgpd.html',
  '/UAS-MANAGER/manifest.json',
  '/UAS-MANAGER/sw.js'
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
  console.log('[SW] Installation v2.0.0');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Mise en cache des assets statiques');
        // Ajout progressif — ignorer les erreurs individuelles
        return Promise.allSettled(
          STATIC_ASSETS.map(url => cache.add(url).catch(e => console.warn('[SW] Impossible de cacher:', url, e)))
        );
      })
      .then(() => self.skipWaiting())
  );
});

// ── Activation & nettoyage anciens caches ────────────────────
self.addEventListener('activate', event => {
  console.log('[SW] Activation v2.0.0');
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => {
            console.log('[SW] Suppression ancien cache:', key);
            return caches.delete(key);
          })
      ))
      .then(() => self.clients.claim())
  );
});

// ── Fetch : stratégie hybride ─────────────────────────────────
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // APIs externes → réseau uniquement
  const isNetworkOnly = NETWORK_ONLY_DOMAINS.some(domain => url.hostname.includes(domain));
  if (isNetworkOnly) {
    event.respondWith(fetch(event.request).catch(() => new Response('', {status: 503})));
    return;
  }

  // IGN / Tuiles cartographiques → réseau avec cache
  const isMapTile = url.hostname.includes('geopf.fr') ||
                    url.hostname.includes('openstreetmap.org') ||
                    url.hostname.includes('arcgisonline.com') ||
                    url.hostname.includes('opentopomap.org');

  if (isMapTile && event.request.method === 'GET') {
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        return fetch(event.request).then(resp => {
          if (resp && resp.status === 200 && resp.type !== 'opaque') {
            const clone = resp.clone();
            caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
          }
          return resp;
        }).catch(() => new Response('', {status: 503}));
      })
    );
    return;
  }

  // Assets statiques → Cache-First avec revalidation en arrière-plan
  if (event.request.method === 'GET') {
    event.respondWith(
      caches.match(event.request).then(cached => {
        const networkFetch = fetch(event.request).then(networkResp => {
          if (networkResp && networkResp.status === 200) {
            caches.open(CACHE_NAME).then(c => c.put(event.request, networkResp.clone()));
          }
          return networkResp;
        }).catch(() => null);

        return cached || networkFetch.then(r => r || caches.match('/UAS-MANAGER/index.html'));
      })
    );
  }
});

// ── Messages depuis l'app ─────────────────────────────────────
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});
