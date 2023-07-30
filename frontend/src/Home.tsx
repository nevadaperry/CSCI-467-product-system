import React from 'react';
import './global.scss';

export default function Home() {
  return (
    <div>
      <header>
        <h2>Welcome to Product System!</h2>
        <p>
          <span className="badge bg-success">
            Your source for all things automotive.
          </span>
        </p>
        <p>Select a system above to get started.</p>
      </header>
    </div>
  );
}
