import React, { useState } from 'react';
import { Button } from 'reactstrap';
import ProductListing from './ProductListing'; 
import CartPage from './CartPage';


// Define the Section enum here
enum Section {
  PRODUCT_LISTING,
  CART,
}

function CustomerHome() {
  const [currentSection, setCurrentSection] = useState(Section.PRODUCT_LISTING);
  const [cartItems, setCartItems] = useState([]);
  // FIX THE TOTAL PRICE FUNCTION
  const [totalPrice, setTotalPrice] = useState(0);

  const addToCart = (product) => {
    setCartItems([...cartItems, { ...product, quantitySelected: 1 }]);
    var curTotal: number = parseFloat(totalPrice) + parseFloat(product.price)
    setTotalPrice(curTotal);
  };

  return (
    <div>
      <header>
        <h2>Customer</h2>
        {/* Two Buttons for Product Listing and Cart */}
        <div className="header-buttons">
          <Button
            className="header-button ps-personal-space"
            color={currentSection === Section.PRODUCT_LISTING ? 'success' : 'secondary'}
            onClick={() => setCurrentSection(Section.PRODUCT_LISTING)}
          >
            Product Listing
          </Button>
          <Button
            className="header-button ps-personal-space"
            color={currentSection === Section.CART ? 'success' : 'secondary'}
            onClick={() => setCurrentSection(Section.CART)}
          >
            Cart
          </Button>
          <Button color="success" onClick={() => console.log('Go to cart page')}>Cart ({cartItems.length})</Button>
        </div>
      </header>
      &nbsp;
      {currentSection === Section.PRODUCT_LISTING ? (
        <ProductListing addToCart={addToCart} />
      ) : (
        <CartPage cartItems={cartItems} totalPrice={totalPrice} />
      )}
      <footer>&nbsp;</footer>
    </div>
  );
}

export default CustomerHome;
