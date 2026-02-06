// js/imageTool.js - 最終修正版
let currentFile = null;
let compressedBlob = null;

// 檢查依賴庫
function checkDependencies() {
    if (typeof imageCompression === 'undefined') {
        window.showToast?.('壓縮元件載入中...請稍候', 'warning');
        return false;
    }
    return true;
}

// 檢測是否移動設備
function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// 初始化
function initImageTool() {
    const dropZone = document.getElementById('drop-zone');
    if (dropZone && isMobileDevice()) {
        const uploadText = dropZone.querySelector('.upload-text');
        if (uploadText) uploadText.textContent = '點擊選擇圖片';
    }
    console.log('✅ 圖片工具已初始化');
}

// 頁面載入時初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initImageTool);
} else {
    initImageTool();
}

// --- 核心邏輯：圖片處理 ---
window.processImage = function(file) {
    if (!file) return;

    // 寬鬆檢查圖片類型
    if (!file.type.match('image.*') && !/\.(jpg|jpeg|png|webp|heic)$/i.test(file.name)) {
        window.showToast?.('請上傳正確的圖片格式', 'warning');
        return;
    }
    
    currentFile = file;
    
    // 1. UI 狀態更新
    document.getElementById('preview-empty').style.display = 'none';
    document.getElementById('preview-active').style.display = 'block';
    document.getElementById('info-original').innerText = formatSize(file.size);
    document.getElementById('info-compressed').innerHTML = '<span style="color:#666">讀取中...</span>';
    
    // 2. 預先讀取圖片尺寸 (解決 Race Condition)
    const img = new Image();
    img.onload = () => {
        const widthInput = document.getElementById('custom-width');
        const heightInput = document.getElementById('custom-height');
        
        // 只有當輸入框為空時才自動填入，避免覆蓋使用者的設定
        if (!widthInput.value) widthInput.value = img.width;
        if (!heightInput.value) heightInput.value = img.height;
        
        URL.revokeObjectURL(img.src); // 釋放記憶體
        
        // 3. 尺寸讀取完畢後，才開始壓縮
        window.runCompression();
    };
    
    img.onerror = () => {
        // 萬一讀取失敗，還是嘗試執行壓縮
        window.runCompression();
    };
    
    img.src = URL.createObjectURL(file);
}

window.applyPreset = function() {
    const preset = document.getElementById('preset-select').value;
    const wInput = document.getElementById('custom-width');
    const hInput = document.getElementById('custom-height');
    
    if (preset === 'custom') { 
        // 保持原樣 
    } else if (preset === '800xauto') { 
        wInput.value = 800; 
        hInput.value = ''; 
    } else { 
        const [w, h] = preset.split('x'); 
        wInput.value = w; 
        hInput.value = h; 
    }
    window.runCompression();
}

window.updateQualityVal = function() {
    document.getElementById('quality-val').innerText = document.getElementById('quality').value;
    if(window.compressionTimer) clearTimeout(window.compressionTimer);
    window.compressionTimer = setTimeout(() => { window.runCompression(); }, 500);
}

// --- 核心邏輯：執行壓縮 ---
window.runCompression = async function() {
    if (!currentFile || !checkDependencies()) return;
    
    const loadingOverlay = document.getElementById('loading-overlay');
    if (loadingOverlay) loadingOverlay.style.display = 'flex';
    
    try {
        const quality = parseFloat(document.getElementById('quality').value);
        const targetW = document.getElementById('custom-width').value;
        const targetH = document.getElementById('custom-height').value;
        const format = document.getElementById('output-format').value;
        
        // 【修正 2】放寬手機版限制，對齊備份版邏輯 (50MB)
        // 這能避免手機為了壓到 2MB 而過度運算或崩潰
        const options = { 
            maxSizeMB: 50, 
            useWebWorker: true,
            initialQuality: quality
        };
        
        // 尺寸設定
        if (targetW) options.maxWidthOrHeight = parseInt(targetW);
        if (targetW && targetH) options.maxWidthOrHeight = Math.max(parseInt(targetW), parseInt(targetH));
        
        // 【修正 1】致命錯誤修正：傳遞正確的 MIME Type
        // 備份版是直接傳 format，正式版原本錯誤地轉成了 'jpg'
        if (format !== 'original') {
            options.fileType = format; // 這裡必須是 "image/jpeg"，不能是 "jpg"
        }
        
        console.log('開始壓縮，設定:', options);
        compressedBlob = await imageCompression(currentFile, options);
        
        // 顯示結果
        const previewUrl = URL.createObjectURL(compressedBlob);
        const previewImg = document.getElementById('preview-compressed');
        if (previewImg) {
            previewImg.onload = () => URL.revokeObjectURL(previewImg.src);
            previewImg.src = previewUrl;
        }
        
        // 計算數據
        const saved = ((currentFile.size - compressedBlob.size) / currentFile.size * 100).toFixed(1);
        const color = saved > 0 ? '#10B981' : '#666'; // 綠色或灰色
        const sizeText = formatSize(compressedBlob.size);
        const percentText = saved > 0 ? `-${Math.abs(saved)}%` : `+${Math.abs(saved)}%`;
        
        document.getElementById('info-compressed').innerHTML = 
            `${sizeText} <span style="font-size:12px; color:${color};">(${percentText})</span>`;
            
    } catch (error) { 
        console.error('壓縮失敗:', error); 
        window.showToast?.(`壓縮失敗: ${error.message}`, 'error');
    } finally { 
        if (loadingOverlay) loadingOverlay.style.display = 'none'; 
    }
}

window.downloadImage = function() {
    if(!compressedBlob) { 
        window.showToast?.('請先上傳並壓縮圖片', 'error');
        return; 
    }
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(compressedBlob);
    
    // 處理副檔名
    let ext = currentFile.name.split('.').pop();
    const format = document.getElementById('output-format').value;
    
    if(format === 'image/jpeg') ext = 'jpg';
    if(format === 'image/png') ext = 'png';
    if(format === 'image/webp') ext = 'webp';
    
    link.download = currentFile.name.replace(/\.[^/.]+$/, "") + '-opt.' + ext;
    link.click();
    
    window.showToast?.('圖片下載中...', 'success');
}

function formatSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}