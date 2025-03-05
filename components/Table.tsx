import { CheckIcon } from '@heroicons/react/outline';
import { Product } from '@invertase/firestore-stripe-payments';
import React from 'react';

interface Props {
	products: Product[];
	selectedPlan: Product | null;
	setSelectedPlan: (product: Product) => void;
}

function Table({ products, selectedPlan, setSelectedPlan }: Props) {
	if (!products || products.length === 0) {
		return <div>Loading products...</div>;
	}
	const handlePlanSelect = (product: Product) => {
		setSelectedPlan(product);
	};
	const renderTableCell = (product: Product, content: React.ReactNode) => (
		<td
			key={product.id}
			onClick={() => handlePlanSelect(product)}
			className={`tableDataFeature ${
				selectedPlan?.id === product.id ? 'text-[#e50914]' : 'text-[gray]'
			}`}
		>
			{content}
		</td>
	);

	return (
		<table className='w-full'>
			<tbody className='divide-y divide-[gray]'>
				<tr className='tableRow'>
					<td className='tableDataTitle'>Monthly price</td>

					{products.map((product) =>
						renderTableCell(
							product,
							product.price[0] ? `USD$${(product.price[0].unit_amount / 100).toFixed(2)}` : 'N/A',
						),
					)}
				</tr>

				<tr className='tableRow'>
					<td className='tableDataTitle'>Video quality</td>
					{products.map((product) =>
						renderTableCell(product, product.metadata?.videoQuality || 'Good'),
					)}
				</tr>

				<tr className='tableRow'>
					<td className='tableDataTitle'>Resolution</td>
					{products.map((product) =>
						renderTableCell(product, product.metadata?.resolution || '1080p'),
					)}
				</tr>

				<tr className='tableRow'>
					<td className='tableDataTitle'>Watch on your TV, computer, mobile phone and tablet</td>
					{products.map((product) =>
						renderTableCell(
							product,
							product.metadata?.portability === 'true' && (
								<CheckIcon className='inline-block h-8 w-8' />
							),
						),
					)}
				</tr>
			</tbody>
		</table>
	);
}

export default Table;
