import React, { useEffect, useMemo, useState } from 'react';
import { useLoad } from '../custom-hooks';
import { Button, Input, Label, Spinner } from 'reactstrap';
import * as api from '../api';

import Packing from './Packing';
import Invoice from './Invoice';
import ShippingLabel from './ShippingLabel';

enum Section {
  PACKING,
  INVOICE,
  SHIPPING_LABEL,
}

export default function ShippingHome() {
  const [orders, ordersLoad] = useLoad(() => api.listOrders({}), 1);
  const [currentSection, setCurrentSection] = useState(Section.PACKING);
  const [currentOrder, setCurrentOrder] = useState(null);

  if (ordersLoad.status === 'loading') {
    return <Spinner />;
  }

  if (!orders) {
    return <div>Error: Error with connecting to database</div>;
  }

  function handleSelect(e) {
    setCurrentOrder(e.target.value);
  }

  return (
    <div>
      <h2>Shipping</h2>
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
      onChange={handleSelect}
      >
        {orders.map( (order, index) => (
            <option key={index} value={order.id}>
              {new Date(order.date_placed!).toLocaleDateString()}: Order #{order.id}
            </option>
          ))}
      </Input>
      &nbsp;
      {/* Right now, the plan is to show the info that will be written
        on each document, then have the ability to create a printable
        HTML page for each document. */}
      <h3>Preview document...</h3>
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
      { currentOrder === null ? (
        <div>Select an order...</div>
      ) : currentSection === Section.PACKING ? (
        <Packing curOrder={currentOrder}/>
      ) : currentSection === Section.INVOICE ? (
        <Invoice curOrder={currentOrder}/>
      ) : (
        <ShippingLabel curOrder={currentOrder}/>
      )}
    </div>
  );
}
