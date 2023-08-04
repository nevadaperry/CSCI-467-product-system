import React, { useEffect, useMemo, useState } from 'react';
import { Button, Form, FormGroup, Input, Label, Spinner } from 'reactstrap';
import { useLoad } from '../custom-hooks';
import * as api from '../api';

enum Section {
  PACKING,
  INVOICE,
  SHIPPING_LABEL,
}

function Documents() {
	const [orders, ordersLoad] = useLoad(() => api.listOrders({}), 0);
	const [currentSection, setCurrentSection] = useState(Section.PACKING);
	
	return (
		<div>
			{/* Shows the currently selected order. 
				You can select another order from the dropdown or
				on the "Orders" tab. */}
			<Label for="orderSelect">
				Current Order
			</Label>
			<Input
			id="orderSelect"
			name="select"
			type="select"
			>
				<option>a</option>
				<option>b</option>
			</Input>
			&nbsp;
			{/* Right now, the plan is to show the info that will be written
				on each document, then have the ability to create a printable
				HTML page for each document. */}
			<h2>Preview document...</h2>
			<Button
				className="header-button ps-personal-space"
				color={currentSection === Section.PACKING ? 'success' : 'secondary'}
				onClick={() => setCurrentSection(Section.PACKING)}
			> Packing List </Button>
			<Button
				className="header-button ps-personal-space"
				color={currentSection === Section.INVOICE ? 'success' : 'secondary'}
				onClick={() => setCurrentSection(Section.INVOICE)}
			> Invoice </Button>
			<Button
				className="header-button ps-personal-space"
				color={currentSection === Section.SHIPPING_LABEL ? 'success' : 'secondary'}
				onClick={() => setCurrentSection(Section.SHIPPING_LABEL)}
			> Shipping Label </Button>
			&nbsp;
			{currentSection === Section.PACKING ? (
				<p>packing</p>
			) : currentSection === Section.INVOICE ? (
				<p>invoice</p>
			) : (
				<p>shipping</p>
			)}
		</div>
	);
}

export default Documents;