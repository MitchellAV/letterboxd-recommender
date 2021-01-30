const { get_database } = require("./util");

const database = [...get_database(0, Infinity)];

const { scrapeTMDB } = require("./tmdb.js");
let startid = 3001;
let endid = 4000000;
let pagestart = Math.floor(startid / 1000);
scrapeTMDB(startid, endid, pagestart, database);
