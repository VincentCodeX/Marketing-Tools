// --- 1. 分頁切換 ---
function switchTab(tabId) {
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tool-section').forEach(section => section.classList.remove('active'));
    event.currentTarget.classList.add('active');
    document.getElementById('tab-' + tabId).classList.add('active');
}

// --- 2. QR Code 邏輯 ---
let qrCodeObj;
document.addEventListener('DOMContentLoaded', function() {
    if(document.getElementById("qrcode-canvas")) {
        qrCodeObj = new QRCodeStyling({
            width: 300, height: 300, type: "svg", data: "https://github.com", image: "",
            dotsOptions: { color: "#2C3E50", type: "square" }, backgroundOptions: { color: "#ffffff" },
            imageOptions: { crossOrigin: "anonymous", margin: 10 }
        });
        qrCodeObj.append(document.getElementById("qrcode-canvas"));
    }
});

function updateQR() {
    const text = document.getElementById('qr-text').value || "https://github.com";
    const color = document.getElementById('qr-color').value;
    const correction = document.getElementById('qr-correction').value;
    const dotsType = document.getElementById('qr-dots-type').value;
    const cornerType = document.getElementById('qr-corner-type').value;
    qrCodeObj.update({ data: text, dotsOptions: { color: color, type: dotsType }, cornersSquareOptions: { type: cornerType }, qrOptions: { errorCorrectionLevel: correction } });
}
function handleLogoUpload(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function (e) { qrCodeObj.update({ image: e.target.result }); document.getElementById('logo-status').innerText = "✅ Logo 已載入"; }
        reader.readAsDataURL(input.files[0]);
    }
}
function setQRType(type) {
    const input = document.getElementById('qr-text');
    const btns = document.querySelectorAll('.type-btn');
    btns.forEach(b => b.classList.remove('active'));
    event.currentTarget.classList.add('active');
    input.placeholder = type === 'url' ? "https://example.com" : "請輸入任何文字...";
}
function downloadQR() { qrCodeObj.download({ name: "qrcode", extension: "png" }); }

// --- 3. GTM (UTM) 邏輯 ---
function generateUTM() {
    let url = document.getElementById('utm-url').value.trim();
    let source = document.getElementById('utm-source').value.trim();
    let medium = document.getElementById('utm-medium').value.trim();
    let campaign = document.getElementById('utm-campaign').value.trim();
    let content = document.getElementById('utm-content').value.trim();
    let resultDisplay = document.getElementById('final-url');

    if (!url) { resultDisplay.innerText = "請至少輸入「目標網址」..."; resultDisplay.style.color = "#ccc"; return; }
    let separator = url.includes('?') ? '&' : '?';
    let params = [];
    if (source) params.push(`utm_source=${encodeURIComponent(source)}`);
    if (medium) params.push(`utm_medium=${encodeURIComponent(medium)}`);
    if (campaign) params.push(`utm_campaign=${encodeURIComponent(campaign)}`);
    if (content) params.push(`utm_content=${encodeURIComponent(content)}`);

    if (params.length > 0) {
        let finalUrl = url + separator + params.join('&');
        resultDisplay.innerText = finalUrl; resultDisplay.style.color = "#2C3E50";
    } else { resultDisplay.innerText = url; }
}
function copyUTM() {
    const urlText = document.getElementById('final-url').innerText;
    if (!urlText || urlText.includes("請輸入")) return;
    navigator.clipboard.writeText(urlText).then(() => { const msg = document.getElementById('copy-msg'); msg.style.opacity = 1; setTimeout(() => { msg.style.opacity = 0; }, 2000); });
}

