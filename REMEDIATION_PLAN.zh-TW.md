# TMDB Streaming Architecture 修正計畫

## 目標

讓付款、資料更新、無障礙行為與 README 敘述一致，並保留可在前端面試中清楚說明的架構決策。

## 執行順序

1. **Stripe 與 Firestore（P1）**
   - 改用 `@invertase/firestore-stripe-payments` 的 `createCheckoutSession`。
   - 由 Firebase Auth 身分建立 `customers/{uid}/checkout_sessions` 文件，交由 Stripe Firebase Extension 處理 Checkout 與 webhook。
   - 移除首頁以 `session_id` 直接寫入訂閱狀態的程式，訂閱狀態只由 Firestore `onSnapshot` 接收。
   - 加入成功、取消與錯誤回饋頁，避免付款流程落到 404。

2. **TMDB 請求與 ISR（P1）**
   - 將 `fetchCache` 限定為真正的 in-flight deduplication。
   - Promise 完成後清除 entry，確保下一次 ISR 可重新取得 TMDB 資料。

3. **鍵盤操作與焦點管理（P2）**
   - 將可點擊縮圖改為語意化 `button`。
   - 使用 MUI Modal 既有的 focus trap／focus restore，保留 ESC 關閉，避免全域 Space handler 攔截按鈕操作。
   - 將 README 的 WCAG 絕對宣稱改為可由目前實作支持的描述。

4. **README 與專案資訊（P2）**
   - 修正 Next.js 版本、專案名稱與過度絕對的用語。
   - 補齊 prerequisites、安裝、環境變數、Firebase／Stripe 設定、測試與 build 指令。
   - 中英文 README 維持相同資訊。

5. **品質驗證**
   - 執行 ESLint、TypeScript、Jest 與 production build。
   - 確認 Git diff 僅包含本計畫範圍，並記錄仍需外部 Firebase／Stripe 控制台確認的項目。

## 完成標準

- 前端不能直接寫入 `subscriptions`。
- Checkout 由登入中的 Firebase 使用者建立，並交由 Stripe Firebase Extension 處理。
- ISR 不會因 process-level Promise cache 永久取得舊資料。
- 所有付款結果都有可用頁面。
- README 的每項主要技術敘述都能由程式碼或測試指出對應證據。
- `lint`、`test`、`tsc --noEmit`、`build` 全部通過。
## 執行結果（2026-07-15）

- [x] Checkout 改由 Firebase Auth + Stripe Payments Extension 建立。
- [x] 移除前端直接寫入 subscriptions 與未驗證的自訂 Checkout API。
- [x] 新增成功、取消與錯誤狀態頁。
- [x] TMDB cache 改為僅去除同時進行中的重複請求，完成後清除。
- [x] AbortSignal 監聽器在請求完成後清理。
- [x] Thumbnail 改為語意化 button，Modal 改用 MUI 的焦點管理。
- [x] Next.js 升級至 15.5.20，lint script 遷移至 ESLint CLI。
- [x] 中英文 README、環境變數範例與 CI 設定完成對齊。
- [x] ESLint、TypeScript、Jest 6/6 與 production build 通過。

## 部署前仍需外部確認

- Firebase 專案已部署目前的 firestore.rules。
- Stripe Payments Firebase Extension 已設定 test-mode secret 與 webhook。
- products／prices 已同步至 Firestore。
- 部署後實際完成一次 Stripe test checkout，確認 subscription onSnapshot 收到 active 或 trialing 狀態。
