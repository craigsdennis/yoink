const Nightmare = require("nightmare");

if (process.argv.length < 3) {
    console.log("Usage:  npm start <URL>");
    process.exit(0);
}
const url = process.argv[2];

const nightmare = Nightmare({
    openDevTools: {
        mode: 'detach'
    },
    show: true
});

function yoinkPages(domain, linksToCheck, yoinkedMap) {
    yoinkedMap = yoinkedMap || new Map();
    return linksToCheck.reduce((prev, next) => {
        // Avoid ye olde infinite loop
        if (yoinkedMap.hasKey(next)) {
            console.log("Already yoinked", next);
            return prev;
        }
        // TODO: write this using snippet
        const page = yoinkPage(next);
        prev.put(next, page);
        const remainingPages = page.links
            .filter(link => link.contains(domain))
            .filter(link => prev.containsKey(link));
        // Recurse
        return yoinkPages(domain, remainingPages, prev);
    }, yoinkedMap);
}

function yoinkPage(url) {

}

// TODO: Synchronize this...
nightmare
    .goto(url)
    // TODO: optionally make this
    .html("index.mhtml", "MHTML")
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
    .end()
    .then(data => {
        console.log("Got the following links:", data.links);
        console.log("And this wad of text:");
        console.log(data.text);
    })
    .catch(err => console.error("Uh oh", err));