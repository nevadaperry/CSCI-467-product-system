import React, { useEffect, useMemo, useState } from 'react';
import { useLoad } from '../custom-hooks';
import { Button, Table, Input, Label, Spinner } from 'reactstrap';
import * as api from '../api';

function ShippingLabel({curOrder}) {
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
		<div>
      <h3>Shipping Label</h3>
      <h4>Shipping: ${ calculateShipping() }&emsp;&emsp;Weight: { calculateWeight() } lbs.</h4>
      <h4>Ship To:</h4>
      <p>{ order.customer_name! }<br/>{ order.shipping_address! }</p>
      <Button
      className="header-button ps-personal-space"
      color='success'
      onClick={() => window.open("https://google.com")}
    	>Print</Button>
    </div>
	);
}

export default ShippingLabel;