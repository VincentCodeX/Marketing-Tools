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

// 添加拖拽事件監聽器（僅在非移動設備上）及文件輸入監聽
document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('drop-zone');
    const imgInput = document.getElementById('img-input');
    
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
    
    // 直接綁定文件輸入的 change 事件（確保在所有設備上都能正確觸發，特別是 iOS）
    if (imgInput) {
        imgInput.addEventListener('change', (e) => {
            const file = e.target.files?.[0];
            if (file) {
                console.log('Image file selected:', file.name, file.type, file.size);
                window.processImage?.(file);
            }
        }, { once: false });
    }
});

window.processImage = async function(file) {
    if (!file) return;
    if (!file.type.match('image.*')) { 
        window.showToast('請上傳圖片檔案', 'error');
        return; 
    }
    
    currentFile = file;
    document.getElementById('preview-empty').style.display = 'none';
    document.getElementById('preview-active').style.display = 'block';
    document.getElementById('info-original').innerText = formatSize(file.size);
    document.getElementById('info-compressed').innerHTML = '0 KB';
    
    // 獲取圖片尺寸，用於設定寬高輸入框的初始值
    const img = new Image();
    let loadTimeout = setTimeout(() => {
        console.warn('圖片加載超時，嘗試直接壓縮');
        window.runCompression();
    }, 3000);
    
    img.onload = () => {
        clearTimeout(loadTimeout);
        const widthInput = document.getElementById('custom-width');
        const heightInput = document.getElementById('custom-height');
        
        // 在移動設備上自動縮放到合理尺寸
        let defaultWidth = img.width;
        if (isMobileDevice() && defaultWidth > 1920) {
            defaultWidth = Math.floor(defaultWidth / 2);
        }
        
        if(!widthInput.value) {
            widthInput.value = defaultWidth;
        }
        if(!heightInput.value) {
            heightInput.value = img.height;
        }
        window.showToast(`圖片已上傳 (${formatSize(file.size)})`, 'success');
        // 圖片加載完成後才開始壓縮
        window.runCompression();
    };
    img.onerror = () => {
        clearTimeout(loadTimeout);
        window.showToast('圖片讀取失敗，請嘗試其他圖片', 'error');
    };
    
    // 使用 Blob URL 創建對象 URL
    try {
        img.src = URL.createObjectURL(file);
    } catch (err) {
        console.error('創建 Blob URL 失敗:', err);
        window.showToast('圖片加載失敗', 'error');
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
    if (!currentFile) {
        window.showToast('請先上傳圖片', 'error');
        return;
    }
    
    if (!checkDependencies()) {
        window.showToast('圖片壓縮庫加載中，請稍候...', 'warning');
        return;
    }
    
    document.getElementById('loading-overlay').style.display = 'flex';
    
    try {
        const quality = parseFloat(document.getElementById('quality').value) / 100;
        const targetW = document.getElementById('custom-width').value;
        const targetH = document.getElementById('custom-height').value;
        const format = document.getElementById('output-format').value;
        
        // 根據設備調整最大文件大小
        let maxSizeMB = 5;
        if (isMobileDevice()) {
            maxSizeMB = 0.5; // 移動設備上降低到 500KB
        }
        
        const options = { 
            maxSizeMB: maxSizeMB, 
            useWebWorker: !isMobileDevice(), // 在移動設備上禁用 Web Worker
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

        compressedBlob = await imageCompression(currentFile, options);
        
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
        document.getElementById('loading-overlay').style.display = 'none'; 
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
