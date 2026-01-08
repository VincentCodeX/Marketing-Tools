// --- 1. 分頁切換 ---
function switchTab(tabId) {
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tool-section').forEach(section => section.classList.remove('active'));
    event.currentTarget.classList.add('active');
    document.getElementById('tab-' + tabId).classList.add('active');
}

// --- 2. QR Code 邏輯 ---
let qrCodeObj;
// 確保 DOM 載入後再初始化 QR Code
document.addEventListener('DOMContentLoaded', function() {
    // 檢查是否有 qrcode-canvas 元素，避免報錯
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

// --- 4. Short URL 邏輯 (is.gd) ---
async function generateShortUrl() {
    const longUrl = document.getElementById('long-url').value.trim();
    const resultBox = document.getElementById('short-result');
    const linkDisplay = document.getElementById('short-link');
    const btnText = document.getElementById('btn-text');
    const btnLoader = document.getElementById('btn-loader');
    const shortenBtn = document.getElementById('shorten-btn');

    if (!longUrl) { alert("請輸入網址！"); return; }

    btnText.style.display = 'none';
    btnLoader.style.display = 'inline-block';
    shortenBtn.disabled = true;
    resultBox.style.display = 'none';

    try {
        const apiUrl = `https://is.gd/create.php?format=simple&url=${encodeURIComponent(longUrl)}`;
        const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(apiUrl)}`;
        const response = await fetch(proxyUrl);
        
        if (response.ok) {
            const shortUrl = await response.text();
            linkDisplay.innerText = shortUrl;
            linkDisplay.href = shortUrl;
            resultBox.style.display = 'block';
        } else {
            alert("縮短失敗，請檢查網址。");
        }
    } catch (error) {
        console.error(error);
        alert("連線錯誤，請稍後再試。");
    } finally {
        btnText.style.display = 'inline';
        btnLoader.style.display = 'none';
        shortenBtn.disabled = false;
    }
}
function copyShortUrl() {
    const urlText = document.getElementById('short-link').innerText;
    navigator.clipboard.writeText(urlText).then(() => {
        const msg = document.getElementById('short-copy-msg');
        msg.style.opacity = 1;
        setTimeout(() => { msg.style.opacity = 0; }, 2000);
    });
}

// --- 5. 圖片壓縮邏輯 (使用 browser-image-compression) ---
let currentFile = null;
let compressedBlob = null;

// A. 處理拖曳與選擇檔案
function handleDragOver(e) {
    e.preventDefault();
    document.getElementById('drop-zone').classList.add('dragover');
}
function handleDragLeave(e) {
    e.preventDefault();
    document.getElementById('drop-zone').classList.remove('dragover');
}
function handleDrop(e) {
    e.preventDefault();
    document.getElementById('drop-zone').classList.remove('dragover');
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        processImage(e.dataTransfer.files[0]);
    }
}

// B. 核心處理函數
async function processImage(file) {
    if (!file.type.match('image.*')) {
        alert("請上傳圖片檔案 (JPG, PNG, WebP)");
        return;
    }
    
    currentFile = file;
    document.getElementById('compression-controls').style.display = 'block';
    
    // 顯示原始圖
    document.getElementById('preview-original').src = URL.createObjectURL(file);
    document.getElementById('info-original').innerText = formatSize(file.size);

    // 開始執行壓縮
    await runCompression();
}

// C. 執行壓縮 (與更新設定時共用)
async function runCompression() {
    if (!currentFile) return;

    // 取得設定值
    const quality = parseFloat(document.getElementById('quality').value);
    const maxWidth = document.getElementById('max-width').value;
    
    // 顯示 Loading
    const loading = document.getElementById('loading-overlay');
    loading.style.display = 'flex';

    // 設定參數
    const options = {
        maxSizeMB: 10,           // 寬鬆限制，主要靠 quality 控制
        maxWidthOrHeight: maxWidth === 'undefined' ? undefined : parseInt(maxWidth),
        useWebWorker: true,
        initialQuality: quality, // 關鍵參數
    };

    try {
        // 呼叫外掛進行壓縮
        compressedBlob = await imageCompression(currentFile, options);
        
        // 顯示結果
        document.getElementById('preview-compressed').src = URL.createObjectURL(compressedBlob);
        
        // 計算節省比例
        const saved = ((currentFile.size - compressedBlob.size) / currentFile.size * 100).toFixed(1);
        document.getElementById('info-compressed').innerHTML = 
            `${formatSize(compressedBlob.size)} <span style="font-size:11px; color:#10B981;">(省下 ${saved}%)</span>`;

    } catch (error) {
        console.error(error);
        alert("壓縮失敗，請換一張圖片試試");
    } finally {
        loading.style.display = 'none';
    }
}

// D. 更新設定時自動重壓
function updateCompressionSetting() {
    // 更新顯示數值
    document.getElementById('quality-val').innerText = document.getElementById('quality').value;
    const width = document.getElementById('max-width').value;
    document.getElementById('width-val').innerText = width === 'undefined' ? '原尺寸' : width + 'px';
    
    // 稍微延遲執行，避免拉動滑桿時瘋狂運算 (防抖動)
    if(this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => {
        runCompression();
    }, 500);
}

// E. 下載檔案
function downloadImage() {
    if(!compressedBlob) return;
    const link = document.createElement('a');
    link.href = URL.createObjectURL(compressedBlob);
    // 檔名加上 -min
    const newName = currentFile.name.replace(/(\.[\w\d_-]+)$/i, '-min$1');
    link.download = newName;
    link.click();
}

// 工具：格式化檔案大小
function formatSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
