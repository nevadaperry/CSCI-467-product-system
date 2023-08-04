import React, { useState } from 'react';
import * as api from '../api';
import { useLoad } from '../custom-hooks';
import { Button, Spinner, Table } from 'reactstrap';
import OrderDetails from './OrderDetails'; // Import the OrderDetails component

function OrderListing() {
  const [orders, ordersLoad] = useLoad(() => api.listOrders({}), 0); // Fetch orders from the API
  const [selectedOrderId, setSelectedOrderId] = useState(null); // State to store the selected orderId

  if (ordersLoad.status === 'loading') {
    return <Spinner />;
  }

  if (!orders) {
    return <div>Error: Error with connecting to database</div>;
  }

  // Function to handle opening the details modal
  const handleDetailsButtonClick = (orderId) => {
    setSelectedOrderId(orderId); // Store the selected orderId in state
  };

  // Function to handle closing the details modal
  const handleCloseModal = () => {
    setSelectedOrderId(null); // Clear the selected orderId to close the modal
  };

  return (
    <div>
      <header>
        <h2>Order Listing Table</h2>
      </header>
      <Table className="ps-no-break">
        <thead>
          <tr>
            <th scope="col">Order ID</th>
            <th scope="col">Order Date</th>
            <th scope="col">Order Total</th>
            <th scope="col">Details</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id}>
              <td>{order.id}</td>
              <td>{new Date(order.date_placed!).toLocaleDateString()}</td>
              <td>${order.total_price}</td>
              <td>
                {/* Button to open OrderDetail */}
                <Button onClick={() => handleDetailsButtonClick(order.id)}>
                  Details
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      {/* Modal for displaying OrderDetails */}
      {selectedOrderId && (
        <OrderDetails
          isOpen={true}
          toggleModal={handleCloseModal}
          orderId={selectedOrderId}
        />
      )}
    </div>
  );
}

export default OrderListing;
