import React, { useState } from 'react';

export default function History({ history, onDeleteScan, onSelectScan, changeTab }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Filter history
  const filteredHistory = history.filter(item => {
    const matchesSearch = item.itemName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || item.itemCategory === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Export database to JSON file download
  const exportToJSON = () => {
    const jsonStr = JSON.stringify(history, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ewaste_valuation_export_${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export database to CSV file download
  const exportToCSV = () => {
    const headers = 'ID,Item Name,Category,Weight (g),Gross Value ($),Recovery Value ($),Processing Cost ($),Net Profit ($),Recycling Tech,Carbon Offset (kg),Date Scanned\n';
    const rows = history.map(item => {
      return `"${item.id}","${item.itemName.replace(/"/g, '""')}","${item.itemCategory}",${item.totalWeightG},${item.grossValue},${item.recoveryValue},${item.processingCost},${item.netProfit},"${item.recommendedMethod}",${item.carbonOffsetKg},"${item.scanDate}"`;
    }).join('\n');
    
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ewaste_valuation_export_${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="animate-fade-in" style={{ padding: '0 40px 40px 40px' }}>
      
      {/* Search and Filters panel */}
      <div className="card" style={{ marginTop: '24px', padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          
          <div style={{ display: 'flex', gap: '12px', flex: 1, minWidth: '300px' }}>
            <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
              <input className="form-control" placeholder="Search by item name..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            <div className="form-group" style={{ width: '180px', marginBottom: 0 }}>
              <select className="form-control" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
                <option value="All">All Categories</option>
                <option value="PCB (Printed Circuit Board)">PCB</option>
                <option value="Cell Phone">Cell Phone</option>
                <option value="Laptop">Laptop</option>
                <option value="Keyboard">Keyboard</option>
                <option value="Mouse">Mouse</option>
                <option value="Cables/Wires">Cables/Wires</option>
                <option value="Battery">Battery</option>
                <option value="Generic Electronic">Generic</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-secondary" onClick={exportToJSON} disabled={history.length === 0}>
              <span className="material-icons-outlined" style={{ fontSize: '18px' }}>download</span> Export JSON
            </button>
            <button className="btn btn-secondary" onClick={exportToCSV} disabled={history.length === 0}>
              <span className="material-icons-outlined" style={{ fontSize: '18px' }}>grid_on</span> Export CSV
            </button>
          </div>

        </div>
      </div>

      {/* Main logs history table */}
      <div className="table-container" style={{ marginTop: '24px' }}>
        {filteredHistory.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
            <span className="material-icons-outlined" style={{ fontSize: '56px', color: 'var(--text-dim)', marginBottom: '12px' }}>find_in_page</span>
            <p>No historical records match your search filter criteria.</p>
          </div>
        ) : (
          <table className="custom-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Item Name</th>
                <th>Category</th>
                <th>Weight</th>
                <th>Intrinsic Value</th>
                <th>Net Profit</th>
                <th>Recycling Recommendation</th>
                <th>CO₂ Offset</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredHistory.map(item => (
                <tr key={item.id}>
                  <td style={{ color: 'var(--text-muted)' }}>
                    {new Date(item.scanDate).toLocaleDateString()}
                  </td>
                  <td style={{ fontWeight: 600 }}>{item.itemName}</td>
                  <td>
                    <span style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '11px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-color)' }}>
                      {item.itemCategory}
                    </span>
                  </td>
                  <td>{item.totalWeightG.toFixed(1)}g</td>
                  <td style={{ color: 'var(--gold)', fontWeight: 600 }}>${item.grossValue.toFixed(2)}</td>
                  <td style={{ color: item.netProfit >= 0 ? 'var(--emerald)' : 'var(--danger)', fontWeight: 600 }}>
                    ${item.netProfit.toFixed(2)}
                  </td>
                  <td style={{ color: 'var(--cyan)' }}>{item.recommendedMethod}</td>
                  <td style={{ color: 'var(--emerald)' }}>{item.carbonOffsetKg.toFixed(2)} kg</td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '11px' }} onClick={() => { onSelectScan(item); changeTab('scanner'); }}>
                        Analyze & Refine
                      </button>
                      <button className="btn btn-danger" style={{ padding: '6px 12px', fontSize: '11px' }} onClick={() => { if (window.confirm("Are you sure you want to delete this scan from database?")) onDeleteScan(item.id); }}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

    </div>
  );
}
