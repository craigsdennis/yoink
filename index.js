const dateformat = require("dateformat");
const deepEqual = require("deep-equal");
const fs = require("fs");
const jsonfile = require("jsonfile");
const Nightmare = require("nightmare");
const mkdirp = require("mkdirp");
const path = require("path");
const sanitize = require("sanitize-filename");

if (process.argv.length < 3) {
    console.log("Usage:  npm start <url> <matching-regexp>");
    process.exit(0);
}
const startingUrl = process.argv[2];
const pattern = process.argv[3];

const baseURLSanitized = sanitize(startingUrl)
yoinkHome = path.join('yoinks', baseURLSanitized);

mkdirp(yoinkHome, () => {
    console.log("Yoink files will be found at", yoinkHome);
});

const nightmare = Nightmare();

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
                indexYoink(page);
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

function indexYoink(page) {
    const now = new Date();
    const dir = storageDirFor(page.url);
    mkdirp.sync(dir);
    let jsonStore = null;
    let previous = null;
    try {
        jsonStore = jsonfile.readFileSync(path.join(dir, `yoink.json`));
        previous = jsonfile.readFileSync(jsonStore.current);
    } catch(err) {
        jsonStore = {};
        previous = {};
        jsonStore.created = now;
    }

    if (!deepEqual(previous, page)) {
        console.log("previous", previous, "page", page);
        const safeDateFileName = sanitize(now.toISOString());
        jsonStore.current = path.join(dir, safeDateFileName + '.json');
        jsonStore.latestCapture = path.join(dir, safeDateFileName + '.mhtml');
        jsonfile.writeFileSync(jsonStore.current, page);
        //fs.renameSync(path.join(dir, 'latest.mhtml'), jsonStore.latestCapture);
    }
    // FIXME:  How to not write this in the first place...
    //fs.unlinkSync(path.join(dir, 'latest.mhtml'));
    jsonStore.lastYoinked = now;
    jsonfile.writeFileSync(path.join(dir, `yoink.json`), jsonStore);
}

function storageDirFor(url) {
    const shortenedSanitized = sanitize(url).replace(baseURLSanitized, '');
    return path.join(yoinkHome, shortenedSanitized);
}

function yoinkPage(url) {
    // Does a save exist?
    const dir = storageDirFor(url);

    return nightmare
        .goto(url)
        // Save it each time...yuck
        //.html(path.join(dir, 'latest.mhtml'), 'mhtml')
        .wait(200)
        .evaluate(() => {
            const links = [];
            for (let a of document.querySelectorAll('a').values()) {
                links.push(a.href);
            }
            return {
                url: document.location.href,
                title: document.title,
                links: links,
                text: document.body.innerText
            };
        })
        .catch(err => console.error("YIKES!", err));

}

yoinkPages()
    .then(dict => {
        console.log("Done");
        nightmare.end();
    })
    .catch(err => console.error("boo hoo", err));
