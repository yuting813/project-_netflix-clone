/** @type {import('next').NextConfig} */
const withTM = require('next-transpile-modules')(['@invertase/firestore-stripe-payments']);

const nextConfig = {
	reactStrictMode: true,
	images: {
		remotePatterns: [
			{
				protocol: 'https',
				hostname: 'image.tmdb.org',
			},
			{
				protocol: 'https',
				hostname: 'rb.gy',
			},
		],
	},
};

module.exports = withTM(nextConfig);
