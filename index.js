const Nightmare = require("nightmare");

if (process.argv.length < 3) {
    console.log("Usage:  npm start <url> <matching-regexp>");
    process.exit(0);
}
const startingUrl = process.argv[2];
const pattern = process.argv[3];

const nightmare = Nightmare({
    openDevTools: {
        mode: 'detach'
    },
    show: true
});

const re = new RegExp(pattern);

function yoinkPages(linksToCheck, yoinkedMap) {
    console.log("yoinkPages called with", linksToCheck);
    // Start with the root page
    linksToCheck = linksToCheck || [startingUrl];
    yoinkedMap = yoinkedMap || new Map();
    return linksToCheck.reduce((prev, next) => {
        // Avoid ye olde infinite loop
        if (yoinkedMap.has(next)) {
            console.log("Already yoinked", next);
            return yoinkedMap;
         }
        return prev.then(() => {
            return yoinkPage(next).then(page => {
                yoinkedMap.set(next, page);
                const remainingPages = page.links
                    .filter(link => re.test(link))
                    .filter(link => !link.startsWith("mailto"))
                    .filter(link => !yoinkedMap.has(link));
                if (remainingPages.length > 0) {
                    // Recurse
                    return yoinkPages(remainingPages, yoinkedMap);
                }
                // URL: Page object
                return yoinkedMap;
            });
        });
    }, Promise.resolve());
}

function yoinkPage(url) {
    return nightmare
        .goto(url)
        // TODO: optionally make this
        .wait(500)
        .evaluate(() => {
            const links = [];
            for (let a of document.querySelectorAll('a').values()) {
                links.push(a.href);
            }
            return {
                title: document.title,
                links: links,
                text: document.body.innerText
            };
        })
        .catch(err => console.error("YIKES!", err));

}

yoinkPages()
    .then(dict => {
        console.log("Got back", dict);
    })
    .catch(err => console.error("boo hoo", err));
