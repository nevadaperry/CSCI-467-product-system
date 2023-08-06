// export default CartPage;
import React, { useState } from 'react';
import { Table, Button } from 'reactstrap';


function CartPage({ cartItems, totalPrice }) {
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [creditCardNumber, setCreditCardNumber] = useState('');
  //TODO PUT THIS TO USE!!
  const [orderCompleted, setOrderCompleted] = useState(false);
  // TODO ADD REMOVE FUNCTION TO THE TABLE AND DB
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
          {/* //Need to fix quantitySelected so that user can select how many they want */}
          {cartItems.map((item) => (
            <tr key={item.id}>
              <td>{item.description}</td>
              <td>{item.quantitySelected}</td>
              <td>${item.price * item.quantitySelected}</td>
            </tr>
          ))}
        </tbody>
      </Table>
      {/* TODO FIX TOTAL PRICING!! */}
      <p>Total Price: ${totalPrice}</p>
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
          {/* TODO Put a on credit card number limit using luhn algorithm */}
          <label>Credit Card Number:</label>
          <input type="text" value={creditCardNumber} onChange={(e) => setCreditCardNumber(e.target.value)} />
        </div>
        {/* TODO SET PAYMENT AUTHORIZATION WITH DB  */}
        <Button
          color="success"
          onClick={() => {
            // Call a function to handle credit card authorization
            // For simplicity, let's assume the order is authorized here
            setOrderCompleted(true);
          }}
        >
          Complete Order
        </Button>
      </form>
    </div>
  );
}

export default CartPage;
