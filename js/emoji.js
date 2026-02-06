// --- 符號工具邏輯 ---
const symbolsData = [ { title: "常用標點", items: ["、", "。", "，", "；", "：", "！", "？", "「」", "『』", "（）", "【】", "《》", "〈〉", "——", "……", "．", "～", "／", "＼", "＆", "＠", "＃", "％", "＊", "＋", "－", "＝"] }, { title: "特殊符號", items: ["→", "←", "↑", "↓", "↔", "↕", "⇒", "⇐", "★", "☆", "○", "●", "◎", "◇", "◆", "□", "■", "△", "▲", "▽", "▼", "❤", "♠", "♣", "✔", "✕", "✖", "©", "®", "™", "℃", "℉"] }, { title: "數學符號", items: ["±", "×", "÷", "≠", "≈", "≦", "≧", "∞", "Σ", "π", "√", "∝", "∈", "∉", "∩", "∪", "⊂", "⊃", "⊆", "⊇", "∀", "∃", "∧", "∨", "½", "¼", "¾"] }, { title: "數字符號", items: ["①", "②", "③", "④", "⑤", "⑥", "⑦", "⑧", "⑨", "⑩", "❶", "❷", "❸", "❹", "❺", "❻", "❼", "❽", "❾", "❿", "㈠", "㈡", "㈢", "㈣", "㈤", "㈥", "㈦", "㈧", "㈨", "㈩", "Ⅰ", "Ⅱ", "Ⅲ", "Ⅳ", "Ⅴ", "Ⅵ", "Ⅶ", "Ⅷ", "Ⅸ", "Ⅹ"] }, { title: "貨幣符號", items: ["$", "¥", "€", "£", "₩", "฿", "₹", "₽"] } ];
const emojisData = [ { title: "表情 / 心情", items: ["😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚", "😋", "😛", "😝", "😜", "🤪", "🤨", "🧐", "🤓", "😎", "🤩", "🥳", "😏", "😒", "😞", "😔", "😟", "😕", "🙁", "☹️", "😣", "😖", "😫", "😩", "🥺", "😢", "😭", "😤", "😠", "😡", "🤬", "🤯", "😳", "🥵", "🥶", "😱", "😨", "😰", "😥", "😓", "🤗", "🤔", "🤭", "🤫", "🤥", "😶", "😐", "😑", "😬", "🙄", "😯", "😦", "😧", "😮", "😲", "🥱", "😴", "🤤", "😪", "😵", "🤐", "🥴", "🤢", "🤮", "🤧", "😷", "🤒", "🤕", "🤑", "🤠", "😈", "👿", "💀", "👻", "💩", "🤡"] }, { title: "手勢 / 人物", items: ["👋", "🤚", "🖐", "✋", "🖖", "👌", "🤌", "🤏", "✌️", "🤞", "🤟", "🤘", "🤙", "👈", "👉", "👆", "🖕", "👇", "☝️", "👍", "👎", "✊", "👊", "🤛", "🤜", "👏", "🙌", "👐", "🤲", "🤝", "🙏", "💪", "💅", "🤳", "🙇", "💁", "🙅", "🙆", "🙋"] }, { title: "愛心 / 裝飾", items: ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "💟", "✨", "⭐️", "🌟", "💫", "⚡️", "🔥", "💥", "💢", "💦", "💨"] } ];
const kaomojiData = [ { title: "打招呼 / 開心", items: ["(o´・_・)o", "(=ﾟωﾟ)ﾉ", "( ´ ▽ ` )ﾉ", "o(ww)o", "(≧∇≦)/", "(*^▽^*)", "\\(★ω★)/", "(☆▽☆)", "(o^ ^o)", "(￣▽￣)"] }, { title: "可愛 / 撒嬌", items: ["(・ω<)", "(*≧ω≦)", "(///▽///)", "(◕‿◕)", "(つ✧ω✧)つ", "(づ￣ ³￣)づ", "(｡･ω･｡)ﾉ♡", "♡(> ਊ <)♡", "(*♡∀♡)"] }, { title: "生氣 / 翻桌", items: ["(╬ Ò ‸ Ó)", "(＃`Д´)", "( ` ω ´ )", "(ノಠ益ಠ)ノ", "(/ﾟДﾟ)/", "┻━┻ ︵ ヽ(°□°ヽ)", "(╯°□°）╯︵ ┻━┻", "(ノ｀Д´)ノ彡┻━┻", "ಠ_ಠ"] }, { title: "無奈 / 傷心", items: ["(￣ω￣;)", "(;´・`)>", "(T_T)", "(;´༎ຶД༎ຶ`)", "(ToT)", "(╥_╥)", "(´-﹏-`；)", "┐(‘～`；)┌", "(can_t help)"] } ];

