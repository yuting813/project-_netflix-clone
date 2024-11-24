/** @type {import('next').NextConfig} */

module.exports = {
	reactStrictMode: true,
	images: {
		domains: ['image.tmdb.org'], // TMDB 圖片域名
		formats: ['image/avif', 'image/webp'],
		// 可選：設置最大圖片大小
		deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
		imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
	},
};

// module.exports = nextConfig;
// const nextConfig = {
// 	reactStrictMode: true,
// };

// module.exports = {
// 	images: {
// 	  remotePatterns: [
// 		{
// 		  protocol: 'https',
// 		  hostname: 'image.tmdb.org'
// 		},
// 	  ],
// 	},
//   }
