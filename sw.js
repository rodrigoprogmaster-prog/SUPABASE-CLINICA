const CACHE_NAME = 'clinica-vanessa-v1';

// Instalação: Força o SW a assumir o controle imediatamente
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Ativação: Limpa caches antigos se houver atualização de versão
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Interceptação de requisições (Fetch)
self.addEventListener('fetch', (event) => {
  // Ignora requisições que não sejam GET (ex: POST, PUT) ou chrome-extensions
  if (event.request.method !== 'GET' || !event.request.url.startsWith('http')) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Estratégia Cache-First: Se estiver no cache, retorna imediatamente
      if (cachedResponse) {
        return cachedResponse;
      }

      // Se não estiver no cache, busca na rede
      return fetch(event.request)
        .then((networkResponse) => {
          // Verifica se a resposta é válida
          if (
            !networkResponse ||
            networkResponse.status !== 200 ||
            networkResponse.type === 'error'
          ) {
            return networkResponse;
          }

          // Clona a resposta para salvar no cache e retornar ao navegador
          const responseToCache = networkResponse.clone();

          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return networkResponse;
        })
        .catch(() => {
          // Se falhar (offline) e não estiver no cache, não faz nada (ou poderia retornar uma página de erro customizada)
          console.log('Offline: Recurso não disponível no cache nem na rede.');
        });
    })
  );
});