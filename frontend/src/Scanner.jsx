import React, { useState, useRef, useEffect } from 'react';

const SAMPLES = [
  { name: 'Printed Circuit Board (PCB)', file: 'motherboard_pcb.jpg', weight: 450, color: '#16a34a', text: 'PCB' },
  { name: 'Smart Phone (Cell Phone)', file: 'iphone_phone.jpg', weight: 175, color: '#2563eb', text: 'Phone' },
  { name: 'Laptop Computer', file: 'thinkpad_laptop.jpg', weight: 2200, color: '#0891b2', text: 'Laptop' },
  { name: 'Mechanical Keyboard', file: 'keychron_keyboard.jpg', weight: 950, color: '#d946ef', text: 'Keyboard' },
  { name: 'USB Copper Cables', file: 'cables_wire.jpg', weight: 350, color: '#ea580c', text: 'Cables' },
  { name: 'Li-Ion Battery Cell', file: 'battery.jpg', weight: 120, color: '#ca8a04', text: 'Battery' }
];

export default function Scanner({ activeScan, setActiveScan, onScanSuccess, backendUrl }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [itemName, setItemName] = useState('');
  const [weightG, setWeightG] = useState(350);
  const [isScanning, setIsScanning] = useState(false);
  const [useCamera, setUseCamera] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // XRF Form states
  const [xrfCopper, setXrfCopper] = useState('');
  const [xrfAluminium, setXrfAluminium] = useState('');
  const [xrfGold, setXrfGold] = useState('');
  const [xrfSilver, setXrfSilver] = useState('');
  const [xrfPalladium, setXrfPalladium] = useState('');
  const [isRefining, setIsRefining] = useState(false);

  // Recycling comparison methods list
  const [comparisons, setComparisons] = useState([]);

  // DOM Refs
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const overlayCanvasRef = useRef(null);
  const fileInputRef = useRef(null);

  // Stop camera when component unmounts or view changes
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Fetch recycling method comparisons when activeScan changes
  useEffect(() => {
    if (activeScan && activeScan.id) {
      // Set XRF input defaults
      const wt = activeScan.totalWeightG;
      setXrfGold(((activeScan.goldQtyG / wt) * 100).toFixed(4));
      setXrfSilver(((activeScan.silverQtyG / wt) * 100).toFixed(4));
      setXrfCopper(((activeScan.copperQtyG / wt) * 100).toFixed(4));
      setXrfAluminium(((activeScan.aluminiumQtyG / wt) * 100).toFixed(4));
      setXrfPalladium(((activeScan.palladiumQtyG / wt) * 100).toFixed(4));

      fetchComparisons(activeScan.id);
    } else {
      setComparisons([]);
    }
  }, [activeScan]);

  // Adjust overlay canvas size when image renders
  useEffect(() => {
    if (activeScan && activeScan.imagePath) {
      setTimeout(() => {
        drawBoundingBoxes();
      }, 300);
    }
  }, [activeScan]);

  const startCamera = async () => {
    try {
      setErrorMsg('');
      setUseCamera(true);
      setCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera access failed:", err);
      setErrorMsg("Camera access is not permitted. Please upload an image instead.");
      setUseCamera(false);
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setErrorMsg('');
    }
  };

  const drawBoundingBoxes = () => {
    const imgEl = document.getElementById('scanned-img-preview');
    const overlay = overlayCanvasRef.current;
    if (!imgEl || !overlay || !activeScan) return;

    // Reset overlay sizes to match rendering
    overlay.width = imgEl.clientWidth;
    overlay.height = imgEl.clientHeight;

    const ctx = overlay.getContext('2d');
    ctx.clearRect(0, 0, overlay.width, overlay.height);

    // If YOLO output exists in scan metadata
    if (activeScan.detections && activeScan.detections.length > 0) {
      const boxes = activeScan.detections;
      boxes.forEach(det => {
        const box = det.box; // [xmin, ymin, xmax, ymax]
        const label = det.label;
        const conf = det.confidence;

        // Bounding box mapping logic:
        // Calculate scaling ratio of drawn image vs native size
        const nativeW = activeScan.imageWidth || 640;
        const nativeH = activeScan.imageHeight || 480;

        const scaleX = overlay.width / nativeW;
        const scaleY = overlay.height / nativeH;

        const x = box[0] * scaleX;
        const y = box[1] * scaleY;
        const w = (box[2] - box[0]) * scaleX;
        const h = (box[3] - box[1]) * scaleY;

        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, w, h);

        ctx.fillStyle = '#10b981';
        ctx.font = 'bold 12px Inter';
        const labelText = `${label} (${(conf * 100).toFixed(0)}%)`;
        const textWidth = ctx.measureText(labelText).width;

        ctx.fillRect(x, y - 20, textWidth + 10, 20);
        ctx.fillStyle = '#ffffff';
        ctx.fillText(labelText, x + 5, y - 5);
      });
    } else {
      // Mock full layout bounding box if empty
      ctx.strokeStyle = 'var(--emerald)';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(overlay.width * 0.05, overlay.height * 0.05, overlay.width * 0.9, overlay.height * 0.9);
      ctx.fillStyle = 'var(--emerald)';
      ctx.font = 'bold 11px Inter';
      ctx.fillText('IDENTIFIED OBJECT AREA', overlay.width * 0.05 + 10, overlay.height * 0.05 + 20);
    }
  };

  const uploadAndScan = async (blobFile, nameStr = '', weightVal = 350) => {
    setIsScanning(true);
    setErrorMsg('');
    try {
      const formData = new FormData();
      formData.append('image', blobFile, blobFile.name || 'upload.jpg');
      formData.append('itemName', nameStr);
      formData.append('weightG', weightVal.toString());

      const res = await fetch(`${backendUrl}/api/ewaste/scan`, {
        method: 'POST',
        body: formData
      });

      if (!res.ok) {
        throw new Error('Analysis request failed. Please check backend connection.');
      }

      const data = await res.json();
      if (data.status === 'success') {
        const scanObj = data.scan;
        // Inject detections and image parameters
        scanObj.detections = data.detected_items || [];
        scanObj.imageWidth = data.image_size ? data.image_size[0] : 640;
        scanObj.imageHeight = data.image_size ? data.image_size[1] : 480;

        setActiveScan(scanObj);
        onScanSuccess();
        stopCamera();
        setUseCamera(false);
      } else {
        throw new Error(data.error || 'Unknown analysis error');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Connecting to server failed.');
    } finally {
      setIsScanning(false);
    }
  };

  const captureCameraFrame = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (blob) {
        blob.name = 'capture_' + Date.now() + '.jpg';
        uploadAndScan(blob, itemName, weightG);
      }
    }, 'image/jpeg');
  };

  const handlePresetSelect = (preset) => {
    // Generate a mock binary image Blob to trigger the REST classification pipeline
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');

    // Draw a premium schematic vector representing the electronic component
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 640, 480);

    // Decorative grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 640; i += 40) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 480); ctx.stroke();
    }
    for (let j = 0; j < 480; j += 40) {
      ctx.beginPath(); ctx.moveTo(0, j); ctx.lineTo(640, j); ctx.stroke();
    }

    // Outer shell
    ctx.strokeStyle = preset.color;
    ctx.lineWidth = 4;
    ctx.strokeRect(120, 90, 400, 300);

    // Drawing circles/components inside
    ctx.fillStyle = preset.color + '22';
    ctx.fillRect(120, 90, 400, 300);

    ctx.fillStyle = preset.color;
    ctx.beginPath(); ctx.arc(320, 240, 60, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px Inter';
    ctx.textAlign = 'center';
    ctx.fillText(preset.text, 320, 248);

    ctx.font = '14px Inter';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.fillText('SIMULATED E-WASTE SPECTROGRAPH', 320, 340);

    canvas.toBlob((blob) => {
      if (blob) {
        blob.name = preset.file;
        setItemName(preset.name);
        setWeightG(preset.weight);
        uploadAndScan(blob, preset.name, preset.weight);
      }
    }, 'image/jpeg');
  };

  const handleManualUploadSubmit = (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setErrorMsg('Please select an image file to upload.');
      return;
    }
    uploadAndScan(selectedFile, itemName, weightG);
  };

  const fetchComparisons = async (id) => {
    try {
      const res = await fetch(`${backendUrl}/api/ewaste/compare/${id}`);
      if (res.ok) {
        const data = await res.json();
        setComparisons(data);
      }
    } catch (err) {
      console.error("Failed to fetch comparisons:", err);
    }
  };

  const handleRefineSubmit = async (e) => {
    e.preventDefault();
    setIsRefining(true);
    try {
      const payload = {
        elemental_data: {
          gold: parseFloat(xrfGold) || 0.0,
          silver: parseFloat(xrfSilver) || 0.0,
          copper: parseFloat(xrfCopper) || 0.0,
          aluminium: parseFloat(xrfAluminium) || 0.0,
          palladium: parseFloat(xrfPalladium) || 0.0
        }
      };

      const res = await fetch(`${backendUrl}/api/ewaste/refine/${activeScan.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Refining request failed.');

      const data = await res.json();
      if (data.status === 'success') {
        const updatedScan = data.scan;
        // preserve bounding box rendering settings
        updatedScan.detections = activeScan.detections;
        updatedScan.imageWidth = activeScan.imageWidth;
        updatedScan.imageHeight = activeScan.imageHeight;

        setActiveScan(updatedScan);
      }
    } catch (err) {
      console.error(err);
      alert('Error refining: ' + err.message);
    } finally {
      setIsRefining(false);
    }
  };

  return (
    <div className="animate-fade-in">
      
      {/* Scanner Screen layout: Form/Selector vs Scan Report */}
      {!activeScan ? (
        <div style={{ maxWidth: '800px', margin: '40px auto', padding: '0 24px' }}>
          
          <div className="card" style={{ padding: '36px' }}>
            <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '24px', marginBottom: '24px', textAlign: 'center' }}>
              E-Waste Diagnostic Scanner Hub
            </h2>

            {errorMsg && (
              <div style={{ padding: '16px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: 'var(--danger)', borderRadius: '12px', marginBottom: '20px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="material-icons-outlined">error_outline</span>
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Quick Demo Template Selectors */}
            <div style={{ marginBottom: '32px' }}>
              <label style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'block', marginBottom: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Quick Capture Templates (Recommended for Instant Testing)
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                {SAMPLES.map(sample => (
                  <button key={sample.name} className="btn btn-secondary" style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '4px', padding: '14px', borderLeft: `4px solid ${sample.color}` }} onClick={() => handlePresetSelect(sample)} disabled={isScanning}>
                    <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-main)' }}>{sample.name}</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Estimated Weight: {sample.weight}g</span>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', margin: '24px 0', color: 'var(--text-dim)' }}>
              <hr style={{ flex: 1, border: 'none', borderTop: '1px solid var(--border-color)' }} />
              <span style={{ fontSize: '12px', fontWeight: 600 }}>OR USE SOURCE INPUTS</span>
              <hr style={{ flex: 1, border: 'none', borderTop: '1px solid var(--border-color)' }} />
            </div>

            {/* Webcam / Upload Actions */}
            <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', justifyContent: 'center' }}>
              <button className="btn btn-secondary" onClick={() => { setUseCamera(false); stopCamera(); }} style={{ borderColor: !useCamera ? 'var(--emerald)' : 'transparent', background: !useCamera ? 'rgba(16, 185, 129, 0.05)' : 'rgba(255,255,255,0.03)' }}>
                <span className="material-icons-outlined">upload_file</span> File Upload
              </button>
              <button className="btn btn-secondary" onClick={startCamera} style={{ borderColor: useCamera ? 'var(--emerald)' : 'transparent', background: useCamera ? 'rgba(16, 185, 129, 0.05)' : 'rgba(255,255,255,0.03)' }}>
                <span className="material-icons-outlined">videocam</span> Camera Capture
              </button>
            </div>

            {/* If Camera Mode */}
            {useCamera ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                <div className="viewfinder-wrapper" style={{ width: '100%', maxWidth: '500px' }}>
                  {cameraActive ? (
                    <>
                      <video ref={videoRef} autoPlay playsInline className="viewfinder-video" />
                      <div className="scan-overlay-reticle" />
                    </>
                  ) : (
                    <div style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Connecting Camera Stream...</div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '12px', width: '100%', maxWidth: '500px' }}>
                  <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                    <input className="form-control" placeholder="Item Name (Optional)" value={itemName} onChange={e => setItemName(e.target.value)} />
                  </div>
                  <div className="form-group" style={{ width: '120px', marginBottom: 0 }}>
                    <input className="form-control" type="number" placeholder="Weight (g)" value={weightG} onChange={e => setWeightG(parseInt(e.target.value) || 0)} />
                  </div>
                  <button className="btn btn-primary" onClick={captureCameraFrame} disabled={isScanning || !cameraActive} style={{ height: '45px' }}>
                    Capture & Scan
                  </button>
                </div>
                <canvas ref={canvasRef} style={{ display: 'none' }} />
              </div>
            ) : (
              /* If Upload Mode */
              <form onSubmit={handleManualUploadSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className="upload-zone" onClick={() => fileInputRef.current?.click()}>
                  <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*" onChange={handleFileChange} />
                  <span className="material-icons-outlined upload-icon">cloud_upload</span>
                  {selectedFile ? (
                    <div>
                      <p style={{ fontWeight: 600, color: 'var(--emerald)' }}>File Selected</p>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>{selectedFile.name}</p>
                    </div>
                  ) : (
                    <div>
                      <p style={{ fontWeight: 600 }}>Drag and drop files here</p>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Supports JPG, PNG formats up to 10MB</p>
                    </div>
                  )}
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label>Item Name Identification Label (Optional)</label>
                    <input className="form-control" placeholder="e.g. Broken PCB Board" value={itemName} onChange={e => setItemName(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>Known Gross Weight (grams)</label>
                    <input className="form-control" type="number" placeholder="350" value={weightG} onChange={e => setWeightG(parseInt(e.target.value) || 0)} />
                  </div>
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%', height: '48px' }} disabled={isScanning || !selectedFile}>
                  {isScanning ? 'Executing YOLO computer vision...' : 'Submit to Metal Extraction Analysis'}
                </button>
              </form>
            )}

            {isScanning && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', marginTop: '24px' }}>
                <span className="material-icons-outlined spin-slow" style={{ fontSize: '32px', color: 'var(--emerald)', animation: 'spin-slow 2s linear infinite' }}>sync</span>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Executing Neural Network Image Classification...</span>
              </div>
            )}

          </div>
        </div>
      ) : (
        /* Scan Report Screen */
        <div className="scanner-grid">
          
          {/* Visual Analysis Panel */}
          <div className="scanner-panel">
            <div className="card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '20px' }}>Visual Spectrum Detection</h3>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>AI Computer Vision bounding indicators</p>
                </div>
                <button className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '12px' }} onClick={() => setActiveScan(null)}>
                  Scan New Item
                </button>
              </div>

              <div className="viewfinder-wrapper" style={{ height: 'auto', background: 'rgba(0,0,0,0.2)' }}>
                <img id="scanned-img-preview" src={`http://localhost:8080/${activeScan.imagePath}`} alt="Scan Result" style={{ width: '100%', height: 'auto', display: 'block', borderRadius: '14px' }} onLoad={drawBoundingBoxes} />
                <canvas ref={overlayCanvasRef} className="overlay-canvas" />
              </div>

              <div style={{ marginTop: '20px', padding: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
                <h4 style={{ fontWeight: 600, fontSize: '14px', marginBottom: '8px', color: 'var(--emerald)' }}>Diagnostic Details</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
                  <div><span style={{ color: 'var(--text-muted)' }}>Classification:</span> <strong style={{ color: 'white' }}>{activeScan.itemCategory}</strong></div>
                  <div><span style={{ color: 'var(--text-muted)' }}>Measured Weight:</span> <strong style={{ color: 'white' }}>{activeScan.totalWeightG.toFixed(1)} g</strong></div>
                  <div><span style={{ color: 'var(--text-muted)' }}>Intrinsic Value:</span> <strong style={{ color: 'var(--gold)' }}>${activeScan.grossValue.toFixed(2)}</strong></div>
                  <div><span style={{ color: 'var(--text-muted)' }}>Date Checked:</span> <span>{new Date(activeScan.scanDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></div>
                </div>
              </div>
            </div>

            {/* XRF elemental refinement panel */}
            <div className="card" style={{ padding: '24px' }}>
              <h3 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 600, marginBottom: '8px' }}>XRF / LIBS Calibration Desk</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '20px' }}>Enter manual sensor elemental concentration percentages to override visual defaults.</p>
              
              <form onSubmit={handleRefineSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Au (Gold %)</label>
                  <input className="form-control" type="number" step="any" value={xrfGold} onChange={e => setXrfGold(e.target.value)} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Ag (Silver %)</label>
                  <input className="form-control" type="number" step="any" value={xrfSilver} onChange={e => setXrfSilver(e.target.value)} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Cu (Copper %)</label>
                  <input className="form-control" type="number" step="any" value={xrfCopper} onChange={e => setXrfCopper(e.target.value)} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Al (Aluminium %)</label>
                  <input className="form-control" type="number" step="any" value={xrfAluminium} onChange={e => setXrfAluminium(e.target.value)} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Pd (Palladium %)</label>
                  <input className="form-control" type="number" step="any" value={xrfPalladium} onChange={e => setXrfPalladium(e.target.value)} />
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                  <button type="submit" className="btn btn-primary" style={{ width: '100%', height: '42px', fontSize: '13px' }} disabled={isRefining}>
                    {isRefining ? 'Calibrating...' : 'Refine Specs'}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Metallurgical Yield Valuation & ROI Analysis */}
          <div className="scanner-panel">
            
            {/* Metals Yield Card */}
            <div className="card" style={{ padding: '24px' }}>
              <h3 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 600, marginBottom: '20px' }}>Recoverable Metal Yields</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                  { name: 'Copper', qty: activeScan.copperQtyG, color: 'var(--copper)' },
                  { name: 'Aluminium', qty: activeScan.aluminiumQtyG, color: 'var(--cyan)' },
                  { name: 'Gold', qty: activeScan.goldQtyG, color: 'var(--gold)' },
                  { name: 'Silver', qty: activeScan.silverQtyG, color: 'var(--silver)' },
                  { name: 'Palladium', qty: activeScan.palladiumQtyG, color: 'var(--palladium)' }
                ].map(metal => {
                  const pct = activeScan.totalWeightG > 0 ? (metal.qty / activeScan.totalWeightG) * 100 : 0;
                  return (
                    <div key={metal.name} style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '12px 16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                        <span style={{ fontWeight: 600 }}>{metal.name}</span>
                        <span style={{ color: metal.color, fontWeight: 700 }}>{metal.qty.toFixed(4)} g ({pct.toFixed(4)}%)</span>
                      </div>
                      <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${Math.min(100, pct * 2)}%`, height: '100%', background: metal.color }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Valuation Advisor Card */}
            <div className="card" style={{ padding: '24px' }}>
              <h3 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 600, marginBottom: '20px' }}>Recovery Options Comparison</h3>
              
              <div className="table-container">
                <table className="custom-table" style={{ fontSize: '12px' }}>
                  <thead>
                    <tr>
                      <th>Extraction Pathway</th>
                      <th>Gross Yield</th>
                      <th>Process Cost</th>
                      <th>Est. Net Profit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisons.map((c) => {
                      const isBest = c.methodName === activeScan.recommendedMethod;
                      return (
                        <tr key={c.methodName} style={{ borderLeft: isBest ? '4px solid var(--emerald)' : 'none', background: isBest ? 'rgba(16, 185, 129, 0.03)' : 'transparent' }}>
                          <td style={{ fontWeight: isBest ? 700 : 500 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span>{c.methodName}</span>
                              {isBest && <span className="material-icons-outlined" style={{ fontSize: '14px', color: 'var(--emerald)' }}>verified</span>}
                            </div>
                          </td>
                          <td>${c.recoveryValue.toFixed(2)}</td>
                          <td>${c.processingCost.toFixed(2)}</td>
                          <td style={{ color: c.netProfit >= 0 ? 'var(--emerald)' : 'var(--danger)', fontWeight: 700 }}>
                            ${c.netProfit.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div style={{ display: 'flex', gap: '14px', marginTop: '20px', alignItems: 'center', padding: '16px', background: 'rgba(6, 182, 212, 0.05)', border: '1px solid rgba(6, 182, 212, 0.15)', borderRadius: '16px' }}>
                <span className="material-icons-outlined" style={{ fontSize: '32px', color: 'var(--cyan)' }}>lightbulb</span>
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--cyan)' }}>Intelligent Technology recommendation</h4>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Based on ROI and footprint, we recommend the <strong>{activeScan.recommendedMethod}</strong> extraction technology, netting a potential profit of <strong>${activeScan.netProfit.toFixed(2)}</strong>.
                  </p>
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
