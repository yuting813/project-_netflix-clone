import { Movie } from '@/typings';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/outline';
import Thumbnail from './Thumbnail';

interface props {
	title: string;
	//When using firebase
	//movie: Movie || DocumentData
	movies: Movie[];
}

function Row({ title, movies }: props) {
	return (
		<div className='h-40 space-y-0.5 md:space-y-2  '>
			<h2>{title}</h2>
			<div className='group  relative md:-ml-2'>
				<ChevronLeftIcon
					className='absolute top-0 bottom-0 left-2  m-auto h-9 w-9
         						cursor-pointer opacity-0 transition hover:scale-125 group-hover:opacity-100 '
				/>  
				<div className='flex scrollbar-hide items-center space-x-0.5  overflow-x-scroll md:space-x-2.5 md:p-2 '>
					{movies.map((movie) => (
						<Thumbnail key={movie.id} movie={movie} />
					))}
				</div>
				<ChevronRightIcon
					className='absolute top-0 bottom-0 left-2  m-auto h-9 w-9 
        					cursor-pointer opacity-0 transition hover:scale-125 group-hover:opacity-100'
				/>
			</div>
		</div>
	);
}

export default Row;
