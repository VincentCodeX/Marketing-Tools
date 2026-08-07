// js/ocr.js - 最終修正版 (整合預處理與容錯)

// 檢測是否移動設備
function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// 1. 初始化邏輯 (防止雙重綁定)
function initOcrTool() {
    // 檢查是否已經初始化過 (透過標記)
    if (window.ocrInitialized) return;
    
    const ocrDropZone = document.getElementById('ocr-drop-zone');
    if (ocrDropZone) {
        // UI 文字調整
        const uploadText = ocrDropZone.querySelector('.upload-text');
        if (uploadText && isMobileDevice()) {
            uploadText.textContent = '點擊拍攝或選擇名片';
        }

        // 拖曳事件 (僅桌面版)
        if (!isMobileDevice()) {
            ocrDropZone.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.stopPropagation();
                ocrDropZone.classList.add('dragover');
            });
            ocrDropZone.addEventListener('dragleave', (e) => {
                e.preventDefault();
                e.stopPropagation();
                ocrDropZone.classList.remove('dragover');
            });
            ocrDropZone.addEventListener('drop', (e) => {
                e.preventDefault();
                e.stopPropagation();
                ocrDropZone.classList.remove('dragover');
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    window.processOcr(e.dataTransfer.files[0]);
                }
            });
        }
        console.log('✅ OCR 工具已初始化');
        window.ocrInitialized = true;
    }
}

// 頁面載入監聽
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initOcrTool);
} else {
    initOcrTool();
}

// 2. 核心處理邏輯
window.processOcr = async function(file) {
    if (!file) return;

    // 【修正1】寬鬆的格式檢查 (允許 iOS 空 type)
    // 只要檔名看起來像圖片，或 type 為空但有 size，就嘗試處理
    const fileNameValid = /\.(jpg|jpeg|png|webp|gif|bmp|heic)$/i.test(file.name);
    if (file.type && !file.type.startsWith('image/') && !fileNameValid) {
        window.showToast?.('請上傳正確的圖片格式', 'warning');
        return;
    }

    try {
        // UI 重置與載入狀態
        clearOcrForm();
        document.getElementById('ocr-preview-img').style.display = 'none';
        document.getElementById('ocr-default-view').style.display = 'none';
        document.getElementById('ocr-loading').style.display = 'flex';
        document.getElementById('ocr-status-text').innerText = "影像優化處理中...";
        
        // 【修正2】關鍵優化：先壓縮與轉換圖片
        // 這解決了 HEIC 不支援的問題，並防止手機記憶體爆掉
        let fileToProcess = file;
        
        // 檢查是否有壓縮庫可用 (依賴 index.html 的 browser-image-compression)
        if (typeof imageCompression !== 'undefined') {
            try {
                const options = {
                    maxSizeMB: 1,           // 限制在 1MB 以內，加快 OCR
                    maxWidthOrHeight: 1024, // 限制尺寸，OCR 不需要 4K 畫質
                    useWebWorker: true,
                    fileType: 'image/jpeg'  // 強制轉為 JPG (解決 HEIC/PNG 問題)
                };
                fileToProcess = await imageCompression(file, options);
                console.log(`OCR 預處理完成: ${file.size} -> ${fileToProcess.size}`);
            } catch (err) {
                console.warn('OCR 預壓縮失敗，使用原圖:', err);
            }
        }

        // 顯示預覽 (使用處理過的圖片)
        const imgUrl = URL.createObjectURL(fileToProcess);
        const previewImg = document.getElementById('ocr-preview-img');
        previewImg.src = imgUrl;
        previewImg.style.display = 'block';
        previewImg.onload = () => URL.revokeObjectURL(imgUrl); // 釋放記憶體

        document.getElementById('ocr-status-text').innerText = "啟動辨識引擎...";

        // 3. 執行 Tesseract
        let worker = null;
        try {
            worker = await Tesseract.createWorker('chi_tra+eng', 1, {
                logger: m => {
                    if (m.status === 'recognizing text') {
                        document.getElementById('ocr-status-text').innerText = `辨識中... ${Math.round(m.progress * 100)}%`;
                    } else {
                        document.getElementById('ocr-status-text').innerText = `${translateStatus(m.status)}`;
                    }
                }
            });

            const { data: { text } } = await worker.recognize(fileToProcess);
            console.log("OCR 結果片段:", text.substring(0, 50));
            
            // 解析資料
            const parsedData = parseOcrResult(text);
            
            // 填入表單
            document.getElementById('ocr-name').value = parsedData.name;
            document.getElementById('ocr-title').value = parsedData.title;
            document.getElementById('ocr-company').value = parsedData.company;
            document.getElementById('ocr-phone').value = parsedData.phone;
            document.getElementById('ocr-email').value = parsedData.email;
            document.getElementById('ocr-tax').value = parsedData.tax;
            document.getElementById('ocr-line').value = parsedData.line;
            
            window.showToast?.('名片辨識完成', 'success');

        } catch (ocrError) {
            console.error('OCR 內部錯誤:', ocrError);
            window.showToast?.('辨識失敗，請重試', 'error');
        } finally {
            if (worker) await worker.terminate();
            document.getElementById('ocr-loading').style.display = 'none';
        }

    } catch (error) {
        console.error('OCR 流程錯誤:', error);
        window.showToast?.('發生未知錯誤', 'error');
        document.getElementById('ocr-loading').style.display = 'none';
        document.getElementById('ocr-default-view').style.display = 'block'; // 恢復顯示
    }
}

