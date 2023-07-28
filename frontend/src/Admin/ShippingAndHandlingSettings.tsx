import React, { useState } from 'react';

function ShippingAndHandlingSettings() {
  // State to manage weight bracket inputs
  const [weightBrackets, setWeightBrackets] = useState([
    { minWeight: 0, maxWeight: 1, charge: 5.0 },
    { minWeight: 1, maxWeight: 5, charge: 10.0 },
    { minWeight: 5, maxWeight: 10, charge: 15.0 },
    // Add more weight brackets as needed
  ]);

  // Function to handle changes in weight brackets
  const handleWeightBracketChange = (index, field, value) => {
    setWeightBrackets((prevBrackets) =>
      prevBrackets.map((bracket, i) =>
        i === index ? { ...bracket, [field]: value } : bracket
      )
    );
  };

  // Function to add a new weight bracket
  const addWeightBracket = () => {
    setWeightBrackets((prevBrackets) => [
      ...prevBrackets,
      { minWeight: 0, maxWeight: 0, charge: 0.0 },
    ]);
  };

  // Function to remove a weight bracket
  const removeWeightBracket = (index) => {
    setWeightBrackets((prevBrackets) =>
      prevBrackets.filter((_, i) => i !== index)
    );
  };

  return (
    <div>
      <h2>Shipping and Handling Settings</h2>
      {weightBrackets.map((bracket, index) => (
        <div key={index}>
          <label htmlFor={`minWeight-${index}`}>Min Weight:</label>
          <input
            id={`minWeight-${index}`}
            type="number"
            value={bracket.minWeight}
            onChange={(e) =>
              handleWeightBracketChange(index, 'minWeight', e.target.value)
            }
          />
          <label htmlFor={`maxWeight-${index}`}>Max Weight:</label>
          <input
            id={`maxWeight-${index}`}
            type="number"
            value={bracket.maxWeight}
            onChange={(e) =>
              handleWeightBracketChange(index, 'maxWeight', e.target.value)
            }
          />
          <label htmlFor={`charge-${index}`}>Charge ($):</label>
          <input
            id={`charge-${index}`}
            type="number"
            step="0.01"
            value={bracket.charge}
            onChange={(e) =>
              handleWeightBracketChange(index, 'charge', parseFloat(e.target.value))
            }
          />
          <button onClick={() => removeWeightBracket(index)}>Remove</button>
        </div>
      ))}
      <button onClick={addWeightBracket}>Add Weight Bracket</button>
      <button>Save Settings</button>
    </div>
  );
}

export default ShippingAndHandlingSettings;


