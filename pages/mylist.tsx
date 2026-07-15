import Head from 'next/head';
import Footer from '@/components/Footer';
import Header from '@/components/Header';
import Modal from '@/components/Modal';
import Thumbnail from '@/components/Thumbnail';
import useAuth from '@/hooks/useAuth';
import useList from '@/hooks/useList';

export default function MyListPage() {
	const { user, loading } = useAuth();
	const list = useList(user?.uid);

	if (loading || !user) return null;

	return (
		<div className='flex min-h-screen flex-col'>
			<Head>
				<title>My List</title>
			</Head>
			<Header />
			<main className='flex-grow px-6 pb-10 pt-24'>
				<p className='mb-6 text-2xl font-bold'>My List</p>
				{list.length === 0 ? (
					<p className='text-gray-400'>
						Your list is empty. Add movies to your list to see them here.
					</p>
				) : (
					<div className='grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7'>
						{list.map((movie, index) => (
							<Thumbnail
								key={movie.id}
								movie={movie}
								orientation='poster'
								priority={index < 7}
								fluid={true}
							/>
						))}
					</div>
				)}
			</main>
			<Modal />
			<Footer />
		</div>
	);
}
