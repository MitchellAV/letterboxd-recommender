const { get_database } = require("./util");

const database = [...get_database(0, Infinity, "./json/database/")];

const {
	scrapeTMDB,
	scrapeTMDBCredits,
	scrapeTMDBKeywords
} = require("./tmdb.js");
let startid = 795001;
let endid = 1000000;
let pagestart = Math.floor(startid / 1000);
scrapeTMDB(startid, endid, pagestart, database).then(() => {
	const databaseCredits = [...get_database(0, Infinity, "./json/credits/")];
	const databaseKeywords = [...get_database(0, Infinity, "./json/keywords/")];
	startid = 1;
	pagestart = Math.floor(startid / 1000);
	scrapeTMDBCredits(startid, endid, pagestart, database, databaseCredits);
	startid = 1;
	pagestart = Math.floor(startid / 1000);
	scrapeTMDBKeywords(startid, endid, pagestart, database, databaseKeywords);
});
