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
// 初始化图片工具（支持动态加载）
function initImageTool() {
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
        console.log('✅ 圖片工具已初始化');
    }
}

// 页面加载时初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initImageTool);
} else {
    // DOM 已加载，立即初始化
    initImageTool();
}

// 修正後的 processImage
window.processImage = async function(file) {
    if (!file) return;
    
    // 檢查是否為圖片
    const isLikelyImage = file.type.match('image.*') || /\.(jpg|jpeg|png|webp|gif|bmp|heic|heif)$/i.test(file.name);
    if (!isLikelyImage && !file.type) console.log('File type unclear, attempting process'); 
    
    currentFile = file;
    
    // UI 狀態更新
    document.getElementById('preview-empty').style.display = 'none';
    document.getElementById('preview-active').style.display = 'block';
    document.getElementById('info-original').innerText = formatSize(file.size);
    document.getElementById('info-compressed').innerHTML = '讀取中...'; // 提示變更
    
    const img = new Image();
    
    // 【關鍵修正】等待圖片讀取完畢，設定好寬高後，才執行壓縮
    img.onload = () => {
        const widthInput = document.getElementById('custom-width');
        const heightInput = document.getElementById('custom-height');
        
        // 自動填入寬高
        widthInput.value = img.width;
        heightInput.value = img.height;
        
        // 釋放記憶體
        URL.revokeObjectURL(img.src);

        // 寬高就緒，開始壓縮
        window.runCompression();
    };
    
    img.onerror = (err) => {
        console.warn('Image preview failed, running compression anyway');
        window.runCompression(); // 讀取失敗才勉強直接跑
    };
    
    // 載入圖片
    img.src = URL.createObjectURL(file);
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
// 修正後的 runCompression
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
        
        // 【關鍵修正】放寬手機版限制，從 2MB 提升到 20MB (或與電腦版一致)
        // 如果你需要防止手機崩潰，設 10-20MB 通常是安全的，2MB 太嚴格
        let maxSizeMB = isMobileDevice() ? 20 : 50; 
        
        const options = { 
            maxSizeMB: maxSizeMB, 
            useWebWorker: true,
            initialQuality: quality
        };
        
        // 尺寸設定邏輯
        if (targetW) options.maxWidthOrHeight = parseInt(targetW);
        if (targetW && targetH) options.maxWidthOrHeight = Math.max(parseInt(targetW), parseInt(targetH));
        
        // 【關鍵修正】移除了 "if (isMobileDevice) ... = 1920" 的強制縮放代碼
        // 因為現在 processImage 已經保證會填入寬高，這裡不需要盲猜了

        // 格式處理
        if (format !== 'original') {
            if (format === 'image/jpeg') options.fileType = 'image/jpeg';
            else if (format === 'image/webp') options.fileType = 'image/webp';
            else if (format === 'image/png') options.fileType = 'image/png';
        }
        
        // 開始壓縮
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
        const color = saved > 0 ? '#10B981' : '#666';
        document.getElementById('info-compressed').innerHTML = `${formatSize(compressedBlob.size)} <span style="font-size:12px; color:${color};">(${saved > 0 ? '-' : ''}${Math.abs(saved)}%)</span>`;
        
        // 只有第一次自動執行時不跳 Toast，避免干擾，這裡可保留
        // window.showToast('壓縮完成！', 'success');
        
    } catch (error) { 
        console.error('壓縮失敗:', error); 
        window.showToast(`壓縮失敗: ${error.message}`, 'error');
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
