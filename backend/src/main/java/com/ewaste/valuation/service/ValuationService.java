package com.ewaste.valuation.service;

import com.ewaste.valuation.model.MetalPrice;
import com.ewaste.valuation.model.Scan;
import com.ewaste.valuation.repository.MetalPriceRepository;
import com.ewaste.valuation.repository.ScanRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class ValuationService {

    @Autowired
    private ScanRepository scanRepository;

    @Autowired
    private MetalPriceRepository metalPriceRepository;

    private final RestTemplate restTemplate = new RestTemplate();
    private final Random random = new Random();

    // Default base prices per gram in USD
    private static final Map<String, Double> BASE_PRICES = Map.of(
        "Gold", 80.50,
        "Silver", 0.95,
        "Copper", 0.0098,
        "Aluminium", 0.0026,
        "Palladium", 33.20
    );

    // Initial database seeder
    public synchronized void seedInitialPrices() {
        for (Map.Entry<String, Double> entry : BASE_PRICES.entrySet()) {
            if (metalPriceRepository.findByMetalNameIgnoreCase(entry.getKey()).isEmpty()) {
                MetalPrice price = new MetalPrice(null, entry.getKey(), entry.getValue(), "g", LocalDateTime.now());
                metalPriceRepository.save(price);
            }
        }
    }

    // Dynamic price updater (runs every 60 seconds to simulate a live market ticker)
    @Scheduled(fixedRate = 60000, initialDelay = 10000)
    public void updateMarketPrices() {
        List<MetalPrice> prices = metalPriceRepository.findAll();
        if (prices.isEmpty()) {
            seedInitialPrices();
            return;
        }

        for (MetalPrice price : prices) {
            // Apply a small random fluctuation (-1.5% to +1.5%)
            double currentPrice = price.getCurrentPricePerG();
            double percentChange = (random.nextDouble() * 3.0 - 1.5) / 100.0;
            double newPrice = currentPrice * (1.0 + percentChange);
            
            // Round to 4 decimal places for accuracy in small values like copper/aluminium
            newPrice = Math.round(newPrice * 10000.0) / 10000.0;
            if (newPrice < 0.0001) newPrice = 0.0001; // Avoid negative/zero prices

            price.setCurrentPricePerG(newPrice);
            price.setLastUpdated(LocalDateTime.now());
            metalPriceRepository.save(price);
        }
        System.out.println("Market prices dynamically updated at " + LocalDateTime.now());
    }

    public Map<String, Double> getCurrentPricesMap() {
        List<MetalPrice> prices = metalPriceRepository.findAll();
        Map<String, Double> pricesMap = new HashMap<>();
        for (MetalPrice p : prices) {
            pricesMap.put(p.getMetalName().toLowerCase(), p.getCurrentPricePerG());
        }
        // Fallback to base prices if empty
        if (pricesMap.isEmpty()) {
            BASE_PRICES.forEach((k, v) -> pricesMap.put(k.toLowerCase(), v));
        }
        return pricesMap;
    }

    /**
     * Compute full metal valuation and recycling options for an item.
     */
    public Scan calculateValuation(String itemName, String category, double weightG, Map<String, Double> composition, String imagePath) {
        Scan scan = new Scan();
        scan.setItemName(itemName);
        scan.setItemCategory(category);
        scan.setTotalWeightG(weightG);
        scan.setImagePath(imagePath);
        scan.setScanDate(LocalDateTime.now());
        return populateValuation(scan, composition);
    }

    public Scan populateValuation(Scan scan, Map<String, Double> composition) {
        double weightG = scan.getTotalWeightG();

        // Extract composition percentages (defaulting to 0 if not present)
        double cuPct = composition.getOrDefault("copper", 0.0) / 100.0;
        double alPct = composition.getOrDefault("aluminium", 0.0) / 100.0;
        double auPct = composition.getOrDefault("gold", 0.0) / 100.0;
        double agPct = composition.getOrDefault("silver", 0.0) / 100.0;
        double pdPct = composition.getOrDefault("palladium", 0.0) / 100.0;

        // Calculate metal weights in grams
        scan.setCopperQtyG(weightG * cuPct);
        scan.setAluminiumQtyG(weightG * alPct);
        scan.setGoldQtyG(weightG * auPct);
        scan.setSilverQtyG(weightG * agPct);
        scan.setPalladiumQtyG(weightG * pdPct);

        // Get current prices
        Map<String, Double> prices = getCurrentPricesMap();
        double priceAu = prices.getOrDefault("gold", BASE_PRICES.get("Gold"));
        double priceAg = prices.getOrDefault("silver", BASE_PRICES.get("Silver"));
        double priceCu = prices.getOrDefault("copper", BASE_PRICES.get("Copper"));
        double priceAl = prices.getOrDefault("aluminium", BASE_PRICES.get("Aluminium"));
        double pricePd = prices.getOrDefault("palladium", BASE_PRICES.get("Palladium"));

        // Gross value is the raw valuation of 100% of the metals (intrinsic value)
        double grossVal = (scan.getGoldQtyG() * priceAu) +
                          (scan.getSilverQtyG() * priceAg) +
                          (scan.getCopperQtyG() * priceCu) +
                          (scan.getAluminiumQtyG() * priceAl) +
                          (scan.getPalladiumQtyG() * pricePd);
        scan.setGrossValue(Math.round(grossVal * 100.0) / 100.0);

        // Evaluate recycling methods and select the best one (highest net profit)
        RecyclingOption bestOption = evaluateRecyclingMethods(scan, prices);
        
        scan.setRecoveryValue(Math.round(bestOption.recoveryValue * 100.0) / 100.0);
        scan.setProcessingCost(Math.round(bestOption.processingCost * 100.0) / 100.0);
        scan.setNetProfit(Math.round(bestOption.netProfit * 100.0) / 100.0);
        scan.setRecommendedMethod(bestOption.methodName);
        scan.setCarbonOffsetKg(Math.round(bestOption.carbonOffsetKg * 100.0) / 100.0);

        return scanRepository.save(scan);
    }

    /**
     * Data structure to compare recycling methodologies
     */
    public static class RecyclingOption {
        public String methodName;
        public double recoveryValue;
        public double processingCost;
        public double netProfit;
        public double carbonOffsetKg;

        public RecyclingOption(String methodName, double recoveryValue, double processingCost, double netProfit, double carbonOffsetKg) {
            this.methodName = methodName;
            this.recoveryValue = recoveryValue;
            this.processingCost = processingCost;
            this.netProfit = netProfit;
            this.carbonOffsetKg = carbonOffsetKg;
        }
    }

    public List<RecyclingOption> getRecyclingComparison(double weightG, double cuG, double alG, double auG, double agG, double pdG) {
        Map<String, Double> prices = getCurrentPricesMap();
        double priceAu = prices.getOrDefault("gold", BASE_PRICES.get("Gold"));
        double priceAg = prices.getOrDefault("silver", BASE_PRICES.get("Silver"));
        double priceCu = prices.getOrDefault("copper", BASE_PRICES.get("Copper"));
        double priceAl = prices.getOrDefault("aluminium", BASE_PRICES.get("Aluminium"));
        double pricePd = prices.getOrDefault("palladium", BASE_PRICES.get("Palladium"));

        List<RecyclingOption> options = new ArrayList<>();

        // 1. Pyrometallurgical
        // Efficiencies: Au:98%, Ag:98%, Pd:98%, Cu:95%, Al:10%
        double pyroRecVal = (auG * 0.98 * priceAu) + (agG * 0.98 * priceAg) + (pdG * 0.98 * pricePd) + (cuG * 0.95 * priceCu) + (alG * 0.10 * priceAl);
        double pyroCost = weightG * 0.08; // $0.08 per gram
        double pyroOffset = (weightG / 1000.0) * 0.8; // Low offset due to carbon emissions of smelting
        options.add(new RecyclingOption("Pyrometallurgical", pyroRecVal, pyroCost, pyroRecVal - pyroCost, pyroOffset));

        // 2. Hydrometallurgical
        // Efficiencies: Au:95%, Ag:95%, Pd:95%, Cu:90%, Al:0%
        double hydroRecVal = (auG * 0.95 * priceAu) + (agG * 0.95 * priceAg) + (pdG * 0.95 * pricePd) + (cuG * 0.90 * priceCu) + (alG * 0.00 * priceAl);
        double hydroCost = weightG * 0.05; // $0.05 per gram
        double hydroOffset = (weightG / 1000.0) * 1.5; // Moderate offset
        options.add(new RecyclingOption("Hydrometallurgical", hydroRecVal, hydroCost, hydroRecVal - hydroCost, hydroOffset));

        // 3. Biometallurgical (Bioleaching)
        // Efficiencies: Au:75%, Ag:70%, Pd:70%, Cu:80%, Al:0%
        double bioRecVal = (auG * 0.75 * priceAu) + (agG * 0.70 * priceAg) + (pdG * 0.70 * pricePd) + (cuG * 0.80 * priceCu) + (alG * 0.00 * priceAl);
        double bioCost = weightG * 0.02; // $0.02 per gram
        double bioOffset = (weightG / 1000.0) * 2.2; // Highest offset (eco-friendly)
        options.add(new RecyclingOption("Biometallurgical", bioRecVal, bioCost, bioRecVal - bioCost, bioOffset));

        // 4. Mechanical Separation
        // Efficiencies: Au:10%, Ag:10%, Pd:5%, Cu:75%, Al:85%
        double mechRecVal = (auG * 0.10 * priceAu) + (agG * 0.10 * priceAg) + (pdG * 0.05 * pricePd) + (cuG * 0.75 * priceCu) + (alG * 0.85 * priceAl);
        double mechCost = weightG * 0.01; // $0.01 per gram
        double mechOffset = (weightG / 1000.0) * 1.1; // Standard mechanical separation offset
        options.add(new RecyclingOption("Mechanical Separation", mechRecVal, mechCost, mechRecVal - mechCost, mechOffset));

        return options;
    }

    private RecyclingOption evaluateRecyclingMethods(Scan scan, Map<String, Double> prices) {
        double weightG = scan.getTotalWeightG();
        double auG = scan.getGoldQtyG();
        double agG = scan.getSilverQtyG();
        double cuG = scan.getCopperQtyG();
        double alG = scan.getAluminiumQtyG();
        double pdG = scan.getPalladiumQtyG();

        List<RecyclingOption> options = getRecyclingComparison(weightG, cuG, alG, auG, agG, pdG);

        // Sort by net profit descending, select the highest net profit
        // In case of negative profits, select the one with the least loss, or biometallurgical for low cost.
        options.sort((o1, o2) -> Double.compare(o2.netProfit, o1.netProfit));
        
        return options.get(0);
    }
}
