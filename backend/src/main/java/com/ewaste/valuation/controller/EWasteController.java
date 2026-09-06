package com.ewaste.valuation.controller;

import com.ewaste.valuation.model.MetalPrice;
import com.ewaste.valuation.model.Scan;
import com.ewaste.valuation.repository.MetalPriceRepository;
import com.ewaste.valuation.repository.ScanRepository;
import com.ewaste.valuation.service.ValuationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/ewaste")
@CrossOrigin(origins = "*") // Allow frontend access
public class EWasteController {

    @Autowired
    private ScanRepository scanRepository;

    @Autowired
    private MetalPriceRepository metalPriceRepository;

    @Autowired
    private ValuationService valuationService;

    private final RestTemplate restTemplate = new RestTemplate();
    private static final String PYTHON_SERVICE_URL = "http://localhost:5000/api";
    private static final String UPLOADS_DIR = "uploads";

    // Standard fallback composition database if AI service is offline
    private static final Map<String, Map<String, Double>> FALLBACK_COMPOSITIONS = Map.of(
        "PCB (Printed Circuit Board)", Map.of("copper", 20.0, "aluminium", 7.0, "gold", 0.025, "silver", 0.1, "palladium", 0.005, "plastics", 30.0, "glass", 10.0, "others", 32.875),
        "Cell Phone", Map.of("copper", 13.0, "aluminium", 5.0, "gold", 0.03, "silver", 0.12, "palladium", 0.006, "plastics", 35.0, "glass", 25.0, "others", 21.844),
        "Laptop", Map.of("copper", 10.0, "aluminium", 18.0, "gold", 0.01, "silver", 0.05, "palladium", 0.002, "plastics", 35.0, "glass", 15.0, "others", 21.938),
        "Keyboard", Map.of("copper", 3.0, "aluminium", 1.0, "gold", 0.001, "silver", 0.005, "palladium", 0.0, "plastics", 85.0, "glass", 0.0, "others", 10.994),
        "Mouse", Map.of("copper", 2.5, "aluminium", 0.5, "gold", 0.0005, "silver", 0.002, "palladium", 0.0, "plastics", 90.0, "glass", 0.0, "others", 6.9975),
        "Monitor/TV", Map.of("copper", 7.0, "aluminium", 10.0, "gold", 0.003, "silver", 0.02, "palladium", 0.001, "plastics", 40.0, "glass", 25.0, "others", 17.976),
        "Cables/Wires", Map.of("copper", 65.0, "aluminium", 5.0, "gold", 0.0, "silver", 0.0, "palladium", 0.0, "plastics", 30.0, "glass", 0.0, "others", 0.0),
        "Battery", Map.of("copper", 8.0, "aluminium", 12.0, "gold", 0.0, "silver", 0.0, "palladium", 0.0, "plastics", 15.0, "glass", 0.0, "others", 65.0),
        "Generic Electronic", Map.of("copper", 8.0, "aluminium", 5.0, "gold", 0.005, "silver", 0.02, "palladium", 0.001, "plastics", 45.0, "glass", 10.0, "others", 31.974)
    );

    @GetMapping("/prices")
    public ResponseEntity<List<MetalPrice>> getLivePrices() {
        return ResponseEntity.ok(metalPriceRepository.findAll());
    }

    @GetMapping("/history")
    public ResponseEntity<List<Scan>> getScanHistory() {
        return ResponseEntity.ok(scanRepository.findAllByOrderByScanDateDesc());
    }

    @DeleteMapping("/scan/{id}")
    public ResponseEntity<Map<String, String>> deleteScan(@PathVariable Long id) {
        if (scanRepository.existsById(id)) {
            scanRepository.deleteById(id);
            return ResponseEntity.ok(Map.of("message", "Scan history record deleted successfully"));
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Scan not found"));
    }

    @GetMapping("/compare/{id}")
    public ResponseEntity<List<ValuationService.RecyclingOption>> getRecyclingComparison(@PathVariable Long id) {
        Optional<Scan> scanOpt = scanRepository.findById(id);
        if (scanOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        Scan scan = scanOpt.get();
        List<ValuationService.RecyclingOption> comparison = valuationService.getRecyclingComparison(
            scan.getTotalWeightG(),
            scan.getCopperQtyG(),
            scan.getAluminiumQtyG(),
            scan.getGoldQtyG(),
            scan.getSilverQtyG(),
            scan.getPalladiumQtyG()
        );
        return ResponseEntity.ok(comparison);
    }

    @PostMapping("/scan")
    public ResponseEntity<?> scanEWaste(
            @RequestParam("image") MultipartFile file,
            @RequestParam(value = "itemName", required = false) String itemName,
            @RequestParam(value = "weightG", defaultValue = "350.0") Double weightG
    ) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Please upload a valid image file."));
        }

        // Save image locally in backend upload folder
        String fileName = System.currentTimeMillis() + "_" + file.getOriginalFilename();
        Path uploadPath = Paths.get(System.getProperty("user.dir"), UPLOADS_DIR);
        try {
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }
            Files.copy(file.getInputStream(), uploadPath.resolve(fileName));
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to store image: " + e.getMessage()));
        }

