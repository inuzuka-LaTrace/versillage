const CACHE_NAME = 'vanitisme-v1-2026';
const DATA_CACHE_NAME = 'vanitisme-data-v1';

// 421個のファイルを1つずつ書くのは現実的ではないため、
// 本来的にはビルド時にこの配列を自動生成するのが理想です。
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  // 主要なフォントやロゴなどのアセットをここに追加
];

// 1. インストール時：アプリケーション本体のキャッシュ
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('App Shellをプレキャッシュ中...');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting(); // 新しいSWをすぐに有効化
});

// 2. 有効化時：古いキャッシュの削除
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME && key !== DATA_CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
});

// 3. フェッチ時：キャッシュ優先（App Shell） + Stale-While-Revalidate（JSONデータ）
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // JSONデータ（/data/配下など）へのリクエストの場合
  if (url.pathname.includes('/data/') || url.pathname.endsWith('.json')) {
    event.respondWith(
      caches.open(DATA_CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          // ネットワークから最新版を取得しにいく（バックグラウンド更新）
          const fetchPromise = fetch(event.request).then((networkResponse) => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });

          // キャッシュがあればそれを返し、なければネットワーク待機
          return cachedResponse || fetchPromise;
        });
      })
    );
    return;
  }

  // それ以外の静的ファイルは Cache First
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
