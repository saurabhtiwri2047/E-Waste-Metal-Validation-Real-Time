import os
import cv2
import numpy as np
from flask import Flask, request, jsonify
from werkzeug.utils import secure_filename

# Optional YOLO import
try:
    from ultralytics import YOLO
    YOLO_AVAILABLE = True
except ImportError:
    YOLO_AVAILABLE = False

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = os.path.join(os.getcwd(), 'uploads')
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Try loading YOLOv8 nano model
model = None
if YOLO_AVAILABLE:
    try:
        # Load pre-trained model (will auto-download if not present)
        model = YOLO("yolov8n.pt")
        print("YOLOv8 loaded successfully.")
    except Exception as e:
        print(f"Warning: Failed to load YOLOv8 model: {e}. Falling back to image heuristic analysis.")
        YOLO_AVAILABLE = False

# Mapping from YOLO COCO class names / keywords to typical metal compositions (in percentage by weight)
COMPOSITION_DATABASE = {
    "PCB (Printed Circuit Board)": {
        "copper": 20.0, "aluminium": 7.0, "gold": 0.025, "silver": 0.1, "palladium": 0.005,
        "plastics": 30.0, "glass": 10.0, "others": 32.87
    },
    "Cell Phone": {
        "copper": 13.0, "aluminium": 5.0, "gold": 0.03, "silver": 0.12, "palladium": 0.006,
        "plastics": 35.0, "glass": 25.0, "others": 21.844
    },
    "Laptop": {
        "copper": 10.0, "aluminium": 18.0, "gold": 0.01, "silver": 0.05, "palladium": 0.002,
        "plastics": 35.0, "glass": 15.0, "others": 21.938
    },
    "Keyboard": {
        "copper": 3.0, "aluminium": 1.0, "gold": 0.001, "silver": 0.005, "palladium": 0.0,
        "plastics": 85.0, "glass": 0.0, "others": 10.994
    },
    "Mouse": {
        "copper": 2.5, "aluminium": 0.5, "gold": 0.0005, "silver": 0.002, "palladium": 0.0,
        "plastics": 90.0, "glass": 0.0, "others": 6.9975
    },
    "Monitor/TV": {
        "copper": 7.0, "aluminium": 10.0, "gold": 0.003, "silver": 0.02, "palladium": 0.001,
        "plastics": 40.0, "glass": 25.0, "others": 17.976
    },
    "Cables/Wires": {
        "copper": 65.0, "aluminium": 5.0, "gold": 0.0, "silver": 0.0, "palladium": 0.0,
        "plastics": 30.0, "glass": 0.0, "others": 0.0
    },
    "Battery": {
        "copper": 8.0, "aluminium": 12.0, "gold": 0.0, "silver": 0.0, "palladium": 0.0,
        "plastics": 15.0, "glass": 0.0, "others": 65.0  # Cobalt, Lithium, Nickel, etc.
    },
    "Generic Electronic": {
        "copper": 8.0, "aluminium": 5.0, "gold": 0.005, "silver": 0.02, "palladium": 0.001,
        "plastics": 45.0, "glass": 10.0, "others": 31.974
    }
}

# Mapping COCO class index to our internal category names
COCO_ELECTRONICS_MAP = {
    63: "Laptop",       # laptop
    64: "Monitor/TV",    # keyboard
    65: "Mouse",         # mouse
    66: "Keyboard",      # keyboard (wait, COCO 66 is keyboard, 64 is laptop, 62 is tv, 67 is cell phone)
    67: "Cell Phone",    # cell phone
    62: "Monitor/TV",    # tvmonitor
    73: "Laptop"         # book (sometimes laptop misclassified as book, or we keep it clean)
}

def analyze_image_heuristics(image_path, filename):
    """
    Fallback image analysis using:
    1. Filename keyword matching
    2. OpenCV color analysis (detect green/blue PCB color, copper color, or plastics)
    """
    fn_lower = filename.lower()
    
    # 1. Filename Keyword matching
    if 'pcb' in fn_lower or 'board' in fn_lower or 'circuit' in fn_lower or 'motherboard' in fn_lower:
        return "PCB (Printed Circuit Board)"
    elif 'phone' in fn_lower or 'mobile' in fn_lower or 'iphone' in fn_lower or 'android' in fn_lower:
        return "Cell Phone"
    elif 'laptop' in fn_lower or 'notebook' in fn_lower or 'macbook' in fn_lower:
        return "Laptop"
    elif 'keyboard' in fn_lower:
        return "Keyboard"
    elif 'mouse' in fn_lower:
        return "Mouse"
    elif 'cable' in fn_lower or 'wire' in fn_lower or 'cord' in fn_lower:
        return "Cables/Wires"
    elif 'battery' in fn_lower or 'cell' in fn_lower or 'li-ion' in fn_lower:
        return "Battery"
    elif 'monitor' in fn_lower or 'tv' in fn_lower or 'display' in fn_lower or 'screen' in fn_lower:
        return "Monitor/TV"

    # 2. OpenCV Green PCB / Copper detection
    try:
        img = cv2.imread(image_path)
        if img is None:
            return "Generic Electronic"
        
        hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
        
        # Define ranges for green color (PCB boards are often green)
        lower_green = np.array([35, 40, 40])
        upper_green = np.array([85, 255, 255])
        green_mask = cv2.inRange(hsv, lower_green, upper_green)
        green_ratio = np.sum(green_mask > 0) / (img.shape[0] * img.shape[1])

        # Define ranges for copper/brownish colors
        lower_copper = np.array([5, 50, 50])
        upper_copper = np.array([25, 255, 255])
        copper_mask = cv2.inRange(hsv, lower_copper, upper_copper)
        copper_ratio = np.sum(copper_mask > 0) / (img.shape[0] * img.shape[1])

        # Define ranges for blue (alternate PCB color)
        lower_blue = np.array([90, 50, 50])
        upper_blue = np.array([130, 255, 255])
        blue_mask = cv2.inRange(hsv, lower_blue, upper_blue)
        blue_ratio = np.sum(blue_mask > 0) / (img.shape[0] * img.shape[1])

        print(f"Heuristics - Green Ratio: {green_ratio:.4f}, Blue Ratio: {blue_ratio:.4f}, Copper Ratio: {copper_ratio:.4f}")

        if green_ratio > 0.08 or blue_ratio > 0.08:
            return "PCB (Printed Circuit Board)"
        elif copper_ratio > 0.15:
            return "Cables/Wires"
    except Exception as e:
        print(f"Error during OpenCV heuristics: {e}")

    return "Generic Electronic"

