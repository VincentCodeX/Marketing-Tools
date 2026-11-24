// --- Short URL 產生器 (is.gd JSONP + TinyURL 備用) ---
// 透過 JSONP 呼叫 is.gd，避免純前端瀏覽器 CORS 阻擋
function fetchIsGdJsonp(longUrl, timeoutMs = 8000) {
    return new Promise((resolve, reject) => {
        const callbackName = 'isGdCallback_' + Date.now() + '_' + Math.floor(Math.random() * 10000);
        const script = document.createElement('script');
        let finished = false;

        const cleanup = () => {
            if (script.parentNode) script.parentNode.removeChild(script);
            delete window[callbackName];
        };

        const timer = setTimeout(() => {
            if (finished) return;
            finished = true;
            cleanup();
            reject(new Error('is.gd 連線逾時'));
        }, timeoutMs);

        window[callbackName] = (data) => {
            if (finished) return;
            finished = true;
            clearTimeout(timer);
            cleanup();
            if (data && data.shorturl) {
                resolve(data.shorturl);
            } else {
                reject(new Error(data?.errormessage || 'is.gd 回傳格式異常'));
            }
        };

        script.onerror = () => {
            if (finished) return;
            finished = true;
            clearTimeout(timer);
            cleanup();
            reject(new Error('無法連線至 is.gd'));
        };

        script.src = `https://is.gd/create.php?format=json&callback=${callbackName}&url=${encodeURIComponent(longUrl)}`;
        document.head.appendChild(script);
    });
}

window.generateShortUrl = async function() {
    const longUrl = document.getElementById('long-url').value.trim();
    const resultBox = document.getElementById('short-result');
    const linkDisplay = document.getElementById('short-link');
    const btnText = document.getElementById('btn-text');
    const btnLoader = document.getElementById('btn-loader');
    const shortenBtn = document.getElementById('shorten-btn');

    if (!longUrl) { 
        window.showToast?.('請輸入網址！', 'warning'); 
        return; 
    }
    
    // 驗證 URL 格式
    try {
        new URL(longUrl);
    } catch (e) {
        window.showToast?.('請輸入有效的網址（例如：https://example.com）', 'warning');
        return;
    }
    
    btnText.style.display = 'none'; 
    btnLoader.style.display = 'inline-block'; 
    shortenBtn.disabled = true; 
    resultBox.style.display = 'none';

    try {
        let shortUrl = null;

        // 方案 1：使用 is.gd JSONP（跨網域穩定可用）
        try {
            shortUrl = await fetchIsGdJsonp(longUrl, 8000);
            console.log('✅ is.gd 成功:', shortUrl);
        } catch (e1) {
            console.warn('⚠️ is.gd API 失敗:', e1.message);
        }

        // 方案 2：如果 is.gd 失敗，嘗試 TinyURL
        if (!shortUrl) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 8000);
                
                const response = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(longUrl)}`, {
                    signal: controller.signal
                });
                clearTimeout(timeoutId);
                
                if (response.ok) {
                    const text = (await response.text()).trim();
                    if (text.startsWith('http')) {
                        shortUrl = text;
                        console.log('✅ TinyURL 成功:', shortUrl);
                    }
                }
            } catch (e2) {
                console.warn('⚠️ TinyURL API 失敗:', e2.message);
            }
        }

        if (shortUrl) {
            linkDisplay.innerText = shortUrl;
            linkDisplay.href = shortUrl.startsWith('http') ? shortUrl : 'https://' + shortUrl;
            resultBox.style.display = 'block';
            resultBox.classList.add('active');
            window.showToast?.('短網址已產生！', 'success');
        } else {
            window.showToast?.('目前短網址服務暫時無法連線，請稍後再試', 'error');
        }
    } catch (error) { 
        console.error('縮短網址錯誤:', error); 
        window.showToast?.('產生短網址時發生錯誤，請稍後再試', 'error');
    } 
    finally { 
        btnText.style.display = 'inline'; 
        btnLoader.style.display = 'none'; 
        shortenBtn.disabled = false; 
    }
}

window.copyShortUrl = function() {
    const urlText = document.getElementById('short-link').innerText;
    if (!urlText || urlText === 'https://is.gd/xyz') {
        window.showToast?.('請先產生短網址', 'warning');
        return;
    }
    
    navigator.clipboard.writeText(urlText).then(() => { 
        const msg = document.getElementById('short-copy-msg'); 
        msg.style.opacity = 1; 
        window.showToast('已複製到剪貼簿！', 'success');
        setTimeout(() => { 
            msg.style.opacity = 0.5; 
        }, 2000); 
    }).catch(err => {
        console.error('複製失敗:', err);
        window.showToast('複製失敗，請手動複製', 'error');
    });
}
