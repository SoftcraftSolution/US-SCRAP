const express = require('express');
const puppeteer = require('puppeteer-core');
const chromium = require('chrome-aws-lambda'); // For serverless environments

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/api/energy-futures', async (req, res) => {
    let browser;
    try {
        // Launch Puppeteer browser for serverless environment
        browser = await puppeteer.launch({
            args: chromium.args,
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath,
            headless: true,
            ignoreHTTPSErrors: true,
        });

        const page = await browser.newPage();

        // Navigate to the CNBC futures and commodities page
        await page.goto('https://www.cnbc.com/futures-and-commodities/', {
            waitUntil: 'networkidle2',
            timeout: 60000, // 60 seconds timeout
        });

        // Scrape both Energy Futures and Metal Futures data
        const futuresData = await page.evaluate(() => {
            const energyData = [];
            const metalData = [];

            // Scrape Energy Futures data
            const energyRows = document.querySelectorAll('div[data-test="MarketTable"] .BasicTable-tableBody tr');
            energyRows.forEach(row => {
                const symbol = row.querySelector('.BasicTable-symbolName a')?.innerText.trim() || '';
                const price = row.querySelector('td:nth-child(2)')?.innerText.trim() || '';
                const change = row.querySelector('td:nth-child(3)')?.innerText.trim() || '';
                const percentChange = row.querySelector('td:nth-child(4)')?.innerText.trim() || '';
                const volume = row.querySelector('td:nth-child(5)')?.innerText.trim() || '';

                if (symbol) {
                    energyData.push({ symbol, price, change, percentChange, volume });
                }
            });

            // Scrape Metal Futures data
            const metalRows = document.querySelectorAll('.MarketsSectionTable-top [data-test="MarketTable"] .BasicTable-tableBody tr');
            metalRows.forEach(row => {
                const symbol = row.querySelector('.BasicTable-symbolName a')?.innerText.trim() || '';
                const price = row.querySelector('td:nth-child(2)')?.innerText.trim() || '';
                const change = row.querySelector('td:nth-child(3)')?.innerText.trim() || '';
                const percentChange = row.querySelector('td:nth-child(4)')?.innerText.trim() || '';
                const volume = row.querySelector('td:nth-child(5)')?.innerText.trim() || '';

                // Include only relevant metal symbols
                if (symbol && (symbol.includes('GOLD') || symbol.includes('SILVER') || symbol.includes('PLATINUM') || symbol.includes('PALLADIUM'))) {
                    metalData.push({ symbol, price, change, percentChange, volume });
                }
            });

            return { energyFutures: energyData, metalFutures: metalData };
        });

        // Return the scraped energy and metal futures data
        res.json({
            energyFutures: { tableHeader: "Energy Futures", data: futuresData.energyFutures },
            metalFutures: { tableHeader: "Metal Futures", data: futuresData.metalFutures },
        });
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
