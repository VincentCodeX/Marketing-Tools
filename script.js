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

// --- 6. OCR 名片掃描邏輯 (修復版) ---

function handleOcrDragLeave(e) { e.preventDefault(); document.getElementById('ocr-drop-zone').style.borderColor = '#E2E8F0'; }
function handleOcrDrop(e) {
    e.preventDefault();
    document.getElementById('ocr-drop-zone').style.borderColor = '#E2E8F0';
    if (e.dataTransfer.files && e.dataTransfer.files[0]) processOcr(e.dataTransfer.files[0]);
}

async function processOcr(file) {
    if (!file) return;
    
    // UI 初始化
    const imgUrl = URL.createObjectURL(file);
    document.getElementById('ocr-preview-img').src = imgUrl;
    document.getElementById('ocr-preview-img').style.display = 'block';
    document.getElementById('ocr-default-view').style.display = 'none';
    document.getElementById('ocr-loading').style.display = 'flex';
    document.getElementById('ocr-status-text').innerText = "下載語言包 (初次約需 10-20 秒)...";
    
    clearOcrForm();

    try {
        // 設定 Worker，指定語言包路徑，避免跨域問題
        const worker = Tesseract.createWorker({
            logger: m => {
                if(m.status === 'recognizing text') {
                    document.getElementById('ocr-status-text').innerText = `文字辨識中... ${Math.round(m.progress * 100)}%`;
                }
            }
        });

        await worker.load();
        await worker.loadLanguage('chi_tra+eng'); // 下載繁體中文和英文
        await worker.initialize('chi_tra+eng');
        
        const { data: { text } } = await worker.recognize(file);
        console.log("辨識原文:", text); // 方便你除錯
        
        parseOcrText(text); // 開始解析
        
        await worker.terminate(); // 釋放記憶體

    } catch (error) {
        console.error(error);
        alert("辨識失敗。請確認網路連線正常 (需要下載語言包)。");
    } finally {
        document.getElementById('ocr-loading').style.display = 'none';
    }
}

function parseOcrText(text) {
    // 移除空白行，統一處理
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const fullText = lines.join(' '); // 單行全文字，方便正則比對

    // 1. Email (更寬鬆的匹配)
    const emailMatch = fullText.match(/[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    if(emailMatch) document.getElementById('ocr-email').value = emailMatch[0];

    // 2. 手機 (台灣格式優化)
    const phoneMatch = fullText.match(/09\d{2}[-\s]?\d{3}[-\s]?\d{3}/) || fullText.match(/\+886\s?9\d{2}[-\s]?\d{3}[-\s]?\d{3}/);
    if(phoneMatch) document.getElementById('ocr-phone').value = phoneMatch[0];

    // 3. 統編 (8碼數字)
    const taxMatch = fullText.match(/\b\d{8}\b/);
    if(taxMatch) document.getElementById('ocr-tax').value = taxMatch[0];

    // 4. LINE ID (簡單匹配)
    const lineMatch = fullText.match(/LINE[:\s]?\s*([a-zA-Z0-9_.-]+)/i);
    if(lineMatch) document.getElementById('ocr-line').value = lineMatch[1];

    // 5. 姓名與公司 (啟發式)
    // 通常公司名會有 "公司", "Inc", "Ltd"
    const companyLine = lines.find(l => l.includes('公司') || l.includes('Ltd') || l.includes('Inc'));
    if(companyLine) document.getElementById('ocr-company').value = companyLine;

    // 通常職稱會有 "經理", "Manager"
    const titleLine = lines.find(l => l.includes('經理') || l.includes('Manager') || l.includes('總監') || l.includes('專員'));
    if(titleLine) document.getElementById('ocr-title').value = titleLine;

    // 剩下的可能是姓名 (排除掉已找到的行)
    const nameLine = lines.find(l => l !== companyLine && l !== titleLine && l.length < 5 && l.length > 1); // 姓名通常短
    if(nameLine) document.getElementById('ocr-name').value = nameLine;
}

function clearOcrForm() {
    ['ocr-name', 'ocr-title', 'ocr-company', 'ocr-phone', 'ocr-email', 'ocr-line', 'ocr-tax'].forEach(id => document.getElementById(id).value = '');
}

function resetOcr() {
    document.getElementById('ocr-preview-img').style.display = 'none';
    document.getElementById('ocr-default-view').style.display = 'block';
    document.getElementById('ocr-input').value = '';
    clearOcrForm();
}

function copyAllOcr() {
    const d = getOcrData();
    const text = `姓名: ${d.name}\n職稱: ${d.title}\n公司: ${d.company}\n電話: ${d.phone}\nEmail: ${d.email}\nLINE: ${d.line}\n統編: ${d.tax}`;
    navigator.clipboard.writeText(text).then(() => alert('已複製全部資料'));
}

function getOcrData() {
    return {
        name: document.getElementById('ocr-name').value,
        title: document.getElementById('ocr-title').value,
        company: document.getElementById('ocr-company').value,
        phone: document.getElementById('ocr-phone').value,
        email: document.getElementById('ocr-email').value,
        line: document.getElementById('ocr-line').value,
        tax: document.getElementById('ocr-tax').value
    };
}

// 匯出功能 - 確保全域可用
window.exportToCsv = function() {
    const d = getOcrData();
    const csvContent = "\uFEFF姓名,職稱,公司,電話,Email,LINE,統編\n" + `${d.name},${d.title},${d.company},${d.phone},${d.email},${d.line},${d.tax}`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "contact.csv";
    link.click();
};

window.copyNotionFormat = function() {
    const d = getOcrData();
    const text = `| 欄位 | 資料 |\n| --- | --- |\n| 姓名 | ${d.name} |\n| 職稱 | ${d.title} |\n| 公司 | ${d.company} |\n| 電話 | ${d.phone} |\n| Email | ${d.email} |\n| LINE | ${d.line} |\n| 統編 | ${d.tax} |`;
    navigator.clipboard.writeText(text).then(() => alert('已複製 Notion 格式'));
};

window.exportToJson = function() {
    const d = getOcrData();
    const blob = new Blob([JSON.stringify(d, null, 2)], { type: 'application/json' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "contact.json";
    link.click();
};
