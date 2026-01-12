// js/main.js

document.addEventListener('DOMContentLoaded', () => {
    // 1. 網頁載入後，自動幫所有 .nav-btn 加上點擊監聽
    const navBtns = document.querySelectorAll('.nav-btn');
    
    navBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // 2. 抓取按鈕上的 data-target 屬性 (例如 "qr", "utm")
            const targetId = btn.getAttribute('data-target');
            // 3. 呼叫切換函式，並把「被點擊的按鈕元素」傳進去
            switchTab(targetId, e.currentTarget);
        });
    });
});

// --- 分頁切換邏輯 ---
function switchTab(tabId, currentBtn) {
    // 移除導覽列按鈕的 active 樣式
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    
    // 移除所有功能區塊的 active 樣式 (隱藏內容)
    document.querySelectorAll('.tool-section').forEach(section => section.classList.remove('active'));
    
    // 加上當前點擊按鈕的 active
    if (currentBtn) {
        currentBtn.classList.add('active');
    }
    
    // 顯示對應的內容區塊
    const target = document.getElementById('tab-' + tabId);
    if(target) {
        target.classList.add('active');
    }
}

// --- 共用彈跳通知函式 ---
function showToast(message) {
    // 取得我們剛剛在 index.html 建立的共用元素
    const toast = document.getElementById("global-toast");
    if (!toast) return;

    // 設定文字
    toast.innerText = message;
    
    // 加上 .show 類別讓它顯示
    toast.className = "toast-msg show success";

    // 3 秒後移除 .show 讓它消失
    setTimeout(function(){ 
        toast.className = toast.className.replace("show", ""); 
    }, 3000);
}