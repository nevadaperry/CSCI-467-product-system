import React, { useState } from 'react';
import FeeSchedule from './FeeSchedule';
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
        <h2>Admin</h2>
        {/* Two Buttons for Shipping Cost and Orders */}
        <div className="header-buttons">
          <Button
            className="header-button ps-personal-space"
            color={currentSection === Section.ORDERS ? 'success' : 'secondary'}
            onClick={() => setCurrentSection(Section.ORDERS)}
          >
            Orders
          </Button>
          <Button
            className="header-button ps-personal-space"
            color={
              currentSection === Section.SHIPPING ? 'success' : 'secondary'
            }
            onClick={() => setCurrentSection(Section.SHIPPING)}
          >
            Fee schedule
          </Button>
        </div>
      </header>
      &nbsp;
      {currentSection === Section.SHIPPING ? (
        <FeeSchedule />
      ) : (
        <>
          <OrderListing />
          <OrderSearch />
          <OrderDetails />
        </>
      )}
      <footer>&nbsp;</footer>
    </div>
  );
}

export default AdminHome;
