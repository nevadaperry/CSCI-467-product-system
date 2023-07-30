import React from 'react';
import { Button, Input, Spinner, Table } from 'reactstrap';
import * as api from '../api';
import { useLoad } from '../custom-hooks';

function CustomerHome() {
  const [products, productsLoad] = useLoad(api.listProducts, [{}]);

  return (
    <div>
      <h1>Customer</h1>
      {(productsLoad.status === 'loading' && <Spinner />) || (
        <Table className="ps-no-break">
          <thead>
            <tr>
              <th></th>
              <th></th>
              <th className="ps-left">Description</th>
              <th className="ps-right">Weight</th>
              <th className="ps-right">Price</th>
              <th className="ps-right">Quantity</th>
            </tr>
          </thead>
          {products!.map((product) => (
            <tr>
              <td className="ps-cell ps-right">#{product.part_number}</td>
              <td className="ps-cell ps-right">
                <img src={product.picture_url} alt="Product" />
              </td>
              <td className="ps-cell ps-left">{product.description}</td>
              <td className="ps-cell ps-right">{product.weight} lb</td>
              <td className="ps-cell ps-right">${product.price}</td>
              <td className="ps-cell ps-right">
                {product.quantity} left in stock
              </td>
              <td className="ps-cell ps-left">
                <span>Qty:</span>
                <Input type="number" value="1" className="ps-input w-25" />
                <span></span>
                <Button className="ps-input" color="success">
                  Add to cart
                </Button>
              </td>
            </tr>
          ))}
        </Table>
      )}
    </div>
  );
}

export default CustomerHome;
