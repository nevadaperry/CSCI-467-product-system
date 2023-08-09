import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useLoad } from '../custom-hooks';
import { Button, Table, Input, Label, Spinner } from 'reactstrap';
import { ReactToPrint, useReactToPrint } from 'react-to-print';
import * as api from '../api';

import PackingPrint from './Printables/PackingPrint';

function Packing({ curOrder }) {
	const [order, orderLoad] = useLoad(() => api.readOrder(curOrder), curOrder);
	const [feeSchedule, feeScheduleLoad] = useLoad(
	  () => api.readFeeSchedule(),
	  1
	);

	const componentRef = useRef();
  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
  });

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

	//TODO: make React not angry at this (throws re-render error when order is shipped)
	if (order.status === 'shipped') {
		if (!shipped) {
			setShipped(true);
		}
	}
	if (order.status === 'authorized') {
		if (shipped) {
			setShipped(false);
		}
	}

	function markAsShipped() {
		if (!shipped) {
			api.updateOrder(curOrder, order, {...order, status: 'shipped'});
			setShipped(true);
		}
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
      <h3>Packing List</h3>
      <Table>
        <thead>
          <tr key="header"><th>ID</th><th>Quantity</th><th>Product Description</th><th>Unit Weight<br/>(lbs.)</th><th>Combined<br/>Weight(lbs.)</th></tr>
        </thead>
        <tbody>
        {order.line_items.map( (item, index) => (
            <tr key={index}><th scope="row">{item.product!.id}</th>
            	<td>{ item.quantity }</td>
            	<td>{ item.product!.description }</td>
            	<td>{ item.product!.weight }</td>
            	<td>{ item.product!.weight * item.quantity }</td>
            </tr>
          ))}
        	<tr key="totals"><th scope="row"><i>Totals:</i></th>
					<td><i>{ calculateQuantity() }</i></td>
					<td>-----</td>
					<td>-----</td>
					<td><i>{ calculateWeight() }</i></td>
				</tr>
        </tbody>
      </Table>
      <div style={{ display: "none" }}><PackingPrint order={order} feeSchedule={feeSchedule} ref={componentRef} /></div>
      <Button
	      className="header-button ps-personal-space"
	      color='success'
	      onClick={handlePrint}
	    >Print</Button>
	    <Button
	      className="header-button ps-personal-space"
	      color={shipped ? 'secondary' : 'success'}
	      onClick={() => markAsShipped()}
	    >{shipped ? "Shipped!" : "Mark as Shipped"}</Button>
  	</div>
	);
}

export default Packing;