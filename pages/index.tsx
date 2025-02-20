import Head from 'next/head';
import Header from '@/components/Header';
import Banner from '@/components/Banner';
import requests from '@/utils/request';
import { Movie } from '@/typings';
import Row from '@/components/Row';
import useAuth from '@/hooks/useAuth';
import Modal from '@/components/Modal';
import { useRecoilValue } from 'recoil';
import { modalState, movieState } from '@/atoms/modalAtom';
import Plans from '@/components/Plans';
import { getProducts, getStripePayments, Product } from '@invertase/firestore-stripe-payments';

// import { fetchProducts } from '@/lib/stripe';
import { collection, getDocs } from 'firebase/firestore';
import app, { db } from '@/firebase';

interface Props {
	netflixOriginals: Movie[];
	trendingNow: Movie[];
	topRated: Movie[];
	actionMovies: Movie[];
	comedyMovies: Movie[];
	horrorMovies: Movie[];
	romanceMovies: Movie[];
	documentaries: Movie[];
	products: Product[];
}

const Home = ({
	netflixOriginals,
	actionMovies,
	comedyMovies,
	documentaries,
	horrorMovies,
	romanceMovies,
	topRated,
	trendingNow,
	products,
}: Props) => {
	console.log('Products:', products);
	const { loading, user } = useAuth();
	const showModal = useRecoilValue(modalState);
	// const subscription = useSubscription(user);
	const movie = useRecoilValue(movieState);
	// const list = useList(user?.uid);
	const subscription = false;

	if (loading || subscription === null) return null;

	if (!subscription) return <Plans products={products} />;
	return (
		<div className='relative bg-[linear-gradient(to_bottom,rgba(20,20,20,0)_0%,rgba(20,20,20,0.15)_15%,rgba(20,20,20,0.35)_29%,rgba(20,20,20,0.58)_44%,#141414_58%,#141414_100%)] rounded lg:h-[160vh] '>
			<Head>
				<title>Home - Netflixx</title>
				<link rel='icon' href='/favicon.ico' />
			</Head>

			<Header />
			<main className='relative pl-4 pb-24 space-y-24 lg:pl-16 '>
				<Banner netflixOriginals={netflixOriginals} />

				<section className='md:space-y-24'>
					<Row title='Trending Now' movies={trendingNow} />
					<Row title='Top Rated' movies={topRated} />
					<Row title='Action Thrillers' movies={actionMovies} />
					{/* My List */}

					<Row title='Comedies' movies={comedyMovies} />
					<Row title='Scary Movies' movies={horrorMovies} />
					<Row title='Romance Movies' movies={romanceMovies} />
					<Row title='Documentaries' movies={documentaries} />
				</section>
			</main>

			{showModal && <Modal />}
		</div>
	);
};

export default Home;

// export const getServerSideProps = async () => {
// 	try {
// 		const [products, ...movieData] = await Promise.all([
// 			fetchProducts().catch((error) => {
// 				console.error('Stripe 產品獲取錯誤:', error);
// 				return [];
// 			}),
// 			// 獲取電影數據
// 			fetch(requests.fetchNetflixOriginals).then((res) => res.json()),
// 			fetch(requests.fetchTrending).then((res) => res.json()),
// 			fetch(requests.fetchTopRated).then((res) => res.json()),
// 			fetch(requests.fetchActionMovies).then((res) => res.json()),
// 			fetch(requests.fetchComedyMovies).then((res) => res.json()),
// 			fetch(requests.fetchHorrorMovies).then((res) => res.json()),
// 			fetch(requests.fetchRomanceMovies).then((res) => res.json()),
// 			fetch(requests.fetchDocumentaries).then((res) => res.json()),
// 		]);

// 		console.log('Stripe products loaded:', products?.length || 0);

// 		// 解構電影數據
// 		const [
// 			netflixOriginals,
// 			trendingNow,
// 			topRated,
// 			actionMovies,
// 			comedyMovies,
// 			horrorMovies,
// 			romanceMovies,
// 			documentaries,
// 		] = movieData;

// 		return {
// 			props: {
// 				products,
// 				netflixOriginals: netflixOriginals.results,
// 				trendingNow: trendingNow.results,
// 				topRated: topRated.results,
// 				actionMovies: actionMovies.results,
// 				comedyMovies: comedyMovies.results,
// 				horrorMovies: horrorMovies.results,
// 				romanceMovies: romanceMovies.results,
// 				documentaries: documentaries.results,
// 			},
// 		};
// 	} catch (error) {
// 		console.error('getServerSideProps error:', error);
// 		return {
// 			props: {
// 				products: [],
// 				netflixOriginals: [],
// 				trendingNow: [],
// 				topRated: [],
// 				actionMovies: [],
// 				comedyMovies: [],
// 				horrorMovies: [],
// 				romanceMovies: [],
// 				documentaries: [],
// 			},
// 		};
// 	}
// };
const payments = getStripePayments(app, {
	productsCollection: 'products',
	customersCollection: 'customers',
});
export const getServerSideProps = async () => {
	console.log('Fetching products...1');
	const products = await getProducts(payments, {
		includePrices: true,
		activeOnly: true,
	})
		.then((res) => res)
		.catch((error) => {
			console.log('Error fetching products:', error);
			return [];
		});
	console.log('Fetching products...2');
	//新增以下程式碼來從firestore取得產品資料
	const productsCollection = collection(db, 'products');
	const productsSnapshot = await getDocs(productsCollection);
	const productsWithPricing = await Promise.all(
		productsSnapshot.docs.map(async (doc) => {
			const productData = doc.data();
			const pricesCollection = collection(db, `products/${doc.id}/prices`);
			const pricesSnapshot = await getDocs(pricesCollection);
			const prices = pricesSnapshot.docs.map((priceDoc) => priceDoc.data());
			console.log('prices:', prices);
			return {
				id: doc.id,
				...productData,
				price: prices.length > 0 ? prices[0].unit_amount : 'No prices available',
			};
		}),
	);

	console.log('productsFromFirestore:', productsWithPricing);

	const [
		netflixOriginals,
		trendingNow,
		topRated,
		actionMovies,
		comedyMovies,
		horrorMovies,
		romanceMovies,
		documentaries,
	] = await Promise.all([
		fetch(requests.fetchNetflixOriginals).then((res) => res.json()),
		fetch(requests.fetchTrending).then((res) => res.json()),
		fetch(requests.fetchTopRated).then((res) => res.json()),
		fetch(requests.fetchActionMovies).then((res) => res.json()),
		fetch(requests.fetchComedyMovies).then((res) => res.json()),
		fetch(requests.fetchHorrorMovies).then((res) => res.json()),
		fetch(requests.fetchRomanceMovies).then((res) => res.json()),
		fetch(requests.fetchDocumentaries).then((res) => res.json()),
	]);

	return {
		props: {
			netflixOriginals: netflixOriginals.results,
			trendingNow: trendingNow.results,
			topRated: topRated.results,
			actionMovies: actionMovies.results,
			comedyMovies: comedyMovies.results,
			horrorMovies: horrorMovies.results,
			romanceMovies: romanceMovies.results,
			documentaries: documentaries.results,
			products: productsWithPricing, // 使用從 Firestore 取得的產品資料
		},
	};
};
