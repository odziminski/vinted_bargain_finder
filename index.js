const puppeteer = require('puppeteer');

const link = process.argv[2];

if (!link) {
    console.log('.');
    process.exit(1);
}

(async () => {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    await page.setExtraHTTPHeaders({
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.82 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
    });

    await page.goto(link);

    try {
        await page.waitForSelector('body');
        const priceElement = await page.$x('/html/body/main/div/section/div/main/div/aside/div[1]/div[1]/div[1]/div[1]/div[1]/div/h1');
        const userProfileLinkElement = await page.$x('/html/body/main/div/section/div/main/div/aside/div[3]/a');

        if (priceElement.length > 0) {
            const price = await page.evaluate(element => element.textContent, priceElement[0]);
            const userProfileLink = await page.evaluate(element => element.getAttribute('href'), userProfileLinkElement[0]);
            console.log('Item price:', price);
            console.log('User profile link:', userProfileLink);

            await scrapeUserProfile(page, userProfileLink);
        }
    } catch (error) {
        console.log(error);
    }

    await browser.close();
})();

async function scrapeUserProfile(page, link) {
    await page.goto('https://wwww.vinted.com/' + link);
    await page.waitForSelector('body');
    const bargainElementXPath = '/html/body/main/div/section/div/div[2]/section/div/div/div/div/div[3]/div[1]/div/div/div/div/div/div[2]/h3';
    const bargainElement = await page.$x(bargainElementXPath);
    const bargain = await page.evaluate(element => element.textContent, bargainElement[0]);

    console.log(getBargainPercentage(bargain));
    return bargain;
}
function getBargainPercentage(bargain) {
    const percentage = bargain.match(/\d+/);
    return percentage ? parseInt(percentage[0]) / 100 : 0;
}

