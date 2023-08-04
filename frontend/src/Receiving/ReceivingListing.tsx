import React, { useState } from 'react';
import { Button, Input, Spinner, Table } from 'reactstrap';
import * as api from '../api';
import { useLoad } from '../custom-hooks';
import { Product } from '../../../shared/resource';

function ProductListing() {
  const [products, productsLoad] = useLoad(() => api.listProducts({}), 0);
  
  const [quantiti, setQuantiti] = useState(1);
  
  const updateStock = (item: Product, updatedQuantity) => {
    api.updateProduct(item.id, item, {...item, quantity:updatedQuantity});
  };

  const handleChange = (event) => {
    setQuantiti(event.target.value);
  };

  return (
    <div>
      <header>
        <h2>Product Listing</h2>
      </header>
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
            <tr key={product.id}>
              <td className="ps-cell ps-right">#{product.part_number}</td>
              <td className="ps-cell ps-right">
                <img src={product.picture_url} alt="Product" />
              </td>
              <td className="ps-cell ps-left">{product.description}</td>
              <td className="ps-cell ps-right">{product.weight} lb</td>
              <td className="ps-cell ps-right">${product.price}</td>
              <td className="ps-cell ps-right">{product.quantity} in stock</td>
              <td className="ps-cell ps-left">Qty:</td>
              <td className="ps-cell ps-left">
                <Input type="number" value={quantiti} id="quantiti" className="ps-input" onChange={handleChange} />
              </td>
              <td className="ps-cell ps-left">
                <Button className="ps-input" color="success" onClick={() => updateStock(product, quantiti)}>
                  Update
                </Button>
              </td>
            </tr>
          ))}
        </Table>
      )}
    </div>
  );
}

export default ProductListing;
