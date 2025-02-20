import { getApp } from '@firebase/app';
import { getProducts, createCheckoutSession } from '@invertase/firestore-stripe-payments';
import { getStripePayments } from '@invertase/firestore-stripe-payments';

// 初始化 Firebase app
const app = getApp();

// 初始化 Stripe Payments
const payments = getStripePayments(app, {
	productsCollection: 'products',
	customersCollection: 'customers',
});

// 獲取產品列表
// export const fetchProducts = async () => {
// 	try {
// 		const products = await getProducts(payments, {
// 			includePrices: true,
// 			activeOnly: true,
// 		});
// 		console.log('Products fetched:', products?.length);
// 		console.log('Products :', products);
// 		return products;
// 	} catch (error) {
// 		console.error('Error fetching products:', error);
// 		return [];
// 	}
// };

// 處理支付
// const loadCheckout = async (priceId: string) => {
// 	try {
// 		const session = await createCheckoutSession(payments, {
// 			price: priceId,
// 			success_url: window.location.origin,
// 			cancel_url: window.location.origin,
// 		});
// 		window.location.assign(session.url);
// 	} catch (error) {
// 		console.error('Checkout error:', error);
// 	}
// };

// export { loadCheckout };
export default payments;
