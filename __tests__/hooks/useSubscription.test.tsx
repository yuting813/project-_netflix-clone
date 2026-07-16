import { renderHook, waitFor } from '@testing-library/react';
import { User } from 'firebase/auth';
import { collection, onSnapshot } from 'firebase/firestore';
import useSubscription from '../../hooks/useSubscription';

// Mock Firebase
jest.mock('../../firebase', () => ({
	db: {},
}));

jest.mock('firebase/firestore', () => ({
	collection: jest.fn(),
	query: jest.fn(),
	where: jest.fn(),
	onSnapshot: jest.fn(),
}));

describe('useSubscription', () => {
	const mockUser = { uid: 'test-user-id' } as User;

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('should return default loading state initially', () => {
		(onSnapshot as jest.Mock).mockReturnValue(() => undefined);
		const { result } = renderHook(() => useSubscription(mockUser));

		expect(result.current.loading).toBe(true);
		expect(result.current.subscription).toBeNull();
	});

	it('should return null subscription if no user is provided', () => {
		const { result } = renderHook(() => useSubscription(null));

		expect(result.current.subscription).toBeNull();
		expect(result.current.loading).toBe(false);
	});

	it('should handle active subscription successfully', async () => {
		const mockSubscription = {
			status: 'active',
			current_period_end: 1234567890,
			current_period_start: 1234560000,
		};

		(onSnapshot as jest.Mock).mockImplementation((query, onNext, _onError) => {
			onNext({
				empty: false,
				docs: [
					{
						data: () => mockSubscription,
					},
				],
			});
			return jest.fn(); // unsubscribe
		});

		const { result } = renderHook(() => useSubscription(mockUser));

		await waitFor(() => {
			expect(result.current.loading).toBe(false);
			expect(result.current.subscription).toEqual(mockSubscription);
			expect(result.current.error).toBe('');
		});
	});

	it('should handle no subscription found', async () => {
		(onSnapshot as jest.Mock).mockImplementation((query, onNext, _onError) => {
			onNext({
				empty: true,
				docs: [],
			});
			return jest.fn();
		});

		const { result } = renderHook(() => useSubscription(mockUser));

		await waitFor(() => {
			expect(result.current.loading).toBe(false);
			expect(result.current.subscription).toBeNull();
		});
	});

	it('should handle error state', async () => {
		(onSnapshot as jest.Mock).mockImplementation((_query, _onNext, onError) => {
			onError(new Error('Permission denied'));
			return jest.fn();
		});

		const { result } = renderHook(() => useSubscription(mockUser));

		await waitFor(() => {
			expect(result.current.loading).toBe(false);
			expect(result.current.error).toBe('訂閱數據獲取失敗');
		});
	});

	it('should handle connection failure (try-catch block)', async () => {
		// Simulate an error thrown during setup (e.g. inside the try block)
		(collection as jest.Mock).mockImplementationOnce(() => {
			throw new Error('Connection failed');
		});

		const { result } = renderHook(() => useSubscription(mockUser));

		await waitFor(() => {
			expect(result.current.error).toBe('訂閱系統連接失敗');
			expect(result.current.loading).toBe(false);
		});
	});
});
