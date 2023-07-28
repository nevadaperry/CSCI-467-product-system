import React from 'react';

// Sample data to represent orders
const sampleOrders = [
  {
    order_id: 1,
    order_date: '2023-07-26T12:34:56', // Sample timestamp
    total_price: 100.0,
  },
  {
    order_id: 2,
    order_date: '2023-07-27T10:20:30', // Sample timestamp
    total_price: 150.0,
  },
  // Add more sample orders if needed
];

function OrderListing() {
  // Placeholder for search box data/state (from OrderSearch.tsx)
  // const [searchTerm, setSearchTerm] = useState('');

  return (
    <div>
      {/* Add search box here (from OrderSearch.tsx) */}
      {/* <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /> */}

      {/* Order Listing Table */}
      <table>
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Order Date</th>
            <th>Order Total</th>
            <th>Details</th>
          </tr>
        </thead>
        <tbody>
          {/* Map through the sample orders and display each row in the table */}
          {sampleOrders.map((order) => (
            <tr key={order.order_id}>
              <td>{order.order_id}</td>
              <td>
                {/* Format the date using toLocaleDateString() */}
                {new Date(order.order_date).toLocaleDateString()}
              </td>
              <td>${order.total_price}</td>
              <td>
                {/* Button to show more details (link to OrderDetails.tsx) */}
                <button onClick={() => console.log('Show more details')}>
                  Details
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default OrderListing;
