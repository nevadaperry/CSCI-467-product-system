import React, { useEffect, useMemo, useState } from 'react';
import { useLoad } from '../custom-hooks';
import { Button, Table, Input, Label, Spinner } from 'reactstrap';
import * as api from '../api';

function Packing({ curOrder }) {
	const [order, orderLoad] = useLoad(() => api.readOrder(curOrder), curOrder);

	const [totalWeight, setTotalWeight] = useState(0);
	const [totalPrice, setTotalPrice] = useState(0);
	const [totalQty, setTotalQty] = useState(0);

	function updateTotalWeight(weight) {
		var newTotal: number = parseFloat(totalWeight) + parseFloat(weight);
		setTotalWeight(newTotal);
	}

	function updateTotalPrice(price) {
		var newTotal: number = parseFloat(totalPrice) + parseFloat(price);
		setTotalPrice(newTotal);
	}

	function updateTotalQty(qty) {
		var newTotal: number = parseFloat(totalQty) + parseFloat(qty);
		setTotalQty(newTotal);
	}

	if (orderLoad.status === 'loading') {
    	return <Spinner />;
  	}

  	if (!order) {
    	// If order is not available, show an error message or handle it accordingly
    	return <div>Error: Order not found.</div>;
  	}

	return (
		<div>
          <h3>Packing List</h3>
          <Table>
            <thead>
              <tr key="header"><th>ID</th><th>Product Description</th><th>Weight (lbs)</th><th>Cost (USD)</th><th>Quantity</th></tr>
            </thead>
            <tbody>
            {order.line_items.map( (item, index) => (
                <tr key={index}><th scope="row">{item.product!.id}</th>
                	<td>{ item.product!.description }</td>
                	<td>{ item.product!.weight }</td>
                	<td>{ item.product!.price }</td>
                	<td>{ item.quantity }</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
	);
}

export default Packing;