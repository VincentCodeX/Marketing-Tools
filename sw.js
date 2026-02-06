// ==========================================
// Service Worker - 离线支持 + 缓存策略
// ==========================================

const CACHE_NAME = 'marketing-tools-v1';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/style.css',
    '/js/main.js',
    '/js/qrcode.js',
    '/js/utm.js',
    '/js/urlShortener.js',
    '/js/imageTool.js',
    '/js/ocr.js',
    '/js/ads.js',
    '/js/emoji.js',
    '/favicon.png'
];

const EXTERNAL_CACHE = [
    'https://fonts.googleapis.com',
    'https://fonts.gstatic.com',
    'https://unpkg.com/qr-code-styling@1.5.0/lib/qr-code-styling.js',
    'https://cdn.jsdelivr.net/npm/browser-image-compression@2.0.2/dist/browser-image-compression.js',
    'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js'
];

// === 安装事件：缓存本地和关键资源 ===
self.addEventListener('install', (event) => {
    console.log('🔧 Service Worker 正在安装...');
    
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('📦 缓存本地资源');
            return cache.addAll(ASSETS_TO_CACHE).catch((error) => {
                console.warn('⚠️ 某些资源缓存失败（可能是外部资源）:', error);
                // 继续，不让安装失败
                return Promise.resolve();
            });
        })
    );
    
    // 跳过等待，立即激活
    self.skipWaiting();
});

// === 激活事件：清理旧缓存 ===
self.addEventListener('activate', (event) => {
    console.log('✅ Service Worker 已激活');
    
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log(`🗑️ 删除旧缓存: ${cacheName}`);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    
    // 激活后立即控制所有客户端
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
                <title>离线模式</title>
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
                    <h1>离线模式</h1>
                    <p>您目前处于离线状态，但您可以使用已缓存的内容。</p>
                    <p style="margin-top: 20px; font-size: 12px; color: #999;">
                        该应用已支持 PWA 离线功能！请稍后恢复网络连接。
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
