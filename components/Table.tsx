import { Product } from '@stripe/firestore-stripe-payments';
import React from 'react';

interface Props {
	products: Product[];
}

function Table({ products }: Props) {
	return (
		<table>
			<tbody>
				<tr>
					<td>Monthly price</td>
					{products.map((product) => (
						<td key={product.id}>
							{product.prices && product.prices.length > 0
								? `USD${product.prices[0].unit_amount! / 100}`
								: 'N/A'}
						</td>
					))}
				</tr>
			</tbody>
		</table>
	);
}

export default Table;
