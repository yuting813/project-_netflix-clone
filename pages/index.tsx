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
import { Product } from '@invertase/firestore-stripe-payments';

// import { fetchProducts } from '@/lib/stripe';
import { collection, doc, getDocs, setDoc } from 'firebase/firestore';
import app, { db } from '@/firebase';
import useSubscription from '@/hooks/useSubscription';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import useList from '@/hooks/useList';

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
	const { loading, user } = useAuth();
	const showModal = useRecoilValue(modalState);
	const subscription = useSubscription(user);
	const movie = useRecoilValue(movieState);
	const list = useList(user?.uid);
	const router = useRouter();
	const { session_id } = router.query;

	useEffect(() => {
		if (session_id && user) {
			// 支付成功後更新訂閱狀態
			const updateSubscription = async () => {
				try {
					const subscriptionRef = doc(db, 'customers', user.uid, 'subscriptions', 'active');
					await setDoc(
						subscriptionRef,
						{
							status: 'active',
							current_period_start: Date.now(),
							current_period_end: Date.now() + 30 * 24 * 60 * 60 * 1000,
							userId: user.uid,
						},
						{ merge: true },
					);
					console.log('訂閱狀態更新成功');
					// window.location.reload();
				} catch (error) {
					console.error('更新訂閱狀態失敗:', error);
				}
			};
			updateSubscription();
		}
	}, [session_id, user]);

	if (loading) return null;

	if (!user) {
		router.push('/login');
		return null;
	}
	if (!subscription) return <Plans products={products} />;
	return (
		<div className='relative bg-[linear-gradient(to_bottom,rgba(20,20,20,0)_0%,rgba(20,20,20,0.15)_15%,rgba(20,20,20,0.35)_29%,rgba(20,20,20,0.58)_44%,#141414_58%,#141414_100%)] rounded lg:h-[160vh] '>
			<Head>
				<title>Home - Netflixx</title>
				<link rel='icon' href='/logo.svg' />
			</Head>

			<Header />
			<main className='relative pl-4 pb-24 space-y-24 lg:pl-16 '>
				<Banner netflixOriginals={netflixOriginals} />

				<section className='md:space-y-24'>
					<Row title='Trending Now' movies={trendingNow} />
					<Row title='Top Rated' movies={topRated} />
					<Row title='Action Thrillers' movies={actionMovies} />
					{/* My List */}
					{list.length > 0 && <Row title='My List' movies={list} />}
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

// const payments = getStripePayments(app, {
// 	productsCollection: 'products',
// 	customersCollection: 'customers',
// });

export const getServerSideProps = async () => {
	// console.log('Fetching products...1');
	// const products = await getProducts(payments, {
	// 	includePrices: true,
	// 	activeOnly: true,
	// })
	// 	.then((res) => res)
	// 	.catch((error) => {
	// 		console.log('Error fetching products:', error);
	// 		return [];
	// 	});
	// console.log('Fetching products...2');

	try {
		//  Firestore 產品獲取邏輯
		const productsCollection = collection(db, 'products');
		const productsSnapshot = await getDocs(productsCollection);

		const productsWithPricing = await Promise.all(
			productsSnapshot.docs.map(async (doc) => {
				const productData = doc.data();
				const pricesCollection = collection(db, `products/${doc.id}/prices`);
				const pricesSnapshot = await getDocs(pricesCollection);

				const prices = pricesSnapshot.docs.map((priceDoc) => ({
					id: priceDoc.id,
					...priceDoc.data(),
				}));

				return {
					id: doc.id,
					...productData,
					price: prices,
				};
			}),
		);

		console.log('productsFromFirestore:', productsWithPricing);

		// 獲取電影數據
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
	} catch (error) {
		console.error('Error fetching data:', error);
		return {
			props: {
				netflixOriginals: [],
				trendingNow: [],
				topRated: [],
				actionMovies: [],
				comedyMovies: [],
				horrorMovies: [],
				romanceMovies: [],
				documentaries: [],
				products: [],
			},
		};
	}
};
