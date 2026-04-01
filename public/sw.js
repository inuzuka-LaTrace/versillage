// バージョン管理：ここを変えるだけで全ユーザーのキャッシュを強制更新できる
const CACHE_VERSION = 'v2026-04-02-01'; 
const ASSET_CACHE = `vanitisme-shell-${CACHE_VERSION}`;
const DATA_CACHE = `vanitisme-data-${CACHE_VERSION}`;

// 確実に存在するファイルだけを定義（ハッシュなしのもの）
const IMMUTABLE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/V3.png', // 新しく作ったアイコン
  // フォントなどはパスが固定ならここに入れる
];

// 1. Install：最小限のApp Shellを固める
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(ASSET_CACHE).then((cache) => cache.addAll(IMMUTABLE_ASSETS))
  );
  self.skipWaiting();
});

// 2. Activate：古いバージョンのキャッシュを「一掃」する
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== ASSET_CACHE && key !== DATA_CACHE) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim()) // すぐに制御を開始
  );
});

// 3. Fetch：戦略の使い分け
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 戦略A：JSONデータ（Stale-While-Revalidate）
  // 421個のファイルはここで「一度開けば保存、次からは即表示」される
  if (url.pathname.endsWith('.json')) {
    event.respondWith(handleDataRequest(request));
    return;
  }

  // 戦略B：静的アセット（Cache First）
  event.respondWith(
    caches.match(request).then((response) => {
      return response || fetch(request).then((networkResponse) => {
        // 動的キャッシュ：リストにないJS/CSSも、一度読み込めばキャッシュに保存
        return caches.open(ASSET_CACHE).then((cache) => {
          cache.put(request, networkResponse.clone());
          return networkResponse;
        });
      });
    })
  );
});

// JSONリクエスト専用のハンドラ
async function handleDataRequest(request) {
  const cache = await caches.open(DATA_CACHE);
  const cachedResponse = await cache.match(request);

  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch(() => null); // ネットワークエラー時は無視（キャッシュに頼る）

  return cachedResponse || fetchPromise;
}