// --- 4. Short URL (is.gd) ---
async function generateShortUrl() {
    const longUrl = document.getElementById('long-url').value.trim();
    const resultBox = document.getElementById('short-result');
    const linkDisplay = document.getElementById('short-link');
    const btnText = document.getElementById('btn-text');
    const btnLoader = document.getElementById('btn-loader');
    const shortenBtn = document.getElementById('shorten-btn');

    if (!longUrl) { alert("請輸入網址！"); return; }

    btnText.style.display = 'none'; btnLoader.style.display = 'inline-block'; shortenBtn.disabled = true; resultBox.style.display = 'none';

    try {
        const apiUrl = `https://is.gd/create.php?format=simple&url=${encodeURIComponent(longUrl)}`;
        const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(apiUrl)}`;
        const response = await fetch(proxyUrl);
        if (response.ok) {
            const shortUrl = await response.text();
            linkDisplay.innerText = shortUrl; linkDisplay.href = shortUrl; resultBox.style.display = 'block';
        } else { alert("縮短失敗，請檢查網址。"); }
    } catch (error) { console.error(error); alert("連線錯誤，請稍後再試。"); } 
    finally { btnText.style.display = 'inline'; btnLoader.style.display = 'none'; shortenBtn.disabled = false; }
}
function copyShortUrl() {
    const urlText = document.getElementById('short-link').innerText;
    navigator.clipboard.writeText(urlText).then(() => { const msg = document.getElementById('short-copy-msg'); msg.style.opacity = 1; setTimeout(() => { msg.style.opacity = 0; }, 2000); });
}

// --- 5. 圖片壓縮邏輯 ---
let currentFile = null;
let compressedBlob = null;

function handleDragOver(e) { e.preventDefault(); document.getElementById('drop-zone').classList.add('dragover'); }
function handleDragLeave(e) { e.preventDefault(); document.getElementById('drop-zone').classList.remove('dragover'); }
function handleDrop(e) {
    e.preventDefault();
    document.getElementById('drop-zone').classList.remove('dragover');
    if (e.dataTransfer.files && e.dataTransfer.files[0]) processImage(e.dataTransfer.files[0]);
}

async function processImage(file) {
    if (!file.type.match('image.*')) { alert("請上傳圖片檔案"); return; }
    currentFile = file;
    document.getElementById('preview-empty').style.display = 'none';
    document.getElementById('preview-active').style.display = 'block';
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
        if(!document.getElementById('custom-width').value) {
            document.getElementById('custom-width').value = img.width;
            document.getElementById('custom-height').value = img.height;
        }
    };
    document.getElementById('info-original').innerText = formatSize(file.size);
    runCompression();
}

function applyPreset() {
    const preset = document.getElementById('preset-select').value;
    const wInput = document.getElementById('custom-width');
    const hInput = document.getElementById('custom-height');
    if (preset === 'custom') { } else if (preset === '800xauto') { wInput.value = 800; hInput.value = ''; } else { const [w, h] = preset.split('x'); wInput.value = w; hInput.value = h; }
    runCompression();
}

function updateQualityVal() {
    document.getElementById('quality-val').innerText = document.getElementById('quality').value;
    if(this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => { runCompression(); }, 500);
}

async function runCompression() {
    if (!currentFile) return;
    document.getElementById('loading-overlay').style.display = 'flex';
    const quality = parseFloat(document.getElementById('quality').value);
    const targetW = document.getElementById('custom-width').value;
    const format = document.getElementById('output-format').value;
    const options = { maxSizeMB: 50, useWebWorker: true, initialQuality: quality };
    if (targetW) options.maxWidthOrHeight = parseInt(targetW);
    if (format !== 'original') options.fileType = format;

    try {
        compressedBlob = await imageCompression(currentFile, options);
        document.getElementById('preview-compressed').src = URL.createObjectURL(compressedBlob);
        const saved = ((currentFile.size - compressedBlob.size) / currentFile.size * 100).toFixed(1);
        let color = saved > 0 ? '#10B981' : '#666';
        document.getElementById('info-compressed').innerHTML = `${formatSize(compressedBlob.size)} <span style="font-size:12px; color:${color};">(${saved > 0 ? '-' : ''}${Math.abs(saved)}%)</span>`;
    } catch (error) { console.error(error); alert("壓縮發生錯誤"); } 
    finally { document.getElementById('loading-overlay').style.display = 'none'; }
}

function downloadImage() {
    if(!compressedBlob) return;
    const link = document.createElement('a');
    link.href = URL.createObjectURL(compressedBlob);
    let ext = currentFile.name.split('.').pop();
    const format = document.getElementById('output-format').value;
    if(format === 'image/jpeg') ext = 'jpg';
    if(format === 'image/png') ext = 'png';
    if(format === 'image/webp') ext = 'webp';
    link.download = currentFile.name.replace(/\.[^/.]+$/, "") + '-opt.' + ext;
    link.click();
}

function formatSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

<script src='https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js'></script>

// 綁定三個複製按鈕
window.copyAllOcr = function() {
    const d = getOcrData();
    const text = `姓名: ${d.name}\n職稱: ${d.title}\n公司: ${d.company}\n電話: ${d.phone}\nEmail: ${d.email}\nLINE: ${d.line}\n統編: ${d.tax}`;
    navigator.clipboard.writeText(text).then(() => alert('已複製全部資料'));
}

// --- 7. 廣告規格邏輯 ---

const platformsData = [
    {
        name: "Facebook", class: "facebook",
        specs: [
            { title: "動態消息圖片", size: "1200 x 628", ratio: "1.91:1", type: "圖片" },
            { title: "動態消息正方形", size: "1080 x 1080", ratio: "1:1", type: "圖片" },
            { title: "限時動態 / Reels", size: "1080 x 1920", ratio: "9:16", type: "圖片/影片" },
            { title: "輪播廣告", size: "1080 x 1080", ratio: "1:1", type: "圖片" }
        ]
    },
    {
        name: "Instagram", class: "instagram",
        specs: [
            { title: "貼文正方形", size: "1080 x 1080", ratio: "1:1", type: "圖片" },
            { title: "貼文直式", size: "1080 x 1350", ratio: "4:5", type: "圖片" },
            { title: "限時動態 / Reels", size: "1080 x 1920", ratio: "9:16", type: "圖片/影片" }
        ]
    },
    {
        name: "Google Ads", class: "google",
        specs: [
            { title: "橫幅 (Landscape)", size: "1200 x 628", ratio: "1.91:1", type: "圖片" },
            { title: "方形 (Square)", size: "1200 x 1200", ratio: "1:1", type: "圖片" },
            { title: "直式 (Portrait)", size: "960 x 1200", ratio: "4:5", type: "圖片" }
        ]
    },
    {
        name: "LINE", class: "line",
        specs: [
            { title: "圖文訊息 (方形)", size: "1040 x 1040", ratio: "1:1", type: "圖片" },
            { title: "圖文訊息 (橫式)", size: "1040 x 520", ratio: "2:1", type: "圖片" },
            { title: "LINE VOOM", size: "1080 x 1080", ratio: "1:1", type: "圖片/影片" }
        ]
    },
    {
        name: "YouTube", class: "youtube",
        specs: [
            { title: "影片縮圖", size: "1280 x 720", ratio: "16:9", type: "圖片" },
            { title: "Shorts", size: "1080 x 1920", ratio: "9:16", type: "影片" },
            { title: "頻道封面", size: "2560 x 1440", ratio: "16:9", type: "圖片" }
        ]
    },
    {
        name: "Threads", class: "threads",
        specs: [
            { title: "貼文圖片", size: "1080 x 1350", ratio: "4:5", type: "圖片" },
            { title: "貼文正方形", size: "1080 x 1080", ratio: "1:1", type: "圖片" }
        ]
    }
];

function renderCards(filterValue) {
    const container = document.getElementById('gridContainer');
    if(!container) return; // 避免找不到元素報錯
    
    container.innerHTML = ''; 

    platformsData.forEach(platform => {
        if (filterValue !== 'all' && platform.name !== filterValue) return;

        const card = document.createElement('div');
        card.className = 'platform-card';
        
        const specsHtml = platform.specs.map(spec => {
            let typeClass = spec.type.includes('影片') ? 'tag-video' : 'tag-img';
            return `
            <div class="spec-item">
                <div class="spec-info">
                    <div class="spec-title">${spec.title}</div>
                    <div class="spec-details">
                        ${spec.size}
                        <span class="tag tag-ratio">${spec.ratio}</span>
                        <span class="tag ${typeClass}">${spec.type}</span>
                    </div>
                </div>
                <button class="copy-btn-small" onclick="copyAdSize('${spec.size}')" title="複製尺寸">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                </button>
            </div>
            `;
        }).join('');

        card.innerHTML = `
            <div class="card-header ${platform.class}">
                <span>${platform.name}</span>
                <span class="spec-count">${platform.specs.length}</span>
            </div>
            <div class="card-body">${specsHtml}</div>
        `;
        container.appendChild(card);
    });
}

function copyAdSize(text) {
    const cleanText = text.replace(/\s/g, ''); 
    navigator.clipboard.writeText(cleanText).then(() => {
        const toast = document.getElementById('ads-toast');
        toast.style.opacity = 1;
        setTimeout(() => { toast.style.opacity = 0; }, 2000);
    });
}

// --- 8. 符號/Emoji/顏文字工具邏輯 ---

// 1. 資料庫 (依照你的截圖分類)
const symbolsData = [
    {
        title: "常用標點",
        items: ["、", "。", "，", "；", "：", "！", "？", "「」", "『』", "（）", "【】", "《》", "〈〉", "——", "……", "．", "～", "／", "＼", "＆", "＠", "＃", "％", "＊", "＋", "－", "＝"]
    },
    {
        title: "特殊符號",
        items: ["→", "←", "↑", "↓", "↔", "↕", "⇒", "⇐", "★", "☆", "○", "●", "◎", "◇", "◆", "□", "■", "△", "▲", "▽", "▼", "❤", "♠", "♣", "✔", "✕", "✖", "©", "®", "™", "℃", "℉"]
    },
    {
        title: "數學符號",
        items: ["±", "×", "÷", "≠", "≈", "≦", "≧", "∞", "Σ", "π", "√", "∝", "∈", "∉", "∩", "∪", "⊂", "⊃", "⊆", "⊇", "∀", "∃", "∧", "∨", "½", "¼", "¾"]
    },
    {
        title: "數字符號",
        items: ["①", "②", "③", "④", "⑤", "⑥", "⑦", "⑧", "⑨", "⑩", "❶", "❷", "❸", "❹", "❺", "❻", "❼", "❽", "❾", "❿", "㈠", "㈡", "㈢", "㈣", "㈤", "㈥", "㈦", "㈧", "㈨", "㈩", "Ⅰ", "Ⅱ", "Ⅲ", "Ⅳ", "Ⅴ", "Ⅵ", "Ⅶ", "Ⅷ", "Ⅸ", "Ⅹ"]
    },
    {
        title: "貨幣符號",
        items: ["$", "¥", "€", "£", "₩", "฿", "₹", "₽"]
    }
];

const emojisData = [
    {
        title: "表情 / 心情",
        items: ["😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚", "😋", "😛", "😝", "😜", "🤪", "🤨", "🧐", "🤓", "😎", "🤩", "🥳", "😏", "😒", "😞", "😔", "😟", "😕", "🙁", "☹️", "😣", "😖", "😫", "😩", "🥺", "😢", "😭", "😤", "😠", "😡", "🤬", "🤯", "😳", "🥵", "🥶", "😱", "😨", "t😰", "😥", "😓", "🤗", "🤔", "🤭", "🤫", "🤥", "😶", "😐", "😑", "😬", "🙄", "😯", "😦", "😧", "😮", "😲", "🥱", "😴", "🤤", "😪", "😵", "🤐", "🥴", "🤢", "🤮", "🤧", "😷", "🤒", "🤕", "🤑", "🤠", "😈", "👿", "💀", "👻", "💩", "🤡"]
    },
    {
        title: "手勢 / 人物",
        items: ["👋", "🤚", "🖐", "✋", "🖖", "👌", "🤌", "🤏", "✌️", "🤞", "🤟", "🤘", "🤙", "👈", "👉", "👆", "🖕", "👇", "☝️", "👍", "👎", "✊", "👊", "🤛", "🤜", "👏", "🙌", "👐", "🤲", "🤝", "🙏", "💪", "💅", "🤳", "🙇", "💁", "🙅", "🙆", "🙋"]
    },
    {
        title: "愛心 / 裝飾",
        items: ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "💟", "✨", "⭐️", "🌟", "💫", "⚡️", "🔥", "💥", "💢", "💦", "💨"]
    },
    {
        title: "慶祝 / 生活",
        items: ["🎉", "🎊", "🎈", "🎂", "🎁", "🎀", "🎄", "🎃", "🎆", "🎇", "🧨", "🧧", "🎋", "🎍", "🎎", "🎏", "🎐", "🎑", "🎒", "🎓", "👑", "💍", "💄", "💎", "📢", "📣", "🔔", "🎵", "🎶", "🎤", "🎧", "📷", "📸", "📹", "📺", "📻", "📱", "📲", "☎️", "📞", "💻", "🖥", "🖨", "⌨️", "🖱", "🔋", "🔌", "💡", "🔦", "🕯", "🪔", "💰", "💵", "💴", "💶", "💷", "💸", "💳", "🧾", "🛒", "🛍"]
    },
    {
        title: "商務 / 文書",
        items: ["📅", "📆", "🗓", "📂", "📁", "🗂", "📊", "📈", "📉", "🗒", "🗓", "🗳", "🗃", "🗳", "🗄", "📋", "📁", "📂", "🗂", "🗞", "📰", "📓", "📔", "📒", "📕", "📗", "📘", "📙", "📚", "📖", "🔖", "🔗", "📎", "🖇", "📐", "📏", "📌", "📍", "✂️", "🖊", "🖋", "✒️", "🖌", "🖍", "📝", "✏️", "🔍", "🔎"]
    }
];

const kaomojiData = [
    {
        title: "打招呼 / 開心",
        items: ["(o´・_・)o", "(=ﾟωﾟ)ﾉ", "( ´ ▽ ` )ﾉ", "o(ww)o", "(≧∇≦)/", "(*^▽^*)", "\\(★ω★)/", "(☆▽☆)", "(o^ ^o)", "(￣▽￣)"]
    },
    {
        title: "可愛 / 撒嬌",
        items: ["(・ω<)", "(*≧ω≦)", "(///▽///)", "(◕‿◕)", "(つ✧ω✧)つ", "(づ￣ ³￣)づ", "(｡･ω･｡)ﾉ♡", "♡(> ਊ <)♡", "(*♡∀♡)"]
    },
    {
        title: "生氣 / 翻桌",
        items: ["(╬ Ò ‸ Ó)", "(＃`Д´)", "( ` ω ´ )", "(ノಠ益ಠ)ノ", "(/ﾟДﾟ)/", "┻━┻ ︵ ヽ(°□°ヽ)", "(╯°□°）╯︵ ┻━┻", "(ノ｀Д´)ノ彡┻━┻", "ಠ_ಠ"]
    },
    {
        title: "無奈 / 傷心",
        items: ["(￣ω￣;)", "(;´・`)>", "(T_T)", "(;´༎ຶД༎ຶ`)", "(ToT)", "(╥_╥)", "(´-﹏-`；)", "┐(‘～`；)┌", "(can_t help)"]
    },
    {
        title: "驚訝 / 疑惑",
        items: ["(⊙_⊙)", "(O_O;)", "(°ロ°)", "∑(O_O;)", "(o_O)", "(・_・;)", "(>_<)", "(@_@)"]
    }
];

