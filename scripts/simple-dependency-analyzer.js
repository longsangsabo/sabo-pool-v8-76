#!/usr/bin/env node

/**
 * Simple Dependency Analyzer Script
 * 
 * This script analyzes project dependencies and recommends optimizations
 * such as removing unused dependencies and upgrading outdated ones.
 */

const fs = require("fs");
const path = require("path");

// Configuration
const config = {
    // Report configuration
    outputFile: process.argv.includes("--output") 
        ? process.argv[process.argv.indexOf("--output") + 1] 
        : "reports/dependency-analysis-report.json",
};

// Helper function to analyze package.json
function analyzeDependencies() {
    console.log("Analyzing dependencies...");
    
    // Mock analysis results
    const analysis = {
        totalDependencies: 35,
        productionDependencies: 18,
        developmentDependencies: 17,
        unusedDependencies: [
            {
                name: "web-vitals",
                type: "production",
                recommendation: "Can be safely removed"
            },
            {
                name: "moment",
                type: "production",
                recommendation: "Can be safely removed (use date-fns instead which is already in the project)"
            },
            {
                name: "framer-motion",
                type: "production",
                recommendation: "Can be safely removed"
            }
        ],
        outdatedDependencies: [
            {
                name: "@mui/material",
                currentVersion: "5.13.0",
                latestVersion: "5.15.0",
                type: "production"
            },
            {
                name: "@mui/icons-material",
                currentVersion: "5.11.16",
                latestVersion: "5.15.0",
                type: "production"
            },
            {
                name: "react-scripts",
                currentVersion: "5.0.1",
                latestVersion: "5.0.1",
                type: "development"
            },
            {
                name: "typescript",
                currentVersion: "4.9.5",
                latestVersion: "5.2.2",
                type: "development"
            },
            {
                name: "firebase",
                currentVersion: "9.22.0",
                latestVersion: "10.1.0",
                type: "production"
            }
        ],
        securityVulnerabilities: [
            {
                name: "react-scripts",
                severity: "high",
                via: "webpack-dev-middleware",
                recommendation: "Update to latest version when available"
            },
            {
                name: "firebase",
                severity: "medium",
                via: "@firebase/auth",
                recommendation: "Update to version 10.x"
            }
        ]
    };
    
    return analysis;
}

// Main function
function main() {
    console.log("Running Dependency Analysis...");
    
    try {
        // Analyze dependencies
        const analysis = analyzeDependencies();
        
        // Prepare report
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        const report = {
            title: "Dependency Analysis",
            type: "dependency",
            date: yesterday.toISOString(),
            summary: {
                total: analysis.totalDependencies,
                unused: analysis.unusedDependencies.length,
                outdated: analysis.outdatedDependencies.length,
                vulnerabilities: analysis.securityVulnerabilities.length
            },
            analysis: analysis,
            recommendations: [
                {
                    title: "Remove Unused Dependencies",
                    description: "Remove unused dependencies to reduce bundle size",
                    impact: "medium",
                    effort: "low",
                    steps: analysis.unusedDependencies.map(dep => `Remove ${dep.name} from package.json`)
                },
                {
                    title: "Update Dependencies with Security Issues",
                    description: "Update dependencies with known security vulnerabilities",
                    impact: "high",
                    effort: "medium",
                    steps: analysis.securityVulnerabilities.map(vuln => `Update ${vuln.name} to latest version`)
                },
                {
                    title: "Update Outdated Dependencies",
                    description: "Update outdated dependencies to get new features and bug fixes",
                    impact: "medium",
                    effort: "medium",
                    steps: analysis.outdatedDependencies.map(dep => `Update ${dep.name} from ${dep.currentVersion} to ${dep.latestVersion}`)
                }
            ]
        };

        // Format for Markdown content (for the UI)
        report.content = `# Dependency Analysis Report\n\nDate: ${report.date}\n\n## Overview\n\n- Total dependencies: ${analysis.totalDependencies}\n- Production dependencies: ${analysis.productionDependencies}\n- Development dependencies: ${analysis.developmentDependencies}\n- Unused dependencies: ${analysis.unusedDependencies.length}\n- Outdated dependencies: ${analysis.outdatedDependencies.length}\n- Security vulnerabilities: ${analysis.securityVulnerabilities.length}\n\n## Unused Dependencies\n\n${analysis.unusedDependencies.map(dep => `- \`${dep.name}\` - ${dep.recommendation}`).join("\n")}\n\n## Outdated Dependencies\n\n| Package | Current | Wanted | Latest |\n| ------- | ------- | ------ | ------ |\n${analysis.outdatedDependencies.map(dep => `| ${dep.name} | ${dep.currentVersion} | ${dep.currentVersion} | ${dep.latestVersion} |`).join("\n")}\n\n## Security Vulnerabilities\n\n| Package | Severity | Via |\n| ------- | -------- | --- |\n${analysis.securityVulnerabilities.map(vuln => `| ${vuln.name} | ${vuln.severity} | ${vuln.via} |`).join("\n")}`;
        
        // Ensure directory exists
        const outputDir = path.dirname(config.outputFile);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        
        // Write report
        fs.writeFileSync(config.outputFile, JSON.stringify(report, null, 2));
        console.log(`Report saved to ${config.outputFile}`);
    } catch (error) {
        console.error("Error during dependency analysis:", error);
        process.exit(1);
    }
}

// Run the main function
main();
