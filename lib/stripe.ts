import { getApp } from '@firebase/app';
// Note: createCheckoutSession and getProducts are used dynamically in the application
import { createCheckoutSession, getStripePayments } from '@invertase/firestore-stripe-payments';

// 初始化 Firebase app
const app = getApp();

// 初始化 Stripe Payments
const payments = getStripePayments(app, {
	productsCollection: 'products',
	customersCollection: 'customers',
});

const loadCheckout = async (priceId: string) => {
	const origin = window.location.origin;
	const session = await createCheckoutSession(payments, {
		price: priceId,
		mode: 'subscription',
		success_url: origin + '/checkout-status?state=success',
		cancel_url: origin + '/checkout-status?state=cancelled',
	});

	window.location.assign(session.url);
};

export { loadCheckout };
export default payments;
