import {
	AuthError,
	createUserWithEmailAndPassword,
	onAuthStateChanged,
	signInWithEmailAndPassword,
	signOut,
	User,
} from 'firebase/auth';
import { useRouter } from 'next/router';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import Loader from '../components/Loader';
import { auth } from '../firebase';

// 30 分鐘自動登出（毫秒）
const TOKEN_EXPIRATION_TIME = 30 * 60 * 1000;

// 固定 public paths，避免 array reference 變動
const PUBLIC_PATHS = Object.freeze(['/login', '/signup', '/checkout-status']);

interface AuthResponse {
	success: boolean;
	error?: string;
}

interface IAuth {
	user: User | null;
	signUp: (email: string, password: string) => Promise<AuthResponse>;
	signIn: (email: string, password: string) => Promise<AuthResponse>;
	logout: () => Promise<{ success: boolean }>;
	error: string | null;
	loading: boolean;
	resetError: () => void;
	initialLoading: boolean;
}

const AuthContext = createContext<IAuth>({
	user: null,
	signUp: async () => ({ success: false }),
	signIn: async () => ({ success: false }),
	logout: async () => ({ success: false }),
	error: null,
	loading: false,
	resetError: () => undefined, // NOOP function，避免 eslint no-empty-function
	initialLoading: true,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
	const [loading, setLoading] = useState(false); // signIn/signUp/loading 狀態
	const [user, setUser] = useState<User | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [initialLoading, setInitialLoading] = useState(true);
	const router = useRouter();

	/** ----------------- onAuthStateChanged：同步 user + redirect ----------------- */
	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
			if (fbUser) {
				setUser(fbUser);
				setLoading(false);
			} else {
				setUser(null);

				// 不是公開頁面 → 自動導向 login
				if (!PUBLIC_PATHS.includes(router.pathname)) {
					router.push('/login').catch((err) => console.error('路由切換錯誤:', err));
				}
			}

			setInitialLoading(false);
		});

		return unsubscribe;
	}, [router.pathname, router]);

	/** ----------------- 自動登出計時器 ----------------- */
	useEffect(() => {
		if (!user) return;

		const timer = setTimeout(async () => {
			try {
				await logout();
				console.log('自動登出成功');
			} catch (err) {
				console.error('自動登出失敗:', err);
			}
		}, TOKEN_EXPIRATION_TIME);

		return () => clearTimeout(timer);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [user]); // 不能放 logout，會導致無限重新建立 timer

	/** ----------------- 清除錯誤訊息 ----------------- */
	const resetError = useCallback(() => {
		setError(null);
	}, []);

	/** ----------------- Sign In ----------------- */
	const signIn = useCallback(
		async (email: string, password: string) => {
			setLoading(true);
			resetError();

			try {
				const userCredential = await signInWithEmailAndPassword(auth, email, password);
				setUser(userCredential.user);
				return { success: true };
			} catch (err) {
				const authError = err as AuthError;
				console.error('登入錯誤:', authError);
				setError(authError.code);
				return { success: false, error: authError.code };
			} finally {
				setLoading(false);
			}
		},
		[resetError],
	);

	/** ----------------- Sign Up ----------------- */
	const signUp = useCallback(
		async (email: string, password: string) => {
			setLoading(true);
			resetError();

			try {
				const userCredential = await createUserWithEmailAndPassword(auth, email, password);
				setUser(userCredential.user);
				return { success: true };
			} catch (err) {
				const authError = err as AuthError;
				console.error('註冊錯誤:', authError);
				setError(authError.code);
				return { success: false, error: authError.code };
			} finally {
				setLoading(false);
			}
		},
		[resetError],
	);

	/** ----------------- Logout ----------------- */
	const logout = useCallback(async () => {
		setLoading(true);
		try {
			await signOut(auth);
			setUser(null);
			setError(null);

			if (router.pathname !== '/login') {
				await router.push('/login');
			}

			return { success: true };
		} catch (err) {
			console.error('登出錯誤:', err);
			return { success: false };
		} finally {
			setLoading(false);
		}
	}, [router]);

	/** ----------------- memo ----------------- */
	const memoedValue = useMemo(
		() => ({
			user,
			signUp,
			signIn,
			loading,
			logout,
			error,
			resetError,
			initialLoading,
		}),
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[user, loading, error, signIn, signUp, resetError, initialLoading],
	);

	return (
		<AuthContext.Provider value={memoedValue}>
			{initialLoading ? (
				<div className='flex h-screen w-screen items-center justify-center bg-black'>
					<Loader color='fill-red-600' />
				</div>
			) : (
				children
			)}
		</AuthContext.Provider>
	);
};

export default function useAuth() {
	return useContext(AuthContext);
}
