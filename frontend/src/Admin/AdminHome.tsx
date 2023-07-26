import React from 'react';
import Header from './Header';
import ShippingAndHandlingSettings from './ShippingAndHandlingSettings';
import OrderListing from './OrderListing';
import OrderSearch from './OrderSearch';
import OrderDetails from './OrderDetails';

function AdminHome() {
  return (
    <div>
      <Header />
      <ShippingAndHandlingSettings />
      <OrderListing />
      <OrderSearch />
      <OrderDetails />
    </div>
  );
}

export default AdminHome;
