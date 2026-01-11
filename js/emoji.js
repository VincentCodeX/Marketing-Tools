// --- 符號工具邏輯 ---
const symbolsData = [ { title: "常用標點", items: ["、", "。", "，", "；", "：", "！", "？", "「」", "『』", "（）", "【】", "《》", "〈〉", "——", "……", "．", "～", "／", "＼", "＆", "＠", "＃", "％", "＊", "＋", "－", "＝"] }, { title: "特殊符號", items: ["→", "←", "↑", "↓", "↔", "↕", "⇒", "⇐", "★", "☆", "○", "●", "◎", "◇", "◆", "□", "■", "△", "▲", "▽", "▼", "❤", "♠", "♣", "✔", "✕", "✖", "©", "®", "™", "℃", "℉"] }, { title: "數學符號", items: ["±", "×", "÷", "≠", "≈", "≦", "≧", "∞", "Σ", "π", "√", "∝", "∈", "∉", "∩", "∪", "⊂", "⊃", "⊆", "⊇", "∀", "∃", "∧", "∨", "½", "¼", "¾"] }, { title: "數字符號", items: ["①", "②", "③", "④", "⑤", "⑥", "⑦", "⑧", "⑨", "⑩", "❶", "❷", "❸", "❹", "❺", "❻", "❼", "❽", "❾", "❿", "㈠", "㈡", "㈢", "㈣", "㈤", "㈥", "㈦", "㈧", "㈨", "㈩", "Ⅰ", "Ⅱ", "Ⅲ", "Ⅳ", "Ⅴ", "Ⅵ", "Ⅶ", "Ⅷ", "Ⅸ", "Ⅹ"] }, { title: "貨幣符號", items: ["$", "¥", "€", "£", "₩", "฿", "₹", "₽"] } ];
const emojisData = [ { title: "表情 / 心情", items: ["😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚", "😋", "😛", "😝", "😜", "🤪", "🤨", "🧐", "🤓", "😎", "🤩", "🥳", "😏", "😒", "😞", "😔", "😟", "😕", "🙁", "☹️", "😣", "😖", "😫", "😩", "🥺", "😢", "😭", "😤", "😠", "😡", "🤬", "🤯", "😳", "🥵", "🥶", "😱", "😨", "t😰", "😥", "😓", "🤗", "🤔", "🤭", "🤫", "🤥", "😶", "😐", "😑", "😬", "🙄", "😯", "😦", "😧", "😮", "😲", "🥱", "😴", "🤤", "😪", "😵", "🤐", "🥴", "🤢", "🤮", "🤧", "😷", "🤒", "🤕", "🤑", "🤠", "😈", "👿", "💀", "👻", "💩", "🤡"] }, { title: "手勢 / 人物", items: ["👋", "🤚", "🖐", "✋", "🖖", "👌", "🤌", "🤏", "✌️", "🤞", "🤟", "🤘", "🤙", "👈", "👉", "👆", "🖕", "👇", "☝️", "👍", "👎", "✊", "👊", "🤛", "🤜", "👏", "🙌", "👐", "🤲", "🤝", "🙏", "💪", "💅", "🤳", "🙇", "💁", "🙅", "🙆", "🙋"] }, { title: "愛心 / 裝飾", items: ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "💟", "✨", "⭐️", "🌟", "💫", "⚡️", "🔥", "💥", "💢", "💦", "💨"] } ];
const kaomojiData = [ { title: "打招呼 / 開心", items: ["(o´・_・)o", "(=ﾟωﾟ)ﾉ", "( ´ ▽ ` )ﾉ", "o(ww)o", "(≧∇≦)/", "(*^▽^*)", "\\(★ω★)/", "(☆▽☆)", "(o^ ^o)", "(￣▽￣)"] }, { title: "可愛 / 撒嬌", items: ["(・ω<)", "(*≧ω≦)", "(///▽///)", "(◕‿◕)", "(つ✧ω✧)つ", "(づ￣ ³￣)づ", "(｡･ω･｡)ﾉ♡", "♡(> ਊ <)♡", "(*♡∀♡)"] }, { title: "生氣 / 翻桌", items: ["(╬ Ò ‸ Ó)", "(＃`Д´)", "( ` ω ´ )", "(ノಠ益ಠ)ノ", "(/ﾟДﾟ)/", "┻━┻ ︵ ヽ(°□°ヽ)", "(╯°□°）╯︵ ┻━┻", "(ノ｀Д´)ノ彡┻━┻", "ಠ_ಠ"] }, { title: "無奈 / 傷心", items: ["(￣ω￣;)", "(;´・`)>", "(T_T)", "(;´༎ຶД༎ຶ`)", "(ToT)", "(╥_╥)", "(´-﹏-`；)", "┐(‘～`；)┌", "(can_t help)"] } ];

function renderSymbolSection(containerId, data, gridClass, btnClass = 'symbol-btn') {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';
    data.forEach(group => {
        const card = document.createElement('div'); card.className = 'symbol-group-card';
        const btnsHtml = group.items.map(item => `<button class="${btnClass}" onclick="copySymbol('${item}')">${item}</button>`).join('');
        card.innerHTML = `<div class="symbol-card-header">${group.title}</div><div class="symbol-grid ${gridClass}">${btnsHtml}</div>`;
        container.appendChild(card);
    });
}
function switchSubTab(tabName) {
    document.querySelectorAll('.sub-nav-btn').forEach(btn => btn.classList.remove('active')); event.currentTarget.classList.add('active');
    document.querySelectorAll('.sub-view').forEach(view => view.classList.remove('active'));
    if (tabName === 'symbols') document.getElementById('view-symbols').classList.add('active');
    else if (tabName === 'emojis') document.getElementById('view-emojis').classList.add('active');
    else if (tabName === 'kaomoji') document.getElementById('view-kaomoji').classList.add('active');
}
function copySymbol(text) {
    navigator.clipboard.writeText(text).then(() => { const toast = document.getElementById('symbol-toast'); toast.style.opacity = 1; setTimeout(() => { toast.style.opacity = 0; }, 1500); });
}
document.addEventListener('DOMContentLoaded', () => {
    renderSymbolSection('view-symbols', symbolsData, 'grid-cols-8');
    renderSymbolSection('view-emojis', emojisData, 'grid-cols-emoji');
    renderSymbolSection('view-kaomoji', kaomojiData, 'grid-cols-kaomoji', 'symbol-btn kaomoji-btn');
});
