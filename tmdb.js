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
const scrapeTMDBCredits = async (
	start_id,
	end_id,
	page,
	database,
	databaseCredits
) => {
	let id = start_id;
	const itemsPerPage = 1000;
	const consecLimit = 1000;
	let isFinished = false;
	let credits_ids = [];
	let database_ids = [];
	for (let i = 0; i < database.length; i++) {
		const id = database[i].id;
		database_ids.push(id);
	}
	for (let i = 0; i < databaseCredits.length; i++) {
		const id = databaseCredits[i].id;
		credits_ids.push(id);
	}
	while (!isFinished) {
		console.log(`Page: ${page}`);
		let json;
		try {
			json = require(`./json/credits/${page}-1000-tmdb.json`);
		} catch (err) {
			json = { posts: [] };
		}
		let startId = id;
		let numErrors = 0;
		let consec_errors = 0;
		while (id < startId + itemsPerPage && id <= end_id && !isFinished) {
			let skip = true;
			for (let i = 0; i < database_ids.length; i++) {
				let database_id = parseInt(database_ids[i]);
				if (database_id == parseInt(id)) {
					skip = false;
					break;
				}
			}
			if (skip) {
				id++;
				continue;
			}
			for (let i = 0; i < credits_ids.length; i++) {
				let database_id = parseInt(credits_ids[i]);
				if (database_id == parseInt(id)) {
					skip = true;
					break;
				}
			}
			if (skip) {
				id++;
				continue;
			}
			try {
				book = await axios.get(
					`https://api.themoviedb.org/3/movie/${id}/credits?api_key=${process.env.TMDB_API_KEY}`
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
		if (json.posts.length !== 0) {
			fs.writeFileSync(
				`./json/credits/${page}-${itemsPerPage}-tmdb.json`,
				JSON.stringify(json)
			);
		} else {
			isFinished == true;
		}

		if (numErrors == itemsPerPage || id > end_id) {
			isFinished = true;
		} else {
			page++;
		}
	}
	console.log(`Finished!!!!!!!!!!!!!!!!!!!!!!!!!!!!`);
};
const scrapeTMDBKeywords = async (
	start_id,
	end_id,
	page,
	database,
	databaseKeywords
) => {
	let id = start_id;
	const itemsPerPage = 1000;
	const consecLimit = 1000;
	let isFinished = false;
	let keywords_ids = [];
	let database_ids = [];
	for (let i = 0; i < database.length; i++) {
		const id = database[i].id;
		database_ids.push(id);
	}
	for (let i = 0; i < databaseKeywords.length; i++) {
		const id = databaseKeywords[i].id;
		keywords_ids.push(id);
	}
	while (!isFinished) {
		console.log(`Page: ${page}`);
		let json;
		try {
			json = require(`./json/keywords/${page}-1000-tmdb.json`);
		} catch (err) {
			json = { posts: [] };
		}
		let startId = id;
		let numErrors = 0;
		let consec_errors = 0;
		while (id < startId + itemsPerPage && id <= end_id && !isFinished) {
			let skip = true;
			for (let i = 0; i < database_ids.length; i++) {
				let database_id = parseInt(database_ids[i]);
				if (database_id == parseInt(id)) {
					skip = false;
					break;
				}
			}
			if (skip) {
				id++;
				continue;
			}
			for (let i = 0; i < keywords_ids.length; i++) {
				let database_id = parseInt(keywords_ids[i]);
				if (database_id == parseInt(id)) {
					skip = true;
					break;
				}
			}
			if (skip) {
				id++;
				continue;
			}
			try {
				book = await axios.get(
					`https://api.themoviedb.org/3/movie/${id}/keywords?api_key=${process.env.TMDB_API_KEY}`
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
		if (json.posts.length !== 0) {
			fs.writeFileSync(
				`./json/keywords/${page}-${itemsPerPage}-tmdb.json`,
				JSON.stringify(json)
			);
		} else {
			isFinished == true;
		}

		if (numErrors == itemsPerPage || id > end_id) {
			isFinished = true;
		} else {
			page++;
		}
	}
	console.log(`Finished!!!!!!!!!!!!!!!!!!!!!!!!!!!!`);
};
module.exports = { scrapeTMDB, scrapeTMDBCredits, scrapeTMDBKeywords };
