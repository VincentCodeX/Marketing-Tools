// --- GTM (UTM) 邏輯 ---
function generateUTM() {
    let url = document.getElementById('utm-url').value.trim();
    let source = document.getElementById('utm-source').value.trim();
    let medium = document.getElementById('utm-medium').value.trim();
    let campaign = document.getElementById('utm-campaign').value.trim();
    let content = document.getElementById('utm-content').value.trim();
    let resultDisplay = document.getElementById('final-url');

    if (!url) { 
        resultDisplay.innerText = "請至少輸入「目標網址」..."; 
        resultDisplay.style.color = "#ccc"; 
        return; 
    }
    
    // 這裡邏輯很棒，判斷要用 ? 還是 &
    let separator = url.includes('?') ? '&' : '?';
    let params = [];
    
    if (source) params.push(`utm_source=${encodeURIComponent(source)}`);
    if (medium) params.push(`utm_medium=${encodeURIComponent(medium)}`);
    if (campaign) params.push(`utm_campaign=${encodeURIComponent(campaign)}`);
    if (content) params.push(`utm_content=${encodeURIComponent(content)}`);

    if (params.length > 0) {
        let finalUrl = url + separator + params.join('&');
        resultDisplay.innerText = finalUrl; 
        resultDisplay.style.color = "#2C3E50";
    } else { 
        resultDisplay.innerText = url; 
    }
}

function copyUTM() {
    const urlText = document.getElementById('final-url').innerText;
    // 檢查有沒有內容，或是顯示的是錯誤提示
    if (!urlText || urlText.includes("請輸入")) return;
    
    navigator.clipboard.writeText(urlText).then(() => { 
        // 呼叫我們剛剛寫好的共用彈跳視窗
        showToast("✅ UTM 連結已複製！");
    }); // <--- 補上這裡的 }); 就修好了
}