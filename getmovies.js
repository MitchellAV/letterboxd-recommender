const { get_database } = require("./util");

const database = [...get_database(0, Infinity, "./json/database/")];
const databaseCredits = [...get_database(0, Infinity, "./json/credits/")];
const databaseKeywords = [...get_database(0, Infinity, "./json/keywords/")];

const {
	scrapeTMDB,
	scrapeTMDBCredits,
	scrapeTMDBKeywords
} = require("./tmdb.js");
let startid = 794001;
let endid = 4000000;
let pagestart = Math.floor(startid / 1000);
// scrapeTMDB(startid, endid, pagestart, database);
startid = 308001;
endid = 4000000;
pagestart = Math.floor(startid / 1000);
scrapeTMDBCredits(startid, endid, pagestart, database, databaseCredits);
startid = 397001;
endid = 4000000;
pagestart = Math.floor(startid / 1000);
scrapeTMDBKeywords(startid, endid, pagestart, database, databaseKeywords);
