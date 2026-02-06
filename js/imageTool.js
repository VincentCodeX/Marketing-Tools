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
// 重點1：極速壓縮 - 立即執行壓縮，不等待圖片預覽加載
// 重點2：背景加載圖片尺寸資訊，異步更新 UI
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
    
    // 【重要】立即執行壓縮，不等待圖片尺寸讀取
    console.log('🚀 立即開始壓縮，不等待圖片尺寸...');
    window.runCompression();
    
    // 【背景任務】異步加載圖片尺寸，僅用於填入默認值和預覽
    (async () => {
        const img = new Image();
        
        // 1. 圖片讀取成功時
        img.onload = () => {
            console.log('Image preview loaded:', img.width, 'x', img.height);
            
            const widthInput = document.getElementById('custom-width');
            const heightInput = document.getElementById('custom-height');
            
            // 自動填入寬高(僅當輸入框為空時)
            if(!widthInput.value) widthInput.value = img.width;
            if(!heightInput.value) heightInput.value = img.height;
            
            // 顯示成功訊息(不阻塞壓縮進程)
            window.showToast(`圖片已載入 (${formatSize(file.size)})`, 'success');
        };
        
        // 2. 圖片讀取失敗時 (不影響壓縮)
        img.onerror = (err) => {
            console.warn('Image preview failed (format support?), but compression continues:', err);
        };
        
        // 載入圖片資料
        try {
            const blobUrl = URL.createObjectURL(file);
            img.src = blobUrl;
        } catch (err) {
            console.error('Blob URL creation failed:', err);
        }
    })();
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
// 重點：加入手機版安全尺寸限制，防止 OOM (記憶體不足)
window.runCompression = async function() {
    if (!currentFile) return;
    
    if (!checkDependencies()) {
        window.showToast('壓縮元件載入中...', 'warning');
        return;
    }
    
    const loadingOverlay = document.getElementById('loading-overlay');
    if (loadingOverlay) loadingOverlay.style.display = 'flex';
    
    try {
        const quality = parseFloat(document.getElementById('quality').value);
        const targetW = document.getElementById('custom-width').value;
        const targetH = document.getElementById('custom-height').value;
        const format = document.getElementById('output-format').value;
        
        // 手機版記憶體保護策略
        let maxSizeMB = 10; // 電腦版預設
        if (isMobileDevice()) {
            maxSizeMB = 2; // 手機版限制 2MB，避免崋激
        }
        
        const options = { 
            maxSizeMB: maxSizeMB, 
            useWebWorker: true, // 手機務必開啟 WebWorker
            initialQuality: quality
        };
        
        // 尺寸設定邏輯
        if (targetW || targetH) {
            // 如果使用者 (或 processImage 背景任務) 已經填入了寬高，就使用該數值
            if (targetW) options.maxWidthOrHeight = parseInt(targetW);
            if (targetW && targetH) options.maxWidthOrHeight = Math.max(parseInt(targetW), parseInt(targetH));
        } else if (isMobileDevice()) {
            // 【關鍵修改】如果輸入框是空的 (代訜圖片還沒讀取完)，且是手機
            // 強制給予一個安全寬度 (1920px)，防止手機試圖壓縮 8K 解析度原圖導致當機
            console.log('Mobile safety mode: limiting to 1920px');
            options.maxWidthOrHeight = 1920;
        }
        
        // 格式處理
        if (format !== 'original') {
            if (format === 'image/jpeg') options.fileType = 'jpg';
            else if (format === 'image/webp') options.fileType = 'webp';
            else if (format === 'image/png') options.fileType = 'png';
        }
        
        console.log('Starting compression:', options);

        // 開始壓縮
        compressedBlob = await imageCompression(currentFile, options);
        
        // 顯示結果
        const previewUrl = URL.createObjectURL(compressedBlob);
        const previewImg = document.getElementById('preview-compressed');
        if (previewImg) {
            previewImg.onload = () => URL.revokeObjectURL(previewImg.src); // 釋放舊記憶體
            previewImg.src = previewUrl;
        }
        
        // 計算數據
        const saved = ((currentFile.size - compressedBlob.size) / currentFile.size * 100).toFixed(1);
        const color = saved > 0 ? '#10B981' : '#666';
        document.getElementById('info-compressed').innerHTML = `${formatSize(compressedBlob.size)} <span style="font-size:12px; color:${color};">(${saved > 0 ? '-' : ''}${Math.abs(saved)}%)</span>`;
        
        window.showToast('壓縮完成！', 'success');
        
    } catch (error) { 
        console.error('壓縮失敗:', error); 
        window.showToast(`壓縮失敗: ${error.message || '記憶體不足'}`, 'error');
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
