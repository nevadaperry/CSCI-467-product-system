import React, { useEffect, useMemo, useState } from 'react';
import { Button, Table, Input, Label } from 'reactstrap';
import { useLoad } from '../../custom-hooks';
import * as api from '../../api';

const LabelPrint = React.forwardRef((props, ref) => {
	const {order, feeSchedule, ...otherProps} = props;

	const [shipped, setShipped] = useState(false);

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
			<p>Product System&emsp;&emsp;&emsp;&emsp;Postage: ${calculateShipping()} PREPAID<br/>
	      	123 Example St&emsp;&emsp;&emsp;&emsp;Total Weight: ${calculateWeight()}<br/>
	      	New York, NY 12345</p>

	      	<p>&emsp;&emsp;&emsp;&emsp;{ order.customer_name! }<br/>&emsp;&emsp;&emsp;&emsp;{ order.shipping_address! }</p>
		</div>
	);
});

export default LabelPrint;