import { CheckIcon, PlusIcon, ThumbUpIcon, VolumeOffIcon, XIcon } from '@heroicons/react/outline';
import { VolumeUpIcon } from '@heroicons/react/solid';
import MuiModal from '@mui/material/Modal';
import { deleteDoc, doc, serverTimestamp, setDoc } from 'firebase/firestore';
import Image from 'next/image';
import { useRecoilState } from 'recoil';
import { useCallback, useEffect, useRef, useState } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { FaPause, FaPlay } from 'react-icons/fa';
import ReactPlayer from 'react-player/lazy';
import { modalState, movieState } from '../atoms/modalAtom';
import { db } from '../firebase';
import useAuth from '../hooks/useAuth';
import useList from '../hooks/useList';
import { Element, Genre } from '../typings';
import { tmdbFetch } from '../utils/request';

// Moved toastStyle outside to avoid dependency issues
const toastStyle = {
	background: 'white',
	color: 'black',
	fontWeight: 'bold',
	fontSize: '16px',
	padding: '15px',
	borderRadius: '9999px',
	maxWidth: '1000px',
};

function Modal() {
	const [showModal, setShowModal] = useRecoilState(modalState);
	const [movie] = useRecoilState(movieState);

	const modalRef = useRef<HTMLDivElement | null>(null);

	const [trailer, setTrailer] = useState('');
	const [trailerLoading, setTrailerLoading] = useState(true);
	const [genres, setGenres] = useState<Genre[]>([]);
	const [muted, setMuted] = useState(true);
	const [addedToList, setAddedToList] = useState(false);
	const [playing, setPlaying] = useState(true);
	const [liked, setLiked] = useState(false);

	const { user } = useAuth();
	const list = useList(user?.uid);

	const [posterLoaded, setPosterLoaded] = useState(false);
	const [posterError, setPosterError] = useState(false);

	const posterPath = movie?.backdrop_path || movie?.poster_path;
	const hasTrailer = Boolean(trailer);

	const heroImageSrc =
		posterError || !posterPath
			? '/fallback-image.webp'
			: `https://image.tmdb.org/t/p/w780${posterPath}`;

	/* ===========================================================
	   Fetch Trailer + Lifecycle Safe
	   =========================================================== */
	useEffect(() => {
		if (!movie) return;

		const currentMovie = movie;

		let active = true;
		setTrailer('');
		setTrailerLoading(true);
		setPlaying(true);

		async function fetchMovie() {
			const data = await tmdbFetch<{
				videos: { results: Element[] };
				genres: Genre[];
			}>( // 定義 API 回傳結構，避免使用 any
				`/${currentMovie.media_type === 'tv' ? 'tv' : 'movie'}/${currentMovie.id}`,
				{
					params: {
						language: 'en-US',
						append_to_response: 'videos',
					},
				},
			).catch(() => null);

			if (!active) return;

			let key = '';
			const list = data?.videos?.results || [];
			const index = list.findIndex((el: Element) => el.type === 'Trailer');
			if (index !== -1) key = list[index].key;

			setTrailer(key);
			setGenres(data?.genres || []);
			setPlaying(Boolean(key));
			setTrailerLoading(false);
		}

		fetchMovie();
		return () => {
			active = false;
		};
	}, [movie]);

	useEffect(
		() => setAddedToList(list.findIndex((result) => result.id === movie?.id) !== -1),
		[list, movie],
	);

	useEffect(() => {
		setPosterLoaded(false);
		setPosterError(false);
	}, [movie]);

	/* ===========================================================
	   Add / Remove List
	   =========================================================== */
	const handleList = async () => {
		if (!user) {
			toast('Please sign in to add movies to your list', { duration: 8000, style: toastStyle });
			return;
		}

		if (!movie) {
			toast('Unable to add movie, please try again later', { duration: 8000, style: toastStyle });
			return;
		}

		if (addedToList) {
			await deleteDoc(doc(db, 'customers', user.uid, 'myList', movie.id.toString()));
			toast(`${movie?.title || movie?.original_name} has been removed from My List`, {
				duration: 8000,
				style: toastStyle,
			});
		} else {
			await setDoc(doc(db, 'customers', user.uid, 'myList', movie.id.toString()), {
				...movie,
				addedAt: serverTimestamp(),
			});
			toast(`${movie?.title || movie?.original_name} has been added to My List`, {
				duration: 8000,
				style: toastStyle,
			});
		}
	};

	/* ===========================================================
	   Play Button
	   =========================================================== */
	const handlePlayClick = useCallback(() => {
		if (trailerLoading) {
			toast('Loading trailer...', { duration: 1500, style: toastStyle });
			return;
		}
		if (!trailer) {
			toast('Trailer not available', { duration: 2000, style: toastStyle });
			return;
		}

		setPlaying((prev) => {
			const next = !prev;
			if (next) {
				// removed isPlayingBtn logic
			}
			return next;
		});

		requestAnimationFrame(() => {
			modalRef.current?.focus();
		});
	}, [trailerLoading, trailer]);

	const handleThumbUpClick = () => {
		setLiked((prev) => {
			const next = !prev;
			toast(next ? 'Added to your likes' : 'Removed like', { duration: 2000, style: toastStyle });
			return next;
		});
	};

	/* ===========================================================
	   Accessibility: Focus Trap + ESC
	   =========================================================== */
	const handleClose = useCallback(() => {
		setShowModal(false);
	}, [setShowModal]);

	/* ===========================================================
	   Badge Component (stream 透明邊框)
	   =========================================================== */
	const Badge = ({ children }: { children: React.ReactNode }) => (
		<div className='mb-3 flex items-center gap-2 rounded-full border border-white/20 bg-black/20 px-3 py-1 text-[11px] uppercase tracking-[0.3em] text-amber-200 backdrop-blur-sm'>
			{children}
		</div>
	);

	/* ===========================================================
	   Render
	   =========================================================== */
	return (
		<MuiModal
			open={showModal}
			aria-labelledby='movie-modal-title'
			onClose={handleClose}
			className='fixed !top-7 left-0 right-0 z-50 mx-auto w-full max-w-5xl overflow-hidden overflow-y-scroll rounded-md scrollbar-hide'
		>
			<div
				ref={modalRef}
				tabIndex={-1}
				className='relative overflow-hidden rounded-xl bg-[#181818] outline-none'
			>
				<h2 id='movie-modal-title' className='sr-only'>
					{movie?.title || movie?.name || 'Title details'}
				</h2>
				<Toaster position='bottom-center' />

				{/* Close Button */}
				<button
					onClick={handleClose}
					aria-label='Close modal'
					className='modalButton absolute right-5 top-5 !z-40 h-9 w-9 border-none bg-[#181818]'
				>
					<XIcon className='h-6 w-6' />
				</button>

				{/* Trailer / Loading / Fallback */}
				<div className='relative bg-[#181818] pt-[54.25%]'>
					{/* Trailer Available */}
					{hasTrailer ? (
						<div className='absolute left-0 top-0 z-0 h-full w-full'>
							<ReactPlayer
								url={`https://www.youtube.com/watch?v=${trailer}`}
								width='100%'
								height='100%'
								style={{ position: 'absolute', top: 0, left: 0 }}
								playing={playing}
								muted={muted}
								onPlay={() => {
									setPlaying(true);
								}}
								onPause={() => setPlaying(false)}
								onEnded={() => setPlaying(false)}
							/>
							{/* Transparent overlay to prevent iframe focus stealing */}
							<div className='absolute inset-0 z-10 cursor-pointer' onClick={handlePlayClick} />
						</div>
					) : /* Loading State */
					trailerLoading ? (
						<div className='absolute inset-0 flex animate-pulse flex-col items-center justify-center rounded-t-md bg-gray-700/40 backdrop-blur-sm'>
							<Badge>Loading trailer...</Badge>
						</div>
					) : (
						/* Fallback State */
						<div className='absolute inset-0 overflow-hidden rounded-t-md'>
							{/* Skeleton */}
							{!posterLoaded && !posterError && (
								<div className='absolute inset-0 animate-pulse bg-gray-700' />
							)}

							<Image
								src={heroImageSrc}
								alt='Fallback artwork'
								fill
								className={`object-cover transition-opacity duration-500 ${
									posterLoaded ? 'opacity-100' : 'opacity-0'
								}`}
								onLoadingComplete={() => setPosterLoaded(true)}
								onError={() => {
									setPosterError(true);
									setPosterLoaded(true);
								}}
							/>

							<div className='absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent' />

							<div className='absolute inset-0 z-10 flex flex-col items-center justify-center px-6 text-center'>
								<Badge>Trailer Unavailable</Badge>
								<p className='max-w-xl text-sm text-gray-200'>
									{
										"We couldn't find a trailer for this title. You can still add it to My List and watch later."
									}
								</p>
							</div>
						</div>
					)}

					{/* Controls Row */}
					<div className='absolute bottom-2 z-20 flex w-full items-center px-4 sm:bottom-4 sm:px-10'>
						{/* Play / Add / Like */}
						<div className='flex items-center space-x-3'>
							{/* Play */}
							<button
								onClick={handlePlayClick}
								disabled={!hasTrailer || trailerLoading}
								className={
									'flex items-center gap-x-2 rounded px-8 py-2 text-xl font-bold transition disabled:opacity-60 ' +
									(!hasTrailer || trailerLoading
										? 'bg-white/20 text-white'
										: playing
											? 'bg-green-600 text-white'
											: 'bg-white text-black')
								}
							>
								{playing ? <FaPause className='h-7 w-7' /> : <FaPlay className='h-7 w-7' />}
								<span>{playing ? 'Pause' : 'Play'}</span>
							</button>

							{/* Add */}
							<button
								className='modalButton'
								onClick={handleList}
								aria-label={addedToList ? 'Remove from My List' : 'Add to My List'}
							>
								{addedToList ? <CheckIcon className='h-7 w-7' /> : <PlusIcon className='h-7 w-7' />}
							</button>

							{/* Like */}
							<button
								onClick={handleThumbUpClick}
								aria-label={liked ? 'Remove like' : 'Like'}
								className={`modalButton ${liked ? 'scale-110 text-blue-400' : ''}`}
							>
								<ThumbUpIcon className='h-7 w-7' />
							</button>
						</div>

						{/* Mute — positioned to the left of YouTube's native 更多影片 control */}
						<button
							className='modalButton ml-auto mr-[-30px]'
							onClick={() => setMuted(!muted)}
							aria-label={muted ? 'Unmute' : 'Mute'}
						>
							{muted ? <VolumeOffIcon className='h-6 w-6' /> : <VolumeUpIcon className='h-6 w-6' />}
						</button>
					</div>
				</div>
				{/* Movie Info */}
				<div className='flex space-x-16 rounded-b-md bg-[#181818] px-10 py-8'>
					<div className='space-y-6 text-lg'>
						<div className='flex items-center space-x-2 text-sm'>
							<p className='font-semibold text-green-400'>
								{movie?.vote_average ? `${(movie.vote_average * 10).toFixed(0)}%` : ''} Match
							</p>
							<p className='font-light'>{movie?.release_date || movie?.first_air_date}</p>
							<div className='flex h-4 items-center justify-center rounded border border-white/40 px-1.5 text-xs'>
								HD
							</div>
						</div>

						<div className='flex flex-col gap-x-10 gap-y-4 font-light md:flex-row'>
							<p className='w-5/6'>{movie?.overview}</p>

							<div className='flex flex-col space-y-3 text-sm'>
								<div>
									<span className='text-[gray]'>Genres: </span>
									{genres.map((g) => g.name).join(', ')}
								</div>
								<div>
									<span className='text-[gray]'>Original language: </span>
									{movie?.original_language}
								</div>
								<div>
									<span className='text-[gray]'>Total votes: </span>
									{movie?.vote_count}
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</MuiModal>
	);
}

export default Modal;
