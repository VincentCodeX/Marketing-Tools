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

// 添加拖拽事件監聽器
document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('drop-zone');
    if (dropZone) {
        dropZone.addEventListener('dragover', handleDragOver);
        dropZone.addEventListener('dragleave', handleDragLeave);
        dropZone.addEventListener('drop', handleDrop);
    }
});

window.processImage = async function(file) {
    if (!file) return;
    if (!file.type.match('image.*')) { alert("請上傳圖片檔案"); return; }
    
    currentFile = file;
    document.getElementById('preview-empty').style.display = 'none';
    document.getElementById('preview-active').style.display = 'block';
    
    // 獲取圖片尺寸，用於設定寬高輸入框的初始值
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
        const widthInput = document.getElementById('custom-width');
        const heightInput = document.getElementById('custom-height');
        if(!widthInput.value) {
            widthInput.value = img.width;
        }
        if(!heightInput.value) {
            heightInput.value = img.height;
        }
    };
    img.onerror = () => {
        alert("無法讀取圖片信息");
    };
    
    // 顯示原始文件大小
    document.getElementById('info-original').innerText = formatSize(file.size);
    
    // 自動開始壓縮
    window.runCompression();
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
        alert('請先上傳圖片');
        return;
    }
    
    if (!checkDependencies()) {
        alert('圖片壓縮庫加載中，請稍候...');
        return;
    }
    
    document.getElementById('loading-overlay').style.display = 'flex';
    const quality = parseFloat(document.getElementById('quality').value);
    const targetW = document.getElementById('custom-width').value;
    const format = document.getElementById('output-format').value;
    const options = { maxSizeMB: 50, useWebWorker: true, initialQuality: quality };
    if (targetW) options.maxWidthOrHeight = parseInt(targetW);
    
    // 正確處理輸出格式
    if (format !== 'original') {
        // 轉換 MIME 類型為 browser-image-compression 支持的格式
        if (format === 'image/jpeg') options.fileType = 'jpg';
        else if (format === 'image/webp') options.fileType = 'webp';
        else if (format === 'image/png') options.fileType = 'png';
    }

    try {
        compressedBlob = await imageCompression(currentFile, options);
        document.getElementById('preview-compressed').src = URL.createObjectURL(compressedBlob);
        const saved = ((currentFile.size - compressedBlob.size) / currentFile.size * 100).toFixed(1);
        let color = saved > 0 ? '#10B981' : '#666';
        document.getElementById('info-compressed').innerHTML = `${formatSize(compressedBlob.size)} <span style="font-size:12px; color:${color};">(${saved > 0 ? '-' : ''}${Math.abs(saved)}%)</span>`;
        window.showToast('圖片壓縮完成', 'success');
    } catch (error) { 
        console.error('壓縮錯誤:', error); 
        alert("壓縮發生錯誤: " + error.message); 
    } 
    finally { 
        document.getElementById('loading-overlay').style.display = 'none'; 
    }
}

window.downloadImage = function() {
    if(!compressedBlob) { alert('請先上傳並壓縮圖片'); return; }
    const link = document.createElement('a');
    link.href = URL.createObjectURL(compressedBlob);
    let ext = currentFile.name.split('.').pop();
    const format = document.getElementById('output-format').value;
    if(format === 'image/jpeg') ext = 'jpg';
    if(format === 'image/png') ext = 'png';
    if(format === 'image/webp') ext = 'webp';
    link.download = currentFile.name.replace(/\.[^/.]+$/, "") + '-opt.' + ext;
    link.click();
    
    // 下载成功后提示
    window.showToast('圖片已下載', 'success');
}

function formatSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
