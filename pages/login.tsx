/* eslint-disable @next/next/no-img-element */
import Head from 'next/head';
import React, { useState } from 'react';
import Image from 'next/image';
import { SubmitHandler, useForm } from 'react-hook-form';
import useAuth from '@/hooks/useAuth';

type Inputs = {
	email: string;
	password: string;
};
function Login() {
	const [login, setLogin] = useState(false);
	const { signIn, signUp } = useAuth();

	const {
		register,
		handleSubmit,
		watch,
		formState: { errors },
	} = useForm<Inputs>();

	const onSubmit: SubmitHandler<Inputs> = async ({ email, password }) => {
		if (login) {
			await signIn(email, password);
		} else {
			await signUp(email, password);
		}
	};
	console.log(watch('email')); // watch input value by passing the name of it

	return (
		<div className='relative flex h-screen w-screen flex-col bg-black md:items-center md:justify-center md:bg-transparent'>
			<Head>
				<title>Netflixx</title>
				<link rel='icon' href='/favicon.ico' />
			</Head>
			<Image
				src='/loginImg.svg'
				className='z-0 hidden opacity-90 sm:inline object-cover'
				alt='Login page background image'
				fill
				priority
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

			<form
				onSubmit={handleSubmit(onSubmit)}
				className='relative mt-24 space-y-8 py-10 px-6 rounded bg-black/75 md:mt-0 md:max-w-md md:px-14'
			>
				<h1 className='text-4xl font-semibold '>Sign In</h1>
				<div className='space-y-4'>
					<label className='inline-block w-full'>
						<input
							type='email'
							placeholder='Email'
							className='input'
							{...register('email', { required: true })}
						/>
						{errors.email && (
							<p className='p-1 text-[13px] font-light text-orange-500  '>
								Please enter a valid email.
							</p>
						)}
					</label>
					<label className='inline-block w-full'>
						<input
							type='password'
							placeholder='Password'
							className='input'
							{...register('password', { required: true })}
						/>
						{errors.password && (
							<p className='p-1 text-[13px] font-light text-orange-500  '>
								Your password must contain between 4 and 60 characters.
							</p>
						)}
					</label>
				</div>
				<button
					className='w-full rounded bg-[#e50914] py-3 font-semibold'
					onClick={() => {
						setLogin(true);
					}}
				>
					Sign in
				</button>
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
