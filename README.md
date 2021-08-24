# MortgageHelper

## Introduction
This is a website I built using Node.js, MongoDB, Javascript, CSS, and HTML. After the tiles load, you should see data about each person in each tile. If you hover over a tile, you can see information about their financials and whether they currently qualify for a mortgage.

There is also a link to charts on the statistics hyperlink on the front page.

## Optimal Experience
**The user experience is best on `Chrome` (the backface-visbility property I used is not supported on `Safari`) and on a computer.** 

## Structure of application
```
Mortgage Helper
   webpages/               
       index.html          Main webpage
       statistics.html     Graphs webpage
   app.js                  Node.js API file
   package.json            Contains information about what is needed to run the app
   package-lock.json       ''
   Procfile                Used for deployment
   README.md               This file
```

## Link
https://mortgage-helper.herokuapp.com/