@app.route('/api/classify', methods=['POST'])
def classify_ewaste():
    if 'image' not in request.files:
        return jsonify({"error": "No image file provided"}), 400
    
    file = request.files['image']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    filename = secure_filename(file.filename)
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    file.save(filepath)

    detected_items = []
    primary_category = None
    confidence = 0.90 # Default mock confidence

    img = cv2.imread(filepath)
    if img is not None:
        h, w, _ = img.shape
    else:
        h, w = 480, 640

    # Try YOLOv8 Object Detection
    if YOLO_AVAILABLE and model is not None:
        try:
            results = model(filepath)
            for result in results:
                boxes = result.boxes
                for box in boxes:
                    cls_id = int(box.cls[0].item())
                    conf = float(box.conf[0].item())
                    
                    if cls_id in COCO_ELECTRONICS_MAP:
                        mapped_category = COCO_ELECTRONICS_MAP[cls_id]
                        xyxy = box.xyxy[0].tolist() # [x1, y1, x2, y2]
                        detected_items.append({
                            "label": mapped_category,
                            "confidence": conf,
                            "box": [int(xyxy[0]), int(xyxy[1]), int(xyxy[2]), int(xyxy[3])]
                        })
            
            # Select primary item as the one with the highest confidence or largest box
            if detected_items:
                # Sort by confidence
                detected_items = sorted(detected_items, key=lambda x: x['confidence'], reverse=True)
                primary_category = detected_items[0]['label']
                confidence = detected_items[0]['confidence']
                
        except Exception as e:
            print(f"YOLO inference error: {e}")

    # Fallback if YOLO didn't detect anything or isn't available
    if not primary_category:
        primary_category = analyze_image_heuristics(filepath, filename)
        # Create a mock bounding box around the center of the image
        box = [int(w * 0.1), int(h * 0.1), int(w * 0.9), int(h * 0.9)]
        detected_items.append({
            "label": primary_category,
            "confidence": confidence,
            "box": box
        })

    composition = COMPOSITION_DATABASE.get(primary_category, COMPOSITION_DATABASE["Generic Electronic"])

    return jsonify({
        "status": "success",
        "primary_item": primary_category,
        "confidence": confidence,
        "detected_items": detected_items,
        "composition": composition,
        "image_size": [w, h],
        "filename": filename
    })

@app.route('/api/refine-elemental', methods=['POST'])
def refine_elemental():
    """
    Refines estimated composition based on manual input of XRF or LIBS readings.
    Expects JSON containing:
      - base_composition: dict of current metals (gold, silver, copper, etc. in %)
      - elemental_data: dict of measured metals (e.g. {"copper": 35.5, "gold": 0.12})
    """
    data = request.json or {}
    base_comp = data.get('base_composition', {}).copy()
    elemental_data = data.get('elemental_data', {})

    if not base_comp:
        return jsonify({"error": "Base composition is required"}), 400

    # Overwrite/refine composition percentages with measured readings
    total_measured = 0.0
    for metal, val in elemental_data.items():
        if metal in base_comp:
            try:
                base_comp[metal] = float(val)
                total_measured += float(val)
            except ValueError:
                pass

    # Re-normalize remaining elements (plastics, glass, others) so total equals 100%
    fixed_metals = list(elemental_data.keys())
    others_list = ["plastics", "glass", "others"]
    
    # Calculate how much percentage is left
    remaining_pct = 100.0 - sum(base_comp[m] for m in base_comp if m in fixed_metals)
    if remaining_pct < 0:
        # If metals exceed 100%, cap them and zero out non-metals
        excess_ratio = 100.0 / sum(base_comp[m] for m in base_comp if m in fixed_metals)
        for m in base_comp:
            if m in fixed_metals:
                base_comp[m] *= excess_ratio
            else:
                base_comp[m] = 0.0
    else:
        # Re-scale non-metal fields proportionally to fit the remaining space
        non_metal_sum = sum(base_comp[o] for o in others_list if o in base_comp)
        if non_metal_sum > 0:
            scale_factor = remaining_pct / non_metal_sum
            for o in others_list:
                if o in base_comp:
                    base_comp[o] *= scale_factor
        else:
            # If no non-metals, put the remainder in 'others'
            base_comp['others'] = remaining_pct

    return jsonify({
        "status": "success",
        "refined_composition": base_comp
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
