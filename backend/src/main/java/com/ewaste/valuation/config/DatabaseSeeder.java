package com.ewaste.valuation.config;

import com.ewaste.valuation.service.ValuationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

@Component
public class DatabaseSeeder implements ApplicationRunner {

    @Autowired
    private ValuationService valuationService;

    @Override
    public void run(ApplicationArguments args) throws Exception {
        System.out.println("Seeding database with default metal price indexes...");
        valuationService.seedInitialPrices();
    }
}
