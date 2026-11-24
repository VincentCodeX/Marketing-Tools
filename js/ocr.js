// js/ocr.js - 方案 A 強化版（支援 HEIC 轉檔、灰階對比預處理、友善錯誤引導、空欄位補「無」）

// 檢測是否為行動裝置
function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// 檢測是否為 HEIC / HEIF 檔案
function isHeicFile(file) {
    if (!file) return false;
    const type = (file.type || '').toLowerCase();
    const name = (file.name || '').toLowerCase();
    return type.includes('heic') || type.includes('heif') || /\.(heic|heif)$/i.test(name);
}

// 顯示友善的錯誤提示與解決建議
function showOcrErrorTip(title, tips = []) {
    const tipBox = document.getElementById('ocr-error-tip');
    if (!tipBox) return;
    const listHtml = tips.length > 0
        ? `<ul style="margin:6px 0 0 18px; padding:0;">${tips.map(t => `<li>${t}</li>`).join('')}</ul>`
        : '';
    tipBox.innerHTML = `<strong>⚠️ ${title}</strong>${listHtml}`;
    tipBox.style.display = 'block';
}

function hideOcrErrorTip() {
    const tipBox = document.getElementById('ocr-error-tip');
    if (tipBox) {
        tipBox.style.display = 'none';
        tipBox.innerHTML = '';
    }
}

// 1. 初始化邏輯（防止重複綁定）
function initOcrTool() {
    if (window.ocrInitialized) return;

    const ocrDropZone = document.getElementById('ocr-drop-zone');
    if (ocrDropZone) {
        const uploadText = ocrDropZone.querySelector('.upload-text');
        if (uploadText && isMobileDevice()) {
            uploadText.textContent = '點擊拍攝或選擇名片';
        }

        // 桌面版拖放上傳
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

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initOcrTool);
} else {
    initOcrTool();
}

// 將圖片進行灰階與對比度增強，提升 Tesseract 辨識率（不影響左側彩色預覽）
function preprocessImageForOcr(blob) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(blob);

        img.onload = () => {
            try {
                URL.revokeObjectURL(url);
                let width = img.naturalWidth || img.width;
                let height = img.naturalHeight || img.height;

                // 調整至適合 OCR 的清晰解析度（長邊控制在 1400~1800px）
                const maxSide = 1800;
                const minRecommended = 1200;
                const longest = Math.max(width, height);

                if (longest > maxSide) {
                    const ratio = maxSide / longest;
                    width = Math.round(width * ratio);
                    height = Math.round(height * ratio);
                } else if (longest < minRecommended && longest > 0) {
                    const ratio = Math.min(2, minRecommended / longest);
                    width = Math.round(width * ratio);
                    height = Math.round(height * ratio);
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d', { willReadFrequently: true });

                // 先鋪白底避免透明 PNG 變黑底
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, width, height);
                ctx.drawImage(img, 0, 0, width, height);

                // 轉灰階並提升對比度，讓文字邊緣更銳利
                const imageData = ctx.getImageData(0, 0, width, height);
                const data = imageData.data;
                const contrast = 1.35; // 溫和對比增強，避免深色名片資訊遺失

                for (let i = 0; i < data.length; i += 4) {
                    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
                    let enhanced = (gray - 128) * contrast + 128;
                    if (enhanced < 0) enhanced = 0;
                    if (enhanced > 255) enhanced = 255;
                    data[i] = data[i + 1] = data[i + 2] = enhanced;
                }
                ctx.putImageData(imageData, 0, 0);

                // 輸出無損 PNG 避免 JPG 壓縮雜訊影響字體邊緣
                canvas.toBlob((processedBlob) => {
                    if (processedBlob) {
                        resolve(processedBlob);
                    } else {
                        resolve(blob);
                    }
                }, 'image/png');
            } catch (err) {
                reject(err);
            }
        };

        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('圖片無法在瀏覽器解碼'));
        };

        img.src = url;
    });
}

