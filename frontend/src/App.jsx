import React, { useState, useEffect } from 'react';
import Dashboard from './Dashboard';
import Scanner from './Scanner';
import MetalRates from './MetalRates';
import Advisor from './Advisor';
import History from './History';

const BACKEND_URL = 'http://localhost:8081';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [history, setHistory] = useState([]);
  const [prices, setPrices] = useState({});
  const [activeScan, setActiveScan] = useState(null);

  // Fetch all current history records
  const fetchHistory = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/ewaste/history`);
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (err) {
      console.error("Failed to connect to backend scan history API:", err);
    }
  };

  // Fetch current live metal prices
  const fetchPrices = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/ewaste/prices`);
      if (res.ok) {
        const data = await res.json();
        const priceMap = {};
        data.forEach(p => {
          priceMap[p.metalName.toLowerCase()] = p.currentPricePerG;
        });
        setPrices(priceMap);
      }
    } catch (err) {
      console.error("Failed to connect to backend prices API:", err);
    }
  };

  // Delete a scan from database
  const handleDeleteScan = async (id) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/ewaste/scan/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        // Remove from list
        setHistory(prev => prev.filter(item => item.id !== id));
        // Reset active scan if it was the one deleted
        if (activeScan && activeScan.id === id) {
          setActiveScan(null);
        }
      }
    } catch (err) {
      console.error("Failed to delete scan record:", err);
    }
  };

  // Load prices and history on mount, set up price polling interval (every 5 seconds)
  useEffect(() => {
    fetchPrices();
    fetchHistory();

    const interval = setInterval(() => {
      fetchPrices();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard 
            history={history} 
            prices={prices} 
            changeTab={setActiveTab} 
            setSelectedScan={setActiveScan} 
          />
        );
      case 'scanner':
        return (
          <Scanner 
            activeScan={activeScan} 
            setActiveScan={setActiveScan} 
            onScanSuccess={fetchHistory} 
            backendUrl={BACKEND_URL} 
          />
        );
      case 'rates':
        return (
          <MetalRates 
            prices={prices} 
          />
        );
      case 'advisor':
        return (
          <Advisor />
        );
      case 'history':
        return (
          <History 
            history={history} 
            onDeleteScan={handleDeleteScan} 
            onSelectScan={setActiveScan} 
            changeTab={setActiveTab} 
          />
        );
      default:
        return <Dashboard history={history} prices={prices} changeTab={setActiveTab} setSelectedScan={setActiveScan} />;
    }
  };

  const getSubTitleText = () => {
    switch (activeTab) {
      case 'dashboard': return 'Operational dashboard and summary statistics';
      case 'scanner': return 'Upload e-waste images or capture via webcam for classification';
      case 'rates': return 'Real-time commodity valuation indexes';
      case 'advisor': return 'Eco-calculator and chemical recovery descriptions';
      case 'history': return 'Scanned database log records';
      default: return '';
    }
  };

  return (
    <>
      {/* Sidebar Section */}
      <div className="sidebar">
        <div className="brand" onClick={() => setActiveTab('dashboard')} style={{ cursor: 'pointer' }}>
          <span className="material-icons-outlined brand-icon">recycling</span>
          <div>
            <h2 className="brand-title">E-Waste Management</h2>
            <div className="brand-subtitle">Valuation AI</div>
          </div>
        </div>

        <ul className="nav-menu">
          <li className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
            <span className="material-icons-outlined">dashboard</span>
            <span>Dashboard</span>
          </li>
          <li className={`nav-item ${activeTab === 'scanner' ? 'active' : ''}`} onClick={() => { setActiveTab('scanner'); if(!activeScan) setActiveScan(null); }}>
            <span className="material-icons-outlined">photo_camera</span>
            <span>E-Waste Scan</span>
          </li>
          <li className={`nav-item ${activeTab === 'rates' ? 'active' : ''}`} onClick={() => setActiveTab('rates')}>
            <span className="material-icons-outlined">trending_up</span>
            <span>Live Prices</span>
          </li>
          <li className={`nav-item ${activeTab === 'advisor' ? 'active' : ''}`} onClick={() => setActiveTab('advisor')}>
            <span className="material-icons-outlined">assignment</span>
            <span>Recycling Advisor</span>
          </li>
          <li className={`nav-item ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
            <span className="material-icons-outlined">history</span>
            <span>Scan History</span>
          </li>
        </ul>

        <div className="sidebar-footer">
          <div>E-Waste Management System</div>
          <div style={{ fontSize: '9px', marginTop: '4px', letterSpacing: '0.5px' }}>v1.0.0 Stable</div>
        </div>
      </div>

      {/* Main Panel Content */}
      <div className="main-content">
        <div className="page-header">
          <div className="header-title-container">
            <h1 style={{ textTransform: 'capitalize' }}>{activeTab === 'rates' ? 'Live Rates & Calculator' : activeTab === 'scanner' ? 'Scan & Valuation Report' : activeTab}</h1>
            <p>{getSubTitleText()}</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span className="material-icons-outlined" style={{ color: 'var(--text-muted)' }}>notifications</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--emerald)22', border: '1px solid var(--emerald)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--emerald)', fontWeight: 'bold', fontSize: '12px' }}>
              AG
            </div>
          </div>
        </div>

        {renderTabContent()}
      </div>
    </>
  );
}
