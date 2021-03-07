const { get_database } = require("./recommendation_engine.js");
const {
	cleanDatabase,
	cleanDatabaseKeywords,
	cleanDatabaseCredits
} = require("./filter");
let filtered_database = [...get_database(0, Infinity, "./json/database/")];
let filtered_database_keywords = [
	...get_database(0, Infinity, "./json/keywords/")
];
let filtered_database_credits = [
	...get_database(0, Infinity, "./json/credits/")
];

filtered_database = cleanDatabase(filtered_database);
filtered_database_keywords = cleanDatabaseKeywords(filtered_database_keywords);
filtered_database_credits = cleanDatabaseCredits(filtered_database_credits);

let keywordMap = new Map();
for (let i = 0; i < filtered_database_keywords.length; i++) {
	const keyword = filtered_database_keywords[i];

	keywordMap.set(keyword._id, keyword);
}
let creditsMap = new Map();
for (let i = 0; i < filtered_database_credits.length; i++) {
	const credits = filtered_database_credits[i];

	creditsMap.set(credits._id, credits);
}

for (let i = 0; i < filtered_database.length; i++) {
	let movie = filtered_database[i];
	const keywords = keywordMap.get(movie._id);
	const credits = creditsMap.get(movie._id);
	movie = { ...movie, ...keywords, ...credits };
	try {
		const BSONMovie = new Movie(movie);
		await BSONMovie.save();
	} catch (err) {
		console.log(err);
	}
}
