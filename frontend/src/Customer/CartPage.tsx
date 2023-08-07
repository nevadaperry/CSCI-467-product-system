// export default CartPage;
import React, { useState } from 'react';
import { Table, Button } from 'reactstrap';


function CartPage({ cartItems, setCartItems, setTotalPrice, totalPrice }) {
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [creditCardNumber, setCreditCardNumber] = useState('');
  //TODO Finish the complete order function
  const [orderCompleted, setOrderCompleted] = useState(false);
  
    const RemoveItem = (productId) => {
    const updatedCart = cartItems.filter((item) => item.id !== productId);
    setCartItems(updatedCart);
    const newTotalPrice = updatedCart.reduce((total, item) => total + item.price * item.quantitySelected, 0);
    setTotalPrice(newTotalPrice);
  };

  const CreditCardNumberChange = (e) => {
    const newCreditCardNumber = e.target.value.replace(/\D/g, '').slice(0, 10);
    setCreditCardNumber(newCreditCardNumber);
  };




  return (
    <div>
      <h2>Cart Items</h2>
      <Table>
        <thead>
          <tr>
            <th>Product</th>
            <th>Quantity</th>
            <th>Price</th>
          </tr>
        </thead>
        <tbody>
          {cartItems.map((item) => (
            <tr key={item.id}>
              <td>{item.description}</td>
              <td>{item.quantitySelected}</td>
              <td>${item.price * item.quantitySelected}</td>
              <td>
                <Button color="danger" onClick={() => RemoveItem(item.id)}> Remove</Button>
                </td>
            </tr>
          ))}
        </tbody>
      </Table>
      <p>Total Price: ${totalPrice.toFixed(2)}</p>
      <form>
        <div>
          <label>Name:</label>
          <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
        </div>
        <div>
          <label>Email:</label>
          <input type="text" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} />
        </div>
        <div>
          <label>Address:</label>
          <input type="text" value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} />
        </div>
        <div>
          <label>Credit Card Number:</label>
          <input type="text" value={creditCardNumber} onChange={CreditCardNumberChange} maxLength ="10" />
        </div>
        {/* TODO SET PAYMENT AUTHORIZATION WITH DB  */}
        <Button
          color="success"
          onClick={() => { setOrderCompleted(true); }}
        >
          Complete Order
        </Button>
      </form>
    </div>
  );
}

export default CartPage;
