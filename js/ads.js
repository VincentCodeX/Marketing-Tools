// --- 廣告規格邏輯 ---
const platformsData = [
    {
        name: "Facebook", class: "facebook",
        specs: [
            { title: "動態消息圖片", size: "1200 x 628", ratio: "1.91:1", type: "圖片" },
            { title: "動態消息正方形", size: "1080 x 1080", ratio: "1:1", type: "圖片" },
            { title: "限時動態 / Reels", size: "1080 x 1920", ratio: "9:16", type: "圖片/影片" },
            { title: "輪播廣告", size: "1080 x 1080", ratio: "1:1", type: "圖片" }
        ]
    },
    { name: "Instagram", class: "instagram", specs: [ { title: "貼文正方形", size: "1080 x 1080", ratio: "1:1", type: "圖片" }, { title: "貼文直式", size: "1080 x 1350", ratio: "4:5", type: "圖片" }, { title: "限時動態 / Reels", size: "1080 x 1920", ratio: "9:16", type: "圖片/影片" } ] },
    { name: "Google Ads", class: "google", specs: [ { title: "橫幅 (Landscape)", size: "1200 x 628", ratio: "1.91:1", type: "圖片" }, { title: "方形 (Square)", size: "1200 x 1200", ratio: "1:1", type: "圖片" }, { title: "直式 (Portrait)", size: "960 x 1200", ratio: "4:5", type: "圖片" } ] },
    { name: "LINE", class: "line", specs: [ { title: "圖文訊息 (方形)", size: "1040 x 1040", ratio: "1:1", type: "圖片" }, { title: "圖文訊息 (橫式)", size: "1040 x 520", ratio: "2:1", type: "圖片" }, { title: "LINE VOOM", size: "1080 x 1080", ratio: "1:1", type: "圖片/影片" } ] },
    { name: "YouTube", class: "youtube", specs: [ { title: "影片縮圖", size: "1280 x 720", ratio: "16:9", type: "圖片" }, { title: "Shorts", size: "1080 x 1920", ratio: "9:16", type: "影片" }, { title: "頻道封面", size: "2560 x 1440", ratio: "16:9", type: "圖片" } ] },
    { name: "Threads", class: "threads", specs: [ { title: "貼文圖片", size: "1080 x 1350", ratio: "4:5", type: "圖片" }, { title: "貼文正方形", size: "1080 x 1080", ratio: "1:1", type: "圖片" } ] }
];

function renderCards(filterValue) {
    const container = document.getElementById('gridContainer');
    if(!container) return;
    container.innerHTML = ''; 
    platformsData.forEach(platform => {
        if (filterValue !== 'all' && platform.name !== filterValue) return;
        const specsHtml = platform.specs.map(spec => {
            let typeClass = spec.type.includes('影片') ? 'tag-video' : 'tag-img';
            return `<div class="spec-item"><div class="spec-info"><div class="spec-title">${spec.title}</div><div class="spec-details">${spec.size}<span class="tag tag-ratio">${spec.ratio}</span><span class="tag ${typeClass}">${spec.type}</span></div></div><button class="copy-btn-small" onclick="copyAdSize('${spec.size}')" title="複製"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg></button></div>`;
        }).join('');
        const card = document.createElement('div'); card.className = 'platform-card';
        card.innerHTML = `<div class="card-header ${platform.class}"><span>${platform.name}</span><span class="spec-count">${platform.specs.length}</span></div><div class="card-body">${specsHtml}</div>`;
        container.appendChild(card);
    });
}
function copyAdSize(text) {
    const cleanText = text.replace(/\s/g, ''); 
    navigator.clipboard.writeText(cleanText).then(() => { showToast(`✅ 已複製尺寸：${cleanText}`);
    });
}
// 初始化
document.addEventListener('DOMContentLoaded', () => { renderCards('all'); });
