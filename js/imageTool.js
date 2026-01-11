// --- 圖片壓縮邏輯 ---
let currentFile = null;
let compressedBlob = null;

function handleDragOver(e) { e.preventDefault(); document.getElementById('drop-zone').classList.add('dragover'); }
function handleDragLeave(e) { e.preventDefault(); document.getElementById('drop-zone').classList.remove('dragover'); }
function handleDrop(e) {
    e.preventDefault();
    document.getElementById('drop-zone').classList.remove('dragover');
    if (e.dataTransfer.files && e.dataTransfer.files[0]) processImage(e.dataTransfer.files[0]);
}

async function processImage(file) {
    if (!file.type.match('image.*')) { alert("請上傳圖片檔案"); return; }
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

function applyPreset() {
    const preset = document.getElementById('preset-select').value;
    const wInput = document.getElementById('custom-width');
    const hInput = document.getElementById('custom-height');
    if (preset === 'custom') { } else if (preset === '800xauto') { wInput.value = 800; hInput.value = ''; } else { const [w, h] = preset.split('x'); wInput.value = w; hInput.value = h; }
    runCompression();
}

function updateQualityVal() {
    document.getElementById('quality-val').innerText = document.getElementById('quality').value;
    if(this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => { runCompression(); }, 500);
}

async function runCompression() {
    if (!currentFile) return;
    document.getElementById('loading-overlay').style.display = 'flex';
    const quality = parseFloat(document.getElementById('quality').value);
    const targetW = document.getElementById('custom-width').value;
    const format = document.getElementById('output-format').value;
    const options = { maxSizeMB: 50, useWebWorker: true, initialQuality: quality };
    if (targetW) options.maxWidthOrHeight = parseInt(targetW);
    if (format !== 'original') options.fileType = format;

    try {
        compressedBlob = await imageCompression(currentFile, options);
        document.getElementById('preview-compressed').src = URL.createObjectURL(compressedBlob);
        const saved = ((currentFile.size - compressedBlob.size) / currentFile.size * 100).toFixed(1);
        let color = saved > 0 ? '#10B981' : '#666';
        document.getElementById('info-compressed').innerHTML = `${formatSize(compressedBlob.size)} <span style="font-size:12px; color:${color};">(${saved > 0 ? '-' : ''}${Math.abs(saved)}%)</span>`;
    } catch (error) { console.error(error); alert("壓縮發生錯誤"); } 
    finally { document.getElementById('loading-overlay').style.display = 'none'; }
}

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
