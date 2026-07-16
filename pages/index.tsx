import { Product } from '@invertase/firestore-stripe-payments';
import { collection, getDocs } from 'firebase/firestore';
import Head from 'next/head';
import Banner from '@/components/Banner';
import Footer from '@/components/Footer';
import Header from '@/components/Header';
import Loader from '@/components/Loader';
import Modal from '@/components/Modal';
import Plans from '@/components/Plans';
import Row from '@/components/Row';
import useAuth from '@/hooks/useAuth';
import useList from '@/hooks/useList';
import useSubscription from '@/hooks/useSubscription';
import { db } from '@/firebase';
import { Movie } from '@/typings';
import requests, { tmdbFetch, TmdbResponse } from '@/utils/request';

interface Props {
	streamOriginals: Movie[];
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
	streamOriginals,
	actionMovies,
	comedyMovies,
	documentaries,
	horrorMovies,
	romanceMovies,
	topRated,
	trendingNow,
	products,
}: Props) => {
	const { loading: authLoading, user } = useAuth();
	const {
		subscription,
		loading: subscriptionLoading,
		error: subscriptionError,
	} = useSubscription(user);
	const list = useList(user?.uid);

	if (authLoading || subscriptionLoading) {
		return (
			<div className='flex h-screen items-center justify-center bg-black'>
				<Loader color='fill-white' />
			</div>
		);
	}

	if (!user) {
		return null;
	}

	if (subscriptionError) {
		return (
			<div className='flex h-screen items-center justify-center bg-black'>
				<div className='text-center text-white'>
					<p className='mb-4 text-red-500'>{subscriptionError}</p>
					<button
						onClick={() => window.location.reload()}
						className='rounded bg-[#e50914] px-4 py-2'
					>
						重新載入
					</button>
				</div>
			</div>
		);
	}

	if (!subscription) return <Plans products={products} />;

	return (
		<div className='relative rounded bg-[linear-gradient(to_bottom,rgba(20,20,20,0)_0%,rgba(20,20,20,0.15)_15%,rgba(20,20,20,0.35)_29%,rgba(20,20,20,0.58)_44%,#141414_58%,#141414_100%)] lg:h-[160vh]'>
			<Head>
				<title>Home - Stream</title>
			</Head>

			<Header />
			<main className='relative space-y-24 pb-24 pl-4 lg:pl-16'>
				<Banner streamOriginals={streamOriginals} />

				<section className='md:space-y-10'>
					<Row
						title='Trending Now'
						movies={trendingNow}
						orientation='poster'
						isPriorityRow={true}
					/>
					<Row title='Comedies' movies={comedyMovies} orientation='poster' />
					{/* My List */}
					{list.length > 0 && <Row title='My List' movies={list} orientation='poster' />}
					<Row title='Top Rated' movies={topRated} orientation='poster' />
					<Row title='Action Thrillers' movies={actionMovies} orientation='poster' />
					<Row title='Romance Movies' movies={romanceMovies} orientation='poster' />
					<Row title='Documentaries' movies={documentaries} orientation='poster' />
					<Row title='Scary Movies' movies={horrorMovies} orientation='poster' />
				</section>
			</main>

			<Modal />
			<Footer />
		</div>
	);
};

export default Home;

export const getStaticProps = async () => {
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

		if (process.env.NODE_ENV !== 'production') {
			console.log('productsFromFirestore:', productsWithPricing);
		}

		// 獲取電影數據
		const [
			streamOriginalsRes,
			trendingNowRes,
			topRatedRes,
			actionMoviesRes,
			comedyMoviesRes,
			horrorMoviesRes,
			romanceMoviesRes,
			documentariesRes,
		] = await Promise.all([
			tmdbFetch<TmdbResponse<Movie>>(requests.fetchstreamOriginals, {
				params: { language: 'en-US' },
			}),
			tmdbFetch<TmdbResponse<Movie>>(requests.fetchTrending, { params: { language: 'en-US' } }),
			tmdbFetch<TmdbResponse<Movie>>(requests.fetchTopRated, { params: { language: 'en-US' } }),
			tmdbFetch<TmdbResponse<Movie>>(requests.fetchActionMovies, { params: { language: 'en-US' } }),
			tmdbFetch<TmdbResponse<Movie>>(requests.fetchComedyMovies, { params: { language: 'en-US' } }),
			tmdbFetch<TmdbResponse<Movie>>(requests.fetchHorrorMovies, { params: { language: 'en-US' } }),
			tmdbFetch<TmdbResponse<Movie>>(requests.fetchRomanceMovies, {
				params: { language: 'en-US' },
			}),
			tmdbFetch<TmdbResponse<Movie>>(requests.fetchDocumentaries, {
				params: { language: 'en-US' },
			}),
		]);

		return {
			props: {
				streamOriginals: streamOriginalsRes?.results ?? [],
				trendingNow: trendingNowRes?.results ?? [],
				topRated: topRatedRes?.results ?? [],
				actionMovies: actionMoviesRes?.results ?? [],
				comedyMovies: comedyMoviesRes?.results ?? [],
				horrorMovies: horrorMoviesRes?.results ?? [],
				romanceMovies: romanceMoviesRes?.results ?? [],
				documentaries: documentariesRes?.results ?? [],
				products: productsWithPricing,
			},
			revalidate: 3600,
		};
	} catch (error) {
		console.error('Error fetching data:', error);
		return {
			props: {
				streamOriginals: [],
				trendingNow: [],
				topRated: [],
				actionMovies: [],
				comedyMovies: [],
				horrorMovies: [],
				romanceMovies: [],
				documentaries: [],
				products: [],
			},
			revalidate: 60, // Retry after 60 seconds on error
		};
	}
};
