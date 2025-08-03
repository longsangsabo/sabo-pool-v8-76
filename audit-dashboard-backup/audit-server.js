const express = require('express');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const app = express();
const port = 3000;

// Middleware to parse JSON requests
app.use(express.json());

// Serve static files from the current directory
app.use(express.static(__dirname));

// Create reports directory if it doesn't exist
const reportsDir = path.join(__dirname, 'reports');
if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir);
}

// Endpoint to run a specific analysis script
app.post('/api/run-analysis', (req, res) => {
    const { type } = req.body;
    
    if (!type) {
        return res.status(400).json({ error: 'Analysis type is required' });
    }
    
    let scriptPath;
    let scriptName;
    
    switch (type) {
        case 'component':
            scriptPath = path.join(__dirname, 'scripts/simple-component-consolidation.js');
            scriptName = 'Component Consolidation';
            break;
        case 'dependency':
            scriptPath = path.join(__dirname, 'scripts/simple-dependency-analyzer.js');
            scriptName = 'Dependency Analysis';
            break;
        case 'performance':
            scriptPath = path.join(__dirname, 'scripts/simple-performance-analyzer.js');
            scriptName = 'Performance Analysis';
            break;
        case 'security':
            scriptPath = path.join(__dirname, 'scripts/simple-security-analyzer.js');
            scriptName = 'Security Analysis';
            break;
        case 'test':
            scriptPath = path.join(__dirname, 'scripts/simple-test-analyzer.js');
            scriptName = 'Test Coverage Analysis';
            break;
        case 'master':
            scriptPath = path.join(__dirname, 'scripts/master-audit-orchestrator.js');
            scriptName = 'Master Audit';
            break;
        default:
            return res.status(400).json({ error: 'Invalid analysis type' });
    }
    
    // Check if the script exists
    if (!fs.existsSync(scriptPath)) {
        return res.status(404).json({ error: `Script for ${scriptName} not found` });
    }
    
    // Create a unique report ID and filename
    const reportId = `${type}-${Date.now()}`;
    const reportPath = path.join(reportsDir, `${reportId}.json`);
    
    // Execute the script with the report path as an argument
    exec(`node "${scriptPath}" --output="${reportPath}"`, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error executing ${scriptName}: ${error.message}`);
            return res.status(500).json({ 
                error: 'Script execution failed', 
                details: error.message,
                stdout,
                stderr
            });
        }
        
        if (stderr) {
            console.warn(`Script warning: ${stderr}`);
        }
        
        // Check if the report file was created
        if (!fs.existsSync(reportPath)) {
            return res.status(500).json({ 
                error: 'Report file was not created',
                stdout,
                stderr
            });
        }
        
        try {
            // Read the report file
            const reportData = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
            
            // Send the report data as the response
            res.status(200).json({
                success: true,
                reportId,
                reportData
            });
        } catch (readError) {
            res.status(500).json({
                error: 'Failed to read report file',
                details: readError.message
            });
        }
    });
});

// Endpoint to get a specific report by ID
app.get('/api/reports/:id', (req, res) => {
    const reportPath = path.join(reportsDir, `${req.params.id}.json`);
    
    if (!fs.existsSync(reportPath)) {
        return res.status(404).json({ error: 'Report not found' });
    }
    
    try {
        const reportData = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
        res.status(200).json(reportData);
    } catch (error) {
        res.status(500).json({
            error: 'Failed to read report file',
            details: error.message
        });
    }
});

// Endpoint to get all reports
app.get('/api/reports', (req, res) => {
    try {
        const reports = fs.readdirSync(reportsDir)
            .filter(file => file.endsWith('.json'))
            .map(file => {
                const filePath = path.join(reportsDir, file);
                try {
                    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                    return {
                        id: path.basename(file, '.json'),
                        title: data.title || 'Unknown Report',
                        type: data.type || 'unknown',
                        date: data.date || new Date().toISOString(),
                        summary: data.summary || {}
                    };
                } catch (error) {
                    return {
                        id: path.basename(file, '.json'),
                        title: 'Error reading report',
                        type: 'error',
                        date: new Date().toISOString(),
                        error: error.message
                    };
                }
            });
        
        res.status(200).json(reports);
    } catch (error) {
        res.status(500).json({
            error: 'Failed to read reports directory',
            details: error.message
        });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Audit Dashboard server running at http://localhost:${port}`);
    console.log(`Open the dashboard at http://localhost:${port}/audit-dashboard.html`);
});
