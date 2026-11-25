// ==========================================
// Service Worker - 離線支援 + 快取策略
// ==========================================

const CACHE_NAME = 'marketing-tools-v1.5'; // 每次修改 JS/CSS 需要更新此版本號
const EXTERNAL_CACHE_NAME = 'external-cache-v1';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './style.css',
    './manifest.json',
    './js/main.js',
    './js/qrcode.js',
    './js/utm.js',
    './js/urlShortener.js',
    './js/imageTool.js',
    './js/ocr.js',
    './js/ads.js',
    './js/emoji.js',
    './favicon.png'
];

// 首屏僅預先快取核心輕量 CDN，重型套件於實際使用時由 fetch 攔截自動快取，避免拖慢首次載入
const EXTERNAL_CACHE = [
    'https://cdn.jsdelivr.net/npm/qr-code-styling@1.5.0/lib/qr-code-styling.js'
];

// === 安裝事件：快取本地與關鍵資源 ===
self.addEventListener('install', (event) => {
    console.log('🔧 Service Worker 正在安裝...');
    
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('📦 快取本地資源');
            return cache.addAll(ASSETS_TO_CACHE).catch((error) => {
                console.warn('⚠️ 某些資源快取失敗（可能是外部資源）:', error);
                return Promise.resolve();
            }).then(() => {
                // 【重要】快取外部 CDN 資源，確保離線或網路不穩時仍可使用
                return caches.open(EXTERNAL_CACHE_NAME).then((externalCache) => {
                    console.log('📦 快取外部 CDN 資源');
                    return externalCache.addAll(EXTERNAL_CACHE).catch((error) => {
                        console.warn('⚠️ CDN 資源快取可能失敗（離線狀態）:', error);
                        return Promise.resolve();
                    });
                });
            });
        })
    );
    
    // 跳過等待，立即啟用
    self.skipWaiting();
});

// === 啟用事件：清理舊快取 ===
self.addEventListener('activate', (event) => {
    console.log('✅ Service Worker 已啟用');
    const validCaches = [CACHE_NAME, EXTERNAL_CACHE_NAME];
    
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (!validCaches.includes(cacheName)) {
                        console.log(`🗑️ 刪除舊快取: ${cacheName}`);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    
    // 啟用後立即控制所有用戶端
    self.clients.claim();
});

// === 拦截请求：缓存优先 + 网络回退策略 ===
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // 只拦截 HTTP/HTTPS 请求
    if (!url.protocol.startsWith('http')) {
        return;
    }

    // 导航请求（HTML）：网络优先，回退到缓存
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    // 缓存成功的响应
                    if (response.status === 200) {
                        const cacheResponse = response.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(request, cacheResponse);
                        });
                    }
                    return response;
                })
                .catch(() => {
                    // 网络错误，返回缓存版本
                    return caches.match(request).then((cachedResponse) => {
                        return cachedResponse || createOfflineResponse();
                    });
                })
        );
        return;
    }

    // 样式表、脚本、字体等资源：缓存优先策略
    if (
        request.destination === 'style' ||
        request.destination === 'script' ||
        request.destination === 'font' ||
        url.origin !== location.origin
    ) {
        event.respondWith(
            caches.match(request).then((cachedResponse) => {
                if (cachedResponse) {
                    // 后台更新缓存（不阻止响应）
                    fetch(request).then((response) => {
                        if (response.status === 200) {
                            caches.open(CACHE_NAME).then((cache) => {
                                cache.put(request, response);
                            });
                        }
                    }).catch(() => {
                        // 网络错误，继续使用缓存
                    });
                    return cachedResponse;
                }
                
                // 缓存中没有，尝试网络
                return fetch(request)
                    .then((response) => {
                        // 缓存成功的响应
                        if (response.status === 200) {
                            const cacheResponse = response.clone();
                            caches.open(CACHE_NAME).then((cache) => {
                                cache.put(request, cacheResponse);
                            });
                        }
                        return response;
                    })
                    .catch(() => {
                        // 网络错误，返回离线页面或默认资源
                        return createOfflineResponse();
                    });
            })
        );
        return;
    }

    // 其他请求（图片、API 等）：网络优先，回退到缓存
    event.respondWith(
        fetch(request)
            .then((response) => {
                // 缓存成功的响应
                if (response.status === 200 && request.method === 'GET') {
                    const cacheResponse = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(request, cacheResponse);
                    });
                }
                return response;
            })
            .catch(() => {
                // 网络错误，返回缓存版本
                return caches.match(request).then((cachedResponse) => {
                    return cachedResponse;
                });
            })
    );
});

// === 创建离线响应 ===
function createOfflineResponse() {
    return new Response(
        `<html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>離線模式</title>
                <style>
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans TC", sans-serif;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        height: 100vh;
                        margin: 0;
                        background: linear-gradient(120deg, #e0c3fc 0%, #8ec5fc 100%);
                    }
                    .offline-container {
                        text-align: center;
                        background: white;
                        padding: 40px;
                        border-radius: 16px;
                        box-shadow: 0 10px 40px rgba(0,0,0,0.1);
                    }
                    .offline-icon {
                        font-size: 64px;
                        margin-bottom: 20px;
                    }
                    h1 {
                        color: #1d1d1f;
                        margin: 0 0 10px;
                    }
                    p {
                        color: #86868b;
                        font-size: 14px;
                    }
                </style>
            </head>
            <body>
                <div class="offline-container">
                    <div class="offline-icon">📡</div>
                    <h1>離線模式</h1>
                    <p>您目前處於離線狀態，但仍可使用已快取的功能。</p>
                    <p style="margin-top: 20px; font-size: 12px; color: #999;">
                        此應用程式已支援 PWA 離線功能，請稍後恢復網路連線。
                    </p>
                </div>
            </body>
        </html>`,
        {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({ 'Content-Type': 'text/html; charset=utf-8' })
        }
    );
}

// === 后台同步（可选：未来用于离线操作队列）===
self.addEventListener('sync', (event) => {
    console.log('🔄 后台同步触发');
    // 未来可在这里添加队列同步逻辑
});

// === 推送通知（可选）===
self.addEventListener('push', (event) => {
    console.log('🔔 接收到推送通知');
    // 未来可在这里添加推送通知逻辑
});

console.log('✅ Service Worker 已加载');
