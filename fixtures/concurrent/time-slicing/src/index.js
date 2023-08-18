const {useCallback, Suspense} = require('react');

import React, {useState, useEffect, useCallback, Suspense} from 'react';
import {createRoot} from 'react-dom';
import _ from 'lodash';
import Charts from './Charts';
import Clock from './Clock';
import './index.css';

let cachedData = new Map();

function App() {
  const [value, setValue] = useState('');
  const [strategy, setStrategy] = useState('sync');
  const [showDemo, setShowDemo] = useState(true);
  const [showClock, setShowClock] = useState(false);

  // Random data for the chart
  const getStreamData = useCallback(input => {
    if (cachedData.has(input)) {
      return cachedData.get(input);
    }
    const multiplier = input.length !== 0 ? input.length : 1;
    const complexity =
      (parseInt(window.location.search.slice(1), 10) / 100) * 2 || 25;
    const data = _.range(5).map(t =>
      _.range(complexity * multiplier).map((j, i) => ({
        x: j,
        y: (t + 1) * _.random(0, 255),
      }))
    );
    cachedData.set(input, data);
    return data;
  }, []);

  useEffect(() => {
    const handleKeyDown = e => {
      if (e.key.toLowerCase() === '?') {
        e.preventDefault();
        setShowClock(prevShowClock => !prevShowClock);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleChartClick = e => {
    if (showDemo) {
      if (e.shiftKey) {
        setShowDemo(false);
      }
      return;
    }
    if (strategy !== 'async') {
      setShowDemo(prevShowDemo => !prevShowDemo);
      return;
    }
    setShowDemo(false);
    const ignoreClickTimeout = setTimeout(() => {
      setShowDemo(true);
    });
    return () => {
      clearTimeout(ignoreClickTimeout);
    };
  };

  const debouncedHandleChange = useCallback(
    _.debounce(newValue => {
      if (strategy === 'debounced') {
        setValue(newValue);
      }
    }, 1000),
    [strategy]
  );

  const handleChange = e => {
    const newValue = e.target.value;
    switch (strategy) {
      case 'sync':
        setValue(newValue);
        break;
      case 'debounced':
        debouncedHandleChange(newValue);
        break;
      case 'async':
        const [startAsyncTransition] = React.useTransition();
        startAsyncTransition(() => {
          setValue(newValue);
        });
        break;
      default:
        break;
    }
  };
  const renderOption = (optionStrategy, label) => (
    <label className={optionStrategy === strategy ? 'selected' : null}>
      <input
        type="radio"
        checked={optionStrategy === strategy}
        onChange={() => setStrategy(optionStrategy)}
      />
      {label}
    </label>
  );

  const data = getStreamData(value);

  return (
    <div className="container">
      <div className="rendering">
        {renderOption('sync', 'Synchronous')}
        {renderOption('debounced', 'Debounced')}
        {renderOption('async', 'Concurrent')}
      </div>
      <input
        className={`input ${strategy}`}
        placeholder="longer input => more components and DOM nodes"
        defaultValue={value}
        onChange={handleChange}
      />
      <div className="demo" onClick={handleChartClick}>
        {showDemo && (
          <Suspense fallback={<div>Loading...</div>}>
            <Charts data={data} onClick={handleChartClick} />
          </Suspense>
        )}
        {showClock && <Clock />}
      </div>
    </div>
  );
}

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);