// 2. 核心處理邏輯
window.processOcr = async function(file) {
    if (!file) return;

    hideOcrErrorTip();

    // 立即攔截 HEIC/HEIF 檔案並給出明確解決建議
    if (isHeicFile(file)) {
        window.showToast?.('目前不支援 HEIC 格式，請改用 JPG 或 PNG', 'warning');
        showOcrErrorTip('目前不支援 iPhone HEIC 原檔格式', [
            '請優先上傳 <strong>JPG</strong> 或 <strong>PNG</strong> 格式圖片。',
            '最快速的解法：在手機打開這張名片照片「截圖」，直接上傳截圖即可。',
            '也可在 iPhone「設定 → 相機 → 格式」改為「最相容」，日後拍攝即會直接存成 JPG。'
        ]);
        return;
    }

    const fileNameValid = /\.(jpg|jpeg|png|webp|gif|bmp)$/i.test(file.name || '');
    if (file.type && !file.type.startsWith('image/') && !fileNameValid) {
        window.showToast?.('此檔案格式不支援辨識', 'warning');
        showOcrErrorTip('不支援此檔案格式', [
            '請上傳圖片檔案（建議使用 JPG 或 PNG 格式）。',
            '如果是 PDF 或文件檔，請先截圖存成圖片後再上傳。'
        ]);
        return;
    }

    const previewImg = document.getElementById('ocr-preview-img');
    const defaultView = document.getElementById('ocr-default-view');
    const loadingEl = document.getElementById('ocr-loading');
    const statusText = document.getElementById('ocr-status-text');
    const rawWrapper = document.getElementById('ocr-raw-wrapper');
    const rawTextEl = document.getElementById('ocr-raw-text');

    try {
        clearOcrForm();
        if (rawWrapper) rawWrapper.style.display = 'none';
        if (rawTextEl) rawTextEl.value = '';
        if (previewImg) previewImg.style.display = 'none';
        if (defaultView) defaultView.style.display = 'none';
        if (loadingEl) loadingEl.style.display = 'flex';

        const displayBlob = file;

        // 顯示彩色預覽圖
        if (previewImg) {
            const previewUrl = URL.createObjectURL(displayBlob);
            previewImg.onload = () => URL.revokeObjectURL(previewUrl);
            previewImg.src = previewUrl;
            previewImg.style.display = 'block';
        }

        // 步驟 B：影像清晰化前處理（高解析度＋灰階對比增強）
        if (statusText) statusText.innerText = '正在增強影像清晰度與文字對比...';
        let ocrBlob = displayBlob;
        try {
            ocrBlob = await preprocessImageForOcr(displayBlob);
        } catch (prepErr) {
            console.warn('⚠️ 影像前處理失敗，改用原圖辨識:', prepErr);
        }

        // 步驟 C：檢查 Tesseract 引擎
        if (typeof Tesseract === 'undefined') {
            throw new Error('TESSERACT_MISSING');
        }

        if (statusText) statusText.innerText = '正在啟動文字辨識引擎...';

        let worker = null;
        try {
            worker = await Tesseract.createWorker('chi_tra+eng', 1, {
                logger: m => {
                    if (!statusText) return;
                    if (m.status === 'recognizing text') {
                        statusText.innerText = `辨識文字中... ${Math.round(m.progress * 100)}%`;
                    } else {
                        statusText.innerText = translateStatus(m.status);
                    }
                }
            });

            const { data: { text } } = await worker.recognize(ocrBlob);
            const cleanedRaw = (text || '').trim();
            console.log('OCR 結果片段:', cleanedRaw.substring(0, 80));

            // 顯示原始文字供使用者核對
            if (rawWrapper && rawTextEl) {
                rawTextEl.value = cleanedRaw || '（未偵測到文字）';
                rawWrapper.style.display = 'block';
            }

            // 解析資料
            const parsedData = parseOcrResult(cleanedRaw);

            // 填入表單（沒有偵測到對應資料的欄位統一填入「無」）
            const setFieldValue = (id, val) => {
                const el = document.getElementById(id);
                if (el) el.value = (val && String(val).trim()) ? String(val).trim() : '無';
            };
            setFieldValue('ocr-name', parsedData.name);
            setFieldValue('ocr-title', parsedData.title);
            setFieldValue('ocr-company', parsedData.company);
            setFieldValue('ocr-phone', parsedData.phone);
            setFieldValue('ocr-email', parsedData.email);
            setFieldValue('ocr-tax', parsedData.tax);
            setFieldValue('ocr-line', parsedData.line);

            const hasAnyField = Object.values(parsedData).some(v => v && String(v).trim() !== '');

            if (cleanedRaw.length < 3) {
                window.showToast?.('未能讀取到清晰文字，建議重新拍攝', 'warning');
                showOcrErrorTip('未偵測到足夠的文字內容', [
                    '請盡量正面平拍名片，讓名片佔滿畫面大部分區域。',
                    '避開強光反光、陰影或花俏背景，文字會清楚許多。',
                    '若名片為深色底或特殊藝術字體，建議先用手機內建相片「調亮／增強對比」後再上傳。'
                ]);
            } else if (!hasAnyField) {
                window.showToast?.('辨識完成，但未能自動分類欄位', 'info');
                showOcrErrorTip('已讀取到文字，但無法自動對應欄位', [
                    '請點開右側下方的「查看原始辨識文字」，直接複製並貼上到對應欄位。',
                    '未能自動對應的欄位已先為您填入「無」。'
                ]);
            } else {
                window.showToast?.('名片辨識完成！未偵測到的欄位已標示為「無」', 'success');
            }
        } catch (ocrError) {
            console.error('OCR 內部錯誤:', ocrError);
            window.showToast?.('文字辨識發生錯誤，請查看下方建議', 'error');
            showOcrErrorTip('文字辨識過程發生中斷', [
                '首次使用需下載繁體中文語言包，請確認目前網路連線正常。',
                '建議重新整理頁面後，改用較清晰的 JPG 或 PNG 圖片再試一次。'
            ]);
        } finally {
            if (worker) await worker.terminate();
            if (loadingEl) loadingEl.style.display = 'none';
        }
    } catch (error) {
        console.error('OCR 流程錯誤:', error);
        if (loadingEl) loadingEl.style.display = 'none';
        if (defaultView) defaultView.style.display = 'block';

        if (error.message === 'TESSERACT_MISSING') {
            window.showToast?.('辨識元件尚未載入完成，請稍候再試', 'warning');
            showOcrErrorTip('辨識元件載入中或網路受限', [
                '請等待幾秒鐘後重新上傳，或重新整理頁面。',
                '若處於離線狀態，需先連網載入一次辨識元件後才能離線使用。'
            ]);
        } else {
            window.showToast?.('圖片讀取失敗，請更換圖片再試', 'error');
            showOcrErrorTip('無法讀取此圖片', [
                '請確認檔案沒有損毀，並優先使用 JPG 或 PNG 格式。',
                '若檔案過大，建議先使用本站「圖片壓縮」功能轉成 JPG 後再辨識。'
            ]);
        }
    }
};