// 2. 渲染函式 (產生 HTML)
function renderSymbolSection(containerId, data, gridClass, btnClass = 'symbol-btn') {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';

    data.forEach(group => {
        const card = document.createElement('div');
        card.className = 'symbol-group-card';
        
        // 產生按鈕 HTML
        const btnsHtml = group.items.map(item => 
            `<button class="${btnClass}" onclick="copySymbol('${item}')">${item}</button>`
        ).join('');

        card.innerHTML = `
            <div class="symbol-card-header">${group.title}</div>
            <div class="symbol-grid ${gridClass}">
                ${btnsHtml}
            </div>
        `;
        container.appendChild(card);
    });
}

// 3. 切換子分頁
function switchSubTab(tabName) {
    // 處理按鈕樣式
    const buttons = document.querySelectorAll('.sub-nav-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    // 簡單用文字內容判斷目前點擊的是哪個按鈕，加上 active
    event.currentTarget.classList.add('active');

    // 處理顯示內容
    document.querySelectorAll('.sub-view').forEach(view => view.classList.remove('active'));
    
    if (tabName === 'symbols') {
        document.getElementById('view-symbols').classList.add('active');
    } else if (tabName === 'emojis') {
        document.getElementById('view-emojis').classList.add('active');
    } else if (tabName === 'kaomoji') {
        document.getElementById('view-kaomoji').classList.add('active');
    }
}

// 4. 複製功能
function copySymbol(text) {
    navigator.clipboard.writeText(text).then(() => {
        const toast = document.getElementById('symbol-toast');
        toast.style.opacity = 1;
        setTimeout(() => { toast.style.opacity = 0; }, 1500);
    });
}

// 5. 初始化渲染 (加在原本的 DOMContentLoaded 裡面，或者獨立執行)
document.addEventListener('DOMContentLoaded', () => {
    // 渲染三個區塊
    renderSymbolSection('view-symbols', symbolsData, 'grid-cols-8');
    renderSymbolSection('view-emojis', emojisData, 'grid-cols-emoji');
    renderSymbolSection('view-kaomoji', kaomojiData, 'grid-cols-kaomoji', 'symbol-btn kaomoji-btn');
    
    // 確保原本的 renderCards 也會執行 (避免覆蓋)
    if(typeof renderCards === 'function') renderCards('all');
});
