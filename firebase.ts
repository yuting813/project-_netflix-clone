// Import the functions you need from the SDKs you need
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
	apiKey: 'AIzaSyBGmd3s0Zj72gXYNz49_N8rgzV0lUsnFmc',
	authDomain: 'netflix-clone-22a83.firebaseapp.com',
	projectId: 'netflix-clone-22a83',
	storageBucket: 'netflix-clone-22a83.appspot.com',
	messagingSenderId: '361595398895',
	appId: '1:361595398895:web:05019756c739b78af3091a',
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth();
console.log('Firebase app', app);
console.log('Firebase db', db);
console.log('Firebase auth', auth);

export default app;
export { auth, db };

// // Example function to fetch products
// async function fetchProducts() {
// 	try {
// 		const productsCollection = collection(db, 'products');
// 		console.log('db:', db);
// 		console.log('productsCollection:', productsCollection);
// 		const productsSnapshot = await getDocs(productsCollection);
// 		const productsList = productsSnapshot.docs.map((doc) => doc.data());
// 		console.log('productsList:', productsList);
// 	} catch (error) {
// 		console.error('Error fetching products:', error);
// 	}
// }

// // Call the function to fetch products
// fetchProducts();
