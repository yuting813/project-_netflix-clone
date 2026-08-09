import Image from 'next/image';
import { useRecoilState } from 'recoil';
import React, { useEffect, useState } from 'react';
import { FaPlay } from 'react-icons/fa';
import { useIsMobile } from '@/hooks/useIsMobile';
import { modalState, movieState } from '@/atoms/modalAtom';
import { baseUrl } from '@/constants/movie';
import { Movie } from '@/typings';

interface Props {
	streamOriginals: Movie[];
}

function Banner({ streamOriginals }: Props) {
	const [movie, setMovie] = useState<Movie | null>(null);
	// We only need the setters here; discard the first tuple item to avoid unused var lint
	const [, setShowModal] = useRecoilState(modalState);
	const [, setCurrentMovie] = useRecoilState(movieState);
	const [isLoading, setIsLoading] = useState(true);
	const [imageError, setImageError] = useState(false);
	const isMobile = useIsMobile();

	useEffect(() => {
		setMovie(streamOriginals[Math.floor(Math.random() * streamOriginals.length)]);
	}, [streamOriginals]);

	const imagePath = isMobile
		? movie?.poster_path || movie?.backdrop_path
		: movie?.backdrop_path || movie?.poster_path;

	return movie == null ? null : (
		<div className='flex flex-col justify-end space-y-4 pt-[30vh] md:pt-[40vh] lg:h-[65vh] lg:pt-0'>
			<div className='absolute left-0 top-0 -z-10 h-[95vh] w-[98.5vw]'>
				<Image
					src={imageError || !imagePath ? '/fallback-image.webp' : `${baseUrl}${imagePath}`}
					alt={movie?.title || movie?.name || 'Movie banner'}
					style={{ objectFit: 'cover' }}
					className={`transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
					fill={true}
					sizes='100vw'
					priority={true}
					onError={() => setImageError(true)}
					onLoad={() => setIsLoading(false)}
				/>
			</div>

			<h1 className='max-w-[70%] text-2xl font-bold leading-tight md:max-w-[60%] md:text-4xl lg:max-w-[50%] lg:text-7xl'>
				{movie?.title || movie?.name || movie?.original_name}
			</h1>

			<p className='line-clamp-3 max-w-xs text-xs drop-shadow-md md:max-w-lg md:text-lg lg:max-w-2xl lg:text-2xl'>
				{movie?.overview}
			</p>

			<div className='mt-4 flex space-x-3'>
				{/* Play 按鈕 */}
				<button
					className='flex items-center gap-x-2 rounded bg-white px-5 py-2 text-sm font-bold text-black transition hover:scale-[1.03] hover:bg-[#e6e6e6] active:scale-[0.97] md:px-8 md:py-2.5 md:text-lg'
					onClick={() => {
						setCurrentMovie(movie);
						setShowModal(true);
					}}
				>
					<FaPlay className='h-4 w-4 text-black md:h-7 md:w-7' />
					Play
				</button>

				{/*  More Info 按鈕 */}
				<button
					className='flex items-center gap-x-2 rounded bg-[gray]/70 px-5 py-2 text-sm font-semibold text-white transition hover:scale-[1.03] hover:bg-[gray]/50 active:scale-[0.97] md:px-8 md:py-2.5 md:text-lg'
					onClick={() => {
						setCurrentMovie(movie);
						setShowModal(true);
					}}
				>
					<svg
						viewBox='0 0 24 24'
						width='24'
						height='24'
						fill='none'
						xmlns='http://www.w3.org/2000/svg'
						className='inline-block translate-y-[1px] md:h-7 md:w-7'
					>
						<path
							fill='currentColor'
							fillRule='evenodd'
							clipRule='evenodd'
							d='M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20M0 12a12 12 0 1 1 24 0 12 12 0 0 1-24 0m13-2v8h-2v-8zm-1-1.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3'
						/>
					</svg>
					More Info
				</button>
			</div>
		</div>
	);
}

export default Banner;