// 輔助函式：狀態翻譯
function translateStatus(status) {
    const map = {
        'loading tesseract core': '正在載入辨識核心...',
        'initializing tesseract': '正在初始化辨識引擎...',
        'loading language traineddata': '正在下載繁體中文語言資料（首次較久）...',
        'initializing api': '正在準備辨識介面...',
        'recognizing text': '辨識文字中...'
    };
    return map[status] || '處理中...';
}

// 輔助函式：清除表單
function clearOcrForm() {
    ['ocr-name', 'ocr-title', 'ocr-company', 'ocr-phone', 'ocr-email', 'ocr-tax', 'ocr-line'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
}

// 輔助函式：解析邏輯（放寬電話、國碼、分機、中英姓名、統編、LINE ID 規則）
function parseOcrResult(text) {
    const data = { name: '', title: '', company: '', phone: '', email: '', line: '', tax: '' };
    if (!text) return data;

    const lines = text
        .split('\n')
        .map(line => line.replace(/[|｜]/g, ' ').trim())
        .filter(line => line.length > 0);

    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
    const taxKeywordRegex = /(?:統一編號|統編|tax\s*id|vat)[:：\s#]*(\d{8})/i;
    const standaloneTaxRegex = /^\d{8}$/;
    const lineRegex = /(?:line(?:\s*id)?|賴)[:：\s]*(@?[a-zA-Z0-9_.-]{3,})/i;

    // 支援台灣手機（含 +886）、市話（含區碼與括號）以及分機
    const mobileRegex = /(?:\+?886[-\s]?)?0?9\d{2}[-\s]?\d{3}[-\s]?\d{3}/;
    const landlineRegex = /(?:\+?886[-\s]?)?\(?0\d{1,2}\)?[-\s]?\d{3,4}[-\s]?\d{3,4}(?:\s*(?:#|ext\.?|分機)\s*\d+)?/i;

    // 第一次掃描：Email、統編、LINE ID
    lines.forEach(line => {
        if (!data.email && emailRegex.test(line)) {
            data.email = line.match(emailRegex)[0];
        }
        if (!data.tax) {
            const kwMatch = line.match(taxKeywordRegex);
            if (kwMatch) {
                data.tax = kwMatch[1];
            } else if (standaloneTaxRegex.test(line.replace(/\s/g, ''))) {
                data.tax = line.replace(/\s/g, '');
            }
        }
        if (!data.line && lineRegex.test(line)) {
            const match = line.match(lineRegex);
            if (match && match[1]) data.line = match[1];
        }
    });

    // 第二次掃描：電話（優先手機，再找市話，排除傳真行）
    lines.forEach(line => {
        if (data.phone) return;
        const isFaxOnly = /fax|傳真/i.test(line) && !/tel|phone|電話|手機|mobile/i.test(line);
        if (isFaxOnly) return;

        const mMatch = line.match(mobileRegex);
        if (mMatch) {
            let digits = mMatch[0].replace(/\D/g, '');
            if (digits.startsWith('886')) digits = '0' + digits.slice(3);
            if (digits.length === 9 && digits.startsWith('9')) digits = '0' + digits;
            data.phone = digits.length === 10
                ? digits.replace(/(\d{4})(\d{3})(\d{3})/, '$1-$2-$3')
                : mMatch[0].trim();
            return;
        }

        const lMatch = line.match(landlineRegex);
        if (lMatch) {
            data.phone = lMatch[0].trim();
        }
    });

    // 第三次掃描：公司與職稱
    const companyKeywords = [
        '公司', '股份有限公司', '有限公司', '企業', '科技', '行銷', '創意', '設計',
        '工作室', '診所', '商行', '中心', '銀行', '事務所', '協會', '集團', '商店',
        'Ltd', 'Inc', 'Co.', 'Corp', 'Group', 'Studio', 'Agency'
    ];
    const titleKeywords = [
        '總經理', '副總', '經理', '副理', '襄理', '協理', '總監', '執行長', '創辦人', '負責人',
        '處長', '主任', '組長', '課長', '工程師', '設計師', '專員', '顧問', '助理', '代表', '會計', '業務', '企劃',
        'CEO', 'CTO', 'COO', 'CFO', 'Founder', 'Director', 'Manager', 'Lead', 'Designer', 'Engineer', 'Specialist', 'Consultant'
    ];

    lines.forEach(line => {
        if (data.email && line.includes(data.email)) return;
        if (!data.company && companyKeywords.some(kw => line.toLowerCase().includes(kw.toLowerCase()))) {
            data.company = line;
            return;
        }
        if (!data.title && titleKeywords.some(kw => line.toLowerCase().includes(kw.toLowerCase()))) {
            data.title = line;
        }
    });

    // 第四次掃描：姓名（支援純中文 2-4 字、中英並列如「王小明 Vincent」、或英文名如「Vincent Chen」）
    const badNameKeywords = [
        '電話', '傳真', '手機', '統編', '地址', '信箱', '官網', '網站', 'LINE', 'TEL', 'FAX', 'ADD',
        'HTTP', 'WWW', '路', '街', '段', '巷', '弄', '號', '樓', '區', '市', '縣', '台灣', 'TAIWAN'
    ];

    lines.forEach(line => {
        if (data.name) return;
        if (line === data.company || line === data.title) return;
        if (data.email && line.includes(data.email)) return;
        if (/\d/.test(line)) return;
        if (badNameKeywords.some(k => line.toUpperCase().includes(k))) return;

        const cleanCn = line.replace(/[^\u4e00-\u9fa5]/g, '');
        const cleanAll = line.replace(/\s+/g, ' ').trim();

        // 情況 1：含 2~4 個中文字（可附帶英文名，總長不超過 20）
        if (cleanCn.length >= 2 && cleanCn.length <= 4 && cleanAll.length <= 20) {
            data.name = cleanAll;
            return;
        }
        // 情況 2：純英文姓名（2~3 個英文單字）
        if (/^[A-Za-z]+(?:\s+[A-Za-z]+){1,2}$/.test(cleanAll) && cleanAll.length <= 24) {
            data.name = cleanAll;
        }
    });

    return data;
}

// 4. 重置與複製／匯出功能
window.copyAllOcr = function() {
    const fields = ['ocr-name', 'ocr-title', 'ocr-company', 'ocr-phone', 'ocr-email', 'ocr-line', 'ocr-tax'];
    const labels = ['姓名', '職稱', '公司', '電話', 'Email', 'LINE', '統編'];

    let text = '';
    fields.forEach((id, index) => {
        const el = document.getElementById(id);
        const val = el ? el.value : '';
        if (val) text += `${labels[index]}: ${val}\n`;
    });

    if (!text) {
        window.showToast?.('沒有資料可複製', 'warning');
        return;
    }

    navigator.clipboard.writeText(text).then(() => {
        window.showToast?.('已複製全部資料', 'success');
    }).catch(err => {
        console.error(err);
        window.showToast?.('複製失敗', 'error');
    });
};

window.copyNotionFormat = function() {
    const fields = getOcrFields();
    const hasData = Object.values(fields).some(v => v && v.trim() !== '');
    if (!hasData) {
        window.showToast?.('沒有可複製的資料', 'warning');
        return;
    }

    const notionText = [
        `Name:: ${fields.name || '無'}`,
        `Title:: ${fields.title || '無'}`,
        `Company:: ${fields.company || '無'}`,
        `Phone:: ${fields.phone || '無'}`,
        `Email:: ${fields.email || '無'}`,
        `LINE:: ${fields.line || '無'}`,
        `Tax ID:: ${fields.tax || '無'}`
    ].join('\n');

    navigator.clipboard.writeText(notionText)
        .then(() => window.showToast?.('Notion 格式已複製', 'success'))
        .catch((err) => {
            console.error(err);
            window.showToast?.('複製失敗，請手動複製', 'error');
        });
};

window.exportToCsv = function() {
    const fields = getOcrFields();
    const rows = [
        ['欄位', '內容'],
        ['姓名', fields.name || '無'],
        ['職稱', fields.title || '無'],
        ['公司', fields.company || '無'],
        ['電話', fields.phone || '無'],
        ['Email', fields.email || '無'],
        ['LINE', fields.line || '無'],
        ['統編', fields.tax || '無']
    ];
    const csv = rows.map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(',')).join('\n');

    navigator.clipboard.writeText(csv)
        .then(() => window.showToast?.('CSV 資料已複製', 'success'))
        .catch((err) => {
            console.error(err);
            window.showToast?.('複製失敗，請手動複製', 'error');
        });
};

window.exportToJson = function() {
    const rawFields = getOcrFields();
    const fields = {};
    Object.keys(rawFields).forEach(k => {
        fields[k] = rawFields[k] || '無';
    });
    const jsonText = JSON.stringify(fields, null, 2);

    navigator.clipboard.writeText(jsonText)
        .then(() => window.showToast?.('JSON 已複製', 'success'))
        .catch((err) => {
            console.error(err);
            window.showToast?.('複製失敗，請手動複製', 'error');
        });
};

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
    hideOcrErrorTip();
    const rawWrapper = document.getElementById('ocr-raw-wrapper');
    const rawTextEl = document.getElementById('ocr-raw-text');
    if (rawWrapper) rawWrapper.style.display = 'none';
    if (rawTextEl) rawTextEl.value = '';

    const previewImg = document.getElementById('ocr-preview-img');
    if (previewImg) {
        previewImg.src = '';
        previewImg.style.display = 'none';
    }
    const defaultView = document.getElementById('ocr-default-view');
    if (defaultView) defaultView.style.display = 'block';
    const input = document.getElementById('ocr-input');
    if (input) input.value = '';
};
