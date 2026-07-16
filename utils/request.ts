// 1. ENV configuration
//-------------------------------------------------------------
const ENV_API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY?.trim() || undefined;

const BASE_URL = 'https://api.themoviedb.org/3';

// Global fetch cache to avoid duplicate TMDB requests
const fetchCache = new Map<string, Promise<unknown>>();

export type TmdbFetchOptions = {
	params?: Record<string, string | number | boolean | undefined>;
	timeout?: number;
	signal?: AbortSignal;
};

export type TmdbResponse<T> = {
	page?: number;
	results?: T[];
	total_pages?: number;
	total_results?: number;
} & Record<string, unknown>;

//-------------------------------------------------------------
// 2. Pure helpers to build a clean TMDB URL
//-------------------------------------------------------------
function resolveBaseUrl(pathOrUrl: string): URL {
	const isFull = /^https?:\/\//i.test(pathOrUrl);
	const base = isFull
		? pathOrUrl
		: `${BASE_URL}${pathOrUrl.startsWith('/') ? '' : '/'}${pathOrUrl}`;
	return new URL(base);
}

function mergeParams(url: URL, params?: Record<string, string | number | boolean | undefined>) {
	if (!params) return;

	Object.entries(params).forEach(([k, v]) => {
		if (v === undefined || v === null) return;
		url.searchParams.set(k, String(v));
	});
}

function ensureApiKey(url: URL, params?: Record<string, string | number | boolean | undefined>) {
	const hasKeyInParams = params && Object.prototype.hasOwnProperty.call(params, 'api_key');
	const hasKeyInUrl = url.searchParams.has('api_key');

	if (!ENV_API_KEY && !hasKeyInParams && !hasKeyInUrl) {
		throw new Error('TMDB API key missing. Set NEXT_PUBLIC_TMDB_API_KEY in your environment.');
	}

	if (!hasKeyInUrl && !hasKeyInParams && ENV_API_KEY) {
		url.searchParams.set('api_key', ENV_API_KEY);
	}
}

function finalizeUrl(url: URL): string {
	return url.toString();
}

//-------------------------------------------------------------
// 3. Unified URL builder (composed from pure helpers)
//-------------------------------------------------------------
function buildUrl(
	pathOrUrl: string,
	params?: Record<string, string | number | boolean | undefined>,
): string {
	const url = resolveBaseUrl(pathOrUrl);

	ensureApiKey(url, params);
	mergeParams(url, params);

	return finalizeUrl(url);
}

//-------------------------------------------------------------
// 4. Main TMDB Fetch wrapper with cache + timeout + typing
//-------------------------------------------------------------
export async function tmdbFetch<T = unknown>(
	path: string,
	options: TmdbFetchOptions = {},
): Promise<T> {
	const { params, timeout = 8000, signal: userSignal } = options;

	const url = buildUrl(path, params);

	// Check fetch cache—return existing promise if present
	const cachedRequest = fetchCache.get(url);
	if (cachedRequest) {
		return cachedRequest as Promise<T>;
	}

	// Create the actual fetch promise
	const fetchPromise = (async () => {
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), timeout);

		// Combine user-provided signal with timeout signal
		const mergedSignals = userSignal ? mergeAbortSignals(userSignal, controller.signal) : undefined;
		const finalSignal = mergedSignals?.signal ?? controller.signal;

		try {
			const res = await fetch(url, { signal: finalSignal });
			clearTimeout(timeoutId);

			if (!res.ok) {
				const text = await res.text().catch(() => '');
				const msg = `TMDB fetch error ${res.status} ${res.statusText}${text ? `: ${text}` : ''}`;
				const err = new Error(msg) as Error & { status: number };
				err.status = res.status;
				throw err;
			}

			return (await res.json()) as T;
		} catch (error: unknown) {
			if (error instanceof Error && error.name === 'AbortError') {
				const abortedError = new Error('Request aborted (timeout or signal)') as Error & {
					code: string;
				};
				abortedError.code = 'ABORTED';
				throw abortedError;
			}
			throw error;
		} finally {
			mergedSignals?.cleanup();
			clearTimeout(timeoutId);
		}
	})();

	// Save promise in cache
	fetchCache.set(url, fetchPromise);

	// This Map deduplicates only concurrent requests. Clear settled Promises so
	// a later ISR execution can fetch fresh TMDB data.
	const clearCacheEntry = () => {
		if (fetchCache.get(url) === fetchPromise) fetchCache.delete(url);
	};
	void fetchPromise.then(clearCacheEntry, clearCacheEntry);

	return fetchPromise;
}

//-------------------------------------------------------------
// Helper: merge two AbortSignals (timeout + user signal)
//-------------------------------------------------------------
type MergedAbortSignals = {
	signal: AbortSignal;
	cleanup: () => void;
};

function mergeAbortSignals(signalA: AbortSignal, signalB: AbortSignal): MergedAbortSignals {
	const controller = new AbortController();
	const cleanup = () => {
		signalA.removeEventListener('abort', onAbort);
		signalB.removeEventListener('abort', onAbort);
	};
	const onAbort = () => {
		controller.abort();
		cleanup();
	};

	if (signalA.aborted || signalB.aborted) {
		controller.abort();
	} else {
		signalA.addEventListener('abort', onAbort);
		signalB.addEventListener('abort', onAbort);
	}

	return { signal: controller.signal, cleanup };
}

//-------------------------------------------------------------
// 5. Backwards-compatible constants (do not break imports)
//-------------------------------------------------------------
const requests = {
	fetchTrending: `${BASE_URL}/trending/all/week`,
	fetchstreamOriginals: `${BASE_URL}/discover/movie?with_networks=213`,
	fetchTopRated: `${BASE_URL}/movie/top_rated`,
	fetchActionMovies: `${BASE_URL}/discover/movie?with_genres=28`,
	fetchComedyMovies: `${BASE_URL}/discover/movie?with_genres=35`,
	fetchHorrorMovies: `${BASE_URL}/discover/movie?with_genres=27`,
	fetchRomanceMovies: `${BASE_URL}/discover/movie?with_genres=10749`,
	fetchDocumentaries: `${BASE_URL}/discover/movie?with_genres=99`,
};

export default requests;
