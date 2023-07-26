import { faHouse } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React from 'react';

function Home() {
  return (
    <div>
      <header>
        <h1 className="text-3xl font-bold underline">Home page</h1>
        <FontAwesomeIcon icon={faHouse} />
        <a href="https://reactjs.org" target="_blank" rel="noopener noreferrer">
          Learn React
        </a>
      </header>
    </div>
  );
}

export default Home;
