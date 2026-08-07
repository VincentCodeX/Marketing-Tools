// ==========================================
// Marketing Tools - 優化版主程式
// 流暢互動 + 進階功能
// ==========================================

// === 1. 應用程式主物件 ===
const MarketingTools = {
    // 初始化
    async init() {
        this.setupNavigation();
        this.loadActiveTabModule(); // 預先加載當前分頁的模組
        this.setupEventDelegation();
        this.setupToast();
        this.addLoadingEffects();
        this.setupAccessibility();
        // 將 CacheManager 初始化放在後台，不阻塞主流程
        CacheManager.init().catch(err => console.warn('快取初始化失敗:', err));
        console.log('✅ Marketing Tools 已載入');
    },

    // === 事件委托系統（統一處理 data-action 屬性）===
    setupEventDelegation() {
        // 事件動作映射表
        const actionMap = {
            'setQRType': (target) => window.setQRType?.(target.dataset.value),
            'updateQR': () => window.updateQR?.(),
            'downloadQR': () => window.downloadQR?.(),
            'handleLogoUpload': (target) => {
                const file = target.files?.[0];
                if (file) window.handleLogoUpload?.(target);
            },
            'triggerFileInput': (target) => document.getElementById(target.dataset.target)?.click(),
            'generateUTM': () => window.generateUTM?.(),
            'copyUTM': () => window.copyUTM?.(),
            'generateShortUrl': () => window.generateShortUrl?.(),
            'copyShortUrl': () => window.copyShortUrl?.(),
            'runCompression': () => window.runCompression?.(),
            'updateQualityVal': () => window.updateQualityVal?.(),
            'downloadImage': () => window.downloadImage?.(),
            'processImage': (target) => {
                const file = target.files?.[0];
                if (file) window.processImage?.(file);
            },
            'applyPreset': () => window.applyPreset?.(),
            'processOcr': (target) => {
                const file = target.files?.[0];
                if (file) window.processOcr?.(file);
            },
            'resetOcr': () => window.resetOcr?.(),
            'copyNotionFormat': () => window.copyNotionFormat?.(),
            'exportToCsv': () => window.exportToCsv?.(),
            'exportToJson': () => window.exportToJson?.(),
            'copyAdSize': (target) => window.copyAdSize?.(target.dataset.value),
            'renderCards': (target) => window.renderCards?.(target.value),
            'switchSubTab': (target) => window.switchSubTab?.(target.dataset.value),
        };

        // 委托點擊事件
        document.addEventListener('click', (e) => {
            const action = e.target.closest('[data-action]');
            if (action && action.tagName !== 'INPUT' && action.tagName !== 'SELECT' && action.tagName !== 'TEXTAREA') {
                const actionName = action.dataset.action;
                const handler = actionMap[actionName];
                if (handler) {
                    handler(action);
                }
            }
        });

        // 委托選擇變更事件
        document.addEventListener('change', (e) => {
            const action = e.target.closest('[data-action]');
            if (action && (action.tagName === 'SELECT' || action.tagName === 'INPUT')) {
                const actionName = action.dataset.action;
                const handler = actionMap[actionName];
                if (handler) {
                    handler(action);
                }
            }
        });

        // 委托輸入事件（用於實時更新）
        document.addEventListener('input', (e) => {
            const action = e.target.closest('[data-action]');
            if (action && (action.tagName === 'INPUT' || action.tagName === 'SELECT') && !action.type.match(/button|submit|checkbox|radio|file/)) {
                const actionName = action.dataset.action;
                const handler = actionMap[actionName];
                if (handler) {
                    // 使用節流避免過度觸發
                    clearTimeout(action._inputTimeout);
                    action._inputTimeout = setTimeout(() => {
                        handler(action);
                    }, 100);
                }
            }
        });

        console.log('✅ 事件委托系統已初始化');
    },

    // === 導航系統 ===
    setupNavigation() {
        const navBtns = document.querySelectorAll('.nav-btn');

        navBtns.forEach((btn, index) => {
            // 添加進場動畫延遲
            btn.style.animationDelay = `${index * 0.05}s`;

            btn.addEventListener('click', (e) => {
                const targetId = btn.getAttribute('data-target');
                this.switchTab(targetId, e.currentTarget);
            });
        });
    },

    // 預先加載當前分頁的模組
    loadActiveTabModule() {
        const activeBtn = document.querySelector('.nav-btn.active');
        if (activeBtn) {
            const targetId = activeBtn.getAttribute('data-target');
            ModuleLoader.loadModuleForTab(targetId);
        }
    },

    // 切換分頁（帶動畫）
    switchTab(tabId, currentBtn) {
        // 按需加载对应模块
        ModuleLoader.loadModuleForTab(tabId);

        // 移除所有按鈕的 active
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // 隱藏所有內容區塊（帶淡出效果）
        document.querySelectorAll('.tool-section').forEach(section => {
            if (section.classList.contains('active')) {
                section.style.animation = 'fadeOut 0.15s ease'; // 加快淡出
                setTimeout(() => {
                    section.classList.remove('active');
                    section.style.animation = '';
                }, 150); // 縮短等待時間
            }
        });

        // 激活當前按鈕
        if (currentBtn) {
            currentBtn.classList.add('active');
            this.createRipple(currentBtn);
        }

        // 顯示對應內容（帶淡入效果）
        // 稍微縮短延遲，讓互動更即時
        setTimeout(() => {
            const target = document.getElementById('tab-' + tabId);
            if (target) {
                target.classList.add('active');
                this.scrollToTop();
            }
        }, 150);
    },

    // === Toast 通知系統（改進版）===
    setupToast() {
        // 確保 Toast 容器存在
        if (!document.getElementById('global-toast')) {
            const toast = document.createElement('div');
            toast.id = 'global-toast';
            toast.className = 'toast-msg';
            document.body.appendChild(toast);
        }
    },

    showToast(message, type = 'success', duration = 3000) {
        const toast = document.getElementById('global-toast');
        if (!toast) return;

        // 圖示對應
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };

        // 設定內容和樣式
        toast.innerHTML = `
            <span style="font-size: 18px;">${icons[type] || '✓'}</span>
            <span>${message}</span>
        `;

        toast.className = `toast-msg ${type}`;

        // 觸發顯示動畫
        requestAnimationFrame(() => {
            toast.classList.add('show');
        });

        // 自動隱藏
        setTimeout(() => {
            toast.classList.remove('show');
        }, duration);
    },

    // === 水波紋效果 ===
    createRipple(element) {
        const ripple = document.createElement('span');
        const rect = element.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);

        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = '50%';
        ripple.style.top = '50%';
        ripple.style.position = 'absolute';
        ripple.style.borderRadius = '50%';
        ripple.style.transform = 'translate(-50%, -50%) scale(0)';
        ripple.style.background = 'rgba(255, 255, 255, 0.6)';
        ripple.style.pointerEvents = 'none';
        ripple.style.animation = 'ripple-effect 0.6s ease-out';

        element.style.position = 'relative';
        element.style.overflow = 'hidden';
        element.appendChild(ripple);

        setTimeout(() => ripple.remove(), 600);
    },

    // === 載入效果 ===
    addLoadingEffects() {
        // 為卡片添加進場動畫（使用 CSS 類避免重排）
        const cards = document.querySelectorAll('.platform-card, .symbol-group-card');
        cards.forEach((card, index) => {
            card.style.setProperty('animation-delay', `${index * 0.05}s`);
            card.classList.add('fade-in-up');
        });
    },

    // === 滾動到頂部 ===
    scrollToTop(smooth = true) {
        window.scrollTo({
            top: 0,
            behavior: smooth ? 'smooth' : 'auto'
        });
    },

    // === 無障礙功能 ===
    setupAccessibility() {
        // 鍵盤導航支援
        document.addEventListener('keydown', (e) => {
            // Tab 鍵高亮顯示
            if (e.key === 'Tab') {
                document.body.classList.add('keyboard-nav');
            }

            // Escape 關閉 Toast
            if (e.key === 'Escape') {
                const toast = document.getElementById('global-toast');
                if (toast) toast.classList.remove('show');
            }
        });

        // 滑鼠點擊移除鍵盤導航樣式
        document.addEventListener('mousedown', () => {
            document.body.classList.remove('keyboard-nav');
        });
    },

    // === 工具函式：複製到剪貼簿 ===
    async copyToClipboard(text, successMessage = '已複製') {
        try {
            await navigator.clipboard.writeText(text);
            this.showToast(successMessage, 'success');
            return true;
        } catch (err) {
            console.error('複製失敗:', err);
            this.showToast('複製失敗，請手動複製', 'error');
            return false;
        }
    },

    // === 工具函式：格式化檔案大小 ===
    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
    },

    // === 工具函式：防抖 ===
    debounce(func, delay = 300) {
        let timeoutId;
        return function (...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    },

    // === 工具函式：節流 ===
    throttle(func, limit = 300) {
        let inThrottle;
        return function (...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
};

// === 2. 動態 CSS 注入（添加額外動畫）===
const injectAnimations = () => {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes ripple-effect {
            to {
                transform: translate(-50%, -50%) scale(4);
                opacity: 0;
            }
        }
        
        @keyframes fadeOut {
            from { opacity: 1; transform: translateY(0); }
            to { opacity: 0; transform: translateY(-10px); }
        }
        
        .keyboard-nav *:focus {
            outline: 3px solid #3B82F6 !important;
            outline-offset: 2px;
        }
    `;
    document.head.appendChild(style);
};

// === 3. 頁面載入完成後初始化 ===
document.addEventListener('DOMContentLoaded', () => {
    MarketingTools.init();
    injectAnimations();
    setupLazyLoading();
    registerServiceWorker();
});

// === 3.5 Lazy Loading 支持 ===
const setupLazyLoading = () => {
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    if (img.dataset.src) {
                        img.src = img.dataset.src;
                        img.removeAttribute('data-src');
                    }
                    if (img.dataset.srcset) {
                        img.srcset = img.dataset.srcset;
                        img.removeAttribute('data-srcset');
                    }
                    observer.unobserve(img);
                }
            });
        }, {
            root: null,
            rootMargin: '50px',
            threshold: 0.01
        });

        document.querySelectorAll('img[data-src]').forEach((img) => {
            imageObserver.observe(img);
        });
    } else {
        // 回退：立即加載所有圖片
        document.querySelectorAll('img[data-src]').forEach((img) => {
            img.src = img.dataset.src;
        });
    }
};

// === 3.6 Service Worker 註冊 ===
const registerServiceWorker = () => {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
            .then((registration) => {
                console.log('✅ Service Worker 已註冊:', registration);

                // 檢查更新
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            // 新版本可用
                            console.log('📦 新版本已準備好，刷新頁面以更新');
                            // 可選：顯示通知讓用戶更新
                        }
                    });
                });
            })
            .catch((error) => {
                console.warn('⚠️ Service Worker 註冊失敗:', error);
            });

        // 監聽 Controller 變化
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            console.log('🔄 Service Worker 已更新');
            // 頁面已被新 Service Worker 接管
        });
    }
};

// === 8. IndexedDB 快取管理系統（API 響應緩存）===
const CacheManager = {
    dbName: 'MarketingTools',
    storeName: 'api-cache',
    db: null,

    // 初始化 IndexedDB
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, 1);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                console.log('✅ IndexedDB 已初始化');
                resolve(true);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    const store = db.createObjectStore(this.storeName, { keyPath: 'key' });
                    store.createIndex('timestamp', 'timestamp', { unique: false });
                    console.log('✅ IndexedDB 表已建立');
                }
            };
        });
    },

    // 保存快取
    async set(key, value, ttl = 3600000) { // 默認 1 小時
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);

            const data = {
                key,
                value,
                timestamp: Date.now(),
                expiry: Date.now() + ttl
            };

            const request = store.put(data);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                console.log(`💾 快取已保存: ${key}`);
                resolve(true);
            };
        });
    },

    // 取得快取
    async get(key) {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.get(key);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                const data = request.result;

                if (!data) {
                    resolve(null);
                    return;
                }

                // 檢查過期時間
                if (data.expiry && Date.now() > data.expiry) {
                    this.delete(key);
                    resolve(null);
                } else {
                    console.log(`📥 快取已取得: ${key}`);
                    resolve(data.value);
                }
            };
        });
    },

    // 刪除快取
    async delete(key) {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.delete(key);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                console.log(`🗑️ 快取已刪除: ${key}`);
                resolve(true);
            };
        });
    },

    // 清空所有快取
    async clear() {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.clear();

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                console.log('🗑️ 所有快取已清空');
                resolve(true);
            };
        });
    }
};

// === 7. 模組動態加載系統（代碼分割）===
const ModuleLoader = {
    loadedModules: new Set(),

    // 模組對應表（按需加載）
    moduleMap: {
        'qrcode': 'js/qrcode.js',
        'utm': 'js/utm.js',
        'shortener': 'js/urlShortener.js',
        'image': 'js/imageTool.js',
        'ocr': 'js/ocr.js',
        'ads': 'js/ads.js',
        'emoji': 'js/emoji.js'
    },

    // 異步加載指定模組
    async loadModule(moduleName) {
        if (this.loadedModules.has(moduleName)) {
            console.log(`📦 模組已加載: ${moduleName}`);
            return true;
        }

        const scriptUrl = this.moduleMap[moduleName];
        if (!scriptUrl) {
            console.warn(`⚠️ 未知模組: ${moduleName}`);
            return false;
        }

        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = scriptUrl;
            script.async = true;
            script.onload = () => {
                this.loadedModules.add(moduleName);
                console.log(`✅ 模組已加載: ${moduleName}`);
                resolve(true);
            };
            script.onerror = () => {
                console.error(`❌ 模組加載失敗: ${moduleName}`);
                reject(false);
            };
            document.head.appendChild(script);
        });
    },

    // 根據 Tab 頁籤按需加載
    loadModuleForTab(tabId) {
        const tabModuleMap = {
            'qr': 'qrcode',
            'utm': 'utm',
            'shorten': 'shortener',
            'compress': 'image',
            'ocr': 'ocr',
            'ads': 'ads',
            'emoji': 'emoji'
        };

        const moduleName = tabModuleMap[tabId];
        if (moduleName && !this.loadedModules.has(moduleName)) {
            this.loadModule(moduleName).catch(() => {
                MarketingTools.showToast(`${moduleName} 模組加載失敗，請重試`, 'error');
            });
        }
    }
};

function showToast(message, type = 'success') {
    MarketingTools.showToast(message, type);
}

// 暴露到 window 對象，供其他模組使用
window.showToast = showToast;

// === 5. 性能監控（開發用）===
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    window.addEventListener('load', () => {
        if (window.performance) {
            const perfData = window.performance.timing;
            const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
            console.log(`📊 頁面載入時間: ${pageLoadTime}ms`);
        }
    });
}

// === 6. 導出供其他模組使用 ===
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MarketingTools;
}
