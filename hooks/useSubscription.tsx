import { User } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

interface Subscription {
	status: string;
	current_period_end: number;
	current_period_start: number;
}

// function useSubscription(user: User | null) {
// 	const [subscription, setSubscription] = useState<Subscription | null>(null);

// 	useEffect(() => {
// 		if (!user) return;

// 		// 監聽用戶的訂閱狀態
// 		const subscriptionsRef = collection(db, 'customers', user.uid, 'subscriptions');
// 		const q = query(subscriptionsRef, where('status', 'in', ['active', 'trialing']));

// 		const unsubscribe = onSnapshot(q, (snapshot) => {
// 			if (snapshot.empty) {
// 				setSubscription(null);
// 				return;
// 			}

// 			// 獲取最新的訂閱資訊
// 			const currentSub = snapshot.docs[0].data() as Subscription;
// 			setSubscription(currentSub);
// 		});

// 		return () => {
// 			unsubscribe();
// 		};
// 	}, [user]);

// 	return subscription;
// }

function useSubscription(user: User | null) {
	const [subscription, setSubscription] = useState<Subscription | null>(null);

	useEffect(() => {
		if (!user) {
			setSubscription(null);
			return;
		}

		try {
			const subscriptionsRef = collection(db, 'customers', user.uid, 'subscriptions');
			const q = query(subscriptionsRef, where('status', 'in', ['active', 'trialing']));

			const unsubscribe = onSnapshot(
				q,
				(snapshot) => {
					if (snapshot.empty) {
						console.log('沒有找到訂閱');
						setSubscription(null);
						return;
					}
					const currentSub = snapshot.docs[0].data() as Subscription;
					console.log('找到訂閱:', currentSub);
					setSubscription(currentSub);
				},
				(error) => {
					console.error('訂閱監聽錯誤:', error);
					setSubscription(null);
				},
			);

			return () => unsubscribe();
		} catch (error) {
			console.error('設置訂閱監聽時出錯:', error);
			setSubscription(null);
		}
	}, [user]);

	return subscription;
}

export default useSubscription;
