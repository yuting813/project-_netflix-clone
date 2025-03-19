import { User } from 'firebase/auth';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { db } from '../firebase';

interface Subscription {
	status: string;
	current_period_end: number;
	current_period_start: number;
}

interface SubscriptionResult {
	subscription: Subscription | null;
	loading: boolean;
	error?: string;
}

function useSubscription(user: User | null): SubscriptionResult {
	const [subscription, setSubscription] = useState<Subscription | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string>('');

	useEffect(() => {
		setError('');

		if (!user) {
			setSubscription(null);
			setLoading(false);
			return;
		}

		try {
			const subscriptionsRef = collection(db, 'customers', user.uid, 'subscriptions');
			const q = query(subscriptionsRef, where('status', 'in', ['active', 'trialing']));

			const unsubscribe = onSnapshot(
				q,
				(snapshot) => {
					if (snapshot.empty) {
						setSubscription(null);
						setLoading(false);
						return;
					}
					const currentSub = snapshot.docs[0].data() as Subscription;
					setSubscription(currentSub);
					setLoading(false);
				},
				(error) => {
					setError('訂閱數據獲取失敗');
					setLoading(false);
				},
			);

			return () => unsubscribe();
		} catch (error) {
			setError('訂閱系統連接失敗');
			setLoading(false);
		}
	}, [user]);

	return { subscription, loading, error };
}

export default useSubscription;
