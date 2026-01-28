# 整合行銷工具盒 (Marketing Tools)

> 一個功能豐富的**在線行銷輔助工具集合**，集結 8 個實用功能於一身，專為行銷人員、內容創作者和網頁開發者設計。

## 🎯 核心功能

### 📱 1. QR Code 生成器
- ⚡ 實時生成高品質 QR Code
- 🎨 完整自定義選項：顏色、形狀、容錯率
- 🎭 點形狀選擇：方塊、圓點、圓角、優雅風格
- 🏢 支援品牌 Logo 置中顯示
- 📥 一鍵下載為圖片

### 🔗 2. UTM 追蹤參數產生器
- 🎯 快速產生行銷追蹤連結
- 📊 支援完整 UTM 參數：source、medium、campaign、content
- ✨ 智能分隔符判斷（自動識別 `?` 或 `&`）
- 📋 URL 編碼自動處理
- 📋 一鍵複製完整追蹤連結

### 🔗 3. 短網址生成
- ⚡ 將冗長網址轉為簡潔形式
- 📱 社群分享最佳化
- 💾 節省字符空間

### 🖼️ 4. 圖片壓縮工具
- 📦 批量壓縮功能
- 🎚️ 可調整品質和目標大小
- 📊 支援多種圖片格式
- ⚡ 使用 browser-image-compression 引擎

### 🔍 5. OCR 文字辨識
- 📸 從圖片提取文字
- 🌐 多語言支援（含繁體中文）
- 🚀 使用 Tesseract.js 引擎
- 📝 實時辨識結果顯示

### 📺 6. 廣告規格速查表
- 📋 整合多平台廣告規格
- **支援平台**：
  - 🔵 Facebook（動態消息、限時動態、Reels、輪播廣告）
  - 📸 Instagram（貼文、限時動態、Reels）
  - 🔍 Google Ads（橫幅、方形、直式）
  - 💬 LINE（圖文訊息、VOOM）
  - ▶️ YouTube（縮圖、Shorts、頻道封面）
  - 📱 Threads（貼文圖片）
- 📋 完整尺寸和比例資訊
- 📋 一鍵複製尺寸數據

### ✨ 7. 特殊符號和 Emoji
- 🔤 標點符號（中文標點、符號等）
- 🎨 特殊圖案（箭頭、星星、愛心等）
- 🧮 數學符號和運算符
- 🔢 數字符號（①②③ 等）
- 💵 多國貨幣符號
- 😊 豐富 Emoji 表情集
- 🤍 可愛顏文字庫
- 🔍 快速搜尋和複製

### ⚙️ 8. 核心邏輯系統
- 🔄 智能標籤頁面切換
- 🔔 Toast 通知系統
- 🎨 統一事件管理
- 📱 響應式交互設計

---

## 🛠️ 技術棧

| 層面 | 技術 |
|------|------|
| **結構** | HTML5 語義化 |
| **樣式** | CSS3 + 磨砂玻璃設計 (Glassmorphism) |
| **互動** | Vanilla JavaScript (ES6+) |
| **QR Code** | QR Code Styling v1.5.0 |
| **圖片壓縮** | browser-image-compression v2.0.2 |
| **OCR** | Tesseract.js v5 |
| **字體** | Google Fonts (Noto Sans TC) |

### 🎨 設計特點
- ✨ 磨砂玻璃風格（毛玻璃效果）
- 📱 完全響應式設計
- 🌈 漸層背景和現代化 UI
- ⚡ 零框架依賴，極輕量級
- 🔒 完全客戶端運作，無後端依賴

---

## 📂 專案結構

```
Marketing-Tools/
├── 📄 index.html              主頁面 (426 行)
├── 🎨 style.css              完整樣式 (502 行)
├── 📋 README.md              本文件
│
└── 📁 js/                    JavaScript 模塊
    ├── main.js               核心邏輯和標籤切換 (53 行)
    ├── qrcode.js             QR Code 生成邏輯
    ├── utm.js                UTM 參數産生器 (43 行)
    ├── urlShortener.js       短網址功能
    ├── imageTool.js          圖片壓縮邏輯
    ├── ocr.js                OCR 文字辨識邏輯
    ├── ads.js                廣告規格資料庫
    └── emoji.js              符號和 Emoji 管理 (36 行)
```

