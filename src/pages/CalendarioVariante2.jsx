import React from 'react';
import HopfButton from '../components/HopfButton.jsx';

function CalendarioVariante2() {
  const handleButtonClick = (current) => {
    console.log('Showing:', current);
  };

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      <HopfButton
        onClick={handleButtonClick}
        size={600}
      />
    </div>
  );
}

export default CalendarioVariante2;
