import React, { useState, useEffect } from 'react';

export default function Dashboard({ history, prices, changeTab, setSelectedScan }) {
  // Aggregate stats from scan history
  const totalWeightKg = (history.reduce((sum, item) => sum + item.totalWeightG, 0) / 1000.0).toFixed(2);
  const totalGrossValue = history.reduce((sum, item) => sum + item.grossValue, 0).toFixed(2);
  const totalRecoveryValue = history.reduce((sum, item) => sum + item.recoveryValue, 0).toFixed(2);
  const totalProfit = history.reduce((sum, item) => sum + item.netProfit, 0).toFixed(2);
  const totalCarbonOffset = history.reduce((sum, item) => sum + item.carbonOffsetKg, 0).toFixed(2);

  // Metal quantities aggregated in grams
  const totals = {
    gold: history.reduce((sum, item) => sum + item.goldQtyG, 0),
    silver: history.reduce((sum, item) => sum + item.silverQtyG, 0),
    copper: history.reduce((sum, item) => sum + item.copperQtyG, 0),
    aluminium: history.reduce((sum, item) => sum + item.aluminiumQtyG, 0),
    palladium: history.reduce((sum, item) => sum + item.palladiumQtyG, 0)
  };

  const totalMetalsG = Object.values(totals).reduce((a, b) => a + b, 0);

  // Dynamic price flash tracking
  const [prevPrices, setPrevPrices] = useState({});
  const [ticks, setTicks] = useState({});

  useEffect(() => {
    if (Object.keys(prices).length > 0) {
      const newTicks = {};
      Object.keys(prices).forEach(key => {
        if (prevPrices[key]) {
          if (prices[key] > prevPrices[key]) {
            newTicks[key] = 'up';
          } else if (prices[key] < prevPrices[key]) {
            newTicks[key] = 'down';
          }
        }
      });
      setTicks(newTicks);
      setPrevPrices(prices);

      // Clear the visual tick indicator after 2 seconds
      const timer = setTimeout(() => setTicks({}), 2000);
      return () => clearTimeout(timer);
    }
  }, [prices]);

  // Mock historical prices for the line graph
  const getHistoricalPoints = () => {
    // Return SVG coordinates for a simple path
    const values = [78.5, 79.2, 80.5, 79.9, 80.8, 82.1, 80.5];
    const width = 500;
    const height = 120;
    const padding = 10;
    const points = values.map((val, idx) => {
      const x = padding + (idx * (width - padding * 2)) / (values.length - 1);
      const y = height - padding - ((val - 75) * (height - padding * 2)) / (85 - 75);
      return `${x},${y}`;
    }).join(' ');
    return points;
  };

  return (
    <div className="animate-fade-in" style={{ padding: '0 40px 40px 40px' }}>
      
      {/* Metrics Row */}
      <div className="card-grid" style={{ padding: '24px 0 0 0' }}>
        
        <div className="card card-emerald">
          <div className="card-header-small">
            <span>Processed Weight</span>
            <span className="material-icons-outlined card-icon" style={{ color: 'var(--emerald)' }}>scale</span>
          </div>
          <div className="card-value">{totalWeightKg} kg</div>
          <div className="card-trend trend-up">
            <span className="material-icons-outlined" style={{ fontSize: '16px' }}>trending_up</span>
            <span>All-time scanned</span>
          </div>
        </div>

        <div className="card card-gold">
          <div className="card-header-small">
            <span>Intrinsic Value</span>
            <span className="material-icons-outlined card-icon" style={{ color: 'var(--gold)' }}>payments</span>
          </div>
          <div className="card-value">${totalGrossValue}</div>
          <div className="card-trend trend-up">
            <span className="material-icons-outlined" style={{ fontSize: '16px' }}>monetization_on</span>
            <span>Raw metal cost</span>
          </div>
        </div>

        <div className="card card-cyan">
          <div className="card-header-small">
            <span>Recoverable Yield</span>
            <span className="material-icons-outlined card-icon" style={{ color: 'var(--cyan)' }}>precision_manufacturing</span>
          </div>
          <div className="card-value">${totalRecoveryValue}</div>
          <div className="card-trend trend-up">
            <span className="material-icons-outlined" style={{ fontSize: '16px' }}>insights</span>
            <span>Recovered value</span>
          </div>
        </div>

        <div className="card card-palladium">
          <div className="card-header-small">
            <span>Recycling Profit</span>
            <span className="material-icons-outlined card-icon" style={{ color: 'var(--palladium)' }}>account_balance_wallet</span>
          </div>
          <div className="card-value">${totalProfit}</div>
          <div className="card-trend" style={{ color: parseFloat(totalProfit) >= 0 ? 'var(--emerald)' : 'var(--danger)' }}>
            <span className="material-icons-outlined" style={{ fontSize: '16px' }}>
              {parseFloat(totalProfit) >= 0 ? 'trending_up' : 'trending_down'}
            </span>
            <span>Estimated ROI</span>
          </div>
        </div>

      </div>

      {/* Carbon Offset Highlight Card */}
      <div className="card" style={{ marginTop: '24px', background: 'rgba(16, 185, 129, 0.04)', border: '1px solid rgba(16, 185, 129, 0.15)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span className="material-icons-outlined" style={{ fontSize: '36px', color: 'var(--emerald)', textShadow: '0 0 10px var(--emerald-glow)' }}>eco</span>
            <div>
              <h3 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 600, color: 'var(--emerald)', fontSize: '18px' }}>Ecological Footprint Prevented</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '2px' }}>Recycling electronic components saves greenhouse gases compared to raw metal mining and refinement extraction.</p>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '28px', fontFamily: 'Outfit, sans-serif', fontWeight: 800, color: 'var(--emerald)' }}>{totalCarbonOffset} kg CO₂</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Net CO₂ Offset Saved</div>
          </div>
        </div>
      </div>

      {/* Main Grid: Live price ticker + composition stats */}
      <div className="grid-2" style={{ marginTop: '24px' }}>
        
        {/* Live Prices Ticker */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 600 }}>Live Metal Rates Ticker</h3>
            <span style={{ fontSize: '11px', color: 'var(--emerald)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--emerald)', display: 'inline-block', animation: 'pulse-emerald 2s infinite' }}></span>
              Ticking price feed
            </span>
          </div>

          <div className="rates-container">
            {Object.keys(BASE_PRICES).map(metal => {
              const currentPrice = prices[metal.toLowerCase()] || BASE_PRICES[metal];
              const tick = ticks[metal.toLowerCase()];
              const metalClass = tick === 'up' ? 'price-glow-up' : tick === 'down' ? 'price-glow-down' : '';
              
              return (
                <div key={metal} className={`rate-ticker-row ${metalClass}`}>
                  <div className="rate-metal-info">
                    <div className={`metal-badge badge-${metal.toLowerCase()}`}>
                      {metal.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 style={{ fontWeight: 600, fontSize: '15px' }}>{metal}</h4>
                      <p style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Rate Index (per gram)</p>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '18px' }}>
                      ${currentPrice.toFixed(4)}
                    </div>
                    <div style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '2px', justifyContent: 'flex-end', color: tick === 'up' ? 'var(--emerald)' : tick === 'down' ? 'var(--danger)' : 'var(--text-muted)' }}>
                      <span className="material-icons-outlined" style={{ fontSize: '12px' }}>
                        {tick === 'up' ? 'arrow_drop_up' : tick === 'down' ? 'arrow_drop_down' : 'remove'}
                      </span>
                      <span>{tick === 'up' ? '+Rate Update' : tick === 'down' ? '-Rate Update' : 'Live'}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Global Composition Breakdown & Chart */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 600, marginBottom: '20px' }}>Global Scanned Metal Stockpile</h3>
          
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            {totalMetalsG === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                <span className="material-icons-outlined" style={{ fontSize: '48px', marginBottom: '12px', color: 'var(--text-dim)' }}>inventory_2</span>
                <p>No e-waste scanned yet.</p>
                <button className="btn btn-primary" style={{ marginTop: '16px' }} onClick={() => changeTab('scanner')}>
                  Scan your first item
                </button>
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {Object.keys(totals).map(metal => {
                    const weight = totals[metal];
                    const percentage = totalMetalsG > 0 ? (weight / totalMetalsG) * 100 : 0;
                    const colorMap = {
                      gold: 'var(--gold)',
                      silver: 'var(--silver)',
                      copper: 'var(--copper)',
                      aluminium: 'var(--cyan)',
                      palladium: 'var(--palladium)'
                    };
                    return (
                      <div key={metal}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                          <span style={{ textTransform: 'capitalize', fontWeight: 500 }}>{metal}</span>
                          <span style={{ fontWeight: 600 }}>{weight.toFixed(2)}g ({percentage.toFixed(1)}%)</span>
                        </div>
                        <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ width: `${percentage}%`, height: '100%', background: colorMap[metal], borderRadius: '4px' }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Micro trend visualizer chart */}
                <div style={{ marginTop: '30px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
                  <h4 style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>Precious Metals Trend Index</h4>
                  <div className="chart-container-large" style={{ height: '120px' }}>
                    <svg width="100%" height="100%" viewBox="0 0 500 120" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="chart-grad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--gold)" stopOpacity="0.25" />
                          <stop offset="100%" stopColor="var(--gold)" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>
                      <path d={`M 10,120 L ${getHistoricalPoints()} L 490,120 Z`} fill="url(#chart-grad)" />
                      <polyline points={getHistoricalPoints()} className="chart-svg-line" stroke="var(--gold)" />
                      <line x1="10" y1="120" x2="490" y2="120" className="chart-svg-axis" />
                      <line x1="10" y1="10" x2="10" y2="120" className="chart-svg-axis" />
                    </svg>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-dim)', fontSize: '11px', marginTop: '6px' }}>
                    <span>6 days ago</span>
                    <span>3 days ago</span>
                    <span>Today (Live)</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Recent History Table Preview */}
      {history.length > 0 && (
        <div className="card" style={{ marginTop: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 600 }}>Recent Scans</h3>
            <button className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '12px' }} onClick={() => changeTab('history')}>
              View All History
            </button>
          </div>
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Item Name</th>
                  <th>Category</th>
                  <th>Total Weight</th>
                  <th>Net Recovered Value</th>
                  <th>Best Tech Method</th>
                  <th>Carbon Offset</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {history.slice(0, 3).map(scan => (
                  <tr key={scan.id}>
                    <td style={{ fontWeight: 600 }}>{scan.itemName}</td>
                    <td>
                      <span style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '11px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                        {scan.itemCategory}
                      </span>
                    </td>
                    <td>{scan.totalWeightG.toFixed(1)}g</td>
                    <td style={{ color: 'var(--emerald)', fontWeight: 600 }}>${scan.recoveryValue.toFixed(2)}</td>
                    <td style={{ color: 'var(--cyan)' }}>{scan.recommendedMethod}</td>
                    <td style={{ color: 'var(--emerald)' }}>{scan.carbonOffsetKg.toFixed(2)} kg</td>
                    <td>
                      <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '11px' }} onClick={() => { setSelectedScan(scan); changeTab('scanner'); }}>
                        Analyze & Refine
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}

// Initial Base Price values for fallback display
const BASE_PRICES = {
  "Gold": 80.50,
  "Silver": 0.95,
  "Copper": 0.0098,
  "Aluminium": 0.0026,
  "Palladium": 33.20
};
