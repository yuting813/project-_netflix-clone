import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Footer from '@/components/Footer';
import Header from '@/components/Header';
import Modal from '@/components/Modal';
import Thumbnail from '@/components/Thumbnail';
import { Movie } from '@/typings';
import { tmdbFetch, TmdbResponse } from '@/utils/request';

export default function SearchPage() {
	const router = useRouter();
	const { q } = router.query;
	const [results, setResults] = useState<Movie[]>([]);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		const query = typeof q === 'string' ? q : '';
		if (!query) return;
		const fetchResults = async () => {
			setLoading(true);
			try {
				const res = await tmdbFetch<TmdbResponse<Movie>>('/search/multi', {
					params: {
						language: 'en-US',
						query,
					},
				});

				// Ensure each result has a media_type so the Modal's fetch logic can determine the correct endpoint
				const normalized = (res.results || []).map((item) => ({
					...item,
					media_type: item.media_type || (item.first_air_date || item.name ? 'tv' : 'movie'),
				}));
				setResults(normalized);
			} catch (err) {
				console.error('Search error', err);
				setResults([]);
			} finally {
				setLoading(false);
			}
		};
		fetchResults();
	}, [q]);

	return (
		<div className='flex min-h-screen flex-col'>
			<Head>
				<title>Search - Stream</title>
			</Head>
			<Header />
			<main className='flex-grow px-4 pt-24'>
				<h1 className='mb-4 text-2xl font-semibold'>Search results for `{q}`</h1>
				{loading && <p>Loading...</p>}
				{!loading && results.length === 0 && <p>No results found.</p>}
				<div className='grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6'>
					{results.map((r) => (
						<Thumbnail key={r.id} movie={r} orientation='poster' fluid />
					))}
				</div>
				{/* Mount the Modal so it can react to Recoil state set by Thumbnail clicks */}
				<Modal />
			</main>

			<div className='bottom-0 w-full'>
				<Footer />
			</div>
		</div>
	);
}
