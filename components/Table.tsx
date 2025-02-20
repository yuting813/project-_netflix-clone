import { Product } from '@invertase/firestore-stripe-payments';
import React from 'react';

interface Props {
	products: Product[];
}

function Table({ products }: Props) {
	if (!products || products.length === 0) {
		return <div>Loading products...</div>;
	}

	return (
		<table className='w-full'>
			<tbody className='divide-y divide-[gray]'>
				<tr className='tableRow'>
					<td className='tableDataTitle'>Monthly price</td>
					{products.map((product) => (
						<td key={product.id} className='tableDataFeature'>
							{product.price ? `USD${(product.price / 100).toFixed(2)}` : 'N/A'}
						</td>
					))}
				</tr>

				<tr className='tableRow'>
					<td className='tableDataTitle'>Video quality</td>
					{products.map((product) => (
						<td key={product.id} className='tableDataFeature'>
							{product.metadata?.videoQuality || 'Good'}
						</td>
					))}
				</tr>

				<tr className='tableRow'>
					<td className='tableDataTitle'>Resolution</td>
					{products.map((product) => (
						<td key={product.id} className='tableDataFeature'>
							{product.metadata?.resolution || '720p'}
						</td>
					))}
				</tr>
			</tbody>
		</table>
	);
}

export default Table;
