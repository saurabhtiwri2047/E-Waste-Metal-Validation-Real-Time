package com.ewaste.valuation.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "metal_prices")
public class MetalPrice {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "metal_name", nullable = false, unique = true)
    private String metalName;

    @Column(name = "current_price_per_g", nullable = false)
    private Double currentPricePerG;

    @Column(name = "unit")
    private String unit = "g";

    @Column(name = "last_updated")
    private LocalDateTime lastUpdated = LocalDateTime.now();

    public MetalPrice() {}

    public MetalPrice(Long id, String metalName, Double currentPricePerG, String unit, LocalDateTime lastUpdated) {
        this.id = id;
        this.metalName = metalName;
        this.currentPricePerG = currentPricePerG;
        this.unit = unit;
        this.lastUpdated = lastUpdated;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getMetalName() { return metalName; }
    public void setMetalName(String metalName) { this.metalName = metalName; }

    public Double getCurrentPricePerG() { return currentPricePerG; }
    public void setCurrentPricePerG(Double currentPricePerG) { this.currentPricePerG = currentPricePerG; }

    public String getUnit() { return unit; }
    public void setUnit(String unit) { this.unit = unit; }

    public LocalDateTime getLastUpdated() { return lastUpdated; }
    public void setLastUpdated(LocalDateTime lastUpdated) { this.lastUpdated = lastUpdated; }
}

