import React from 'react';
import { useTheme } from '../src/context/ThemeContext';

// Variante 2 - In sviluppo
export default function CalendarVariant2() {
  const { mode } = useTheme();

  const bgColor = mode === 'dark' ? '#0E1416' : '#F5FAFC';
  const textColor = mode === 'dark' ? '#DEE3E5' : '#171D1E';

  return (
    <div style={{
      width: '100%',
      height: '100%',
      background: bgColor,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <p style={{
        color: textColor,
        fontFamily: "'Orbitron', sans-serif",
        fontSize: '14px'
      }}>
        Variante 2 - In sviluppo
      </p>
    </div>
  );
}
