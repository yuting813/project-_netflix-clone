import Head from 'next/head';
import Image from 'next/image';
import { useRouter } from 'next/router';
import React, { useState } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';
import Loader from '@/components/Loader';
import useAuth from '@/hooks/useAuth';

interface FirebaseAuthError {
	code: string;
	message: string;
}

type Inputs = {
	email: string;
	password: string;
};

function Login() {
	const router = useRouter();
	const { signIn, signUp, loading } = useAuth();
	const [login, setLogin] = useState(false);
	const [message, setMessage] = useState({ type: '', content: '' });
	const [isSubmitting, setIsSubmitting] = useState(false);

	const {
		register,
		handleSubmit,
		watch,
		formState: { errors },
	} = useForm<Inputs>();

	// 統一的錯誤處理函數
	const handleAuthError = (error: FirebaseAuthError) => {
		switch (error.code) {
			case 'auth/email-already-in-use':
				return { type: 'error', content: '此信箱已被註冊，請直接登入' };
			case 'auth/user-not-found':
				return { type: 'error', content: '帳號未註冊，請先註冊帳號' };
			case 'auth/wrong-password':
				return { type: 'error', content: '密碼錯誤，請重新輸入' };
			case 'auth/invalid-email':
				return { type: 'error', content: '信箱格式不正確' };
			default:
				console.error('認證錯誤:', error);
				return { type: 'error', content: '發生錯誤，請稍後再試' };
		}
	};

	const onSubmit: SubmitHandler<Inputs> = async ({ email, password }) => {
		if (isSubmitting) return;
		setIsSubmitting(true);
		setMessage({ type: '', content: '' });

		try {
			if (login) {
				const result = await signIn(email, password);
				if (result.success) {
					router.push('/');
					setMessage({ type: 'success', content: '登入成功！即將跳轉...' });
				} else {
					setMessage(handleAuthError({ code: result.error || '', message: '' }));
				}
			} else {
				const result = await signUp(email, password);
				if (result.success) {
					setMessage({ type: 'success', content: '註冊成功！' });
					setTimeout(() => router.push('/'), 1500);
				} else {
					setMessage(handleAuthError({ code: result.error || '', message: '' }));
				}
			}
		} catch (error) {
			const firebaseError = error as FirebaseAuthError;
			setMessage(handleAuthError(firebaseError));
		} finally {
			setIsSubmitting(false); // 確保在操作完成後重置狀態
		}
	};

	return (
		<div className='relative flex h-screen w-screen flex-col bg-black md:items-center md:justify-center md:bg-transparent'>
			<Head>
				<title>Netflixx</title>
				<link rel='icon' href='/logo.svg' />
			</Head>
			<Image
				src='/loginImg.webp'
				alt='Login page background image'
				className='-z-10 hidden brightness-[50%] sm:inline object-cover absolute inset-0 h-screen w-screen '
				fill
				priority
			/>

			<img
				src='./logo.svg'
				width={70}
				height={70}
				className='absolute left-4 top-4  cursor-pointer object-contain md:left-10 md:top-6 '
				alt='logo'
				sizes='(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
			/>

			<form
				onSubmit={handleSubmit(onSubmit)}
				className='relative mt-24 space-y-8 py-10 px-6 rounded bg-black/75 md:mt-0 md:max-w-md md:px-14'
			>
				<h1 className='text-4xl font-semibold '>登入</h1>
				<div className='space-y-4'>
					<label className='inline-block w-full'>
						<input
							type='email'
							placeholder='Email'
							className='input'
							{...register('email', {
								required: '請輸入有效的電子郵件地址。', // 添加了自定義錯誤訊息
								pattern: {
									// 添加了 email 格式驗證
									value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
									message: '請輸入有效的電子郵件地址。',
								},
							})}
						/>

						{errors.email && (
							<p className='p-1 text-[13px] font-light text-orange-500'>{errors.email.message}</p>
						)}
					</label>
					<label className='inline-block w-full'>
						<input
							type='password'
							placeholder='Password'
							className='input'
							{...register('password', {
								required: '您的密碼必須包含 4 至 60 個字元。',
								minLength: { value: 6, message: '您的密碼必須包含 4 至 60 個字元。' },
								maxLength: { value: 60, message: '您的密碼必須包含 4 至 60 個字元。' },
							})}
						/>
						{errors.password && (
							<p className='p-1 text-[13px] font-light text-orange-500  '>
								{errors.password.message}
							</p>
						)}
					</label>
				</div>
				{message.content && (
					<div
						className={`p-3 rounded text-center ${
							message.type === 'success'
								? 'bg-green-500/20 text-green-500'
								: 'bg-red-500/20 text-red-500'
						}`}
					>
						{message.content}
					</div>
				)}

				<button
					disabled={loading}
					className={`w-full rounded py-3 font-semibold ${
						loading || message.type === 'success'
							? 'bg-[#e50914]/60'
							: 'bg-[#e50914] hover:bg-[#e50914]/80'
					}`}
					onClick={() => setLogin(true)}
				>
					{loading ? (
						<Loader color='fill-white' />
					) : (
						<div className='flex items-center justify-center space-x-2'>登入</div>
					)}
				</button>

				<div className='text-[gray]'>
					尚未加入Netflixx? {'  '}
					<button
						type='submit'
						onClick={() => setLogin(false)}
						className='text-white hover:underline '
					>
						馬上註冊。
					</button>
				</div>
			</form>
		</div>
	);
}

export default Login;
