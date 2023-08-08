import React, { useEffect, useMemo, useState } from 'react';
import { Button, Table, Input, Label, Spinner } from 'reactstrap';
import { useLoad } from '../../custom-hooks';
import * as api from '../../api';

const InvoicePrint = React.forwardRef((props, ref) => {
	const {curOrder, ...otherProps} = props;

	const [order, orderLoad] = useLoad(() => api.readOrder(curOrder), curOrder);
	const [feeSchedule, feeScheduleLoad] = useLoad(
	  () => api.readFeeSchedule(),
	  1
	);

	const [shipped, setShipped] = useState(false);

	if (orderLoad.status === 'loading' || feeScheduleLoad.status === 'loading') {
    	return <Spinner />;
  	}

  	if (!order) {
    	// If order is not available, show an error message or handle it accordingly
    	return <div>Error: Order not found.</div>;
  	}
  	if (!feeSchedule) {
		// If fee schedule is not available, show an error message or handle it accordingly
		return <div>Error: Shipping fee info not found</div>;
	}

	// Calculates the total quantity of items.
	const calculateQuantity = () => {
		let amount = 0;
		order.line_items.forEach((item) => {
			amount += item.quantity;
		});
		return amount;
	};

	// Function to calculate the amount without shipping
	  const calculateAmountWithoutShipping = () => {
	    let amount = 0;

	    order.line_items.forEach((item) => {
	      amount += item.product!.price * item.quantity;
	    });

	    return amount.toFixed(2);
	  };

	// Calculates total weight of all items.
	const calculateWeight = () => {
		const weight = order.line_items.reduce((totalWeight, item) => {
	      	return totalWeight + item.product!.weight * item.quantity;
	    }, 0);

	    return weight;
	};

	  // Function to calculate the shipping cost
	  const calculateShipping = () => {
	    let shipping = 0;
	    const weight = calculateWeight();

	    // Find the relevant shipping fee from the fee schedule
	    feeSchedule.weight_brackets.forEach((bracket) => {
	      if (weight >= bracket.lower_bound) {
	        shipping = bracket.fee;
	      }
	    });

	    return shipping.toFixed(2);
	  };

	// Calculates total cost.
	const calculateTotalCost = () => {
		let total = parseFloat(calculateAmountWithoutShipping()) + parseFloat(calculateShipping());
		return total;
	};

	return (
		<div style={{ margin: 20 }} ref={ref}>
			<h1>Product System</h1>
			<p><i>Your source for all things automotive.</i></p>
			<h2>Invoice</h2>
  			<h3>Bill To:</h3>
  			<p>{ order.customer_name! }<br/>{ order.shipping_address! }</p>
  			<Table>
    			<thead>
      				<tr key="header"><th>ID</th><th>Quantity</th><th>Product Description</th><th>Unit Cost<br/>(USD)</th><th>Combined<br/>Cost(USD)</th></tr>
    			</thead>
    			<tbody>
    				{order.line_items.map( (item, index) => (
			        <tr key={index}><th scope="row">{item.product!.id}</th>
			        	<td>{ item.quantity }</td>
			        	<td>{ item.product!.description }</td>
			        	<td>{ item.product!.price }</td>
			        	<td>{ item.product!.price * item.quantity }</td>
			        </tr>
      				))}
    				<tr key="totals"><th scope="row"><i>Totals:</i></th>
						<td><i>{ calculateQuantity() }</i></td>
						<td>-----</td>
						<td>-----</td>
						<td><i>{ calculateAmountWithoutShipping() }</i></td>
					</tr>
    			</tbody>
  			</Table>
  			<h3>Shipping: ${ calculateShipping() }</h3>
  			<h3>Total Cost: ${ calculateTotalCost() }</h3>
  			<p><i>Thank you for your business!</i></p>
		</div>
	);
});

export default InvoicePrint;
