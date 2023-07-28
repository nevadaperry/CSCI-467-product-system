// export default ShippingAndHandlingSettings;
import React, { useState } from 'react';
import { Button, Input, Label } from 'reactstrap';

function ShippingAndHandlingSettings() {
  const FREE_SHIPPING_CHARGE = 'Free';
  const OVER_100_LBS = 9999 ; // Some large value to represent over 100 lbs (adjust as needed)
  // Sample default weight brackets and charges
  const defaultWeightBrackets = [
    { minWeight: 0, maxWeight: 1, charge: FREE_SHIPPING_CHARGE },
    { minWeight: 1, maxWeight: 2, charge: 0.99 },
    { minWeight: 2, maxWeight: 5, charge: 1.99 },
    { minWeight: 5, maxWeight: 10, charge: 5.99 },
    { minWeight: 10, maxWeight: 25, charge: 9.99 },
    { minWeight: 25, maxWeight: 50, charge: 12.99 },
    { minWeight: 50, maxWeight: 100, charge: 25.99 },
    { minWeight: 100, maxWeight: OVER_100_LBS, charge: 49.99 },
    // Add more weight brackets up to 100 lbs as needed
  ];

  // State to manage weight bracket inputs
  const [weightBrackets, setWeightBrackets] = useState(defaultWeightBrackets);
  const [newWeight, setNewWeight] = useState(0);
  const [newCharge, setNewCharge] = useState(0.0);

  // Function to add a new weight bracket
const addWeightBracket = () => {
  const newBracket = { minWeight: weightBrackets[weightBrackets.length - 1].maxWeight, maxWeight: newWeight, charge: newCharge };
  const sortedBrackets = [...weightBrackets, newBracket].sort((a, b) => a.maxWeight - b.maxWeight);

  for (let i = 1; i < sortedBrackets.length; i++) {
    sortedBrackets[i].minWeight = sortedBrackets[i - 1].maxWeight;
  }

  setWeightBrackets(sortedBrackets);
  setNewWeight(0);
  setNewCharge(0.0);
};
 // Function to remove a weight bracket
const removeWeightBracket = (index) => {
  setWeightBrackets((prevBrackets) => {
    const updatedBrackets = prevBrackets.filter((_, i) => i !== index);

    // Recalculate minWeight based on the new sorted order
    for (let i = 1; i < updatedBrackets.length; i++) {
      updatedBrackets[i].minWeight = updatedBrackets[i - 1].maxWeight;
    }

    return updatedBrackets;
  });
};
  const generateWeightBracketRows = () => {
    return weightBrackets.map((bracket, index) => (
      <tr key={index}>
        <td>from {bracket.minWeight}</td>
        <td> to {bracket.maxWeight} lbs</td>
        <td>{bracket.charge}</td>
        <td>
        <Button color="danger" onClick={() => removeWeightBracket(index)}>
          Remove
        </Button>
      </td>
      </tr>
    ));
  };

  return (
    <div>
      <h2>Shipping and Handling Settings</h2>
      <div className="container">
        {weightBrackets.map((bracket, index) => (
          <div className="row my-3" key={index}>
            {/* ... Rest of the code ... */}
          </div>
        ))}
        <table className="table">
          <thead>
            <tr>
              <th>Min Weight</th>
              <th>Max Weight</th>
              <th>Charge ($)</th>
            </tr>
          </thead>
          <tbody>{generateWeightBracketRows()}</tbody>
        </table>
        {/* ... Rest of the code ... */}
        <div>
          <Label htmlFor="newWeight">New Weight (lbs) :</Label>
          <Input
            id="newWeight"
            type="number"
            value={newWeight}
            onChange={(e) => setNewWeight(parseFloat(e.target.value))}
          />
        </div>
        <div>
          <Label htmlFor="newCharge">New Charge ($):</Label>
          <Input
            id="newCharge"
            type="number"
            step="0.01"
            value={newCharge}
            onChange={(e) => setNewCharge(parseFloat(e.target.value))}
          />
        </div>
        <Button onClick={addWeightBracket}>Add Weight Bracket</Button>
        <Button color="success">Save Settings</Button>
      </div>
    </div>
  );
}

export default ShippingAndHandlingSettings;

