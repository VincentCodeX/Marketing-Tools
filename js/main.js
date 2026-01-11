// --- 分頁切換邏輯 ---
function switchTab(tabId) {
    // 移除導覽列按鈕的 active 樣式
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    // 移除所有功能區塊的 active 樣式 (隱藏內容)
    document.querySelectorAll('.tool-section').forEach(section => section.classList.remove('active'));
    
    // 加上當前點擊按鈕的 active
    event.currentTarget.classList.add('active');
    // 顯示對應的內容區塊
    const target = document.getElementById('tab-' + tabId);
    if(target) target.classList.add('active');
}
