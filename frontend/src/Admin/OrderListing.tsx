import React, { useEffect, useMemo, useState } from 'react';
import * as api from '../api';
import moment from 'moment';
import { useLoad } from '../custom-hooks';
import {
  Button,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownToggle,
  Input,
  Label,
  Modal,
  ModalBody,
  ModalHeader,
  Spinner,
  Table,
} from 'reactstrap';
import { DateRangePicker } from 'react-date-range';
import OrderDetails from './OrderDetails'; // Import the OrderDetails component

function OrderListing() {
  const [dateRanges, setDateRanges] = useState([
    {
      startDate: new Date('2000-01-02'),
      endDate: new Date('2043-12-31'),
      key: 'selection',
    },
  ]);
  const [statusFilterIsOpen, setStatusFilterIsOpen] = useState(false);
  const [dateModalIsOpen, setDateModalIsOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<
    'authorized' | 'shipped' | undefined
  >(undefined);
  const [priceLowerBound, setPriceLowerBound] = useState(0);
  const [priceUpperBound, setPriceUpperBound] = useState(477777);
  const filters = useMemo(() => {
    return {
      date_lower_bound: dateRanges[0]?.startDate,
      date_upper_bound: dateRanges[0]?.endDate,
      status: statusFilter,
      price_lower_bound: Number.isNaN(priceLowerBound) ? 0 : priceLowerBound,
      price_upper_bound: Number.isNaN(priceUpperBound)
        ? 477777
        : priceUpperBound,
    };
  }, [dateRanges, statusFilter, priceLowerBound, priceUpperBound]);
  const [refreshOrdinal, setRefreshOrdinal] = useState(0);
  const [orders, ordersLoad] = useLoad(
    () => api.listOrders(filters),
    refreshOrdinal
  ); // Fetch orders from the API
  const [selectedOrderId, setSelectedOrderId] = useState(null); // State to store the selected orderId
  useEffect(() => {
    setRefreshOrdinal(refreshOrdinal + 1);
  }, [filters]);

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
        <Modal
          className="ps-fit-content"
          isOpen={dateModalIsOpen}
          toggle={() => setDateModalIsOpen(!dateModalIsOpen)}
        >
          <ModalHeader toggle={() => setDateModalIsOpen(false)}>
            Date range for order search
          </ModalHeader>
          <ModalBody>
            <DateRangePicker
              onChange={(item) => setDateRanges([item.selection])}
              showSelectionPreview={true}
              moveRangeOnFirstSelection={false}
              months={2}
              ranges={dateRanges}
              direction="horizontal"
            />
          </ModalBody>
        </Modal>
        <Table>
          <tr>
            <td>
              <Button
                onClick={() => setDateModalIsOpen(true)}
                color="secondary"
              >
                Select date range [
                {moment(filters.date_lower_bound).format('M/D/YYYY')} to{' '}
                {moment(filters.date_upper_bound).format('M/D/YYYY')}]
              </Button>
            </td>
            <td>
              <Dropdown
                isOpen={statusFilterIsOpen}
                toggle={() => setStatusFilterIsOpen(!statusFilterIsOpen)}
              >
                <DropdownToggle caret>
                  Status filter [{statusFilter ? statusFilter : 'any'}]
                </DropdownToggle>
                <DropdownMenu>
                  <DropdownItem onClick={() => setStatusFilter(undefined)}>
                    Any
                  </DropdownItem>
                  <DropdownItem onClick={() => setStatusFilter('authorized')}>
                    Authorized
                  </DropdownItem>
                  <DropdownItem onClick={() => setStatusFilter('shipped')}>
                    Shipped
                  </DropdownItem>
                </DropdownMenu>
              </Dropdown>
            </td>
          </tr>
          <tr>
            <td>
              <Label className="ps-inline-flex">Price lower bound:&nbsp;</Label>
              <Input
                className="ps-inline-flex"
                type="number"
                step="0.01"
                value={priceLowerBound}
                onChange={(e) => setPriceLowerBound(parseFloat(e.target.value))}
              />
            </td>
            <td>
              <Label className="ps-inline-flex">Price upper bound:&nbsp;</Label>
              <Input
                className="ps-inline-flex"
                type="number"
                step="0.01"
                value={priceUpperBound}
                onChange={(e) => setPriceUpperBound(parseFloat(e.target.value))}
              />
            </td>
          </tr>
        </Table>
      </header>
      {ordersLoad.status === 'loading' ? (
        <Spinner />
      ) : !orders ? (
        <div>Error: Error with connecting to database</div>
      ) : (
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
            {orders.length === 0 && (
              <span className="ps-center">No orders found.</span>
            )}
          </tbody>
        </Table>
      )}

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
