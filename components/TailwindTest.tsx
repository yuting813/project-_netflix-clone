// components/GradientTest.tsx
import React from 'react';

const GradientTest = () => {
	return (
		<div className='p-4 space-y-4'>
			{/* 測試 1: 使用 Tailwind 內置漸層 */}
			<div className='h-32 bg-gradient-to-r from-blue-500 to-purple-500 rounded'>
				<p className='text-white p-4'>默認漸層 1</p>
			</div>

			{/* 測試 2: 使用 Tailwind 預設色彩 */}
			<div className='h-32 bg-gradient-to-b from-green-500 to-blue-500 rounded'>
				<p className='text-white p-4'>自定義漸層 2</p>
			</div>

			{/* 測試 3: 使用多重漸層點 */}
			<div className='h-32 bg-[linear-gradient(to_bottom,#ff0000,#00ff00,#0000ff)] rounded'>
				<p className='text-white p-4'>直接樣式漸層 3</p>
			</div>

			{/* 測試 4: Netflix 風格漸層 */}
			<div className='h-32 bg-[linear-gradient(to_bottom,rgba(20,20,20,0)_0%,rgba(20,20,20,0.15)_15%,rgba(20,20,20,0.35)_29%,rgba(20,20,20,0.58)_44%,#141414_68%,#141414_100%)] rounded'>
				<p className='text-white p-4'>Netflix 風格漸層 4</p>
			</div>

			{/* 測試 5: 使用 Tailwind 多重色彩漸層 */}
			<div className='h-32 bg-gradient-to-r from-red-500 via-yellow-500 to-blue-500 rounded'>
				<p className='text-white p-4'>多重色彩漸層 5</p>
			</div>
		</div>
	);
};

export default GradientTest;
