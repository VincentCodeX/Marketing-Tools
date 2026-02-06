// --- 圖片壓縮邏輯 ---
let currentFile = null;
let compressedBlob = null;

// 檢查依賴庫
function checkDependencies() {
    if (typeof imageCompression === 'undefined') {
        console.error('browser-image-compression 庫未加載');
        return false;
    }
    return true;
}

// 檢測是否移動設備
function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

function handleDragOver(e) { 
    e.preventDefault(); 
    e.stopPropagation();
    document.getElementById('drop-zone').classList.add('dragover'); 
}

function handleDragLeave(e) { 
    e.preventDefault(); 
    e.stopPropagation();
    document.getElementById('drop-zone').classList.remove('dragover'); 
}

function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    document.getElementById('drop-zone').classList.remove('dragover');
    if (e.dataTransfer.files && e.dataTransfer.files[0]) window.processImage(e.dataTransfer.files[0]);
}

// 添加拖拽事件監聽器（僅在非移動設備上）
document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('drop-zone');
    
    if (dropZone) {
        // 根據設備類型更新上傳提示
        const uploadText = dropZone.querySelector('.upload-text');
        if (uploadText && isMobileDevice()) {
            uploadText.textContent = '點擊選擇圖片';
        }
        
        // 只在非移動設備上添加拖拽事件
        if (!isMobileDevice()) {
            dropZone.addEventListener('dragover', handleDragOver);
            dropZone.addEventListener('dragleave', handleDragLeave);
            dropZone.addEventListener('drop', handleDrop);
        }
    }
});

// --- 修正後的 processImage ---
// 重點：移除了 setTimeout 強制執行的邏輯，避免雙重運算
window.processImage = async function(file) {
    if (!file) {
        console.warn('processImage called with no file');
        return;
    }
    
    // 檢查檔案類型 (寬鬆檢查，避免某些手機型號 type 為空)
    const isLikelyImage = file.type.match('image.*') || /\.(jpg|jpeg|png|webp|gif|bmp|heic|heif)$/i.test(file.name);
    if (!isLikelyImage && !file.type) {
        console.log('File type unclear, but attempting to process'); 
    }
    
    currentFile = file;
    console.log('Current file set:', file.name);
    
    // UI 狀態更新
    document.getElementById('preview-empty').style.display = 'none';
    document.getElementById('preview-active').style.display = 'block';
    document.getElementById('info-original').innerText = formatSize(file.size);
    document.getElementById('info-compressed').innerHTML = '準備中...';
    
    const img = new Image();
    
    // 1. 圖片讀取成功時
    img.onload = () => {
        console.log('Image loaded:', img.width, 'x', img.height);
        
        const widthInput = document.getElementById('custom-width');
        const heightInput = document.getElementById('custom-height');
        
        // 自動填入寬高
        let defaultWidth = img.width;
        // 如果是超大圖片，在手機上視覺預設值可以縮小，但不影響實際壓縮邏輯(除非用戶不改)
        if (isMobileDevice() && defaultWidth > 1920) {
            defaultWidth = Math.floor(defaultWidth / 2); 
        }
        
        if(!widthInput.value) widthInput.value = defaultWidth;
        if(!heightInput.value) heightInput.value = img.height;
        
        window.showToast(`圖片已載入 (${formatSize(file.size)})`, 'success');
        
        // 確保寬高數據都準備好後，才執行壓縮
        window.runCompression();
    };
    
    // 2. 圖片讀取失敗時 (例如某些 HEIC 瀏覽器無法直接預覽)
    img.onerror = (err) => {
        console.warn('Image preview failed (format support?), attempting compression anyway:', err);
        // 即使預覽失敗，browser-image-compression 庫可能仍能處理檔案，所以嘗試執行
        window.runCompression();
    };
    
    // 載入圖片資料
    try {
        const blobUrl = URL.createObjectURL(file);
        img.src = blobUrl;
    } catch (err) {
        console.error('Blob URL creation failed:', err);
        window.showToast('圖片載入失敗', 'error');
    }
}

window.applyPreset = function() {
    const preset = document.getElementById('preset-select').value;
    const wInput = document.getElementById('custom-width');
    const hInput = document.getElementById('custom-height');
    if (preset === 'custom') { } else if (preset === '800xauto') { wInput.value = 800; hInput.value = ''; } else { const [w, h] = preset.split('x'); wInput.value = w; hInput.value = h; }
    window.runCompression();
}

window.updateQualityVal = function() {
    document.getElementById('quality-val').innerText = document.getElementById('quality').value;
    if(window.compressionTimer) clearTimeout(window.compressionTimer);
    window.compressionTimer = setTimeout(() => { window.runCompression(); }, 500);
}

