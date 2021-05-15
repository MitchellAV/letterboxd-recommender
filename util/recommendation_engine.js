const axios = require("axios");

const fsSync = require("fs");

const download_image = async (url, image_path) =>
	axios({
		url,
		responseType: "stream"
	}).then(
		(response) =>
			new Promise((resolve, reject) => {
				response.data
					.pipe(fsSync.createWriteStream(image_path))
					.on("finish", () => resolve())
					.on("error", (e) => reject(e));
			})
	);

const scrapeThumbnails = async (database) => {
	const database_length = database.length;
	for (let i = 0; i < database_length; i++) {
		const movie = database[i];
		const { _id, thumbnail_url } = movie;
		const path = "./public/thumbnails/" + _id + "-thumb.jpg";
		try {
			if (!fsSync.existsSync(path)) {
				try {
					await download_image(thumbnail_url, path);
					console.log(`Downloaded: ${i + 1}/${database_length}`);
				} catch (err) {
					console.error(err);
				}
			}
		} catch (err) {
			console.error(err);
		}
	}
};
module.exports = {
	scrapeThumbnails
};
