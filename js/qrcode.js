// --- QR Code 邏輯 ---
let qrCodeObj;

// 初始化 QR Code（支持動態載入和同步載入）
function initQRCode() {
    if (!document.getElementById("qrcode-canvas")) return;

    if (typeof QRCodeStyling !== 'undefined') {
        if (!qrCodeObj) {
            qrCodeObj = new QRCodeStyling({
                width: 300, height: 300, type: "svg", data: "https://github.com", image: "",
                dotsOptions: { color: "#2C3E50", type: "square" }, backgroundOptions: { color: "#ffffff" },
                imageOptions: { crossOrigin: "anonymous", margin: 10 }
            });
            qrCodeObj.append(document.getElementById("qrcode-canvas"));
            console.log('✅ QR Code 已初始化');
        }
    } else {
        // 若函式庫尚未載入，延遲重試
        console.log('⏳ QR Code Library 尚未載入，等待中...');
        setTimeout(initQRCode, 500);
    }
}

// 頁面加載時初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initQRCode);
} else {
    // DOM 已加載，立即初始化
    initQRCode();
}

function updateQR() {
    if (!qrCodeObj) return;
    const text = document.getElementById('qr-text').value || "https://github.com";
    const color = document.getElementById('qr-color').value;
    const correction = document.getElementById('qr-correction').value;
    const dotsType = document.getElementById('qr-dots-type').value;
    const cornerType = document.getElementById('qr-corner-type').value;
    qrCodeObj.update({ data: text, dotsOptions: { color: color, type: dotsType }, cornersSquareOptions: { type: cornerType }, qrOptions: { errorCorrectionLevel: correction } });
}
function handleLogoUpload(input) {
    if (!qrCodeObj) return;
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function (e) {
            qrCodeObj.update({ image: e.target.result });
            document.getElementById('logo-status').innerText = "✅ Logo 已載入";
        };
        reader.readAsDataURL(input.files[0]);
    }
}
function setQRType(type) {
    const input = document.getElementById('qr-text');
    const btns = document.querySelectorAll('.type-btn');
    btns.forEach(b => b.classList.remove('active'));
    const activeBtn = Array.from(btns).find(b => b.dataset.value === type);
    if (activeBtn) activeBtn.classList.add('active');
    input.placeholder = type === 'url' ? "https://example.com" : "請輸入任何文字...";
}
function downloadQR() {
    if (!qrCodeObj) return;
    qrCodeObj.download({ name: "qrcode", extension: "png" });
}
