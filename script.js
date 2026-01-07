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
