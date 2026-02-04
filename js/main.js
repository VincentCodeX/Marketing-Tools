// ==========================================
// Marketing Tools - 優化版主程式
// 流暢互動 + 進階功能
// ==========================================

// === 1. 應用程式主物件 ===
const MarketingTools = {
    // 初始化
    init() {
        this.setupNavigation();
        this.setupToast();
        this.addLoadingEffects();
        this.setupAccessibility();
        console.log('✅ Marketing Tools 已載入');
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

    // 切換分頁（帶動畫）
    switchTab(tabId, currentBtn) {
        // 移除所有按鈕的 active
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // 隱藏所有內容區塊（帶淡出效果）
        document.querySelectorAll('.tool-section').forEach(section => {
            if (section.classList.contains('active')) {
                section.style.animation = 'fadeOut 0.2s ease';
                setTimeout(() => {
                    section.classList.remove('active');
                    section.style.animation = '';
                }, 200);
            }
        });
        
        // 激活當前按鈕
        if (currentBtn) {
            currentBtn.classList.add('active');
            this.createRipple(currentBtn);
        }
        
        // 顯示對應內容（帶淡入效果）
        setTimeout(() => {
            const target = document.getElementById('tab-' + tabId);
            if (target) {
                target.classList.add('active');
                this.scrollToTop();
            }
        }, 200);
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
        // 為卡片添加進場動畫
        const cards = document.querySelectorAll('.platform-card, .symbol-group-card');
        cards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.animation = `fadeInUp 0.5s ease forwards ${index * 0.05}s`;
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
});

// === 4. 向後兼容的全域函式 ===
// 保留舊的 switchTab 和 showToast 函式名稱
function switchTab(tabId, currentBtn) {
    MarketingTools.switchTab(tabId, currentBtn);
}

function showToast(message, type = 'success') {
    MarketingTools.showToast(message, type);
}

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
