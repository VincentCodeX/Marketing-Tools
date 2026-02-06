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

window.processImage = async function(file) {
    if (!file) {
        console.warn('processImage called with no file');
        return;
    }
    
    console.log('Processing image:', file.name, 'Type:', file.type, 'Size:', file.size);
    
    // iOS 上 file.type 可能為空，需要通過文件名判斷，但為了相容性，先嘗試處理所有文件
    const isLikelyImage = file.type.match('image.*') || /\.(jpg|jpeg|png|webp|gif|bmp|heic|heif)$/i.test(file.name);
    if (!isLikelyImage && !file.type) {
        // 如果看起來像圖片，或是沒有 type，先嘗試處理
        console.log('File type unclear, but attempting to process'); 
    }
    
    currentFile = file;
    console.log('Current file set:', file.name);
    
    document.getElementById('preview-empty').style.display = 'none';
    document.getElementById('preview-active').style.display = 'block';
    document.getElementById('info-original').innerText = formatSize(file.size);
    document.getElementById('info-compressed').innerHTML = '0 KB';
    
    // 獲取圖片尺寸，用於設定寬高輸入框的初始值
    const img = new Image();
    let loadTimeout = setTimeout(() => {
        console.warn('圖片加載超時（3秒），嘗試直接壓縮');
        window.runCompression();
    }, 3000);
    
    img.onload = () => {
        clearTimeout(loadTimeout);
        console.log('Image loaded:', img.width, 'x', img.height);
        
        const widthInput = document.getElementById('custom-width');
        const heightInput = document.getElementById('custom-height');
        
        // 在移動設備上自動縮放到合理尺寸
        let defaultWidth = img.width;
        if (isMobileDevice() && defaultWidth > 1920) {
            defaultWidth = Math.floor(defaultWidth / 2);
            console.log('Mobile device detected, resizing width to:', defaultWidth);
        }
        
        if(!widthInput.value) {
            widthInput.value = defaultWidth;
        }
        if(!heightInput.value) {
            heightInput.value = img.height;
        }
        
        window.showToast(`圖片已上傳 (${formatSize(file.size)})`, 'success');
        console.log('Toast shown, starting compression');
        
        // 圖片加載完成後才開始壓縮
        window.runCompression();
    };
    
    img.onerror = (err) => {
        clearTimeout(loadTimeout);
        console.error('Image load error:', err);
        window.showToast('圖片讀取失敗，請嘗試其他圖片', 'error');
    };
    
    // 使用 Blob URL 創建對象 URL
    try {
        const blobUrl = URL.createObjectURL(file);
        console.log('Blob URL created successfully');
        img.src = blobUrl;
    } catch (err) {
        console.error('創建 Blob URL 失敗:', err);
        window.showToast('圖片加載失敗，請重試', 'error');
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

window.runCompression = async function() {
    console.log('runCompression called, currentFile:', currentFile ? currentFile.name : 'none');
    
    if (!currentFile) {
        window.showToast('請先上傳圖片', 'error');
        return;
    }
    
    if (!checkDependencies()) {
        window.showToast('圖片壓縮庫加載中，請稍候...', 'warning');
        return;
    }
    
    const loadingOverlay = document.getElementById('loading-overlay');
    if (!loadingOverlay) {
        console.error('loading-overlay element not found');
        return;
    }
    
    loadingOverlay.style.display = 'flex';
    
    try {
        const quality = parseFloat(document.getElementById('quality').value) / 100;
        const targetW = document.getElementById('custom-width').value;
        const targetH = document.getElementById('custom-height').value;
        const format = document.getElementById('output-format').value;
        
        console.log('Compression settings:', {
            quality: quality,
            targetW: targetW,
            targetH: targetH,
            format: format,
            isMobile: isMobileDevice()
        });
        
        // 根據設備調整最大文件大小
        // 修正：手機照片像素高，0.5MB 太激進，改為 1-2MB 避免運算過久
        let maxSizeMB = 5;
        if (isMobileDevice()) {
            maxSizeMB = 2; // 改為 2MB，減輕運算壓力
        }
        
        const options = { 
            maxSizeMB: maxSizeMB, 
            // 重要：始終開啟 useWebWorker，手機必須用 WebWorker 避免 UI 卡死
            useWebWorker: true,
            initialQuality: quality
        };
        
        // 設置尺寸限制
        if (targetW && targetH) {
            options.maxWidthOrHeight = Math.max(parseInt(targetW), parseInt(targetH));
        } else if (targetW) {
            options.maxWidthOrHeight = parseInt(targetW);
        }
        
        // 正確處理輸出格式
        if (format !== 'original') {
            // 轉換 MIME 類型為 browser-image-compression 支持的格式
            if (format === 'image/jpeg') options.fileType = 'jpg';
            else if (format === 'image/webp') options.fileType = 'webp';
            else if (format === 'image/png') options.fileType = 'png';
        }
        
        console.log('Starting compression with options:', options);

        compressedBlob = await imageCompression(currentFile, options);
        console.log('Compression complete:', formatSize(compressedBlob.size));
        
        // 更新預覽圖
        const previewUrl = URL.createObjectURL(compressedBlob);
        const previewImg = document.getElementById('preview-compressed');
        if (previewImg) {
            previewImg.src = previewUrl;
        }
        
        // 計算壓縮率
        const saved = ((currentFile.size - compressedBlob.size) / currentFile.size * 100).toFixed(1);
        const color = saved > 0 ? '#10B981' : '#666';
        document.getElementById('info-compressed').innerHTML = `${formatSize(compressedBlob.size)} <span style="font-size:12px; color:${color};">(${saved > 0 ? '-' : ''}${Math.abs(saved)}%)</span>`;
        
        window.showToast('圖片壓縮完成', 'success');
    } catch (error) { 
        console.error('壓縮錯誤:', error); 
        window.showToast(`壓縮發生錯誤: ${error.message}`, 'error');
    } 
    finally { 
        loadingOverlay.style.display = 'none'; 
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
