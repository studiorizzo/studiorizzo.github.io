import React from 'react';
import CalendarVariant2 from '../../calendar/calendar_variant2.jsx';
import HopfButton from '../components/HopfButton.jsx';

function CalendarioVariante2(props) {
  const handleButtonClick = () => {
    alert('Hopf Button clicked!');
  };

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
      padding: '20px',
      boxSizing: 'border-box',
      background: '#f0f0f0'
    }}>
      {/* Demo del HopfButton */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '20px',
        padding: '40px',
        background: '#1a1a2e',
        borderRadius: '16px'
      }}>
        <h2 style={{ color: '#fff', margin: 0, fontFamily: 'monospace' }}>
          Hopf Button (Three.js)
        </h2>
        <p style={{ color: '#aaa', margin: 0, fontFamily: 'monospace', fontSize: '14px' }}>
          Hopf fibration con proiezione stereografica S³→R³
        </p>

        <div style={{ display: 'flex', gap: '40px', alignItems: 'center' }}>
          <HopfButton
            onClick={handleButtonClick}
            size={150}
            label="Login"
          />
          <HopfButton
            onClick={handleButtonClick}
            size={200}
            label="Enter"
          />
          <HopfButton
            onClick={handleButtonClick}
            size={120}
            label="Go"
          />
        </div>
      </div>

      {/* Versione originale Canvas per confronto */}
      <div style={{
        flex: 1,
        minHeight: '400px',
        borderRadius: '16px',
        overflow: 'hidden'
      }}>
        <CalendarVariant2 {...props} />
      </div>
    </div>
  );
}

export default CalendarioVariante2;
