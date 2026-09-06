package com.ewaste.valuation.repository;

import com.ewaste.valuation.model.MetalPrice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface MetalPriceRepository extends JpaRepository<MetalPrice, Long> {
    Optional<MetalPrice> findByMetalNameIgnoreCase(String metalName);
}
