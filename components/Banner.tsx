/* eslint-disable @next/next/no-img-element */
import { FaPlay } from 'react-icons/fa';
import { baseUrl } from '@/constants/movie';
import { Movie } from '@/typings';
import autoprefixer from 'autoprefixer';
import Image from 'next/image';
import React, { useEffect, useState } from 'react';
import { InformationCircleIcon } from '@heroicons/react/outline';
import { useRecoilState } from 'recoil';
import { modalState, movieState } from '@/atoms/modalAtom';

interface Props {
	netflixOriginals: Movie[];
}

function Banner({ netflixOriginals }: Props) {
	const [movie, setMovie] = useState<Movie | null>(null);
	const [showModal, setShowModal] = useRecoilState(modalState);
	const [currentMovie, setCurrentMovie] = useRecoilState(movieState);

	useEffect(() => {
		setMovie(netflixOriginals[Math.floor(Math.random() * netflixOriginals.length)]);
	}, [netflixOriginals]);

	return movie == null ? null : (
		<div className='flex flex-col space-y-2 py-16 md:space-y-4 lg:h-[65vh] lg:justify-end lg:pb-12'>
			<div className='absolute top-0 left-0  h-[95vh] w-screen -z-10'>
				<Image
					src={`${baseUrl}${movie?.backdrop_path || movie?.poster_path}`}
					alt='image'
					style={{ objectFit: 'cover' }}
					fill={true}
					priority={true}
					sizes='(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
				/>
			</div>
			<h1 className='text-2xl md:text-3xl lg:text-7xl'>
				{movie?.title || movie?.name || movie?.original_name}
			</h1>
			<p className='max-w-xs text-xs text-shadow-md md:max-w-lg md:text-lg lg:max-w-2xl lg:text-2xl  '>
				{movie?.overview}
			</p>
			<div className='flex space-x-3 '>
				<button className='bannerButton bg-white text-black '>
					<FaPlay className='h-4 w-4 text-black md:h-7 md:w-7' />
					Play{' '}
				</button>
				<button
					className='bannerButton bg-[gray]/70'
					onClick={() => {
						setCurrentMovie(movie);
						setShowModal(true);
					}}
				>
					More Info <InformationCircleIcon className='h-5 w-5 md:h-8 md:w-8' />
				</button>
			</div>
		</div>
	);
}

export default Banner;

{
	/* <Image
      src="/don.jpg"
      fill={true}
      alt="Picture of the author"
      priority={true}
    /> */
}
{
	/* <Image
					src={`${baseUrl}${movie?.backdrop_path || movie?.poster_path}`}
					width={500}
					height={500}
					style={{ objectFit: 'cover' }}
					alt='Picture of the author'
				/> */
}

{
	/* {movie?.backdrop_path && movie?.poster_path && (
					<Image
						src={`${baseUrl}${movie.backdrop_path || movie.poster_path}`}
						alt='image'
						style={{ objectFit: 'cover' }}
						fill={true}
						priority={true}
					/>
					)} */
}
