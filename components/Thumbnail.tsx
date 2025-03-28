import { DocumentData } from 'firebase/firestore';
import Image from 'next/image';
import { useRecoilState } from 'recoil';
import { useState } from 'react';
import { modalState, movieState } from '@/atoms/modalAtom';
import { Movie } from '@/typings';

interface Props {
	movie: Movie | DocumentData;
}

function Thumbnail({ movie }: Props) {
	const [showModal, setShowModal] = useRecoilState(modalState);
	const [currentMovie, setCurrentMovie] = useRecoilState(movieState);
	const [imageError, setImageError] = useState(false);
	const imagePath = movie.poster_path || movie.backdrop_path;
	return (
		<div
			className={
				'relative h-28 min-w-[180px] cursor-pointer transition duration-200 ease-out md:h-36 md:min-w-[260px] md:hover:scale-105'
			}
			onClick={() => {
				setCurrentMovie(movie);
				setShowModal(true);
			}}
		>
			<Image
				src={
					imageError || !imagePath
						? '/fallback-image.webp'
						: `https://image.tmdb.org/t/p/w500${imagePath}`
				}
				alt={movie.title || movie.name || 'Movie poster'}
				className='rounded-sm object-cover md:rounded'
				fill={true}
				sizes='(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
				onError={() => {
					console.error(
						'Failed to load image for movie: ${ movie.title || movie.name }',
						imagePath,
					);
					setImageError(true);
				}}
			/>
		</div>
	);
}

export default Thumbnail;
