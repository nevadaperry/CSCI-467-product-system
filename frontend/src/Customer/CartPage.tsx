import React, { useState } from 'react';
import { Table, Button } from 'reactstrap';
import { createOrder } from '../api';
import { useNavigate } from 'react-router-dom';



function CartPage({
  cartItems,
  setCartItems,
  totalPrice,
  setTotalPrice,
  orderCompleted,
  setOrderCompleted,
}) {
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [creditCardNumber, setCreditCardNumber] = useState('');
  const [orderAuthNumber, setOrderAuthNumber] = useState('');

  const [creditCardExp, setCreditCardExp] = useState('');
  const [creditCardCVV, setCreditCardCVV] = useState('');
  const [cardholderName, setCardholderName] = useState('');

  const [shippingAddress, setShippingAddress] = useState('');
  const [useSameAddress, setUseSameAddress] = useState(false);
  
  let navigate = useNavigate()

  const handleClick = () => {
   
    setCartItems([]);
    setTotalPrice(0);
    setOrderCompleted(false); 
    navigate('./Home')
 }


  const RemoveItem = (productId) => {
    const updatedCart = cartItems.filter((item) => item.id !== productId);
    setCartItems(updatedCart);
    const newTotalPrice = updatedCart.reduce(
      (total, item) => total + item.price * item.quantitySelected,
      0
    );
    setTotalPrice(newTotalPrice);
  };

  const CreditCardNumberChange = (e) => {
    const newCreditCardNumber = e.target.value.replace(/\D/g, '').slice(0, 16);
    setCreditCardNumber(newCreditCardNumber);
  };

  const CreditCardExpChange = (e) => {
    const newCreditCardExp = e.target.value;
    setCreditCardExp(newCreditCardExp);
  };

  const CreditCardCVVChange = (e) => {
    const newCreditCardCVV = e.target.value.replace(/\D/g, '').slice(0, 4); // Assuming CVV has 4 digits
    setCreditCardCVV(newCreditCardCVV);
  };

  const CardholderNameChange = (e) => {
    const newCardholderName = e.target.value;
    setCardholderName(newCardholderName);
  };

  const comepleteOrder = async (event) => {
    console.log('Complete Order button clicked'); // Add this line

    event.preventDefault();
    try {
      const orderData = {
        customer_name: customerName,
        customer_email: customerEmail,
        customer_address: customerAddress,
        line_items: cartItems.map((item) => ({
          product_id: item.id,
          quantity: item.quantitySelected,
        })),
        cc_full: {
          digits: creditCardNumber,
          exp: creditCardExp,
          cvv: creditCardCVV,
          cardholder_name: cardholderName,
        },
        shipping_address: useSameAddress ? customerAddress : shippingAddress,
      };

      const response = await createOrder(orderData);
      setOrderAuthNumber(response.auth_number!);
      setOrderCompleted(true);

      await sendConfirmationEmail(response.id);

    } catch (error) {
      console.error('Error creating order:', error);
          console.error('Error response:', error.response); // Add this line

    }
  };

  const sendConfirmationEmail = async (orderId) => {
    try {
      // Make an API call to your backend to trigger email sending
      const response = await fetch(`/api/send-email/${orderId}`, {
        method: 'POST',
      });

      if (response.ok) {
        console.log('Confirmation email sent successfully');
      } else {
        console.error('Failed to send confirmation email');
      }
    } catch (error) {
      console.error('Error sending confirmation email:', error);
    }
  };


  if (orderCompleted) {
    return (
      <div>
        <h2>Order Complete</h2>
        <p>Order Auth Number: {orderAuthNumber}</p>
        <p>Oder Name: {customerName}</p>
        <p>Confirmation Email: {customerEmail}</p>
        <p>Thank you for your purchase!
        <button onClick={handleClick}> Return </button>
        </p>
      </div>
    );
  }

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
                <Button color="danger" onClick={() => RemoveItem(item.id)}>
                  {' '}
                  Remove
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
      <p>Total Price: ${totalPrice.toFixed(2)}</p>
      <form>
        <div>
          <label>Name:</label>
          <input
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
          />
        </div>
        <div>
          <label>Email:</label>
          <input
            type="text"
            value={customerEmail}
            onChange={(e) => setCustomerEmail(e.target.value)}
          />
        </div>
        <div>
          <label>Address:</label>
          <input
            type="text"
            value={customerAddress}
            onChange={(e) => setCustomerAddress(e.target.value)}
          />
        </div>
        <div>
          <label>Shipping Address:</label>
          <input
            type="text"
            value={shippingAddress}
            onChange={(e) => setShippingAddress(e.target.value)}
          />
        </div>

        <div>
          <label>Use same address for shipping:</label>
          <input
            type="checkbox"
            checked={useSameAddress}
            onChange={(e) => setUseSameAddress(e.target.checked)}
          />
        </div>
        <div>
          <label>Credit Card Number:</label>
          <input
            type="text"
            value={creditCardNumber}
            onChange={CreditCardNumberChange}
            maxLength={16}
          />
        </div>
        <div>
          <label>Credit Card Expiration:</label>
          <input
            type="text"
            value={creditCardExp}
            onChange={CreditCardExpChange}
          />
        </div>
        <div>
          <label>Credit Card CVV:</label>
          <input
            type="text"
            value={creditCardCVV}
            onChange={CreditCardCVVChange}
            maxLength={4} 
          />
        </div>
        <div>
          <label>Cardholder's Name:</label>
          <input
            type="text"
            value={cardholderName}
            onChange={CardholderNameChange}
          />
        </div>
        {/* TODO SET PAYMENT AUTHORIZATION WITH DB  */}
        <Button color="success" onClick={(e) => comepleteOrder(e)}>
          Complete Order
        </Button>
      </form>
    </div>
  );
}

export default CartPage;
