/** @type {import('next').NextConfig} */
// const nextConfig = {
// 	reactStrictMode: true,
// };

// module.exports = nextConfig;

module.exports = {
	reactStrictMode: true,
	images: {
		domains: ['image.tmdb.org'],
	},
};

// module.exports = {
// 	images: {
// 	  remotePatterns: [
// 		{
// 		  protocol: 'https',
// 		  hostname: 'image.tmdb.org',
// 		  port: '',
// 		  pathname: '',
// 		},
// 	  ],
// 	},
//   }