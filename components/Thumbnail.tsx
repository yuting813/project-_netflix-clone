import { DocumentData } from 'firebase/firestore';
import Image from 'next/image';
import { useSetRecoilState } from 'recoil';
import { useState } from 'react';
import { modalState, movieState } from '@/atoms/modalAtom';
import { Movie } from '@/typings';

interface Props {
	movie: Movie | DocumentData;
	orientation?: 'backdrop' | 'poster';
	// when true, make poster thumbnails taller on large screens (used by search page)
	tallOnLarge?: boolean;
	priority?: boolean;
	/** when true, fills the grid cell using aspect-ratio instead of fixed height */
	fluid?: boolean;
}

function Thumbnail({
	movie,
	orientation = 'backdrop',
	tallOnLarge = false,
	priority = false,
	fluid = false,
}: Props) {
	// We only need to set the state, not read it.
	// using useSetRecoilState prevents all Thumbnails from re-rendering when the state changes!
	const setShowModal = useSetRecoilState(modalState);
	const setCurrentMovie = useSetRecoilState(movieState);
	const [imageError, setImageError] = useState(false);
	const [isLoaded, setIsLoaded] = useState(false);
	// choose poster for portrait, otherwise backdrop
	const imagePath =
		orientation === 'poster'
			? movie.poster_path || movie.backdrop_path
			: movie.backdrop_path || movie.poster_path;
	const containerClass =
		orientation === 'poster'
			? fluid
				? 'relative w-full aspect-[2/3] cursor-pointer transition-transform duration-200 ease-out hover:scale-105 rounded-xl overflow-hidden'
				: `relative h-64 min-w-[150px] cursor-pointer transition-transform duration-200 ease-out md:h-80 md:min-w-[220px] ${
						tallOnLarge ? 'md:h-[28rem] md:min-w-[220px]' : ''
					} md:hover:scale-105 rounded-xl overflow-hidden`
			: 'relative h-28 min-w-[180px] cursor-pointer transition-transform duration-200 ease-out md:h-36 md:min-w-[260px] md:hover:scale-105 rounded-lg overflow-hidden';
	return (
		<button
			type='button'
			className={containerClass}
			aria-haspopup='dialog'
			aria-label={'Open details for ' + (movie.title || movie.name || 'this title')}
			onClick={() => {
				if (process.env.NODE_ENV !== 'production') {
					console.log('Thumbnail clicked', {
						id: movie.id,
						media_type: (movie as Movie).media_type,
					});
				}
				setCurrentMovie(movie);
				setShowModal(true);
			}}
		>
			{/* Skeleton while image loads */}
			{!isLoaded && !imageError && (
				<div className='absolute inset-0 animate-pulse bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700' />
			)}
			<Image
				src={
					imageError || !imagePath
						? '/fallback-image.webp'
						: `https://image.tmdb.org/t/p/w500${imagePath}`
				}
				alt={movie.title || movie.name || 'Movie poster'}
				className={`rounded-sm object-cover transition-opacity duration-300 md:rounded ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
				fill={true}
				priority={priority}
				sizes={
					orientation === 'poster'
						? '(max-width: 768px) 40vw, (max-width: 1200px) 20vw, 12vw'
						: '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
				}
				onLoad={() => setIsLoaded(true)}
				onError={() => {
					console.error(`Failed to load image for movie: ${movie.title || movie.name}`, imagePath);
					setImageError(true);
					setIsLoaded(true);
				}}
			/>
			{/* Error overlay */}
			{imageError && (
				<div className='absolute inset-0 flex items-center justify-center bg-black/60 p-2 text-center'>
					<span className='text-sm text-gray-300'>Image unavailable</span>
				</div>
			)}
		</button>
	);
}

export default Thumbnail;
