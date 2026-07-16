import { renderHook, waitFor } from '@testing-library/react';
import { onSnapshot } from 'firebase/firestore';
import useList from '../../hooks/useList';

jest.mock('../../firebase', () => ({
	db: {},
}));

jest.mock('firebase/firestore', () => ({
	collection: jest.fn(),
	onSnapshot: jest.fn(),
}));

describe('useList', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('sorts recently added titles first and keeps legacy titles without addedAt last', async () => {
		(onSnapshot as jest.Mock).mockImplementation((_collection, onNext) => {
			onNext({
				docs: [
					{
						id: 'legacy',
						data: () => ({ title: 'Legacy title' }),
					},
					{
						id: 'newest',
						data: () => ({
							title: 'Newest title',
							addedAt: { toMillis: () => 200 },
						}),
					},
					{
						id: 'older',
						data: () => ({
							title: 'Older title',
							addedAt: { toMillis: () => 100 },
						}),
					},
				],
			});

			return jest.fn();
		});

		const { result } = renderHook(() => useList('test-user-id'));

		await waitFor(() => {
			expect(result.current.map((movie) => movie.title)).toEqual([
				'Newest title',
				'Older title',
				'Legacy title',
			]);
		});
	});
});
