// ============================================================
//  UAS Manager — Service Worker v1.0
//  Stratégie : Cache-First pour assets statiques
//              Network-First pour APIs externes
// ============================================================

const CACHE_NAME = 'uas-manager-v1.0.0';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/sw.js'
];

// APIs externes — toujours réseau (jamais mis en cache)
const NETWORK_ONLY = [
  'api.checkwx.com',
  'api.openweathermap.org',
  'opensky-network.org',
  'sofia-briefing.aviation-civile.gouv.fr'
];

// ── Installation ─────────────────────────────────────────────
self.addEventListener('install', event => {
  console.log('[SW] Installation v1.0.0');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Mise en cache des assets statiques');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
      .catch(err => console.warn('[SW] Erreur cache install:', err))
  );
});

// ── Activation & nettoyage anciens caches ────────────────────
self.addEventListener('activate', event => {
  console.log('[SW] Activation');
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

  // APIs externes → réseau uniquement, pas de cache
  const isNetworkOnly = NETWORK_ONLY.some(domain => url.hostname.includes(domain));
  if (isNetworkOnly) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Assets statiques → Cache-First avec fallback réseau
  if (event.request.method === 'GET') {
    event.respondWith(
      caches.match(event.request)
        .then(cached => {
          if (cached) {
            // Mise à jour en arrière-plan (stale-while-revalidate)
            const fetchPromise = fetch(event.request)
              .then(networkResp => {
                if (networkResp && networkResp.status === 200) {
                  caches.open(CACHE_NAME)
                    .then(cache => cache.put(event.request, networkResp.clone()));
                }
                return networkResp;
              })
              .catch(() => {/* réseau indisponible, on garde le cache */});
            return cached;
          }
          // Pas en cache → réseau puis mise en cache
          return fetch(event.request)
            .then(networkResp => {
              if (!networkResp || networkResp.status !== 200 || networkResp.type === 'opaque') {
                return networkResp;
              }
              const toCache = networkResp.clone();
              caches.open(CACHE_NAME)
                .then(cache => cache.put(event.request, toCache));
              return networkResp;
            })
            .catch(() => {
              // Fallback offline → page d'accueil
              if (event.request.destination === 'document') {
                return caches.match('/index.html');
              }
            });
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
