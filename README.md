# Yoink

Yet another web scraper. This one attempts to gather page content and changes over time for a whole domain.

Usage:
```
npm start http://some.website.com website
```
This will crawl `http://some.website.com` recursively for any pages that match `website`

Currently will create a directory named `yoinks` and store files as they change for you.

Still need to make mhtml a conditional on new only.