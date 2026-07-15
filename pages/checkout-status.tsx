import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

const statusContent = {
	success: {
		title: 'Checkout completed',
		message: 'Your subscription is being synchronized. It may take a moment to appear.',
	},
	cancelled: {
		title: 'Checkout cancelled',
		message: 'No plan changes were made. You can return and choose a plan when you are ready.',
	},
	error: {
		title: 'Unable to start checkout',
		message: 'Please return to the plans page and try again.',
	},
} as const;

type CheckoutState = keyof typeof statusContent;

export default function CheckoutStatus() {
	const router = useRouter();
	const state = typeof router.query.state === 'string' ? router.query.state : 'error';
	const content = statusContent[state as CheckoutState] ?? statusContent.error;

	return (
		<div className='flex min-h-screen items-center justify-center bg-[#141414] px-6 text-white'>
			<Head>
				<title>{content.title} - Stream</title>
			</Head>
			<main className='w-full max-w-lg rounded-xl border border-white/10 bg-black/40 p-8 text-center shadow-xl'>
				<h1 className='text-3xl font-semibold'>{content.title}</h1>
				<p className='mt-4 text-gray-300'>{content.message}</p>
				<Link
					href='/'
					className='mt-8 inline-block rounded bg-[#e50914] px-6 py-3 font-semibold transition hover:bg-[#f6121d]'
				>
					Return home
				</Link>
			</main>
		</div>
	);
}
