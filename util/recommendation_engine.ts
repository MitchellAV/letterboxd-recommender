import axios from "axios";

import fs from "fs";

const download_image = (url: string, image_path: string) =>
	axios({
		url,
		responseType: "stream"
	}).then(
		(response) =>
			new Promise((resolve, reject) => {
				response.data
					.pipe(fs.createWriteStream(image_path))
					.on("finish", () => resolve(true))
					.on("error", (e: any) => reject(e));
			})
	);

export const scrapeThumbnails = (database: any[]) => {
	const database_length = database.length;
	for (let i = 0; i < database_length; i++) {
		const movie = database[i];
		const { _id, thumbnail_url } = movie;
		const path = "./public/thumbnails/" + _id + "-thumb.jpg";
		try {
			if (!fs.existsSync(path)) {
				try {
					download_image(thumbnail_url, path);
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
