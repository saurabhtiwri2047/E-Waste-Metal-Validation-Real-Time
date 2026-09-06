import React, { useState } from 'react';

const METAL_UNITS = {
  g: 1,
  oz: 31.1035, // troy ounce in grams
  kg: 1000,
  lb: 453.592 // pound in grams
};

// Historical trends mock database (7 days)
const HISTORY_DATA = {
  gold: [78.2, 79.5, 78.8, 80.2, 80.5, 81.4, 82.2],
  silver: [0.88, 0.91, 0.90, 0.94, 0.93, 0.95, 0.97],
  copper: [0.0092, 0.0094, 0.0093, 0.0096, 0.0095, 0.0098, 0.0099],
  aluminium: [0.0024, 0.0025, 0.0024, 0.0026, 0.0025, 0.0026, 0.0027],
  palladium: [31.5, 32.1, 31.9, 32.8, 33.2, 33.8, 34.4]
};

export default function MetalRates({ prices }) {
  const [selectedMetal, setSelectedMetal] = useState('gold');
  const [calcMetal, setCalcMetal] = useState('gold');
  const [calcWeight, setCalcWeight] = useState(10);
  const [calcUnit, setCalcUnit] = useState('g');

  const currentPriceG = prices[calcMetal] || 0;
  const unitGrams = METAL_UNITS[calcUnit];
  const calculatedVal = (currentPriceG * calcWeight * unitGrams).toFixed(2);

  // Helper to generate SVG polyline path coordinates
  const getHistoricalPoints = (metalName) => {
    const values = HISTORY_DATA[metalName.toLowerCase()] || [10, 10, 10, 10, 10, 10, 10];
    const width = 600;
    const height = 200;
    const padding = 15;
    
    const minVal = Math.min(...values) * 0.98;
    const maxVal = Math.max(...values) * 1.02;
    const range = maxVal - minVal;

    const points = values.map((val, idx) => {
      const x = padding + (idx * (width - padding * 2)) / (values.length - 1);
      const y = height - padding - ((val - minVal) * (height - padding * 2)) / range;
      return `${x},${y}`;
    });

    return points.join(' ');
  };

  const getPointsList = (metalName) => {
    return getHistoricalPoints(metalName);
  };

  return (
    <div className="animate-fade-in" style={{ padding: '0 40px 40px 40px' }}>
      
      {/* Live Market tickers grid */}
      <div className="card-grid" style={{ padding: '24px 0 0 0' }}>
        {[
          { name: 'Gold', key: 'gold', sym: 'Au', color: 'var(--gold)' },
          { name: 'Silver', key: 'silver', sym: 'Ag', color: 'var(--silver)' },
          { name: 'Copper', key: 'copper', sym: 'Cu', color: 'var(--copper)' },
          { name: 'Aluminium', key: 'aluminium', sym: 'Al', color: 'var(--cyan)' },
          { name: 'Palladium', key: 'palladium', sym: 'Pd', color: 'var(--palladium)' }
        ].map(metal => {
          const rateG = prices[metal.key] || 0;
          return (
            <div key={metal.key} className="card" onClick={() => setSelectedMetal(metal.key)} style={{ cursor: 'pointer', borderLeft: selectedMetal === metal.key ? `4px solid ${metal.color}` : '1px solid var(--border-color)', background: selectedMetal === metal.key ? 'var(--card-bg-hover)' : 'var(--card-bg)' }}>
              <div className="card-header-small">
                <span>{metal.name} Market Rate</span>
                <span className="material-icons-outlined card-icon" style={{ color: metal.color }}>show_chart</span>
              </div>
              <div className="card-value" style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                ${rateG.toFixed(4)}
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>/ g</span>
              </div>
              <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-dim)' }}>
                <span>Ounce: ${(rateG * 31.1035).toFixed(2)}</span>
                <span>Kg: ${(rateG * 1000).toFixed(2)}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid-2" style={{ marginTop: '24px' }}>
        
        {/* Historic chart for selected metal */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, textTransform: 'capitalize' }}>{selectedMetal} Rate Trend Index</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Historical valuations over the last 7 sessions</p>
            </div>
            <div className={`metal-badge badge-${selectedMetal}`}>
              {selectedMetal.slice(0, 2).toUpperCase()}
            </div>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div className="chart-container-large">
              <svg width="100%" height="100%" viewBox="0 0 600 200" preserveAspectRatio="none">
                <defs>
                  <linearGradient id={`chart-grad-${selectedMetal}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={`var(--${selectedMetal})`} stopOpacity="0.2" />
                    <stop offset="100%" stopColor={`var(--${selectedMetal})`} stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                {/* Horizontal Gridlines */}
                {[0.25, 0.5, 0.75].map((ratio, idx) => (
                  <line key={idx} x1="15" y1={200 * ratio} x2="585" y2={200 * ratio} className="chart-svg-grid" />
                ))}
                
                {/* Graph Path */}
                <path d={`M 15,200 L ${getPointsList(selectedMetal)} L 585,200 Z`} fill={`url(#chart-grad-${selectedMetal})`} />
                <polyline points={getPointsList(selectedMetal)} className="chart-svg-line" stroke={`var(--${selectedMetal})`} />
                
                <line x1="15" y1="185" x2="585" y2="185" className="chart-svg-axis" />
                <line x1="15" y1="15" x2="15" y2="185" className="chart-svg-axis" />
              </svg>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-dim)', fontSize: '11px', marginTop: '10px', padding: '0 8px' }}>
              <span>6 sessions ago</span>
              <span>4 sessions ago</span>
              <span>2 sessions ago</span>
              <span>Today (Live Ticker)</span>
            </div>
          </div>
        </div>

        {/* Currency Valuation Calculator / Conversion Desk */}
        <div className="card">
          <h3 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, marginBottom: '8px' }}>Metal Conversion & Valuation Desk</h3>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '24px' }}>Estimate current raw cash values based on weight index metrics.</p>

          <form style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} onSubmit={e => e.preventDefault()}>
            <div className="form-group">
              <label>Select Target Metal</label>
              <select className="form-control" value={calcMetal} onChange={e => setCalcMetal(e.target.value)}>
                <option value="gold">Gold (Au)</option>
                <option value="silver">Silver (Ag)</option>
                <option value="copper">Copper (Cu)</option>
                <option value="aluminium">Aluminium (Al)</option>
                <option value="palladium">Palladium (Pd)</option>
              </select>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label>Total Item Weight</label>
                <input className="form-control" type="number" min="0" step="any" value={calcWeight} onChange={e => setCalcWeight(parseFloat(e.target.value) || 0)} />
              </div>
              <div className="form-group">
                <label>Measurement Unit</label>
                <select className="form-control" value={calcUnit} onChange={e => setCalcUnit(e.target.value)}>
                  <option value="g">Grams (g)</option>
                  <option value="oz">Troy Ounces (oz)</option>
                  <option value="kg">Kilograms (kg)</option>
                  <option value="lb">Pounds (lb)</option>
                </select>
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '20px', textAlign: 'center', marginTop: '12px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>
                Estimated Market Value
              </div>
              <div style={{ fontSize: '32px', fontFamily: 'Outfit, sans-serif', fontWeight: 800, color: 'var(--emerald)' }}>
                ${calculatedVal}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '4px' }}>
                Calculated at {calcWeight} {calcUnit} of {calcMetal.toUpperCase()} using live market index
              </div>
            </div>
          </form>
        </div>

      </div>

    </div>
  );
}