---

## 🚀 快速開始

### 方法 1：直接開啟
```bash
# macOS / Linux / Windows
直接在瀏覽器中打開 index.html 文件
```

### 方法 2：本地伺服器（推薦）
```bash
# 使用 Python 3
python -m http.server 8000

# 或使用 Node.js
npx http-server

# 或使用 Ruby
ruby -run -ehttpd . -p8000
```

然後訪問：**http://localhost:8000**

### 使用方式
1. 點擊頂部導覽列選擇需要的工具
2. 根據工具類型輸入相關資訊
3. 使用「複製」按鈕快速複製結果到剪貼簿
4. 某些工具（如 QR Code）支援下載功能

---

## 💡 常見使用場景

### 📱 社群行銷
- 使用 **QR Code** 產生器製作推廣二維碼
- 用 **UTM 追蹤** 監測廣告效果
- 用 **短網址** 優化 Instagram / TikTok 貼文

### 📸 圖片編輯
- **壓縮圖片** 加快網頁載入速度
- **OCR 辨識** 快速提取圖片中的文字

### 📺 廣告投放
- 查詢 **廣告規格** 確保尺寸正確
- 快速複製尺寸參數到設計軟體

### 📝 內容創作
- 使用 **Emoji 和符號** 豐富文案表現力
- 批量管理多個平台的推廣連結

---

## 🎨 自訂與擴展

### 修改色彩方案
編輯 `style.css` 中的 CSS 變數：
```css
:root {
    --primary: #2C3E50;      /* 主色調 */
    --accent: #10B981;       /* 強調色 */
    --danger: #EF4444;       /* 警告色 */
    --glass-bg: rgba(255, 255, 255, 0.70); /* 玻璃背景 */
}
```

### 新增廣告平台
編輯 `js/ads.js` 的 `platformsData` 陣列：
```javascript
{
    name: "新平台",
    class: "newplatform",
    specs: [
        { title: "規格名稱", size: "寬 x 高", ratio: "比例", type: "類型" }
    ]
}
```

### 擴展符號庫
編輯 `js/emoji.js` 的 `symbolsData` 陣列新增符號分類

### 添加新工具
1. 在 `js/` 建立新的 `.js` 文件
2. 在 `index.html` 新增 HTML 結構和導覽按鈕
3. 在 `main.js` 註冊標籤切換邏輯

---

## 🌐 瀏覽器相容性

| 瀏覽器 | 支援狀態 | 建議版本 |
|--------|--------|--------|
| Chrome | ✅ | 最新版 |
| Edge | ✅ | 最新版 |
| Firefox | ✅ | 最新版 |
| Safari | ✅ | 14+ |
| iOS Safari | ✅ | 14+ |
| Android Chrome | ✅ | 最新版 |

**注意**：部分功能（如 OCR）在某些舊版本瀏覽器上可能運作緩慢。

---

## ⚡ 效能最佳化

- 🔄 資源加載使用 CDN（jsDelivr、unpkg）
- 🎭 CSS 過度效果使用 GPU 加速
- 📦 所有資源都是外部載入，無本地大檔案
- 🚀 完全客戶端運行，無伺服器延遲

---

## 📝 許可證

**MIT License** - 自由使用、修改和分發

---

## 🤝 貢獻指南

歡迎提交改進建議！

- 🐛 發現 Bug？提交 Issue
- 💡 有功能建議？歡迎討論
- 🔧 想要改進代碼？提交 Pull Request

---

## 📞 支援與反饋

- 💬 問題或建議：提交 GitHub Issue
- 🔗 分享使用心得

---

## 📈 使用統計

本專案包含：
- **8 個實用工具**
- **426 行 HTML** 結構代碼
- **502 行 CSS** 樣式代碼
- **多個 JavaScript 模塊** 實現邏輯
- **0 個外部依賴**（僅使用 CDN 庫）

---

**最後更新**：2026年1月28日  
**版本**：v1.0 Release  
**狀態**：✅ 全功能就緒