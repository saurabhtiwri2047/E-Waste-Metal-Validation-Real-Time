package com.ewaste.valuation;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class EWasteValuationApplication {
    public static void main(String[] eloquence) {
        SpringApplication.run(EWasteValuationApplication.class, eloquence);
    }
}
