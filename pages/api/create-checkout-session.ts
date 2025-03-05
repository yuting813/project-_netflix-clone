import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
	apiVersion: '2025-02-24.acacia',
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	if (req.method !== 'POST') {
		return res.status(405).json({ message: 'Method not allowed' });
	}

	try {
		const { priceId, userId } = req.body;

		const session = await stripe.checkout.sessions.create({
			payment_method_types: ['card'],
			line_items: [
				{
					price: priceId,
					quantity: 1,
				},
			],
			mode: 'subscription',
			success_url: `${req.headers.origin}/?session_id={CHECKOUT_SESSION_ID}`, // 添加 session_id
			cancel_url: `${req.headers.origin}/cancel`,
			metadata: {
				userId: userId, // 添加用戶 ID 到 metadata
			},
		});

		res.status(200).json({ id: session.id });
	} catch (error) {
		console.error('Checkout session creation error:', error);
		res.status(500).json({ message: 'Internal server error' });
	}
}
