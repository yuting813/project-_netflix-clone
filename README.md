[English](README.md) | [繁體中文](README.zh-TW.md)

# TMDB Streaming Architecture — A Production-Oriented Frontend Reference Implementation

This project is a **technical reference implementation** for a streaming media frontend architecture. It focuses on resolving **state dependencies across multiple asynchronous data flows** and handling **boundary edge cases**. The architecture demonstrates how to build a **predictable, fault-tolerant, and defensively designed** state management system across **Firebase Auth** (authentication), **Stripe** (subscription billing), and the **TMDB API** (media data).

- **Live Reference Deployment**: [stream.tinahu.dev](https://stream.tinahu.dev/)
- **Test Credentials**: Email `demo@tinahu.dev` / Password `Demo1234!` (account pre-activated with a test subscription)

[![Continuous Integration](https://github.com/yuting813/TMDB-Streaming-Architecture/actions/workflows/ci.yml/badge.svg)](https://github.com/yuting813/TMDB-Streaming-Architecture/actions)
![Next.js](https://img.shields.io/badge/Next.js-15.5-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Firebase](https://img.shields.io/badge/Firebase-Firestore%20%7C%20Auth-orange?logo=firebase)
![Recoil](https://img.shields.io/badge/State-Recoil-purple)
![Stripe](https://img.shields.io/badge/Payment-Stripe-635BFF?logo=stripe)
![CI](https://img.shields.io/badge/CI-GitHub%20Actions-2088FF?logo=github-actions)

![Homepage Screenshot](docs/screenshot-home.png)

---

## Architectural Decisions

### 1. Guarded Render Chain

In asynchronous data flows (e.g., Firebase Auth state must be confirmed before querying Firestore for subscription plans), deeply nested `if-else` blocks — or a single monolithic condition trying to cover everything (`if (auth && sub && !loading)`) — quickly become unmaintainable.

**Decision**: `pages/index.tsx` abandons nested conditionals in favor of a strict **early-return guard chain** (guard clauses). Each `if` acts as an independent checkpoint responsible for exactly one boundary:

```tsx
// Layer 1 — Loading guard: Full-screen spinner while any data source is loading
if (authLoading || subscriptionLoading) return <Loader />;

// Layer 2 — Auth guard: Blocks mounting for unauthenticated users
// (Redirection is handled inside useAuth's onAuthStateChanged callback)
if (!user) return null;

// Layer 3 — Error handling: Fallback UI with a "reload" button on Firestore connection errors
if (subscriptionError) return <ErrorState />;

// Layer 4 — Access guard: Users without an active subscription are routed to the plans page
if (!subscription) return <Plans products={products} />;

// Layer 5 — All guards passed: Mount the core content
return <MainContent />;
```

**Payoff**: Each guard isolates one boundary, making later edge cases easier to add and reducing the chance of changing unrelated branches.

---

### 2. initialLoading — Preventing the Initial Authentication Flash

Firebase authentication resolution is asynchronous. Before the SDK confirms the user's state, `user` is temporarily `null`. If a route guard fires prematurely, an already-logged-in user experiences a jarring "logged-out screen → home page" flash (Flash of Unauthenticated Content, FOUC).

**Decision**: `useAuth` implements a firm `initialLoading` timing lock, blocking children from rendering until the first `onAuthStateChanged` callback resolves:

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

**Auto-logout timer**: `useAuth` also sets a 30-minute `setTimeout` after login, executing `logout()` when it expires to force-end the session. This timer is cleared via a `useEffect` cleanup function upon manual logout or component unmount, preventing dangling callbacks.

---

### 3. API Defense Layer: `tmdbFetch`'s Three Lines of Defense

TMDB requests are centralized in utils/request.ts so pages and components share the same timeout, error handling, and request policy.

1. **Request Deduplication (In-flight Cache)**: Concurrent requests for the same URL share one Promise. The entry is cleared after the Promise settles, allowing later ISR executions to retrieve fresh data.
2. **Build-Hang Protection (Timeout)**: A built-in `AbortController` enforces an 8-second timeout, preventing an unstable TMDB connection from hanging the Next.js build process indefinitely.
3. **Safe Signal Aggregation**: Timeout and caller-provided AbortSignals are combined. Listeners are removed after abort or request completion to avoid retaining callbacks longer than needed.

---

### 4. Modal Race Condition Defense (Stale Response Ignore)

When a user rapidly clicks through the movie list, an earlier `fetch` result can arrive after a new modal has already been rendered. This overwrites the new state with stale data, causing visual corruption (a race condition).

**Decision**: A closure variable `active` inside `useEffect` tracks the component's mount lifecycle. Before applying any state updates, the `fetchMovie` async function checks the `active` flag. If the modal has closed or switched by the time the response arrives, the stale payload is deliberately discarded:

```tsx
useEffect(() => {
  if (!movie) return;
  let active = true;

  async function fetchMovie() {
    const data = await tmdbFetch(...).catch(() => null);
    if (!active) return; // Discard stale results after unmount, preventing state pollution
    setTrailer(key);
    setGenres(data?.genres || []);
  }

  fetchMovie();
  return () => { active = false; };
}, [movie]);
```

This pattern defends against both React's memory-leak warnings and UI state pollution originating from out-of-order asynchronous responses.

---

### 5. Dual-Track State Architecture: ISR + Firestore

Movie catalog data and user profile data update at fundamentally different frequencies. Forcing both onto the same data layer inevitably leads to state desynchronization. This project splits the data flow by characteristic:

| Track              | Mechanism                                              | Trigger                                     | Single Source of Truth (SSOT) |
| ------------------ | ------------------------------------------------------ | ------------------------------------------- | ----------------------------- |
| Movie Catalog Data | Next.js ISR (`getStaticProps` + `revalidate: 3600`)    | Build time + hourly background revalidation | TMDB API                      |
| User Profile Data  | Firestore `onSnapshot` (`useList` / `useSubscription`) | Push-based, on any DB change                | Firestore                     |

**Decision**: Firestore is the server-backed source of truth for My List. Components trigger writes and receive committed changes through onSnapshot, reducing the window in which UI and backend data can diverge.

**Subscription query condition**: `useSubscription` queries using `where('status', 'in', ['active', 'trialing'])`, meaning a single guard effortlessly covers both standard active subscriptions and users in their trial period.

**Error fallback**: On a TMDB request failure, getStaticProps returns empty arrays and uses revalidate: 60. The page remains buildable and becomes eligible for an earlier regeneration attempt.

---

### 6. State Selection: Context vs. Recoil (Decoupled by Data Flow)

- **Auth (React Context)**: Authentication state sits at the top of the component tree and mutates infrequently. `useAuth` encapsulates the complete Firebase subscription lifecycle and the auto-logout timer, utilizing `useMemo` to block unnecessary render noise.

- **UI State (Recoil Atom)**: Using Context for the Banner, Thumbnail, and Modal would trigger widespread, unnecessary re-renders. This system leverages Recoil atoms as a lightweight publish/subscribe event bus, fully decoupling components. Clicking a Thumbnail only requires `setCurrentMovie(movie)`, completely bypassing prop drilling.

  **Write-Side Isolation**: Thumbnail uses useSetRecoilState because it only writes modal state. Thumbnails are therefore not subscribed to atom value changes, avoiding modal-state-driven re-renders across the thumbnail list.

---

## System Architecture

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
        E -->|30-min timer| G[Auto-logout]
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

## Edge Cases and System Stability

- **Image Loading State Management**: Thumbnail and Modal display skeleton or fallback artwork while remote images resolve. Thumbnail also shows an Image unavailable overlay after a failed request.
- **Explicit Public Route Allowlist**: Auth routing uses a frozen allowlist for login, signup, and checkout status pages. This keeps public-route intent centralized and prevents accidental array mutation.
- **Modal Keyboard and Focus Behavior**: Movie thumbnails are semantic buttons with dialog labels. MUI Modal supplies focus containment, ESC handling, and focus restoration; the dialog also exposes an accessible title.
- **Jest Unit Tests**: Six useSubscription tests cover initial loading, null user, active subscription, empty results, snapshot errors, and setup failures.

---

## Local Setup

### Prerequisites

- Node.js 18.18 or newer
- npm
- A TMDB API key
- A Firebase project with Authentication and Firestore enabled
- The Stripe Payments Firebase Extension configured for the same Firebase project

### Install and run

```powershell
npm ci
Copy-Item .env.example .env.local
npm run dev
```

Open http://localhost:3000 after filling in the Firebase and TMDB values in .env.local.

### Firebase and Stripe setup

1. Enable Email/Password authentication in Firebase.
2. Deploy firestore.rules and the indexes declared by firebase.json.
3. Install and configure the Stripe Payments Firebase Extension declared in firebase.json.
4. Add active products and prices to the products collection through the extension sync.
5. Configure the extension webhook and Stripe test-mode secrets in Firebase, not in the browser environment.

Checkout uses the signed-in Firebase user to create customers/{uid}/checkout_sessions. The extension creates the Stripe Checkout Session and writes subscription updates back to Firestore. The frontend only reads subscription records.

### Quality checks

```powershell
npm run lint
npm run test -- --ci
npx tsc --noEmit
npm run build
```

## Project Structure

```text
pages/          # Route entry points (kept minimal, complexity delegated to hooks)
components/     # UI presentation layer (no direct API calls)
hooks/          # Defensive state management logic (useAuth / useSubscription / useList)
atoms/          # Atomic Recoil state
utils/          # API forwarding interface and network-layer defenses
constants/      # Shared configuration constants
types/          # TypeScript type definitions
```

## Firestore Schema and Security Rules

### 1. Data Model

```text
customers/
  {uid}/
    subscriptions/
      {subscriptionId} → { status, current_period_start, current_period_end }
    payments/
      {paymentId} → { ... }
    checkout_sessions/
      {sessionId} → { ... }   ← The only sub-collection clients are allowed to write to
    myList/
      {movieId} → { id, title, poster_path, backdrop_path, ... }

products/
  {productId}/
    prices/
      {priceId} → { unit_amount, currency, interval }
    tax_rates/
      {taxRateId} → { ... }
```

### 2. Security Rule Design

The firestore.rules file separates read/write access by functional boundary:

- **User Data Isolation**: `customers/{uid}` and its sub-collections are tightly restricted to `request.auth.uid == uid`, ensuring only the authenticated owner of that specific credential can access the data.
- **Read-Only Sensitive Data**: A user's subscription records (`subscriptions`) and payment records (`payments`) strictly grant `read` access in the security rules. Clients cannot directly modify subscription states—updates flow securely through the Stripe Webhook (Stripe Firebase Extension) on the backend, structurally preventing client-side tampering.
- **Checkout Sessions (Read/Write)**: `checkout_sessions` is the _only_ sub-collection clients are permitted to write to, as the Stripe Checkout flow requires the client to instantiate a session document to initiate payment. This exemplifies a minimal write-surface design.
- **Public Read-Only Plans**: Plan metadata (`products/**`, including `prices` and `tax_rates`) is configured to be publicly readable (`allow read: if true`) and explicitly blocks any client-side writes.

---

## Author and Engineering Philosophy

Drawing from a background in risk management—particularly a sensitivity to anticipating extreme scenarios—I apply these principles to software development, focusing heavily on **defensive frontend engineering** and codebase resilience.

This project applies that philosophy to asynchronous authentication, subscription state, TMDB requests, modal interactions, and UI fallbacks. The goal is to make failure states explicit and keep user-visible state predictable when dependencies are slow or unavailable.

- **Website**: [tinahu.dev](https://www.tinahu.dev/)
- **GitHub**: [yuting813](https://github.com/yuting813)
- **Email**: [tinahuu321@gmail.com](mailto:tinahuu321@gmail.com)

> **Educational Use Disclaimer**
> This project is solely for personal technical demonstration and educational purposes. It is **not** a commercial product and is not affiliated with any streaming media service. Movie data is sourced via the public [TMDB API](https://www.themoviedb.org/).
