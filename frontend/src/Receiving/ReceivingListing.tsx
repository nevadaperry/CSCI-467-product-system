import React, { useEffect, useMemo, useState } from 'react';
import { Button, Input, Spinner, Table } from 'reactstrap';
import * as api from '../api';
import { useLoad } from '../custom-hooks';
import { Product } from '../../../shared/resource';

function ReceivingListing() {
  const [idFilter, setIdFilter] = useState('');
  const [descriptionFilter, setDescriptionFilter] = useState('');
  const [refreshOrdinal, setRefreshOrdinal] = useState(0);
  const productFilters = useMemo(() => {
    setRefreshOrdinal(refreshOrdinal + 1);
    return { id: idFilter, description: descriptionFilter };
  }, [idFilter, descriptionFilter]);
  const [products, productsLoad] = useLoad(
    () => api.listProducts(productFilters),
    refreshOrdinal
  );

  const [listQuantities, setListQuantities] = useState<number[]>([]);
  useEffect(() => {
    setListQuantities(products?.map((product) => product.quantity) ?? []);
  }, [products]);

  const updateStock = (item: Product, index: number) => {
    api.updateProduct(item.id!, item, {
      ...item,
      quantity: listQuantities[index],
    });
  };

  return (
    <div>
      <header>
        <h2>Product Listing</h2>
        <Table>
          <tbody>
            <tr>
              <td>
                <Input
                  placeholder="Search for description..."
                  value={descriptionFilter}
                  className="ps-input"
                  onChange={(e) => setDescriptionFilter(e.target.value)}
                />
              </td>
              <td>
                <Input
                  type="number"
                  placeholder="Search for part number..."
                  value={idFilter}
                  className="ps-input"
                  onChange={(e) => setIdFilter(e.target.value)}
                />
              </td>
            </tr>
          </tbody>
        </Table>
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
          <tbody>
            {products
              ?.sort((a, b) => a.part_number - b.part_number)
              .map((product, index) => (
                <tr key={product.id}>
                  <td className="ps-cell ps-right">#{product.part_number}</td>
                  <td className="ps-cell ps-right">
                    <img src={product.picture_url} alt="Product" />
                  </td>
                  <td className="ps-cell ps-left">{product.description}</td>
                  <td className="ps-cell ps-right">{product.weight} lb</td>
                  <td className="ps-cell ps-right">${product.price}</td>
                  <td className="ps-cell ps-right">
                    {product.quantity} in stock
                  </td>
                  <td className="ps-cell ps-left">Qty:</td>
                  <td className="ps-cell ps-left">
                    <Input
                      type="number"
                      min="0"
                      value={listQuantities[index]}
                      className="ps-input"
                      onChange={(e) =>
                        setListQuantities({
                          ...listQuantities,
                          [index]: +e.target.value,
                        })
                      }
                    />
                  </td>
                  <td className="ps-cell ps-left">
                    <Button
                      className="ps-input"
                      color="success"
                      onClick={() => {
                        updateStock(product, index);
                        setRefreshOrdinal((v) => v + 1);
                      }}
                    >
                      Update
                    </Button>
                  </td>
                </tr>
              ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}

export default ReceivingListing;