// 渲染緩存 - 防止重複渲染
const renderCache = { symbols: false, emojis: false, kaomoji: false };

// 分批渲染 - 防止一次性渲染過多元素導致卡頓
function renderSymbolSectionInBatches(containerId, data, gridClass, btnClass = 'symbol-btn', batchSize = 5) {
    const container = document.getElementById(containerId);
    if (!container || container.children.length > 0) return; // 如果已渲染，跳過
    
    let groupIndex = 0;
    
    function renderNextBatch() {
        if (groupIndex >= data.length) return; // 全部渲染完成
        
        const endIndex = Math.min(groupIndex + batchSize, data.length);
        
        for (let i = groupIndex; i < endIndex; i++) {
            const group = data[i];
            const card = document.createElement('div');
            card.className = 'symbol-group-card';
            
            // 標題
            const header = document.createElement('div');
            header.className = 'symbol-card-header';
            header.textContent = group.title;
            card.appendChild(header);
            
            // 按鈕網格
            const grid = document.createElement('div');
            grid.className = `symbol-grid ${gridClass}`;
            
            group.items.forEach(item => {
                const btn = document.createElement('button');
                btn.className = btnClass;
                btn.textContent = item;
                btn.dataset.symbol = item;
                grid.appendChild(btn);
            });
            
            card.appendChild(grid);
            container.appendChild(card);
        }
        
        groupIndex = endIndex;
        
        // 使用 requestAnimationFrame 保持高幀率，避免卡頓
        if (groupIndex < data.length) {
            requestAnimationFrame(renderNextBatch);
        }
    }
    
    // 延遲開始渲染，避免搶占主線程的關鍵操作
    setTimeout(renderNextBatch, 50);
}

function switchSubTab(tabName) {
    // 更新按鈕活跃态
    document.querySelectorAll('.sub-nav-btn').forEach(btn => btn.classList.remove('active'));
    const activeBtn = Array.from(document.querySelectorAll('.sub-nav-btn')).find(b => b.dataset.value === tabName);
    if (activeBtn) activeBtn.classList.add('active');
    
    // 隱藏所有視圖并顯示目標視圖
    document.querySelectorAll('.sub-view').forEach(view => view.classList.remove('active'));
    
    // 首次訪問該分頁時才渲染（懶加載）
    if (tabName === 'symbols' && !renderCache.symbols) {
        renderSymbolSectionInBatches('view-symbols', symbolsData, 'grid-cols-8', 'symbol-btn', 5);
        renderCache.symbols = true;
    } else if (tabName === 'emojis' && !renderCache.emojis) {
        renderSymbolSectionInBatches('view-emojis', emojisData, 'grid-cols-emoji', 'symbol-btn', 5);
        renderCache.emojis = true;
    } else if (tabName === 'kaomoji' && !renderCache.kaomoji) {
        renderSymbolSectionInBatches('view-kaomoji', kaomojiData, 'grid-cols-kaomoji', 'symbol-btn kaomoji-btn', 3);
        renderCache.kaomoji = true;
    }
    
    // 顯示對應的視圖
    const viewMap = { symbols: 'view-symbols', emojis: 'view-emojis', kaomoji: 'view-kaomoji' };
    const viewId = viewMap[tabName];
    if (viewId) document.getElementById(viewId).classList.add('active');
}

// 事件委托複製（避免每個按鈕都有個 onclick）
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('symbol-btn') && e.target.dataset.symbol) {
        navigator.clipboard.writeText(e.target.dataset.symbol).then(() => {
            showToast(`已複製：${e.target.dataset.symbol}`);
        });
    }
});

// 初始化 Emoji 工具（支持动态加载）
function initEmojiTool() {
    // 只預先渲染第一個分頁（標點符號），使用分批渲染
    renderSymbolSectionInBatches('view-symbols', symbolsData, 'grid-cols-8', 'symbol-btn', 5);
    renderCache.symbols = true;
    console.log('✅ Emoji 工具已初始化');
}

// 页面加载时初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initEmojiTool);
} else {
    // DOM 已加载，立即初始化
    initEmojiTool();
}
