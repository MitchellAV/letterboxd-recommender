const fs = require("fs");

const get_database = (start, stop) => {
	const files = fs.readdirSync("./json/database/");
	let database = [];
	stop = stop > files.length ? files.length : stop;

	for (let i = start; i < stop; i++) {
		const file = files[i];
		console.log(i, file);
		let datapart = require(`./json/database/${file}`).posts;
		database = [...database, ...datapart];
	}

	return database;
};
module.exports = { get_database };
