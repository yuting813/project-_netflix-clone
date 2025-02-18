import { getProducts, getStripePayments } from '@stripe/firestore-stripe-payments';
import { createCheckoutSession } from '@stripe/firestore-stripe-payments';
import { getFunctions, httpsCallable } from '@firebase/functions';
import app from '../firebase';
import { getFirestore } from 'firebase/firestore';

// 初始化 Firestore
const db = getFirestore(app);

console.log('Firestore DB:', app);
const payments = getStripePayments(app, {
	productsCollection: 'products',
	customersCollection: 'customers',
});

// 添加调试信息
console.log('Firebase App Config:', {
	projectId: app.options.projectId,
	region: 'us-central1',
	functions: !!getFunctions(app),
});

console.log('Stripe Extension Status:', {
	isInitialized: !!payments,
	productsCollection: 'products',
	customersCollection: 'customers',
	db: !!db,
});

const testProducts = async () => {
	try {
		console.log('Starting to fetch products...');
		console.log('Payments object:', payments); // 添加這行
		const products = await getProducts(payments, {
			includePrices: true,
			activeOnly: true,
		});
		console.log('Products from Stripe:', products);
	} catch (error: unknown) {
		console.error('Stripe products error:', error);
		if (error instanceof Error) {
			console.error('Detailed Error:', {
				name: error.name,
				message: error.message,
				stack: error.stack,
				cause: error.cause,
				// 添加更多錯誤信息
				code: (error as any).code,
				details: (error as any).details,
				serverResponse: (error as any).serverResponse,
			});
		}
	}
};

testProducts();

const loadCheckout = async (priceId: string) => {
	await createCheckoutSession(payments, {
		price: priceId,
		success_url: window.location.origin,
		cancel_url: window.location.origin,
	})
		.then((snapshot) => window.location.assign(snapshot.url))
		.catch((error) => console.log('error_loadCheckout', error.message));
};

// const goToBillingPortal = async () => {
// 	const instance = getFunctions(app, 'us-central1');
// 	const functionRef = httpsCallable(instance, 'ext-firestore-stripe-payments-createPortalLink');

// 	await functionRef({
// 		returnUrl: `${window.location.origin}/account`,
// 	})
// 		.then(({ data }: any) => window.location.assign(data.url))
// 		.catch((error) => console.log(error.message));
// };

export { loadCheckout };
export default payments;
