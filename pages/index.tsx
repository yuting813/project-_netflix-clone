import { NextPage } from 'next';
import Head from 'next/head';
import Image from 'next/image';
import Header from '@/components/Header';
import Banner from '@/components/Banner';
import requests from '@/utils/request';
import { Movie } from '@/typings';
import Row from '@/components/Row';
import useAuth from '@/hooks/useAuth';
import { useState } from 'react';
import Modal from '@/components/Modal';
import { useRecoilValue } from 'recoil';
import { modalState } from '@/atoms/modalAtom';

interface Props {
	netflixOriginals: Movie[];
	trendingNow: Movie[];
	topRated: Movie[];
	actionMovies: Movie[];
	comedyMovies: Movie[];
	horrorMovies: Movie[];
	romanceMovies: Movie[];
	documentaries: Movie[];
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
}: Props) => {
	// console.log(123,netflixOriginals);
	const { loading } = useAuth();
	const showModal = useRecoilValue(modalState);
	// const [showModal, setShowModal] = useState(false);

	// if (loading) return 'Loading';
	if (loading) return null;

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

			{/* Modal */}
			{showModal && <Modal />}
		</div>
	);
};

export default Home;

export const getServerSideProps = async () => {
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
		},
	};
};
