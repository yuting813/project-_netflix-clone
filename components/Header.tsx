/* eslint-disable @next/next/no-img-element */
import { BellIcon, SearchIcon } from '@heroicons/react/solid';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import useAuth from '@/hooks/useAuth';
import BasicMenu from './BasicMenu';

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
				<Image
					src='/logo.svg'
					width={40}
					height={40}
					className='cursor-pointer object-contain'
					alt='logo'
				/>

				<BasicMenu />

				<ul className='hidden space-x-4 md:flex'>
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
				<img
					src='https://rb.gy/g1pwyx'
					alt='logout'
					className='cursor-pointer rounded'
					onClick={logout}
				/>
			</div>
		</header>
	);
}

export default Header;
