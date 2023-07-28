import React, { useState } from 'react';
import ShippingAndHandlingSettings from './ShippingAndHandlingSettings';
import OrderListing from './OrderListing';
import OrderSearch from './OrderSearch';
import OrderDetails from './OrderDetails';
import { Button } from 'reactstrap';

// Define the Section enum here
/* 
Enums in TypeScript allow you to define a set of named constants, 
and each constant is assigned a numeric value. By default, the first constant has the value 0, 
and the value increments by 1 for subsequent constants
*/
enum Section {
  SHIPPING,
  ORDERS,
}

function AdminHome() {
  const [currentSection, setCurrentSection] = useState(Section.SHIPPING);
  // State to keep track of which section is currently being displayed.
  // By default, it is set to the Shipping and Handling Settings section (SHIPPING).
  return (
    <div>
      <header>
        <h1>Admin Interface</h1>
        {/* Two Buttons for Shipping Cost and Orders */}
        <div className="header-buttons">
          <Button
            className="header-button"
            color={currentSection === Section.ORDERS ? 'primary' : 'secondary'}
            onClick={() => setCurrentSection(Section.ORDERS)}
          >
            Orders
          </Button>
          <Button
            className="header-button"
            color={
              currentSection === Section.SHIPPING ? 'primary' : 'secondary'
            }
            onClick={() => setCurrentSection(Section.SHIPPING)}
          >
            Shipping Cost
          </Button>
        </div>
      </header>
      {currentSection === Section.SHIPPING ? (
        <ShippingAndHandlingSettings />
      ) : (
        <>
          <OrderListing />
          <OrderSearch />
          <OrderDetails />
        </>
      )}
    </div>
  );
}

export default AdminHome;
