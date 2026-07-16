# 2026-07-15 最終檢查與架構修正紀錄

## 背景

本次更新以「前端工程師轉職面試作品」為目標，核對 TMDB Streaming Architecture 的 README、實際程式、付款流程、資料更新策略、無障礙行為與可執行性。

## 已完成修正

### Stripe 與 Firestore

- Checkout 改用 @invertase/firestore-stripe-payments 的 createCheckoutSession。
- Checkout Session 綁定目前登入的 Firebase Auth 使用者。
- 移除首頁依賴 session_id 直接寫入 subscriptions 的流程。
- 移除未驗證 Firebase 身分的自訂 Stripe API route。
- 訂閱狀態只由 Stripe Payments Firebase Extension 寫入，前端透過 onSnapshot 讀取。
- 新增 Checkout 成功、取消與錯誤狀態頁。

### TMDB、ISR 與非同步請求

- fetchCache 改為只去除同時進行中的相同請求。
- Promise 完成後清除 cache entry，讓後續 ISR 能重新取得 TMDB 資料。
- AbortSignal listeners 在 abort 或請求結束後清除。
- 保留 8 秒 timeout 與 stale response ignore。

### 無障礙與 UI

- Thumbnail 從可點擊 div 改為語意化 button。
- Thumbnail 加入 dialog 與可存取名稱。
- Modal 使用 MUI 既有的 focus containment、ESC close 與 focus restoration。
- 移除會攔截其他按鈕 Space 操作的全域 keyboard handler。
- Login、Signup 與 Plans 的 logo 改用 Next Image。

### README 與作品定位

- 英文標題從 Production-Grade 改為 Production-Oriented。
- 繁中標題改為「生產導向的前端架構參考實作」。
- 移除「根除、完美、徹底杜絕」等難以在面試中證明的絕對敘述。
- 補上 prerequisites、本機啟動、環境變數、Firebase／Stripe 與品質檢查說明。
- README 的 Stripe、ISR、cache、focus management 與程式碼重新對齊。
- 專案名稱改為 tmdb-streaming-architecture。

### 依賴與工具鏈

- Next.js 升級至 15.5.20。
- Stripe Payments client 升級至 0.0.8。
- ESLint 升級至 8.57.1，lint script 從 next lint 遷移至 ESLint CLI。
- 移除不再使用的 Stripe client/server packages。
- 移除帶入舊 PostCSS dependency chain 的 tailwindcss-textshadow。
- production audit 從 20 個漏洞（含 2 critical）降至 2 個 moderate transitive findings。

## 驗證結果

- ESLint：通過，0 errors、0 warnings。
- TypeScript：npx tsc --noEmit 通過。
- Jest：6/6 tests 通過。
- Next.js production build：通過。
- 首頁、Movies 與 New routes：確認一小時 ISR。
- Checkout status route：成功產生。
- git diff --check：通過。

## 尚未由本機驗證的外部項目

- Firebase 專案是否已部署目前的 firestore.rules。
- Stripe Payments Firebase Extension 是否已設定 test-mode secret 與 webhook。
- products 與 prices 是否已同步至 Firestore。
- 實際完成 Stripe test checkout 後，subscription 是否更新為 active 或 trialing。
- 線上站是否已部署本次 commit。

## 下一步建議

### P0：完成部署後付款 smoke test

1. 部署 Firestore rules 與前端。
2. 確認 Stripe Payments Firebase Extension 設定。
3. 使用 Stripe test card 完成一次 Checkout。
4. 確認 customers/{uid}/subscriptions 出現 active 或 trialing 文件。
5. 確認前端 onSnapshot 自動解除 Plans guard 並顯示首頁。
6. 驗證取消付款與 Extension 錯誤時的狀態頁。

這是目前最重要的下一步，因為它驗證本次修正的核心跨服務資料流。

### P1：補齊網路層測試

新增 utils/request.ts 測試，至少涵蓋：

- 同 URL 的同時請求只呼叫一次 fetch。
- Promise 完成後 cache entry 會清除。
- 下一次請求能取得新資料。
- timeout 會 abort。
- caller signal 會 abort。
- HTTP error 與 aborted error 能被區分。

### P1：提交與 CI 驗證

建議將本次變更整理成一個獨立 commit，例如：

fix: align Stripe subscription flow, ISR cache, accessibility, and docs

Push 後確認 GitHub Actions 的 lint、typecheck、test 與 build 全部通過，再部署線上展示。

### P2：準備面試展示流程

建議準備 3 至 5 分鐘 demo：

1. 說明 Auth、Subscription、TMDB 三條資料流。
2. 示範 initialLoading 與 guard chain。
3. 說明 ISR 與 Firestore realtime 為何分開。
4. 快速切換 Modal，說明 stale response ignore。
5. 說明本次如何發現並修正 Stripe client write 與 security rules 的矛盾。

### P2：補充品質證據

- 執行鍵盤操作檢查：Tab、Shift+Tab、Enter、ESC。
- 執行 Lighthouse accessibility 與 performance。
- 補一張 Checkout 狀態頁截圖。
- 視需要加入短版架構決策摘要，避免 README 第一屏資訊過重。

## 面試定位

這個作品最適合以「多重非同步資料流與狀態邊界」為主題，而不是強調畫面仿製。建議主軸：

- Auth lifecycle 與 FOUC。
- Subscription realtime state。
- ISR 與 Firestore 的資料特性分流。
- Race condition 與 stale response。
- In-flight request deduplication。
- Security rules 與 client write boundary。
- 面對既有技術債時的診斷與修正能力。
