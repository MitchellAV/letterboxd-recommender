const axios = require("axios");
const fs = require("fs");
const dotenv = require("dotenv").config();
const scrapeTMDB = async (start_id, end_id, page, database) => {
	let id = start_id;
	const itemsPerPage = 1000;
	const consecLimit = 1000;
	let isFinished = false;
	let database_ids = [];
	for (let i = 0; i < database.length; i++) {
		const id = database[i].id;
		database_ids.push(id);
	}
	while (!isFinished) {
		console.log(`Page: ${page}`);
		let json;
		try {
			json = require(`./json/database/${page}-1000-tmdb.json`);
		} catch (err) {
			json = { posts: [] };
		}
		let startId = id;
		let numErrors = 0;
		let consec_errors = 0;
		while (id < startId + itemsPerPage && id <= end_id && !isFinished) {
			let found = false;
			for (let i = 0; i < database_ids.length; i++) {
				let database_id = parseInt(database_ids[i]);
				if (database_id == parseInt(id)) {
					found = true;
					break;
				}
			}
			if (found) {
				id++;
				continue;
			}
			try {
				book = await axios.get(
					`https://api.themoviedb.org/3/movie/${id}?api_key=${process.env.TMDB_API_KEY}`
				);
				consec_errors = 0;
				json.posts.push(book.data);
				console.log(`id: ${id}`);
			} catch (err) {
				numErrors++;
				consec_errors++;
				if (consec_errors > consecLimit) {
					isFinished = true;
				}
				console.log(`id: ${id} - Not found`);
			}
			id++;
		}
		console.log(`Page: ${page} - ${json.posts.length}`);
		fs.writeFileSync(
			`./json/database/${page}-${itemsPerPage}-tmdb.json`,
			JSON.stringify(json)
		);

		if (numErrors == itemsPerPage || id > end_id) {
			isFinished = true;
		} else {
			page++;
		}
	}
	console.log(`Finished!!!!!!!!!!!!!!!!!!!!!!!!!!!!`);
};
module.exports = { scrapeTMDB };
