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
	const [isLoading, setIsLoading] = useState(true);
	const [imageError, setImageError] = useState(false);

	useEffect(() => {
		setMovie(netflixOriginals[Math.floor(Math.random() * netflixOriginals.length)]);
	}, [netflixOriginals]);

	const imagePath = movie?.poster_path || movie?.backdrop_path;

	return movie == null ? null : (
		<div className=' flex flex-col space-y-2 py-16 md:space-y-4 lg:h-[65vh] lg:justify-end lg:pb-12'>
			<div className='absolute top-0 left-0  h-[95vh] w-[98.5vw] -z-10'>
				<Image
					src={imageError || !imagePath ? '/fallback-image.webp' : `${baseUrl}${imagePath}`}
					alt={movie?.title || movie?.name || 'Movie banner'}
					style={{ objectFit: 'cover' }}
					className={`transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
					fill={true}
					sizes='100vw'
					priority={true}
					onError={() => setImageError(true)}
					onLoadingComplete={() => setIsLoading(false)}
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
