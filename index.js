const puppeteer = require('puppeteer');

const link = process.argv[2];

if (!link) {
    console.log('Podaj link jako argument.');
    process.exit(1);
}

(async () => {
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();

    await page.setExtraHTTPHeaders({
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.82 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
    });

    await page.goto(link);

    try {
        await page.waitForSelector('body');
        const priceElement = await page.$x('/html/body/main/div/section/div/main/div/aside/div[1]/div[1]/div[1]/div[1]/div[1]/div/h1');
        if (priceElement.length > 0) {
            const price = await page.evaluate(element => element.textContent, priceElement[0]);
            console.log('Item price:', price);
        }
    } catch (error) {
        console.log(error);
    }

    await browser.close();
})();
