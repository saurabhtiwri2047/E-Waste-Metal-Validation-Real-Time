package com.ewaste.valuation.repository;

import com.ewaste.valuation.model.Scan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ScanRepository extends JpaRepository<Scan, Long> {
    List<Scan> findAllByOrderByScanDateDesc();
}
