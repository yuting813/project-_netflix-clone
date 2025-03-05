import useAuth from '@/hooks/useAuth';
import Head from 'next/head';
import Link from 'next/link';
import React, { useState } from 'react';
import { CheckIcon } from '@heroicons/react/outline';
import { Product } from '@invertase/firestore-stripe-payments';
import Table from './Table';
import Loader from './Loader';
import { loadCheckout } from '../lib/stripe';

interface Props {
	products: Product[];
}

const Plans = ({ products }: Props) => {
	const { logout, user } = useAuth();
	const [selectedPlan, setSelectedPlan] = useState<Product | null>(products[2]);

	const [isBillingLoading, setBillingLoading] = useState(false);

	console.log('Selected Plan:', selectedPlan);
	console.log('Price ID:', selectedPlan?.price?.[0]?.id);

	const subscribeToPlan = () => {
		if (!user) return;

		const priceId = selectedPlan?.price?.[0]?.id;
		if (!priceId) {
			console.error('No price ID found');
			return;
		}

		console.log('Attempting checkout with price ID:', priceId);
		try {
			loadCheckout(priceId, user.uid);
			setBillingLoading(true);
			console.log('開始訂閱流程');
		} catch (error) {
			console.error('訂閱過程發生錯誤:', error);
			setBillingLoading(false);
		}
	};
	return (
		<div>
			<Head>
				{' '}
				<title>Netflixx</title>
				<link rel='icon' href='./logo.svg' />
			</Head>

			<header className='border-b border-white/10 bg-[#141414]'>
				<Link href='/'>
					<img
						src='./logo.svg'
						width={50}
						height={10}
						className='cursor-pointer object-contain'
						alt=''
					/>
				</Link>
				<button onClick={logout} className='text-lg font-medium hover:underline '>
					Sign out
				</button>
			</header>

			<main className='pt-28 px-5 mx-auto max-w-5xl pb-12 transition-all'>
				<h1 className='mb-3 text-3xl font-medium  '>Choose the plan that is right for you</h1>
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

				{/* <div className='mt-4 flex flex-col space-y-4'>
					<div className='flex w-full items-center justify-center self-end md:w-3/5'>
						{products.map((product) => (
							<div
								key={product.id}
								className={`planBox ${
									selectedPlan?.id === product.id ? 'opacity-100' : 'opacity-60'
								} cursor-pointer`}
								onClick={() => {
									setSelectedPlan(product);
								}}
							>
								{product.name}
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
						className='mx-auto w-11/12 bg-[#E50914] rounded py-4 text-xl shadow hover:bg-[#f6121d] md:w-[420px]'
						onClick={subscribeToPlan}
					>
						{isBillingLoading ? <Loader color='dark:fill-gray-300' /> : 'Subscribe'}
					</button>
				</div> */}

				<div className='mt-4 flex flex-col space-y-4'>
					<div className='flex w-full items-center justify-center self-end md:w-3/5 relative'>
						{products.map((product) => (
							<div
								key={product.id}
								className={`planBox relative ${
									selectedPlan?.id === product.id ? 'opacity-100' : 'opacity-60'
								} cursor-pointer  transition-opacity duration-200`}
								onClick={() => setSelectedPlan(product)}
							>
								{product.name}

								{product.name === 'Premium' && (
									<span
										className='absolute -top-4
										left-1/2 transform -translate-x-1/2 
									 bg-gradient-to-r from-purple-600 to-blue-500 
									 text-white text-sm font-medium px-4 py-1.5  
									 shadow-lg whitespace-nowrap '
									>
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
						className='mx-auto w-11/12 bg-[#E50914] rounded py-4 text-xl shadow hover:bg-[#f6121d] md:w-[420px]'
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
