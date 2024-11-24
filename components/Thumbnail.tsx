/* eslint-disable prettier/prettier */
import { Movie } from '@/typings';
import Image from 'next/image';

interface Props {
	//When using firebase
	//movie: Movie || DocumentData
	movie: Movie;
}

function Thumbnail({ movie }: Props) {
	return (
		<div
			className={
				'relative h-28 min-w-[180px] cursor-pointer transition duration-200 ease-out md:h-36 md:min-w-[260px] md:hover:scale-105'
			}
		>
			<Image
				src={`https://image.tmdb.org/t/p/w500${movie.backdrop_path || movie.poster_path}`}
				className='rounded-sm object-cover md:rounded'
				fill={true}
				alt=''
				sizes='(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
			/>
		</div>
	);
}

export default Thumbnail;
