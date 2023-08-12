const puppeteer = require('puppeteer');

const link = process.argv[2];

if (!link) {
    console.log('.');
    process.exit(1);
}

(async () => {
    const browser = await puppeteer.launch({headless: false});
    const page = await browser.newPage();

    await page.setExtraHTTPHeaders({
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.82 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
    });

    try {
        await page.goto(link);
        await page.waitForSelector('body');
        const priceElement = await page.$x('/html/body/main/div/section/div/main/div/aside/div[1]/div[1]/div[1]/div[1]/div[1]/div/h1');
        const userProfileLinkElement = await page.$x('/html/body/main/div/section/div/main/div/aside/div[3]/a');

        if (priceElement.length > 0) {
            const price = await page.evaluate(element => element.textContent, priceElement[0]);
            const userProfileLink = await page.evaluate(element => element.getAttribute('href'), userProfileLinkElement[0]);
            console.log('Item price:', price);

            const userInfo = await scrapeUserProfile(page, userProfileLink);
            const itemPrices = Object.values(userInfo.items).sort((a, b) => a - b);
            const maxBargain = userInfo.bargain;

            const totalPrice = getPriceFloatValue(price);
            const maxItems = Math.min(itemPrices.length - 1, Math.floor(maxBargain / 0.05));

            let optimalItems = 0;
            let optimalBargain = 0;
            let optimalPrice = totalPrice;

            for (let i = 0; i <= maxItems; i++) {
                const currentBargain = i * (maxBargain / maxItems);
                const currentTotalPrice = (totalPrice + itemPrices.slice(1, i + 1).reduce((acc, cur) => acc + cur, 0)) * (1 - currentBargain);
                if (currentTotalPrice < optimalPrice) {
                    optimalPrice = currentTotalPrice;
                    optimalItems = i + 1;
                    optimalBargain = currentBargain;
                }
            }

            if (optimalItems > 0) {
                console.log(`Optimal configuration: ${optimalItems} item(s) with ${Math.round(optimalBargain * 100)}% discount.`);
                console.log(`Total price: ${optimalPrice}`);
            } else {
                console.log('There is no option to make your item cheaper.');
            }
        }
    } catch (error) {
        console.log(error);
    } finally {
        await browser.close();
    }
})();

async function scrapeUserProfile(page, link) {
    await page.goto('https://www.vinted.com' + link);
    await page.waitForSelector('body');
    const bargainElementXPath = '/html/body/main/div/section/div/div[2]/section/div/div/div/div/div[3]/div[1]/div/div/div/div/div/div[2]/h3';
    const bargainElement = await page.$x(bargainElementXPath);
    const bargain = getBargainPercentage(await page.evaluate(element => element.textContent, bargainElement[0]));
    return {'bargain': bargain, 'items': await scrapeUserItems(page)};
}

async function scrapeUserItems(page) {
    const itemLinks = await page.$$eval('.feed-grid__item a', links => links.map(link => link.href));

    const priceSelector = '.title-content h3';
    const itemPrices = await page.$$eval(priceSelector, prices => prices.map(price => price.textContent));

    return itemLinks.reduce((acc, link, index) => {
        acc[link] = parseFloat(itemPrices[index].replace(/[^\d,.]/g, '').replace(',', '.'));
        return acc;
    }, {});
}

function getPriceFloatValue(str) {
    const regex = /[+-]?\d+(\.\d+)?/;
    const match = str.match(regex);

    if (match) {
        return parseFloat(match[0].replace(',', '.'));
    }
    return NaN;
}

function getBargainPercentage(bargain) {
    const percentage = bargain.match(/\d+/);
    return percentage ? parseInt(percentage[0]) / 100 : 0;
}
