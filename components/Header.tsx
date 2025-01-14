/* eslint-disable @next/next/no-img-element */
import useAuth from '@/hooks/useAuth';
import { BellIcon, SearchIcon } from '@heroicons/react/solid';
import Link from 'next/link';
import { useEffect, useState } from 'react';

function Header() {
	const [isScrolled, setIsScrolled] = useState(false);
	const { logout } = useAuth();

	useEffect(() => {
		const handleScroll = () => {
			if (window.scrollY > 0) {
				setIsScrolled(true);
			} else {
				setIsScrolled(false);
			}
		};
		window.addEventListener('scroll', handleScroll);
		return () => {
			window.removeEventListener('scroll', handleScroll);
		};
	}, []);

	return (
		<header className={`${isScrolled && 'bg-[#141414]'}`}>
			<div className='flex items-center space-x-2 md:space-x-6'>
				<img
					// src='https://rb.gy/ulxxee'
					src='./logo.svg'
					width={40}
					height={40}
					className='cursor-pointer object-contain'
					alt=''
				/>

				<ul className='hidden space-x-4 md:flex'>
					<link rel='icon' href='/favicon.ico' />
					<li className='headerLink'>Home </li>
					<li className='headerLink'>TV Shows</li>
					<li className='headerLink'>Movies</li>
					<li className='headerLink'>New & Popular</li>
					<li className='headerLink'>My List</li>
				</ul>
			</div>
			<div className='flex items-center space-x-4 text-sm font-light'>
				<SearchIcon className='hidden h-6 w-6 sm:inline' />
				<p className='hidden lg:inline'>Kids</p>
				<BellIcon className=' h-6 w-6' />
				<Link href='/account'>
					<img
						src='https://rb.gy/g1pwyx'
						alt=''
						className='cursor-pointer rounded'
						onClick={logout}
					/>
				</Link>
			</div>
		</header>
	);
}

export default Header;
