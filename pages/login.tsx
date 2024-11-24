/* eslint-disable @next/next/no-img-element */
import Head from 'next/head';
import React from 'react';
import Image from 'next/image';

function Login() {
	return (
		<div className='relative flex h-screen w-screen flex-col bg-black md:items-center md:justify-center md:bg-transparent'>
			<Head>
				<title>Netflixx</title>
				<link rel='icon' href='/favicon.ico' />
			</Head>
			<Image
				// src='https://rb.gy/p2hphi'
				src='/nf.svg'
				className='-z-10 !hidden opacity-60 sm:!inline'
				alt='image'
				style={{ objectFit: 'cover' }}
				fill={true}
				priority={true}
				sizes='(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
			/>
			<img
				// src='https://rb.gy/ulxxee'
				src='./logo.svg'
				width={70}
				height={70}
				className='absolute left-4 top-4  cursor-pointer object-contain md:left-10 md:top-6 '
				alt=''
				sizes='(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
			/>

			<form className='relative mt-24 space-y-8 py-10 px-6 rounded bg-black/75 md:mt-0 md:max-w-md md:px-14'>
				<h1 className='text-4xl font-semibold '>Sign In</h1>
				<div className='space-y-4'>
					<label className='inline-block w-full'>
						<input type='email' placeholder='Email' className='input' />
					</label>
					<label className='inline-block w-full'>
						<input type='password' placeholder='Password' className='input' />
					</label>
				</div>
				<button className='w-full rounded bg-[#e50914] py-3 font-semibold'>Sign in</button>
				<div className='text-[gray]'>
					New to Netflixx? {'  '}
					<button type='submit' className='text-white hover:underline '>
						Sing up now
					</button>
				</div>
			</form>
		</div>
	);
}

export default Login;
