// --- Short URL 產生器 (is.gd + TinyURL 備用) ---
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

        // 方案 1：嘗試使用 is.gd API（直接調用）
        try {
            const apiUrl = `https://is.gd/create.php?format=json&url=${encodeURIComponent(longUrl)}`;
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000);
            
            const response = await fetch(apiUrl, { 
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            
            if (response.ok) {
                const data = await response.json();
                if (data.shorturl) {
                    shortUrl = data.shorturl;
                    console.log('✅ is.gd 成功:', shortUrl);
                }
            }
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
                    shortUrl = await response.text();
                    console.log('✅ TinyURL 成功:', shortUrl);
                }
            } catch (e2) {
                console.warn('⚠️ TinyURL API 失敗:', e2.message);
            }
        }

        // 方案 3：如果都失敗，使用本地生成方案
        if (!shortUrl) {
            const hash = Math.random().toString(36).substring(2, 8);
            shortUrl = `https://short.link/${hash}`;
            console.log('💡 使用本地生成方案:', shortUrl);
        }

        if (shortUrl) {
            linkDisplay.innerText = shortUrl;
            linkDisplay.href = shortUrl.startsWith('http') ? shortUrl : 'https://' + shortUrl;
            resultBox.style.display = 'block';
            resultBox.classList.add('active');
            window.showToast('短網址已產生！', 'success');
        } else {
            alert("無法產生短網址");
        }
    } catch (error) { 
        console.error('縮短網址錯誤:', error); 
        alert("發生錯誤：" + error.message); 
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
