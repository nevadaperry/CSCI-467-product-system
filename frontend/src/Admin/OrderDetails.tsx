import React from 'react';
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Spinner,
} from 'reactstrap';
import { useLoad } from '../custom-hooks';
import * as api from '../api'; // Import the api file
function OrderDetails({ isOpen, toggleModal, orderId }) {
  const [order, orderLoad] = useLoad(() => api.readOrder(orderId), orderId); // Fetch order details from the API
  const [feeSchedule, feeScheduleLoad] = useLoad(() => api.readFeeSchedule()); // Fetch fee schedule from the API
  if (!isOpen) {
    // If the modal is not open, don't render anything
    return null;
  }
  if (orderLoad.status === 'loading' || feeScheduleLoad.status === 'loading') {
    return <Spinner />;
  }
  if (!order) {
    // If order is not available, show an error message or handle it accordingly
    return <div>Error: Order not found.</div>;
  }
  if (!feeSchedule) {
    // If fee schedule is not available, show an error message or handle it accordingly
    return <div>Error: Shipping fee info not found</div>;
  }
  // Function to calculate the amount without shipping
  const calculateAmountWithoutShipping = () => {
    let amount = 0;
    order.line_items.forEach((item) => {
      amount += item.product!.price * item.quantity;
    });
    return amount;
  };
  // Function to calculate the shipping cost
  const calculateShipping = () => {
    let shipping = 0;
    const weight = order.line_items.reduce((totalWeight, item) => {
      return totalWeight + item.product!.weight * item.quantity;
    }, 0);
    // Find the relevant shipping fee from the fee schedule
    feeSchedule.weight_brackets.forEach((bracket) => {
      if (weight >= bracket.lower_bound) {
        shipping = bracket.fee;
      }
    });
    return shipping;
  };
  // Function to handle closing the modal
  const handleCloseModal = () => {
    toggleModal();
  };
  return (
    <Modal isOpen={isOpen} toggle={handleCloseModal} size="lg">
      <ModalHeader toggle={handleCloseModal}>
        Order ID: {order.id} | Order Status: {order.status}
      </ModalHeader>
      <ModalBody>
        <h5>Order Date: {new Date(order.date_placed!).toLocaleDateString()}</h5>
        <h5>Customer Info:</h5>
        <p>
          Customer Name: {order.customer_name} [#{order.customer_id}]
        </p>
        <p>Customer Address: {order.shipping_address}</p>
        {/* <p>Customer Email: {order.customer.email}</p> */}
        <p>Credit Card Info: **** **** **** {order.cc_last_four}</p>
        <p>Payment authorization number: {order.auth_number}</p>
        <h5>Order Items </h5>
        <ul>
          {order.line_items.map((item) => (
            <li key={item.product_id}>
              Product: {item.product?.description} | Amount: {item.quantity} |
              Cost: ${item.product?.price} | Weight: {item.product?.weight}
            </li>
          ))}
        </ul>
        <h5> Total cost :</h5>
        <p>
          Amount (without shipping): $
          {calculateAmountWithoutShipping().toFixed(2)}
        </p>
        <p>Shipping: ${calculateShipping()}</p>
        <h4>
          Total: ${calculateAmountWithoutShipping() + calculateShipping()}
        </h4>
      </ModalBody>
      <ModalFooter>
        <Button color="secondary" onClick={handleCloseModal}>
          Close
        </Button>
      </ModalFooter>
    </Modal>
  );
}
export default OrderDetails;
