// 只保留一個 withTM 定義
const withTM = require('next-transpile-modules')(['@invertase/firestore-stripe-payments']);

module.exports = withTM({
	reactStrictMode: true,
	images: {
		domains: ['image.tmdb.org', 'rb.gy'],
	},
});
