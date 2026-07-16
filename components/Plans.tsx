import { CheckIcon } from '@heroicons/react/outline';
import { Product } from '@invertase/firestore-stripe-payments';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useState } from 'react';
import useAuth from '@/hooks/useAuth';
import { loadCheckout } from '../lib/stripe';
import Loader from './Loader';
import Table from './Table';

interface Props {
	products: Product[];
}

const Plans = ({ products }: Props) => {
	const { logout, user } = useAuth();
	const router = useRouter();
	const [selectedPlan, setSelectedPlan] = useState<Product | null>(products[2]);

	const [isBillingLoading, setBillingLoading] = useState(false);

	const subscribeToPlan = async () => {
		if (!user) return;

		const priceId = selectedPlan?.price?.[0]?.id;
		if (!priceId) {
			console.error('No price ID found');
			return;
		}

		setBillingLoading(true);
		try {
			await loadCheckout(priceId);
		} catch (error) {
			console.error('訂閱過程發生錯誤:', error);
			await router.push('/checkout-status?state=error');
		} finally {
			setBillingLoading(false);
		}
	};
	return (
		<div>
			<Head>
				{' '}
				<title>Stream</title>
				<link rel='icon' href='./logo.svg' />
			</Head>

			<header className='border-b border-white/10 bg-[#141414]'>
				<Link href='/'>
					<div>
						<Image
							src='/logo.svg'
							alt='Stream home'
							width={40}
							height={40}
							className='absolute left-4 top-4 h-[40px] w-[40px] cursor-pointer object-contain md:left-10 md:top-6'
						/>
					</div>
				</Link>
				<button onClick={logout} className='text-lg font-medium hover:underline'>
					Sign out
				</button>
			</header>

			<main className='mx-auto max-w-5xl px-5 pb-12 pt-28 transition-all'>
				<h1 className='mb-3 text-3xl font-medium'>Choose the plan that is right for you</h1>
				<ul>
					<li className='flex items-center gap-x-2 text-lg'>
						<CheckIcon className='h-7 w-7 text-[#E50914]' /> Watch all you want. Ad-free.
					</li>
					<li className='flex items-center gap-x-2 text-lg'>
						<CheckIcon className='h-7 w-7 text-[#E50914]' /> Recommendations just for you.
					</li>
					<li className='flex items-center gap-x-2 text-lg'>
						<CheckIcon className='h-7 w-7 text-[#E50914]' /> Change or cancel your plan anytime.
					</li>
				</ul>

				<div className='mt-4 flex flex-col space-y-4'>
					<div className='relative flex w-full items-center justify-center self-end md:w-3/5'>
						{products.map((product) => (
							<div
								key={product.id}
								className={`planBox relative ${
									selectedPlan?.id === product.id ? 'opacity-100' : 'opacity-60'
								} cursor-pointer transition-opacity duration-200`}
								onClick={() => setSelectedPlan(product)}
							>
								{product.name}

								{product.name === 'Premium' && (
									<span className='absolute -top-4 left-1/2 -translate-x-1/2 transform whitespace-nowrap bg-gradient-to-r from-purple-600 to-blue-500 px-4 py-1.5 text-sm font-medium text-white shadow-lg'>
										Most Popular
									</span>
								)}
							</div>
						))}
					</div>

					<Table
						products={products}
						selectedPlan={selectedPlan}
						setSelectedPlan={setSelectedPlan}
					/>
					<button
						disabled={!selectedPlan?.price?.[0]?.id || isBillingLoading}
						className='mx-auto w-11/12 rounded bg-[#E50914] py-4 text-xl shadow hover:bg-[#f6121d] md:w-[420px]'
						onClick={subscribeToPlan}
					>
						{isBillingLoading ? <Loader color='dark:fill-gray-300' /> : 'Subscribe'}
					</button>
				</div>
			</main>
		</div>
	);
};

export default Plans;
