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
        return links;
    })
    .end()
    .then(links => console.log(links))
    .catch(err => console.error("Uh oh", err));