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

nightmare
    .goto(url)
    .evaluate(() => {
        const links = [];
        for (let a of document.querySelectorAll('a').values()) {
            links.push(a.href);
        }
        return {
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