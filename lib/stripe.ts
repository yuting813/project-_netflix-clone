import { getApp } from '@firebase/app';
import {
	createCheckoutSession,
	getProducts,
	getStripePayments,
} from '@invertase/firestore-stripe-payments';
import { loadStripe } from '@stripe/stripe-js';

// 初始化 Firebase app
const app = getApp();

// 初始化 Stripe Payments
const payments = getStripePayments(app, {
	productsCollection: 'products',
	customersCollection: 'customers',
});

const stripePromise = loadStripe(
	'pk_test_51QogiRRsSr8qcNR4YmWmX3vnlM8W1augUrk3y5SpjGOndUk31SPLsHpQAsSBNGpWBeH8k2ObVi9Bkb9zGwKOI4zT00MB9MjFuA',
);

const loadCheckout = async (priceId: string, userId: string) => {
	try {
		const stripe = await stripePromise;
		if (!stripe) throw new Error('Stripe not loaded');

		// 創建 checkout session
		const response = await fetch('/api/create-checkout-session', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ priceId, userId }),
		});

		const session = await response.json();

		// 重定向到 Stripe Checkout
		const result = await stripe.redirectToCheckout({
			sessionId: session.id,
		});

		if (result.error) {
			throw new Error(result.error.message);
		}
	} catch (error) {
		console.error('支付錯誤:', error);
		window.location.assign('/error');
	}
};

export { loadCheckout };
export default payments;
