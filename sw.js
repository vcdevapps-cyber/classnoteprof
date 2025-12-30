const CACHE_NAME = 'classnote-v4'; // Atualizado para forçar atualização
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
];

// 1. Instalação: Cacheia os arquivos estáticos
self.addEventListener('install', (event) => {
  self.skipWaiting(); // Força o SW a ativar imediatamente
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching all assets');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// 2. Ativação: Limpa caches antigos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        if (key !== CACHE_NAME) {
          return caches.delete(key);
        }
      }));
    })
  );
  self.clients.claim(); // Controla a página imediatamente
});

// 3. Fetch: Estratégia "Cache First, falling back to Network"
// Isso faz o app carregar instantaneamente, mesmo offline.
self.addEventListener('fetch', (event) => {
  // Ignora requisições que não sejam http (ex: chrome-extension)
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Se achou no cache, retorna
      if (cachedResponse) {
        return cachedResponse;
      }
      
      // Se não, busca na rede
      return fetch(event.request).then((response) => {
        // Não cacheia respostas inválidas
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        // Cacheia a nova requisição para a próxima vez
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      }).catch(() => {
        // Se estiver offline e não tiver no cache, tenta servir o index
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
