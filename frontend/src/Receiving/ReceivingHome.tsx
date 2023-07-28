import React, { useState } from 'react';
import { Button } from 'reactstrap';
import * as api from '../api';

function ReceivingHome() {
  const [text, setText] = useState('Default');
  return (
    <div>
      <header>
        <h1>Receiving</h1>
      </header>
      <Button
        onClick={() => {
          console.log('hello');
          api.readFeeSchedule().then((result) => {
            setText('New ' + JSON.stringify(result));
          });
        }}
        color="primary"
      >
        Button
      </Button>
      <p>1: {text}</p>
    </div>
  );
}

export default ReceivingHome;
