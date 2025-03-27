import {
	AuthError,
	createUserWithEmailAndPassword,
	onAuthStateChanged,
	signInWithEmailAndPassword,
	signOut,
	User,
} from 'firebase/auth';
import { useRouter } from 'next/router';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { auth } from '../firebase';

// 自動登出時間設置（毫秒）
const TOKEN_EXPIRATION_TIME = 1800000; // 30分鐘 = 30 * 60 * 1000

// 添加返回值類型介面
interface AuthResponse {
	success: boolean;
	error?: string;
}

interface IAuth {
	user: User | null;
	signUp: (email: string, password: string) => Promise<AuthResponse>; // 更新返回類型
	signIn: (email: string, password: string) => Promise<AuthResponse>; // 更新返回類型
	logout: () => Promise<{ success: boolean }>;
	error: string | null;
	loading: boolean;
}

const AuthContext = createContext<IAuth>({
	user: null,
	signUp: async () => ({ success: false }),
	signIn: async () => ({ success: false }),
	logout: async () => ({ success: false }),
	error: null,
	loading: false,
});

interface AuthProviderProps {
	children: React.ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
	const [loading, setLoading] = useState(false);
	const [user, setUser] = useState<User | null>(null);
	const [error, setError] = useState(null);
	const [initialLoading, setInitialLoading] = useState(true);
	const router = useRouter();

	// Persisting the user
	useEffect(
		() =>
			onAuthStateChanged(auth, (user) => {
				if (user) {
					// Logged in...
					setUser(user);
					setLoading(false);
				} else {
					// Not logged in...
					setUser(null);
					try {
						if (router.pathname !== '/login') {
							router.push('/login');
						}
					} catch (error) {
						console.error('路由切換錯誤:', error);
					}
				}

				setInitialLoading(false);
			}),
		[auth, router],
	);

	useEffect(() => {
		let logoutTimer: NodeJS.Timeout;

		if (user) {
			logoutTimer = setTimeout(async () => {
				try {
					await logout();
					console.log('自動登出成功');
				} catch (error) {
					console.error('自動登出失敗:', error);
				}
			}, TOKEN_EXPIRATION_TIME);
		}

		return () => {
			if (logoutTimer) {
				clearTimeout(logoutTimer);
			}
		};
	}, [user]);

	const resetError = () => {
		setError(null);
	};

	const signIn = async (email: string, password: string) => {
		setLoading(true);
		resetError();
		try {
			const userCredential = await signInWithEmailAndPassword(auth, email, password);
			console.log(userCredential.user);
			setUser(userCredential.user);
			return { success: true };
		} catch (error) {
			const authError = error as AuthError;
			console.error('登入錯誤:', authError);
			// 根據 Firebase 錯誤代碼進行處理，例如顯示錯誤訊息給使用者，或者根據錯誤代碼進行其他動作
			return {
				success: false,
				error: authError.code,
			};
		} finally {
			setLoading(false);
		}
	};

	const signUp = async (email: string, password: string) => {
		setLoading(true);
		resetError();
		try {
			const userCredential = await createUserWithEmailAndPassword(auth, email, password);
			console.log(userCredential.user);
			setUser(userCredential.user);
			return { success: true };
		} catch (error) {
			const authError = error as AuthError;
			console.error('註冊錯誤:', authError);
			// 根據 Firebase 錯誤代碼進行處理，例如顯示錯誤訊息給使用者，或者根據錯誤代碼進行其他動作
			return {
				success: false,
				error: authError.code,
			};
		} finally {
			setLoading(false);
		}
	};

	const logout = async () => {
		setLoading(true);
		try {
			await signOut(auth);
			setUser(null);
			return { success: true };
		} catch (error) {
			console.error('登出錯誤:', error);
			return { success: false };
		} finally {
			setLoading(false);
		}
	};

	const memoedValue = useMemo(
		() => ({
			user,
			signUp,
			signIn,
			loading,
			logout,
			error,
			resetError,
		}),
		[user, loading, error],
	);

	return (
		<AuthContext.Provider value={memoedValue}>{!initialLoading && children}</AuthContext.Provider>
	);
};

export default function useAuth() {
	return useContext(AuthContext);
}
