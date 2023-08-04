import React, { useState } from 'react';
import OrderList from './OrderList';
import Documents from './Documents';
import { Button } from 'reactstrap';

enum Section {
  ORDERS,
  DOCUMENTS
}

export default function ShippingHome() {
  const [currentSection, setCurrentSection] = useState(Section.ORDERS);
  // State to keep track of which section is currently being displayed.
  // By default, it is set to the Shipping and Handling Settings section (SHIPPING).
  return (
    <div>
      <header>
        <h2>Shipping</h2>
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
              currentSection === Section.DOCUMENTS ? 'success' : 'secondary'
            }
            onClick={() => setCurrentSection(Section.DOCUMENTS)}
          >
            Documents
          </Button>
        </div>
      </header>
      &nbsp;
      {currentSection === Section.DOCUMENTS ? (
        <Documents />
      ) : (
        <>
          <OrderList />
        </>
      )}
      <footer>&nbsp;</footer>
    </div>
  );
}
