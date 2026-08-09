[English](README.md) | [繁體中文](README.zh-TW.md)

# TMDB Streaming Architecture — 生產導向的前端架構參考實作

本專案為串流媒體前端架構的**技術參考實作**，專注於解決**多重非同步資料流的狀態依賴**與**邊界極端情境（Edge Cases）**。本架構展示了如何在 **Firebase Auth（身份認證）**、**Stripe（金流訂閱）** 與 **TMDB（媒體資料）** 之間，建立一個**可預測、高容錯且具備防禦性設計（Defensive Design）**的狀態管理系統。

- **線上參考部署**: [stream.tinahu.dev](https://stream.tinahu.dev/)
- **測試憑證**：Email `demo@tinahu.dev` / Password `Demo1234!`（帳號已預先開通測試訂閱）

[![Continuous Integration](https://github.com/yuting813/TMDB-Streaming-Architecture/actions/workflows/ci.yml/badge.svg)](https://github.com/yuting813/TMDB-Streaming-Architecture/actions)
![Next.js](https://img.shields.io/badge/Next.js-15.5-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Firebase](https://img.shields.io/badge/Firebase-Firestore%20%7C%20Auth-orange?logo=firebase)
![Recoil](https://img.shields.io/badge/State-Recoil-purple)
![Stripe](https://img.shields.io/badge/Payment-Stripe-635BFF?logo=stripe)
![CI](https://img.shields.io/badge/CI-GitHub%20Actions-2088FF?logo=github-actions)

![Homepage Screenshot](docs/screenshot-home.png)

---

## 核心架構與工程決策 (Architecture Decisions)

### 1. Guarded Render Chain（防禦性渲染鏈）

在非同步的資料流中（例如：必須先確認 Firebase Auth 狀態，才能向 Firestore 查詢訂閱方案），如果使用深層巢狀的 `if-else`，或是把條件全塞進同一個判斷式（例如 `if (auth && sub && !loading)`），將導致邏輯極度難以維護。

**設計決策**：在 `pages/index.tsx` 中捨棄巢狀結構，改採嚴格的 **Early Return（提早回傳）防護鏈**（又稱 Guard Clauses），讓每一層 `if` 就像獨立的安全檢查哨，只專注於單一防禦邊界：

```tsx
// 第 1 層 — Loading 防護：任一資料來源載入中，全螢幕 Spinner
if (authLoading || subscriptionLoading) return <Loader />;

// 第 2 層 — Auth 防護：未登入者阻擋掛載
// （redirect 由 useAuth 內部的 onAuthStateChanged callback 負責執行）
if (!user) return null;

// 第 3 層 — 錯誤處理：Firestore 連線異常時顯示含「重新載入」按鈕的 fallback UI
if (subscriptionError) return <ErrorState />;

// 第 4 層 — 權限防護：無有效訂閱者，鎖定於訂閱方案頁
if (!subscription) return <Plans products={products} />;

// 第 5 層 — 全部通過後掛載主核心元件
return <MainContent />;
```

優勢在於：每一層 guard 只處理一個邊界，後續新增情境時較容易維持既有分支的行為。

---

### 2. initialLoading — 避免初始驗證畫面閃動

Firebase 驗證為非同步回調。在 SDK 確認使用者狀態前，`user` 會暫時呈現 `null`。若此時觸發路由守衛，已登入的用戶會經歷「未登入畫面 → 首頁」的嚴重閃動（Flash of Unauthenticated Content, FOUC）。

**設計決策**：在 `useAuth` 實作堅固的 `initialLoading` 時序鎖。在第一次 `onAuthStateChanged` 回調確認前，強制攔截 children 渲染：

```tsx
<AuthContext.Provider value={memoedValue}>
	{initialLoading ? (
		<div className='flex h-screen w-screen items-center justify-center bg-black'>
			<Loader color='fill-red-600' />
		</div>
	) : (
		children
	)}
</AuthContext.Provider>
```

**自動登出計時器**：`useAuth` 同時在用戶登入後設定 30 分鐘的 `setTimeout`，到期後呼叫 `logout()` 強制結束 Session。計時器透過 `useEffect` cleanup 在用戶主動登出或元件卸載時同步清除，防止懸空回調（Dangling Callback）。

---

### 3. API Defense Layer（請求防禦層）：`tmdbFetch` 的三道防線

TMDB 請求集中於 utils/request.ts，讓頁面與元件共用 timeout、錯誤處理與請求規則。

1. **請求去重（In-flight Cache）**：同一時間對相同 URL 的請求共用一個 Promise；Promise 完成後即清除 entry，讓後續 ISR 能重新取得資料。
2. **Build 卡死防護（Timeout）**：內建 `AbortController` 賦予 8 秒 timeout，避免 TMDB 網路不穩導致 Next.js build 無限掛起。
3. **中斷訊號整合**：合併 timeout 與呼叫端 AbortSignal，並在 abort 或請求完成後移除監聽器，避免不必要地保留 callback。

---

### 4. Modal 的競態條件防禦（Stale Response Ignore）

當使用者在影片列表快速連點時，舊的 `fetch` 結果可能在新的 Modal 已渲染後才回來，進而覆蓋狀態造成畫面錯亂（Race Condition）。

**設計決策**：在 `useEffect` 內宣告閉包變數 `active` 追蹤元件的掛載生命週期。`fetchMovie` 非同步函式在套用任何狀態更新前，都會先確認 `active` 旗標——當回應抵達時若 Modal 已關閉或切換，過期的 Payload 會被主動丟棄：

```tsx
useEffect(() => {
  if (!movie) return;
  let active = true;

  async function fetchMovie() {
    const data = await tmdbFetch(...).catch(() => null);
    if (!active) return; // 元件卸載時丟棄 stale 結果，防止狀態污染
    setTrailer(key);
    setGenres(data?.genres || []);
  }

  fetchMovie();
  return () => { active = false; };
}, [movie]);
```

此設計同時防禦 React 的 Memory Leak 警告，以及非同步回應順序錯亂造成的 UI 狀態污染。

---

### 5. Dual-Track State Architecture（雙軌狀態架構）：ISR + Firestore

電影清單與用戶個人資料的更新頻率截然不同，強制混用同一個資料層將導致狀態脫鉤。本專案將資料流依據特性拆分：

| 軌道         | 機制                                                   | 觸發時機                          | Single Source of Truth (SSOT) |
| ------------ | ------------------------------------------------------ | --------------------------------- | ----------------------------- |
| 電影分類資料 | Next.js ISR (`getStaticProps` + `revalidate: 3600`)    | Build Time + 每小時背景增量       | TMDB API                      |
| 用戶個人資料 | Firestore `onSnapshot` (`useList` / `useSubscription`) | 任何 DB 變化即時推送 (Push-based) | Firestore                     |

**設計決策**：Firestore 是「我的片單」在伺服端的資料來源。元件觸發寫入，並透過 onSnapshot 接收已提交的變化，降低 UI 與後端短暫不一致的風險。

**訂閱查詢條件**：`useSubscription` 以 `where('status', 'in', ['active', 'trialing'])` 查詢，一個守衛同時涵蓋標準有效訂閱與試用期（Trial Period）用戶。

**錯誤 Fallback**：TMDB 請求失敗時，getStaticProps 回傳空陣列並使用 revalidate: 60，讓頁面仍可完成建置，並較早進入下一次重新產生。

---

### 6. 狀態選型：Context vs Recoil（按資料流向解耦）

- **Auth (React Context)**：認證狀態是樹頂端的依賴，變更頻率低。`useAuth` 封裝完整的 Firebase 訂閱生命週期與自動登出計時器防護，並用 `useMemo` 阻擋渲染噪音。

- **UI 狀態 (Recoil Atom)**：Banner、Thumbnail 與 Modal 若使用 Context 會引發大範圍的不必要重渲染。本系統使用 Recoil atom 作為輕量的發布/訂閱（Publish/Subscribe）事件匯流排，讓元件完全解耦——Thumbnail 點擊後僅需 `setCurrentMovie(movie)`，無需任何 Prop Drilling。

  **寫入端隔離**：Thumbnail 只寫入 modal state，因此使用 useSetRecoilState，不訂閱 atom 值的變化，避免 modal 狀態更新帶動整批縮圖重新渲染。

---

## 系統架構圖

```mermaid
graph TD
    subgraph "Build Time — ISR"
        A[getStaticProps] -->|Promise.all x8| B["tmdbFetch&lt;T&gt;()"]
        A --> P[Firestore products]
        P --> C
        B -->|revalidate 3600| C[Static HTML + Props]
    end

    subgraph "Runtime — Auth Layer"
        D[Firebase onAuthStateChanged] --> E[AuthProvider Context]
        E -->|initialLoading gate| F[App Children Mounted]
        E -->|30 分鐘計時器| G[Auto-logout]
    end

    subgraph "Runtime — Firestore Realtime"
        E -->|user.uid| H["useSubscription onSnapshot (active|trialing)"]
        E -->|user.uid| I[useList onSnapshot]
        H -->|subscription / loading / error| J[5-Layer Guard Chain]
        I -->|list array| K[My List Row]
    end

    subgraph "UI State — Recoil"
        L[Banner / Thumbnail] -->|setCurrentMovie + setShowModal| M[Recoil Atoms]
        M -->|movieState / modalState| N[Modal Component]
    end

    C --> J
    J -->|All guards pass| O[Full Home Page]
    O --> L
```

---

## 邊界情境防護與系統穩定性

- **圖片載入狀態管理**：Thumbnail 與 Modal 在遠端圖片載入時顯示 skeleton 或 fallback artwork；Thumbnail 在請求失敗後亦會顯示 Image unavailable 提示。
- **明確的公開路由白名單**：Auth routing 集中列出 login、signup 與 checkout status，並凍結陣列，降低公開路由被意外修改的可能。
- **Modal 鍵盤與焦點行為**：影片縮圖使用具 dialog 標示的語意化 button；MUI Modal 提供焦點限制、ESC 關閉與焦點還原，dialog 亦具有可存取標題。
- **Jest 單元測試**：useSubscription 的 6 個測試涵蓋初始 loading、null user、active subscription、empty result、snapshot error 與 setup failure。

---

## 本機執行

### 前置需求

- Node.js 18.18 以上
- npm
- TMDB API key
- 已啟用 Authentication 與 Firestore 的 Firebase 專案
- 已在同一 Firebase 專案設定 Stripe Payments Firebase Extension
- 建議安裝：[React Developer Tools](https://react.dev/learn/react-developer-tools) 瀏覽器擴充套件（在開發環境下便於檢視 Recoil 狀態與進行效能分析）

### 安裝與啟動

```powershell
npm ci
Copy-Item .env.example .env.local
npm run dev
```

填入 .env.local 的 Firebase 與 TMDB 設定後，開啟 http://localhost:3000。

### Firebase 與 Stripe 設定

1. 在 Firebase 啟用 Email/Password 登入。
2. 部署 firestore.rules 與 firebase.json 宣告的 indexes。
3. 安裝並設定 firebase.json 宣告的 Stripe Payments Firebase Extension。
4. 透過 Extension 同步有效的 products 與 prices。
5. Stripe test-mode secret 與 webhook 設定放在 Firebase Extension，不放入瀏覽器環境變數。

Checkout 會以目前登入的 Firebase 使用者建立 customers/{uid}/checkout_sessions。Extension 負責建立 Stripe Checkout Session，並將訂閱更新寫回 Firestore；前端只讀取 subscription records。

### 品質檢查

```powershell
npm run lint
npm run test -- --ci
npx tsc --noEmit
npm run build
```

## 專案結構

```
pages/          # 路由入口（保持邏輯極簡化，將複雜度委派至 Hooks）
components/     # UI 呈現層（不處理 API 直接呼叫）
hooks/          # 防禦性狀態管理邏輯（useAuth / useSubscription / useList）
atoms/          # 原子化 Recoil 狀態
utils/          # API 轉發介面與網路層防禦實作
constants/      # 共用設定常數
types/          # TypeScript 型別定義
```

## Firestore 資料結構與安全規則

### 1. 資料模型

```
customers/
  {uid}/
    subscriptions/
      {subscriptionId} → { status, current_period_start, current_period_end }
    payments/
      {paymentId} → { ... }
    checkout_sessions/
      {sessionId} → { ... }   ← 唯一允許客戶端寫入的子集合
    myList/
      {movieId} → { id, title, poster_path, backdrop_path, ... }

products/
  {productId}/
    prices/
      {priceId} → { unit_amount, currency, interval }
    tax_rates/
      {taxRateId} → { ... }
```

### 2. 安全規則 (Security Rules) 設計

firestore.rules 依功能需求區分讀寫權限：

- **用戶資料隔離**：`customers/{uid}` 及其子集合限制為 `request.auth.uid == uid`，僅允許持有對應憑證的登入用戶本人進行存取。
- **敏感資料唯讀**：用戶的訂閱記錄（`subscriptions`）與付款記錄（`payments`）在安全規則中僅開放 `read` 權限。用戶端無法直接變更訂閱狀態，狀態更新需經由 Stripe Webhook (Stripe Firebase Extension) 於後端處理，防範前端資料篡改。
- **Checkout Sessions（讀寫）**：`checkout_sessions` 是唯一允許客戶端寫入的子集合，因為 Stripe Checkout 流程需要由客戶端建立 Session 文件以啟動支付。這是最小化的寫入面（Minimal Write Surface）設計。
- **公開方案唯讀**：方案元資料（`products/**`，含 `prices` 與 `tax_rates`）設為公開可讀（`allow read: if true`），且禁止任何用戶端寫入。

---

## 作者與工程哲學

結合過去在風險管理中對「極端情境預判」的敏感度，我將這份思維帶入軟體開發，專注於**防禦性前端工程**與程式庫韌性。

本專案將此思維應用於非同步驗證、訂閱狀態、TMDB 請求、Modal 互動與 UI fallback，目標是明確處理失敗狀態，並在外部服務延遲或不可用時維持可預測的使用者體驗。

- **Website**: [tinahu.dev](https://www.tinahu.dev/)
- **GitHub**: [yuting813](https://github.com/yuting813)
- **Email**: [tinahuu321@gmail.com](mailto:tinahuu321@gmail.com)

> **教育用途免責聲明**
> 本專案僅供個人技術證明與教育用途，**非**商業產品，且與任何串流媒體服務無關。電影資料皆來自 [TMDB API](https://www.themoviedb.org/)
