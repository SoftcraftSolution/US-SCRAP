const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/api/energy-futures', async (req, res) => {
    let browser;
    try {
        // Launch Puppeteer browser with performance optimizations
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
            defaultViewport: null,
        });

        const page = await browser.newPage();

        // Navigate to the CNBC futures and commodities page
        await page.goto('https://www.cnbc.com/futures-and-commodities/', {
            waitUntil: 'networkidle2',
        });

        // Scrape Energy Futures data
        const energyFuturesData = await page.evaluate(() => {
            const data = [];
            const rows = document.querySelectorAll('div[data-test="MarketTable"] .BasicTable-tableBody tr');

            rows.forEach(row => {
                const symbol = row.querySelector('.BasicTable-symbolName a')?.innerText.trim() || '';
                const price = row.querySelector('td:nth-child(2)')?.innerText.trim() || '';
                const change = row.querySelector('td:nth-child(3)')?.innerText.trim() || '';
                const percentChange = row.querySelector('td:nth-child(4)')?.innerText.trim() || '';
                const volume = row.querySelector('td:nth-child(5)')?.innerText.trim() || '';

                if (symbol) {
                    data.push({ symbol, price, change, percentChange, volume });
                }
            });

            return data;
        });

        // Scrape Metal Futures data
        const metalFuturesData = await page.evaluate(() => {
            const data = [];
            // Select the Metal Futures section using the correct traversal
            const metalHeader = Array.from(document.querySelectorAll('h3')).find(h => h.innerText.includes("METAL FUTURES"));
            const metalTable = metalHeader ? metalHeader.nextElementSibling.querySelector('[data-test="MarketTable"]') : null;

            if (metalTable) {
                const rows = metalTable.querySelectorAll('.BasicTable-tableBody tr');

                rows.forEach(row => {
                    const symbol = row.querySelector('.BasicTable-symbolName a')?.innerText.trim() || '';
                    const price = row.querySelector('td:nth-child(2)')?.innerText.trim() || '';
                    const change = row.querySelector('td:nth-child(3)')?.innerText.trim() || '';
                    const percentChange = row.querySelector('td:nth-child(4)')?.innerText.trim() || '';
                    const volume = row.querySelector('td:nth-child(5)')?.innerText.trim() || '';

                    if (symbol) {
                        data.push({ symbol, price, change, percentChange, volume });
                    }
                });
            }

            return data;
        });

        // Log Metal Futures data to the console
        console.log('Metal Futures Data:', metalFuturesData);

        // Return the scraped energy and metal futures data
        res.json({
            energyFutures: { tableHeader: "Energy Futures", data: energyFuturesData },
            metalFutures: { tableHeader: "Metal Futures", data: metalFuturesData },
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

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