        // Prepare parameters
        String finalItemName = (itemName == null || itemName.trim().isEmpty()) ? "Scanned Component" : itemName;
        String imageRelativePath = UPLOADS_DIR + "/" + fileName;

        // Try calling Python AI service
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);

            org.springframework.util.LinkedMultiValueMap<String, Object> body = new org.springframework.util.LinkedMultiValueMap<>();
            body.add("image", file.getResource());

            HttpEntity<org.springframework.util.LinkedMultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);
            
            ResponseEntity<Map> response = restTemplate.postForEntity(
                PYTHON_SERVICE_URL + "/classify",
                requestEntity,
                Map.class
            );

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                Map<String, Object> aiResult = response.getBody();
                String detectedCategory = (String) aiResult.get("primary_item");
                Map<String, Double> composition = (Map<String, Double>) aiResult.get("composition");
                List<Object> detectedItems = (List<Object>) aiResult.get("detected_items");
                
                String finalName = (itemName == null || itemName.trim().isEmpty()) ? "Scanned " + detectedCategory : itemName;

                Scan result = valuationService.calculateValuation(
                    finalName,
                    detectedCategory,
                    weightG,
                    composition,
                    imageRelativePath
                );

                // Add bounding boxes and items inside the response metadata
                Map<String, Object> finalResponse = new HashMap<>();
                finalResponse.put("scan", result);
                finalResponse.put("detected_items", detectedItems);
                finalResponse.put("status", "success");
                finalResponse.put("ai_service_used", true);

                return ResponseEntity.ok(finalResponse);
            }
        } catch (Exception e) {
            System.err.println("Warning: AI Microservice down. Executing fallback local heuristics. Error: " + e.getMessage());
        }

        // Fallback Heuristics
        String detectedCategory = determineFallbackCategory(file.getOriginalFilename());
        Map<String, Double> composition = FALLBACK_COMPOSITIONS.getOrDefault(detectedCategory, FALLBACK_COMPOSITIONS.get("Generic Electronic"));
        String finalName = (itemName == null || itemName.trim().isEmpty()) ? "Scanned " + detectedCategory + " (Fallback)" : itemName;

        Scan result = valuationService.calculateValuation(
            finalName,
            detectedCategory,
            weightG,
            composition,
            imageRelativePath
        );

        // Bounding box mock for frontend
        List<Map<String, Object>> mockDetections = List.of(Map.of(
            "label", detectedCategory,
            "confidence", 0.85,
            "box", List.of(50, 50, 400, 400)
        ));

        Map<String, Object> finalResponse = new HashMap<>();
        finalResponse.put("scan", result);
        finalResponse.put("detected_items", mockDetections);
        finalResponse.put("status", "success");
        finalResponse.put("ai_service_used", false);

        return ResponseEntity.ok(finalResponse);
    }

    @PostMapping("/refine/{id}")
    public ResponseEntity<?> refineScan(@PathVariable Long id, @RequestBody Map<String, Object> requestBody) {
        Optional<Scan> scanOpt = scanRepository.findById(id);
        if (scanOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Scan entry not found"));
        }

        Scan scan = scanOpt.get();
        Map<String, Double> elementalData = (Map<String, Double>) requestBody.get("elemental_data");
        if (elementalData == null || elementalData.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "elemental_data field is required."));
        }

        // Build base composition map from existing scan quantities
        double totalWt = scan.getTotalWeightG();
        Map<String, Double> baseComp = new HashMap<>();
        baseComp.put("copper", (scan.getCopperQtyG() / totalWt) * 100.0);
        baseComp.put("aluminium", (scan.getAluminiumQtyG() / totalWt) * 100.0);
        baseComp.put("gold", (scan.getGoldQtyG() / totalWt) * 100.0);
        baseComp.put("silver", (scan.getSilverQtyG() / totalWt) * 100.0);
        baseComp.put("palladium", (scan.getPalladiumQtyG() / totalWt) * 100.0);
        
        // Note: we can estimate non-metals residues
        double metalSum = baseComp.values().stream().mapToDouble(Double::doubleValue).sum();
        baseComp.put("plastics", 35.0);
        baseComp.put("glass", 15.0);
        baseComp.put("others", Math.max(0.0, 100.0 - metalSum - 50.0));

        Map<String, Double> refinedComp = null;

        // Try calling Python AI service /refine-elemental endpoint
        try {
            Map<String, Object> pyRequest = new HashMap<>();
            pyRequest.put("base_composition", baseComp);
            pyRequest.put("elemental_data", elementalData);

            ResponseEntity<Map> response = restTemplate.postForEntity(
                PYTHON_SERVICE_URL + "/refine-elemental",
                pyRequest,
                Map.class
            );

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                Map<String, Object> body = response.getBody();
                refinedComp = (Map<String, Double>) body.get("refined_composition");
            }
        } catch (Exception e) {
            System.err.println("Warning: AI service refine endpoint failed. Running local Java refinement. Error: " + e.getMessage());
        }

        // Local Java fallback refinement logic if Python microservice is offline
        if (refinedComp == null) {
            refinedComp = executeLocalRefinement(baseComp, elementalData);
        }

        // Apply updated composition and recompute valuation
        Scan updatedScan = valuationService.populateValuation(scan, refinedComp);

        return ResponseEntity.ok(Map.of(
            "status", "success",
            "scan", updatedScan,
            "ai_service_used", refinedComp != null
        ));
    }

    private String determineFallbackCategory(String filename) {
        if (filename == null) return "Generic Electronic";
        String fn = filename.toLowerCase(Locale.ROOT);
        if (fn.contains("pcb") || fn.contains("board") || fn.contains("circuit") || fn.contains("motherboard")) {
            return "PCB (Printed Circuit Board)";
        } else if (fn.contains("phone") || fn.contains("mobile") || fn.contains("iphone") || fn.contains("android")) {
            return "Cell Phone";
        } else if (fn.contains("laptop") || fn.contains("notebook")) {
            return "Laptop";
        } else if (fn.contains("keyboard")) {
            return "Keyboard";
        } else if (fn.contains("mouse")) {
            return "Mouse";
        } else if (fn.contains("cable") || fn.contains("wire")) {
            return "Cables/Wires";
        } else if (fn.contains("battery")) {
            return "Battery";
        } else if (fn.contains("monitor") || fn.contains("tv") || fn.contains("screen")) {
            return "Monitor/TV";
        }
        return "Generic Electronic";
    }

    private Map<String, Double> executeLocalRefinement(Map<String, Double> baseComp, Map<String, Double> elementalData) {
        Map<String, Double> refined = new HashMap<>(baseComp);
        double fixedSum = 0.0;

        for (Map.Entry<String, Double> entry : elementalData.entrySet()) {
            String metal = entry.getKey().toLowerCase();
            if (refined.containsKey(metal)) {
                refined.put(metal, entry.getValue());
                fixedSum += entry.getValue();
            }
        }

        double remainingPct = 100.0 - fixedSum;
        if (remainingPct < 0) {
            double scale = 100.0 / fixedSum;
            for (String key : refined.keySet()) {
                if (elementalData.containsKey(key)) {
                    refined.put(key, refined.get(key) * scale);
                } else {
                    refined.put(key, 0.0);
                }
            }
        } else {
            List<String> others = List.of("plastics", "glass", "others");
            double othersSum = 0.0;
            for (String o : others) {
                othersSum += refined.getOrDefault(o, 0.0);
            }
            if (othersSum > 0) {
                double scale = remainingPct / othersSum;
                for (String o : others) {
                    refined.put(o, refined.getOrDefault(o, 0.0) * scale);
                }
            } else {
                refined.put("others", remainingPct);
            }
        }
        return refined;
    }
}
