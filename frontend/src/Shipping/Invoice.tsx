import React, { useEffect, useMemo, useState } from 'react';
import { useLoad } from '../custom-hooks';
import { Button, Table, Input, Label, Spinner } from 'reactstrap';
import * as api from '../api';

function Invoice({curOrder}) {
	const [order, orderLoad] = useLoad(() => api.readOrder(curOrder), curOrder);

	function markAsShipped() {
		api.updateOrder(curOrder, existing, {...existing, status: 'shipped'});
	}

	if (orderLoad.status === 'loading' || feeScheduleLoad.status === 'loading') {
    	return <Spinner />;
  	}

  	if (!order) {
    	// If order is not available, show an error message or handle it accordingly
    	return <div>Error: Order not found.</div>;
  	}


}