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

// --- 5. 圖片壓縮邏輯 Pro (適配新介面) ---
let currentFile = null;
let compressedBlob = null;

// A. 處理拖曳與選擇檔案
function handleDragOver(e) { e.preventDefault(); document.getElementById('drop-zone').classList.add('dragover'); }
function handleDragLeave(e) { e.preventDefault(); document.getElementById('drop-zone').classList.remove('dragover'); }
function handleDrop(e) {
    e.preventDefault();
    document.getElementById('drop-zone').classList.remove('dragover');
    if (e.dataTransfer.files && e.dataTransfer.files[0]) processImage(e.dataTransfer.files[0]);
}

// B. 載入圖片 (進入點)
async function processImage(file) {
    if (!file.type.match('image.*')) { alert("請上傳圖片檔案 (JPG, PNG, WebP)"); return; }
    
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

// C. 套用預設尺寸
function applyPreset() {
    const preset = document.getElementById('preset-select').value;
    const wInput = document.getElementById('custom-width');
    const hInput = document.getElementById('custom-height');

    if (preset === 'custom') {
    } else if (preset === '800xauto') {
        wInput.value = 800; hInput.value = '';
    } else {
        const [w, h] = preset.split('x');
        wInput.value = w; hInput.value = h;
    }
    runCompression();
}

// D. 更新品質
function updateQualityVal() {
    document.getElementById('quality-val').innerText = document.getElementById('quality').value;
    if(this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => { runCompression(); }, 500);
}

// E. 核心壓縮
async function runCompression() {
    if (!currentFile) return;
    document.getElementById('loading-overlay').style.display = 'flex';

    const quality = parseFloat(document.getElementById('quality').value);
    const targetW = document.getElementById('custom-width').value;
    const format = document.getElementById('output-format').value;

    const options = {
        maxSizeMB: 50, useWebWorker: true, initialQuality: quality,
    };
    if (targetW) options.maxWidthOrHeight = parseInt(targetW);
    if (format !== 'original') options.fileType = format;

    try {
        compressedBlob = await imageCompression(currentFile, options);
        document.getElementById('preview-compressed').src = URL.createObjectURL(compressedBlob);
        
        const saved = ((currentFile.size - compressedBlob.size) / currentFile.size * 100).toFixed(1);
        let color = saved > 0 ? '#10B981' : '#666';
        document.getElementById('info-compressed').innerHTML = 
            `${formatSize(compressedBlob.size)} <span style="font-size:12px; color:${color};">(${saved > 0 ? '-' : ''}${Math.abs(saved)}%)</span>`;
    } catch (error) { console.error(error); alert("壓縮發生錯誤"); } 
    finally { document.getElementById('loading-overlay').style.display = 'none'; }
}

// F. 下載
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

// --- 6. 名片 OCR 邏輯 (Tesseract.js) ---

// A. 處理拖曳
function handleOcrDragLeave(e) { e.preventDefault(); document.getElementById('ocr-drop-zone').style.borderColor = '#E2E8F0'; }
function handleOcrDrop(e) {
    e.preventDefault();
    document.getElementById('ocr-drop-zone').style.borderColor = '#E2E8F0';
    if (e.dataTransfer.files && e.dataTransfer.files[0]) processOcr(e.dataTransfer.files[0]);
}

// B. 核心處理
async function processOcr(file) {
    if (!file) return;
    
    // 1. 顯示預覽圖 & Loading
    const imgUrl = URL.createObjectURL(file);
    const preview = document.getElementById('ocr-preview-img');
    const defaultView = document.getElementById('ocr-default-view');
    const loading = document.getElementById('ocr-loading');
    const statusText = document.getElementById('ocr-status-text');

    preview.src = imgUrl;
    preview.style.display = 'block';
    defaultView.style.display = 'none';
    loading.style.display = 'flex';
    
    // 清空舊資料
    clearOcrForm();

    try {
        statusText.innerText = "正在初始化引擎...";
        
        // 2. 執行 OCR (使用 Tesseract)
        // 'chi_tra+eng' 代表同時辨識 繁體中文 + 英文
        const { data: { text } } = await Tesseract.recognize(
            file,
            'chi_tra+eng', 
            {
                logger: m => {
                    if(m.status === 'recognizing text') {
                        statusText.innerText = `辨識中... ${Math.round(m.progress * 100)}%`;
                    }
                }
            }
        );

        console.log("OCR Result:", text); // 開發者工具可看原始結果
        
        // 3. 智能解析 (把文字填入表格)
        parseOcrText(text);

    } catch (error) {
        console.error(error);
        alert("辨識發生錯誤，請重試");
    } finally {
        loading.style.display = 'none';
    }
}

// C. 智能解析文字 (Regex 大法)
function parseOcrText(text) {
    // 1. Email
    const emailMatch = text.match(/[\w.-]+@[\w.-]+\.[\w]+/);
    if(emailMatch) document.getElementById('ocr-email').value = emailMatch[0];

    // 2. 手機/電話 (抓取 09xx 或 02-xxxx 格式)
    const phoneMatch = text.match(/(\(?0\d{1,3}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4})/);
    if(phoneMatch) document.getElementById('ocr-phone').value = phoneMatch[0];

    // 3. 統編 (8碼數字)
    const taxMatch = text.match(/\b\d{8}\b/);
    if(taxMatch) document.getElementById('ocr-tax').value = taxMatch[0];

    // 4. 姓名與職稱 (這比較難，通常取前幾行，或尋找特定關鍵字)
    // 這裡做一個簡單的假設：第一行通常是公司或姓名
    const lines = text.split('\n').filter(line => line.trim() !== '');
    if(lines.length > 0) {
        // 嘗試猜測，如果第一行包含 "公司" 字眼，就填公司，否則填姓名
        if(lines[0].includes('公司') || lines[0].includes('Ltd')) {
            document.getElementById('ocr-company').value = lines[0];
            if(lines[1]) document.getElementById('ocr-name').value = lines[1];
        } else {
            document.getElementById('ocr-name').value = lines[0];
            // 找職稱關鍵字
            const titleKeywords = ['經理', '總監', '工程師', '專員', 'Manager', 'Director', 'CEO'];
            const titleLine = lines.find(line => titleKeywords.some(kw => line.includes(kw)));
            if(titleLine) document.getElementById('ocr-title').value = titleLine;
        }
    }
    
    // 5. 嘗試找 LINE ID (通常前面會有 LINE 字樣)
    const lineMatch = text.match(/LINE[:\s]?\s*([A-Za-z0-9_.-]+)/i);
    if(lineMatch) document.getElementById('ocr-line').value = lineMatch[1];
}

// D. 清空與重置
function clearOcrForm() {
    const ids = ['ocr-name', 'ocr-title', 'ocr-company', 'ocr-phone', 'ocr-email', 'ocr-line', 'ocr-tax'];
    ids.forEach(id => document.getElementById(id).value = '');
}

function resetOcr() {
    document.getElementById('ocr-preview-img').style.display = 'none';
    document.getElementById('ocr-default-view').style.display = 'flex';
    document.getElementById('ocr-input').value = '';
    clearOcrForm();
}

function copyAllOcr() {
    // 把所有欄位組合成一段文字複製
    const ids = ['ocr-name', 'ocr-title', 'ocr-company', 'ocr-phone', 'ocr-email', 'ocr-line', 'ocr-tax'];
    const text = ids.map(id => {
        const val = document.getElementById(id).value;
        return val ? `${val}` : '';
    }).filter(v => v).join('\n');
    
    if(text) {
        navigator.clipboard.writeText(text).then(() => alert('已複製全部資料'));
    }
}
