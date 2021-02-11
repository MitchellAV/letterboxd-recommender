const fs = require("fs");

const get_database = (start, stop, path) => {
	const files = fs.readdirSync(path);
	let database = [];
	stop = stop > files.length ? files.length : stop;

	for (let i = start; i < stop; i++) {
		const file = files[i];
		console.log(i, file);
		let datapart = require(`${path}${file}`).posts;
		database = [...database, ...datapart];
	}

	return database;
};
module.exports = { get_database };
