const express = require('express');
const puppeteer = require('puppeteer-core'); // Change this if you are using the bundled version

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/api/energy-futures', async (req, res) => {
    let browser;
    try {
        // Launch Puppeteer browser
        browser = await puppeteer.launch({
            executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', // Adjust the path as needed
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
            defaultViewport: null,
        });

        const page = await browser.newPage();

        // Navigate to the CNBC futures and commodities page
        await page.goto('https://www.cnbc.com/futures-and-commodities/', {
            waitUntil: 'networkidle2',
        });

        // ... Your scraping logic here ...

    } catch (error) {
        console.error('Error scraping data:', error);
        res.status(500).json({ error: 'An error occurred while scraping data.' });
    } finally {
        if (browser) {
            await browser.close(); // Ensure the browser is closed on completion
        }
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