// 輔助函式：狀態翻譯
function translateStatus(status) {
    const map = {
        'loading tesseract core': '載入核心元件',
        'loading language traineddata': '下載語言資料',
        'initializing api': '初始化 API',
        'recognizing text': '辨識文字中'
    };
    return map[status] || '處理中...';
}

// 輔助函式：清除表單
function clearOcrForm() {
    ['ocr-name', 'ocr-title', 'ocr-company', 'ocr-phone', 'ocr-email', 'ocr-tax', 'ocr-line'].forEach(id => {
        const el = document.getElementById(id);
        if(el) el.value = '';
    });
}

// 輔助函式：解析邏輯 (保持不變，但增加容錯)
function parseOcrResult(text) {
    if (!text) return {};
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    const data = { name: '', title: '', company: '', phone: '', email: '', line: '', tax: '' };

    const emailRegex = /[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
    const taxRegex = /\d{8}/;
    const lineRegex = /(line|id)[:\s]*([a-z0-9_.-]+)/i;
    const isPhone = (str) => /^(09\d{8}|0\d{8,9})$/.test(str);

    // 第一次掃描：找 Email, 統編, Line
    lines.forEach(line => {
        if (emailRegex.test(line) && !data.email) { data.email = line.match(emailRegex)[0]; return; }
        if (taxRegex.test(line) && !data.tax && (line.includes('統編') || line.length === 8)) { data.tax = line.match(taxRegex)[0]; return; }
        if (lineRegex.test(line) && !data.line) { const match = line.match(lineRegex); if(match && match[2]) data.line = match[2]; return; }
    });

    // 第二次掃描：找電話 (移除符號後判斷)
    lines.forEach(line => {
        if (data.phone) return;
        const digits = line.replace(/\D/g, ''); 
        if (isPhone(digits)) {
            // 格式化電話
            data.phone = digits.startsWith('09') && digits.length === 10 ? digits.replace(/(\d{4})(\d{3})(\d{3})/, '$1-$2-$3') : line;
        }
    });

    // 第三次掃描：找公司與職稱
    lines.forEach(line => {
        if (line.includes(data.email) || (data.phone && line.includes(data.phone.split('-')[0]))) return;
        const companyKeywords = ['公司', 'Ltd', 'Inc', 'Co.', 'Group', '銀行', '工作室', '診所', '商行', '中心', '店'];
        if (!data.company && companyKeywords.some(kw => line.includes(kw))) { data.company = line; return; }
        const titleKeywords = ['經理', '總監', '工程師', '專員', 'Manager', 'Director', 'CEO', '襄理', '處長', '負責人', '顧問', '助理', '代表', '設計師', '會計', '創辦人'];
        if (!data.title && titleKeywords.some(kw => line.includes(kw))) { data.title = line; return; }
    });

    // 第四次掃描：找名字 (排除法)
    lines.forEach(line => {
        if (line.includes(data.email) || line === data.company || line === data.title) return;
        if (data.phone && line.replace(/\D/g, '').includes(data.phone.replace(/\D/g, ''))) return;
        const cleanName = line.replace(/\s/g, '');
        // 名字通常 2-4 字，且不包含數字或關鍵字
        if (!data.name && cleanName.length >= 2 && cleanName.length <= 4) {
            const badKeywords = ['電話', '傳真', '手機', '統編', '地址', '信箱', 'TEL', 'FAX', 'ADD', '路', '號', '樓', '區', '市', '縣'];
            if (!/\d/.test(line) && !badKeywords.some(k => line.toUpperCase().includes(k))) { data.name = cleanName; }
        }
    });
    return data;
}

// 4. 重置與複製功能
window.copyAllOcr = function() {
    const fields = ['ocr-name', 'ocr-title', 'ocr-company', 'ocr-phone', 'ocr-email', 'ocr-line', 'ocr-tax'];
    const labels = ['姓名', '職稱', '公司', '電話', 'Email', 'LINE', '統編'];
    
    let text = '';
    fields.forEach((id, index) => {
        const val = document.getElementById(id).value;
        if(val) text += `${labels[index]}: ${val}\n`;
    });

    if(!text) {
        window.showToast?.('沒有資料可複製', 'warning');
        return;
    }

    navigator.clipboard.writeText(text).then(() => {
        window.showToast?.('已複製全部資料', 'success');
    }).catch(err => {
        console.error(err);
        window.showToast?.('複製失敗', 'error');
    });
}

window.copyNotionFormat = function() {
    const fields = getOcrFields();
    const notionText = [
        `Name:: ${fields.name}`,
        `Title:: ${fields.title}`,
        `Company:: ${fields.company}`,
        `Phone:: ${fields.phone}`,
        `Email:: ${fields.email}`,
        `LINE:: ${fields.line}`,
        `Tax ID:: ${fields.tax}`
    ].filter(line => line.trim().endsWith('::') === false).join('\n');

    if (!notionText) {
        window.showToast?.('沒有可複製的資料', 'warning');
        return;
    }

    navigator.clipboard.writeText(notionText)
        .then(() => window.showToast?.('Notion 格式已複製', 'success'))
        .catch((err) => {
            console.error(err);
            window.showToast?.('複製失敗，請手動複製', 'error');
        });
}

window.exportToCsv = function() {
    const fields = getOcrFields();
    const rows = [
        ['欄位', '內容'],
        ['姓名', fields.name],
        ['職稱', fields.title],
        ['公司', fields.company],
        ['電話', fields.phone],
        ['Email', fields.email],
        ['LINE', fields.line],
        ['統編', fields.tax]
    ];
    const csv = rows.map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(',')).join('\n');

    navigator.clipboard.writeText(csv)
        .then(() => window.showToast?.('CSV 資料已複製', 'success'))
        .catch((err) => {
            console.error(err);
            window.showToast?.('複製失敗，請手動複製', 'error');
        });
}

window.exportToJson = function() {
    const fields = getOcrFields();
    const jsonText = JSON.stringify(fields, null, 2);

    navigator.clipboard.writeText(jsonText)
        .then(() => window.showToast?.('JSON 已複製', 'success'))
        .catch((err) => {
            console.error(err);
            window.showToast?.('複製失敗，請手動複製', 'error');
        });
}

function getOcrFields() {
    return {
        name: document.getElementById('ocr-name')?.value || '',
        title: document.getElementById('ocr-title')?.value || '',
        company: document.getElementById('ocr-company')?.value || '',
        phone: document.getElementById('ocr-phone')?.value || '',
        email: document.getElementById('ocr-email')?.value || '',
        line: document.getElementById('ocr-line')?.value || '',
        tax: document.getElementById('ocr-tax')?.value || ''
    };
}

window.resetOcr = function() {
    clearOcrForm();
    const previewImg = document.getElementById('ocr-preview-img');
    if (previewImg) {
        previewImg.src = "";
        previewImg.style.display = 'none';
    }
    const defaultView = document.getElementById('ocr-default-view');
    if (defaultView) defaultView.style.display = 'block';
    const input = document.getElementById('ocr-input');
    if (input) input.value = ''; // 清空 file input 以便重複上傳同一張
}