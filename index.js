const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/api/energy-futures', async (req, res) => {
    try {
        // Fetch the HTML of the CNBC futures and commodities page
        const { data } = await axios.get('https://www.cnbc.com/futures-and-commodities/', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.75 Safari/537.36'
            }
        });

        // Load the HTML into cheerio
        const $ = cheerio.load(data);

        // Scrape both Energy Futures and Metal Futures data
        const futuresData = {
            energyFutures: [],
            metalFutures: [],
        };

        // Scrape Energy Futures data
        const energyRows = $('div[data-test="MarketTable"] .BasicTable-tableBody tr');
        energyRows.each((index, row) => {
            const symbol = $(row).find('.BasicTable-symbolName a').text().trim() || '';
            const price = $(row).find('td:nth-child(2)').text().trim() || '';
            const change = $(row).find('td:nth-child(3)').text().trim() || '';
            const percentChange = $(row).find('td:nth-child(4)').text().trim() || '';
            const volume = $(row).find('td:nth-child(5)').text().trim() || '';

            if (symbol) {
                futuresData.energyFutures.push({ symbol, price, change, percentChange, volume });
            }
        });

        // Scrape Metal Futures data
        const metalRows = $('.MarketsSectionTable-top [data-test="MarketTable"] .BasicTable-tableBody tr');
        metalRows.each((index, row) => {
            const symbol = $(row).find('.BasicTable-symbolName a').text().trim() || '';
            const price = $(row).find('td:nth-child(2)').text().trim() || '';
            const change = $(row).find('td:nth-child(3)').text().trim() || '';
            const percentChange = $(row).find('td:nth-child(4)').text().trim() || '';
            const volume = $(row).find('td:nth-child(5)').text().trim() || '';

            // Include only relevant metal symbols
            if (symbol && (symbol.includes('GOLD') || symbol.includes('SILVER') || symbol.includes('PLATINUM') || symbol.includes('PALLADIUM'))) {
                futuresData.metalFutures.push({ symbol, price, change, percentChange, volume });
            }
        });

        // Log data to the console
        console.log('Futures Data:', futuresData);
        
        // Return the scraped energy and metal futures data
        res.json({
            energyFutures: { tableHeader: "Energy Futures", data: futuresData.energyFutures },
            metalFutures: { tableHeader: "Metal Futures", data: futuresData.metalFutures },
        });
    } catch (error) {
        console.error('Error scraping data:', error);
        res.status(500).json({ error: 'An error occurred while scraping data.' });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