// --- 修正後的 runCompression ---
// 重點：修正了品質計算 (/100 的錯誤) 和手機版參數
window.runCompression = async function() {
    console.log('runCompression called');
    
    if (!currentFile) {
        // 避免無檔案時報錯
        return; 
    }
    
    if (!checkDependencies()) {
        window.showToast('元件載入中，請稍後...', 'warning');
        return;
    }
    
    const loadingOverlay = document.getElementById('loading-overlay');
    if (loadingOverlay) loadingOverlay.style.display = 'flex';
    
    try {
        // [修正點 1] 移除 / 100。因為 input value 已經是 0.1 ~ 1.0
        const qualityInput = document.getElementById('quality').value;
        const quality = parseFloat(qualityInput);
        
        const targetW = document.getElementById('custom-width').value;
        const targetH = document.getElementById('custom-height').value;
        const format = document.getElementById('output-format').value;
        
        // [修正點 2] 手機版參數優化
        let maxSizeMB = 5;
        if (isMobileDevice()) {
            maxSizeMB = 2; // 手機設為 2MB 上限，避免記憶體不足
        }
        
        const options = { 
            maxSizeMB: maxSizeMB, 
            useWebWorker: true, // [修正點 3] 手機必須開啟 WebWorker 避免卡死
            initialQuality: quality
        };
        
        // 尺寸設定
        if (targetW && targetH) {
            options.maxWidthOrHeight = Math.max(parseInt(targetW), parseInt(targetH));
        } else if (targetW) {
            options.maxWidthOrHeight = parseInt(targetW);
        }
        
        // 格式轉換
        if (format !== 'original') {
            if (format === 'image/jpeg') options.fileType = 'jpg';
            else if (format === 'image/webp') options.fileType = 'webp';
            else if (format === 'image/png') options.fileType = 'png';
        }
        
        console.log('Starting compression with options:', options);

        // 執行壓縮
        compressedBlob = await imageCompression(currentFile, options);
        console.log('Compression complete:', formatSize(compressedBlob.size));
        
        // 更新結果預覽
        const previewUrl = URL.createObjectURL(compressedBlob);
        const previewImg = document.getElementById('preview-compressed');
        if (previewImg) {
            previewImg.src = previewUrl;
            // 釋放舊記憶體 (可選)
            previewImg.onload = () => URL.revokeObjectURL(previewUrl); 
        }
        
        // 計算壓縮率數據
        const saved = ((currentFile.size - compressedBlob.size) / currentFile.size * 100).toFixed(1);
        const color = saved > 0 ? '#10B981' : '#666';
        document.getElementById('info-compressed').innerHTML = `${formatSize(compressedBlob.size)} <span style="font-size:12px; color:${color};">(${saved > 0 ? '-' : ''}${Math.abs(saved)}%)</span>`;
        
        window.showToast('壓縮完成', 'success');
        
    } catch (error) { 
        console.error('壓縮錯誤:', error); 
        window.showToast(`壓縮失敗: ${error.message || '記憶體不足或格式不支援'}`, 'error');
    } finally { 
        if (loadingOverlay) loadingOverlay.style.display = 'none'; 
    }
}

window.downloadImage = function() {
    if(!compressedBlob) { 
        window.showToast('請先上傳並壓縮圖片', 'error');
        return; 
    }
    
    try {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(compressedBlob);
        let ext = currentFile.name.split('.').pop();
        const format = document.getElementById('output-format').value;
        
        if(format === 'image/jpeg') ext = 'jpg';
        if(format === 'image/png') ext = 'png';
        if(format === 'image/webp') ext = 'webp';
        
        link.download = currentFile.name.replace(/\.[^/.]+$/, "") + '-opt.' + ext;
        
        // 在移動設備上使用不同的下載方式
        if (isMobileDevice()) {
            // 移動設備：使用 iOS/Android 的分享菜單或直接打開
            try {
                link.click();
                // 延遲後檢查下載是否完成
                setTimeout(() => {
                    URL.revokeObjectURL(link.href);
                }, 1000);
            } catch (e) {
                // 輔助方案：如果直接下載失敗，嘗試打開圖片
                window.open(link.href);
            }
        } else {
            // 桌面設備：標準下載
            link.click();
            // 立即清理 URL
            URL.revokeObjectURL(link.href);
        }
        
        window.showToast('圖片已下載', 'success');
    } catch(error) {
        console.error('下載錯誤:', error);
        window.showToast(`下載失敗: ${error.message}`, 'error');
    }
}

function formatSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
