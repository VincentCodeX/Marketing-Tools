// --- OCR 名片掃描邏輯 (Tesseract v5) ---

function handleOcrDragLeave(e) { e.preventDefault(); document.getElementById('ocr-drop-zone').style.borderColor = '#E2E8F0'; }
function handleOcrDrop(e) {
    e.preventDefault();
    document.getElementById('ocr-drop-zone').style.borderColor = '#E2E8F0';
    if (e.dataTransfer.files && e.dataTransfer.files[0]) processOcr(e.dataTransfer.files[0]);
}

async function processOcr(file) {
    if (!file) return;
    
    const imgUrl = URL.createObjectURL(file);
    document.getElementById('ocr-preview-img').src = imgUrl;
    document.getElementById('ocr-preview-img').style.display = 'block';
    document.getElementById('ocr-default-view').style.display = 'none';
    document.getElementById('ocr-loading').style.display = 'flex';
    document.getElementById('ocr-status-text').innerText = "初始化引擎中...";
    
    clearOcrForm();

    let worker = null;
    try {
        // 初始化 Worker (chi_tra + eng)
        worker = await Tesseract.createWorker('chi_tra+eng', 1, {
            logger: m => {
                if(m.status === 'recognizing text') {
                    document.getElementById('ocr-status-text').innerText = `辨識中... ${Math.round(m.progress * 100)}%`;
                } else {
                    document.getElementById('ocr-status-text').innerText = `${translateStatus(m.status)} (${Math.round(m.progress * 100)}%)`;
                }
            }
        });

        const { data: { text } } = await worker.recognize(file);
        console.log("OCR 辨識結果:", text);
        
        const parsedData = parseOcrResult(text);
        
        document.getElementById('ocr-name').value = parsedData.name;
        document.getElementById('ocr-title').value = parsedData.title;
        document.getElementById('ocr-company').value = parsedData.company;
        document.getElementById('ocr-phone').value = parsedData.phone;
        document.getElementById('ocr-email').value = parsedData.email;
        document.getElementById('ocr-tax').value = parsedData.tax;
        document.getElementById('ocr-line').value = parsedData.line;

    } catch (error) {
        console.error(error);
        alert("辨識發生錯誤，請稍後再試或檢查圖片。");
    } finally {
        if (worker) await worker.terminate();
        document.getElementById('ocr-loading').style.display = 'none';
    }
}

// 狀態翻譯
function translateStatus(status) {
    const map = {
        'loading tesseract core': '載入核心元件',
        'loading language traineddata': '下載語言包',
        'initializing api': '初始化 API',
        'recognizing text': '辨識文字中'
    };
    return map[status] || status;
}

// 清除表單
function clearOcrForm() {
    ['ocr-name', 'ocr-title', 'ocr-company', 'ocr-phone', 'ocr-email', 'ocr-tax', 'ocr-line'].forEach(id => {
        const el = document.getElementById(id);
        if(el) el.value = '';
    });
}

// 解析邏輯
function parseOcrResult(text) {
    if (!text) return {};
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    const data = { name: '', title: '', company: '', phone: '', email: '', line: '', tax: '' };

    const emailRegex = /[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
    const taxRegex = /\d{8}/;
    const lineRegex = /(line|id)[:\s]*([a-z0-9_.-]+)/i;
    const isPhone = (str) => /^(09\d{8}|0\d{8,9})$/.test(str);

    lines.forEach(line => {
        if (emailRegex.test(line) && !data.email) { data.email = line.match(emailRegex)[0]; return; }
        if (taxRegex.test(line) && !data.tax && (line.includes('統編') || line.length === 8)) { data.tax = line.match(taxRegex)[0]; return; }
        if (lineRegex.test(line) && !data.line) { const match = line.match(lineRegex); if(match && match[2]) data.line = match[2]; return; }
    });

    lines.forEach(line => {
        if (data.phone) return;
        const digits = line.replace(/\D/g, ''); 
        if (isPhone(digits)) {
            data.phone = digits.startsWith('09') && digits.length === 10 ? digits.replace(/(\d{4})(\d{3})(\d{3})/, '$1-$2-$3') : line;
        }
    });

    lines.forEach(line => {
        if (line.includes(data.email) || (data.phone && line.includes(data.phone.split('-')[0]))) return;
        const companyKeywords = ['公司', 'Ltd', 'Inc', 'Co.', 'Group', '銀行', '工作室', '診所', '商行', '中心'];
        if (!data.company && companyKeywords.some(kw => line.includes(kw))) { data.company = line; return; }
        const titleKeywords = ['經理', '總監', '工程師', '專員', 'Manager', 'Director', 'CEO', '襄理', '處長', '負責人', '顧問', '助理', '代表', '設計師', '會計', '創辦人'];
        if (!data.title && titleKeywords.some(kw => line.includes(kw))) { data.title = line; return; }
    });

    lines.forEach(line => {
        if (line.includes(data.email) || line === data.company || line === data.title) return;
        if (data.phone && line.replace(/\D/g, '').includes(data.phone.replace(/\D/g, ''))) return;
        const cleanName = line.replace(/\s/g, '');
        if (!data.name && cleanName.length >= 2 && cleanName.length <= 4) {
            const badKeywords = ['電話', '傳真', '手機', '統編', '地址', '信箱', 'TEL', 'FAX', 'ADD', '路', '號', '樓'];
            if (!/\d/.test(line) && !badKeywords.some(k => line.toUpperCase().includes(k))) { data.name = cleanName; }
        }
    });
    return data;
}

window.copyAllOcr = function() {
    const name = document.getElementById('ocr-name').value;
    const title = document.getElementById('ocr-title').value;
    const company = document.getElementById('ocr-company').value;
    const phone = document.getElementById('ocr-phone').value;
    const email = document.getElementById('ocr-email').value;
    const line = document.getElementById('ocr-line').value;
    const tax = document.getElementById('ocr-tax').value;
    const text = `姓名: ${name}\n職稱: ${title}\n公司: ${company}\n電話: ${phone}\nEmail: ${email}\nLINE: ${line}\n統編: ${tax}`;
    navigator.clipboard.writeText(text).then(() => alert('已複製全部資料'));
}
// 重置 OCR
window.resetOcr = function() {
    clearOcrForm();
    document.getElementById('ocr-preview-img').src = "";
    document.getElementById('ocr-preview-img').style.display = 'none';
    document.getElementById('ocr-default-view').style.display = 'block';
}
