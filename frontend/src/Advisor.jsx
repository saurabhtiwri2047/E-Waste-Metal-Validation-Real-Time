import React, { useState } from 'react';

const RECYCLING_TECHS = [
  {
    name: 'Pyrometallurgical',
    icon: 'local_fire_department',
    color: 'var(--copper)',
    efficiency: 'Gold/Precious: 98% | Base: 95% | Aluminium: 10%',
    cost: 'High ($0.08 / g)',
    carbon: 'High footprint (Smelting fumes)',
    desc: 'Thermal treatment utilizing high-temperature furnaces to melt components. Excellent for recovering precious metals from dense, high-grade circuit boards, but burns off plastics and oxidizes/slags structural metals like Aluminium.',
    useCase: 'Complex multi-layer PCB motherboards, IC chips, gold connectors.'
  },
  {
    name: 'Hydrometallurgical',
    icon: 'science',
    color: 'var(--cyan)',
    efficiency: 'Gold/Precious: 95% | Base: 90% | Aluminium: 0%',
    cost: 'Moderate ($0.05 / g)',
    carbon: 'Medium (Chemical waste output)',
    desc: 'Chemical extraction involving acid leaching (nitric, hydrochloric, or aqua regia) followed by solvent extraction and electrolysis. Delivers highly selective recovery of copper and precious metals with low energy costs.',
    useCase: 'Mobile phone logic boards, RAM chips, telecom components.'
  },
  {
    name: 'Biometallurgical (Bioleaching)',
    icon: 'grass',
    color: 'var(--emerald)',
    efficiency: 'Gold: 75% | Copper: 80% | Silver/Pd: 70%',
    cost: 'Very Low ($0.02 / g)',
    carbon: 'Negligible (Eco-friendly, slow)',
    desc: 'Microbe-assisted leaching using bacteria (such as Acidithiobacillus ferrooxidans) to dissolve metals in aqueous solutions. Extremely eco-friendly and inexpensive, but takes several days/weeks to complete recovery cycles.',
    useCase: 'Low-grade electronic waste, pulverised CPU powders, mining slag.'
  },
  {
    name: 'Mechanical / Physical',
    icon: 'settings',
    color: 'var(--silver)',
    efficiency: 'Aluminium: 85% | Copper: 75% | Precious: <10%',
    cost: 'Lowest ($0.01 / g)',
    carbon: 'Low (Electricity usage only)',
    desc: 'Physical sorting, crushing, magnetic separation, and eddy-current density segregation. Highly effective at retrieving housing plastics, structural steel, and pure copper wires, but cannot recover microscopic precious components.',
    useCase: 'Power cords, insulated copper cabling, steel chassis, keyboards.'
  }
];

export default function Advisor() {
  // Carbon footprint calculator states
  const [calcCu, setCalcCu] = useState(10);
  const [calcAl, setCalcAl] = useState(25);
  const [calcAu, setCalcAu] = useState(0.5);
  const [calcAg, setCalcAg] = useState(2.0);

  // Carbon savings constants (kg CO2 saved per kg recycled)
  const CO2_SAVINGS = {
    copper: 4.5,
    aluminium: 11.5,
    gold: 18000.0,
    silver: 220.0
  };

  const totalCarbonSavings = (
    ((calcCu / 1000) * CO2_SAVINGS.copper) +
    ((calcAl / 1000) * CO2_SAVINGS.aluminium) +
    ((calcAu / 1000) * CO2_SAVINGS.gold) +
    ((calcAg / 1000) * CO2_SAVINGS.silver)
  ).toFixed(2);

  return (
    <div className="animate-fade-in" style={{ padding: '0 40px 40px 40px' }}>
      
      {/* Carbon Offset Calculator */}
      <div className="card" style={{ marginTop: '24px', background: 'rgba(16, 185, 129, 0.03)', border: '1px solid rgba(16, 185, 129, 0.15)' }}>
        <h3 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '20px', marginBottom: '8px', color: 'var(--emerald)' }}>
          Interactive Carbon Offset Calculator
        </h3>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>
          Estimate the total greenhouse gas emissions prevented by extracting metals from e-waste instead of raw mining operations.
        </p>

        <div className="grid-2">
          {/* Inputs */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="form-group">
              <label>Copper (g)</label>
              <input className="form-control" type="number" min="0" value={calcCu} onChange={e => setCalcCu(parseFloat(e.target.value) || 0)} />
            </div>
            <div className="form-group">
              <label>Aluminium (g)</label>
              <input className="form-control" type="number" min="0" value={calcAl} onChange={e => setCalcAl(parseFloat(e.target.value) || 0)} />
            </div>
            <div className="form-group">
              <label>Gold (g)</label>
              <input className="form-control" type="number" min="0" step="any" value={calcAu} onChange={e => setCalcAu(parseFloat(e.target.value) || 0)} />
            </div>
            <div className="form-group">
              <label>Silver (g)</label>
              <input className="form-control" type="number" min="0" step="any" value={calcAg} onChange={e => setCalcAg(parseFloat(e.target.value) || 0)} />
            </div>
          </div>

          {/* Results display */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: 'rgba(16, 185, 129, 0.05)', borderRadius: '16px', border: '1px dashed rgba(16, 185, 129, 0.2)', padding: '24px' }}>
            <span className="material-icons-outlined" style={{ fontSize: '48px', color: 'var(--emerald)', textShadow: '0 0 10px var(--emerald-glow)', marginBottom: '10px' }}>eco</span>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Net CO₂ Prevented</div>
            <div style={{ fontSize: '36px', fontFamily: 'Outfit, sans-serif', fontWeight: 800, color: 'var(--emerald)', margin: '6px 0' }}>
              {totalCarbonSavings} kg
            </div>
            <p style={{ fontSize: '11px', color: 'var(--text-dim)', textAlign: 'center' }}>
              Equivalent to planting {(parseFloat(totalCarbonSavings) / 22).toFixed(1)} mature trees (mature tree absorbs ~22kg CO₂/year)
            </p>
          </div>
        </div>
      </div>

      {/* Recycling Technologies list */}
      <h3 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '20px', marginTop: '36px', marginBottom: '20px' }}>
        Recycling & Recovery Technology Matrix
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {RECYCLING_TECHS.map(tech => (
          <div key={tech.name} className="card" style={{ borderLeft: `5px solid ${tech.color}` }}>
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
              <div className="metal-badge" style={{ background: tech.color + '22', width: '56px', height: '56px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifySelf: 'center' }}>
                <span className="material-icons-outlined" style={{ fontSize: '32px', color: tech.color }}>{tech.icon}</span>
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '18px', color: tech.color }}>
                  {tech.name} Extraction Pathway
                </h4>
                <p style={{ color: 'var(--text-main)', fontSize: '14px', marginTop: '8px', lineHeight: '1.5' }}>
                  {tech.desc}
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginTop: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '16px', fontSize: '12px' }}>
                  <div>
                    <span style={{ color: 'var(--text-dim)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>Recovery Efficiency</span>
                    <strong style={{ color: 'white' }}>{tech.efficiency}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-dim)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>Operational Cost</span>
                    <strong style={{ color: 'white' }}>{tech.cost}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-dim)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>Carbon Emissions</span>
                    <strong style={{ color: 'white' }}>{tech.carbon}</strong>
                  </div>
                </div>

                <div style={{ marginTop: '14px', background: 'rgba(255,255,255,0.02)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '12px' }}>
                  <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Primary Application:</span> <span style={{ color: 'var(--text-main)' }}>{tech.useCase}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
