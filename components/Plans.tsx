import useAuth from '@/hooks/useAuth';
import { Button } from '@mui/material';
import { signOut } from 'firebase/auth';
import Head from 'next/head';
import Link from 'next/link';
import React, { useState } from 'react';
import Header from './Header';
import { CheckIcon } from '@heroicons/react/outline';
import { Product } from '@invertase/firestore-stripe-payments';
// import { loadCheckout } from '@/lib/stripe';
import loadCheckout from '@/lib/stripe';
import Table from './Table';

interface Props {
	products: Product[];
}

const Plans = ({ products }: Props) => {
	console.log('products_plans', products);
	const { logout, user } = useAuth();
	const [selectedPlan, setSelectedPlan] = useState<Product | null>(products[2]);

	const [isBillingLoading, setBillingLoading] = useState(false);

	const subscribeToPlan = () => {
		if (!user) return;

		loadCheckout(selectedPlan?.prices[0].id!);
		setBillingLoading(true);
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
				<div className='mt-4 flex flex-col space-y-4'>
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
					<button>Subscribe</button>
				</div>
			</main>
		</div>
	);
};

export default Plans;
