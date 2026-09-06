package com.ewaste.valuation.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "scans")
public class Scan {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "item_name", nullable = false)
    private String itemName;

    @Column(name = "item_category", nullable = false)
    private String itemCategory;

    @Column(name = "total_weight_g", nullable = false)
    private Double totalWeightG;

    @Column(name = "image_path")
    private String imagePath;

    // Metal Quantities (in grams)
    @Column(name = "gold_qty_g")
    private Double goldQtyG = 0.0;

    @Column(name = "silver_qty_g")
    private Double silverQtyG = 0.0;

    @Column(name = "copper_qty_g")
    private Double copperQtyG = 0.0;

    @Column(name = "aluminium_qty_g")
    private Double aluminiumQtyG = 0.0;

    @Column(name = "palladium_qty_g")
    private Double palladiumQtyG = 0.0;

    // Financial Valuations (in USD)
    @Column(name = "gross_value")
    private Double grossValue = 0.0;

    @Column(name = "recovery_value")
    private Double recoveryValue = 0.0;

    @Column(name = "processing_cost")
    private Double processingCost = 0.0;

    @Column(name = "net_profit")
    private Double netProfit = 0.0;

    // Recommendation and Environmental impact
    @Column(name = "recommended_method")
    private String recommendedMethod;

    @Column(name = "carbon_offset_kg")
    private Double carbonOffsetKg = 0.0;

    @Column(name = "scan_date")
    private LocalDateTime scanDate = LocalDateTime.now();

    public Scan() {}

    public Scan(Long id, String itemName, String itemCategory, Double totalWeightG, String imagePath, Double goldQtyG, Double silverQtyG, Double copperQtyG, Double aluminiumQtyG, Double palladiumQtyG, Double grossValue, Double recoveryValue, Double processingCost, Double netProfit, String recommendedMethod, Double carbonOffsetKg, LocalDateTime scanDate) {
        this.id = id;
        this.itemName = itemName;
        this.itemCategory = itemCategory;
        this.totalWeightG = totalWeightG;
        this.imagePath = imagePath;
        this.goldQtyG = goldQtyG;
        this.silverQtyG = silverQtyG;
        this.copperQtyG = copperQtyG;
        this.aluminiumQtyG = aluminiumQtyG;
        this.palladiumQtyG = palladiumQtyG;
        this.grossValue = grossValue;
        this.recoveryValue = recoveryValue;
        this.processingCost = processingCost;
        this.netProfit = netProfit;
        this.recommendedMethod = recommendedMethod;
        this.carbonOffsetKg = carbonOffsetKg;
        this.scanDate = scanDate;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getItemName() { return itemName; }
    public void setItemName(String itemName) { this.itemName = itemName; }

    public String getItemCategory() { return itemCategory; }
    public void setItemCategory(String itemCategory) { this.itemCategory = itemCategory; }

    public Double getTotalWeightG() { return totalWeightG; }
    public void setTotalWeightG(Double totalWeightG) { this.totalWeightG = totalWeightG; }

    public String getImagePath() { return imagePath; }
    public void setImagePath(String imagePath) { this.imagePath = imagePath; }

    public Double getGoldQtyG() { return goldQtyG; }
    public void setGoldQtyG(Double goldQtyG) { this.goldQtyG = goldQtyG; }

    public Double getSilverQtyG() { return silverQtyG; }
    public void setSilverQtyG(Double silverQtyG) { this.silverQtyG = silverQtyG; }

    public Double getCopperQtyG() { return copperQtyG; }
    public void setCopperQtyG(Double copperQtyG) { this.copperQtyG = copperQtyG; }

    public Double getAluminiumQtyG() { return aluminiumQtyG; }
    public void setAluminiumQtyG(Double aluminiumQtyG) { this.aluminiumQtyG = aluminiumQtyG; }

    public Double getPalladiumQtyG() { return palladiumQtyG; }
    public void setPalladiumQtyG(Double palladiumQtyG) { this.palladiumQtyG = palladiumQtyG; }

    public Double getGrossValue() { return grossValue; }
    public void setGrossValue(Double grossValue) { this.grossValue = grossValue; }

    public Double getRecoveryValue() { return recoveryValue; }
    public void setRecoveryValue(Double recoveryValue) { this.recoveryValue = recoveryValue; }

    public Double getProcessingCost() { return processingCost; }
    public void setProcessingCost(Double processingCost) { this.processingCost = processingCost; }

    public Double getNetProfit() { return netProfit; }
    public void setNetProfit(Double netProfit) { this.netProfit = netProfit; }

    public String getRecommendedMethod() { return recommendedMethod; }
    public void setRecommendedMethod(String recommendedMethod) { this.recommendedMethod = recommendedMethod; }

    public Double getCarbonOffsetKg() { return carbonOffsetKg; }
    public void setCarbonOffsetKg(Double carbonOffsetKg) { this.carbonOffsetKg = carbonOffsetKg; }

    public LocalDateTime getScanDate() { return scanDate; }
    public void setScanDate(LocalDateTime scanDate) { this.scanDate = scanDate; }
}

