const math = require("mathjs");
const axios = require("axios");

const fs = require("fs").promises;
const fsSync = require("fs");

const { filterDatabase } = require("./filter");
const { TF_IDF } = require("./tf-idf");

const get_database = (start, stop, path) => {
	const files = fsSync.readdirSync(path);
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

/**
 *
 * @param {Array} database Array of Objects containing a tags property contatining an Array of String tags
 */

const gen_ref_tags = async (database) => {
	let ref_tags;

	ref_tags = [];
	for (let i = 0; i < database.length; i++) {
		const tags = database[i].tags;
		for (let j = 0; j < tags.length; j++) {
			const tag = tags[j];
			if (!ref_tags.includes(tag)) {
				ref_tags.push(tag);
			}
		}
	}
	console.log("created ref tags");
	const json = { list: [...ref_tags] };
	await fs.writeFile(`./json/database_ref_tags.json`, JSON.stringify(json));

	return ref_tags;
};
const avg_vectors = (vectors) => {
	let sum_vectors = Array(vectors.size()[0]).fill(0);
	vectors = vectors.toArray();
	vectors.forEach((vector) => {
		sum_vectors = sum_vectors.map((e, i) => e + vector[i]);
	});

	// vectors.map((value, index, matrix) => {return });

	let max = math.norm(sum_vectors);
	let avg_vector = sum_vectors.map((x) => x / max);
	return avg_vector;
};
const cosine_similarity = (vectorA, vectorB) => {
	vectorA = math.matrix(vectorA, "sparse");
	vectorB = math.matrix(vectorB, "sparse");
	const a_norm = math.hypot(vectorA);
	const b_norm = math.hypot(vectorB);
	const dot_result = math.dot(vectorA, vectorB);
	let score = dot_result / (a_norm * b_norm);
	if (isNaN(score)) {
		score = 0;
	}
	return score;
};

const is_in_array = (array, target) => {
	let found = false;
	for (let i = 0; i < array.length; i++) {
		const obj = array[i];
		if (obj.title === target) {
			return true;
		}
	}
	return found;
};
const save_multiple_files = (matrix, name) => {
	let json = { posts: [] };
	let page = 0;
	let itemsPerPage = 1000;
	for (let i = 0; i < matrix.length; i++) {
		const vector = matrix[i];
		json.posts.push(vector);
		if (json.posts.length == itemsPerPage || i == matrix.length - 1) {
			fsSync.writeFileSync(
				`./json/${name}/${page}-${itemsPerPage}-tfidf.json`,
				JSON.stringify(json)
			);
			page++;
			json = { posts: [] };
		}
	}
};
const get_TF_IDF_Vectors = async (
	filtered_database,
	ref_tags,
	count_books_tag,
	filename
) => {
	let database_vectors;
	try {
		database_vectors = get_database(0, Infinity, `./json/${filename}/`);
		// database_vectors = require(`./json/${filename}.json`);
		// database_vectors = database_vectors.list;
		if (
			database_vectors.length !== filtered_database.length ||
			database_vectors[0].length !== ref_tags.length
		) {
			throw new Error("Length different");
		}
	} catch (err) {
		database_vectors = await TF_IDF(
			filtered_database,
			ref_tags,
			count_books_tag
		);
		console.log(`created ${filename} database vectors`);
		save_multiple_files(database_vectors, filename);
		// await fs.writeFile(`./json/${filename}.json`, JSON.stringify(json));
	}

	return database_vectors;
};
const get_recommended = async (
	single_vector,
	database_vectors,
	database,
	name
) => {
	let recommend;
	try {
		if (name == "id") {
			throw new Error("Don't save id searches");
		}
		recommend = require(`./json/${name}-recommended.json`).list;
		if (recommend.length !== database_vectors.length) {
			throw new Error("Length different");
		}
	} catch (err) {
		recommend = [];
		// single_vector = math.matrix(single_vector, "sparse");
		const database_size = database_vectors.length;
		for (let i = 0; i < database_size; i++) {
			// console.time("vector");
			// const vector = math.row(database_vectors, i);
			// const vector = math.transpose(
			// 	math.matrix(database_vectors[i], "sparse")
			// );
			const vector = database_vectors[i];
			// console.timeEnd("vector");

			// console.time("score");
			const score = cosine_similarity(single_vector, vector);
			// console.timeEnd("score");

			// console.time("book");
			let book = { ...database[i], score };
			// console.timeEnd("book");

			// console.time("recommend");
			recommend.push(book);
			// console.timeEnd("recommend");
			if (i % 1000 == 0) {
				console.log(`Scored ${i + 1}/${database_size}`);
			}
		}

		console.log("created recommended");
		if (name !== "id") {
			const json = { list: [...recommend] };
			await fs.writeFile(
				`./json/${name}-recommended.json`,
				JSON.stringify(json)
			);
		}
	}
	return recommend;
};
const filter_recommended = (
	recommended_list,
	ignore_list,
	filterlist,
	num_results
) => {
	// order rankings
	// recommended_list.sort((a, b) => {
	// 	return a.score - b.score;
	// });
	// recommended_list.forEach((book, i) => {
	// 	book.score_rank = i + 1;
	// });
	// recommended_list.sort((a, b) => {
	// 	return a.num_favorites - b.num_favorites;
	// });
	// recommended_list.forEach((book, i) => {
	// 	book.fav_rank = i + 1;
	// });
	// recommended_list.sort((a, b) => {
	// 	return b.score_rank + b.fav_rank - (a.score_rank + a.fav_rank);
	// });
	// filter rankings

	recommended_list.sort((a, b) => {
		return b.score - a.score;
	});
	// remove favorited post
	recommended_list = recommended_list.filter(
		(movie) => !is_in_array(ignore_list, movie.title)
	);

	recommended_list = filterDatabase(recommended_list, filterlist);
	// recommended_list = recommended_list.filter(
	// 	(book) => parseInt(book.num_favorites) >= 10000
	// );
	// return list of
	return recommended_list.slice(0, num_results);
};
const count_docs_with_tag = (tag, all_books) => {
	let count = 0;
	for (let i = 0; i < all_books.length; i++) {
		const book_tags = all_books[i].tags;
		const book_tags_length = book_tags.length;
		for (let j = 0; j < book_tags_length; j++) {
			if (tag === book_tags[j]) {
				count++;
				break;
			}
		}
	}
	return count;
};
const gen_tag_count = (all_books, ref_tags) => {
	let count_books_tag = [];
	const ref_tags_length = ref_tags.length;
	for (let i = 0; i < ref_tags_length; i++) {
		const tag = ref_tags[i];
		const count = count_docs_with_tag(tag, all_books);
		count_books_tag.push(count);
		if (i % 100 == 0) {
			console.log(`Counted ${i + 1}/${ref_tags_length}`);
		}
	}
	return count_books_tag;
};
const get_tag_count = async (all_books, ref_tags, name) => {
	let count_books_tag;
	try {
		count_books_tag = require(`./json/${name}_tag_count.json`).list;
		if (count_books_tag.length !== ref_tags.length) {
			throw new Error("Length different");
		}
	} catch (err) {
		count_books_tag = gen_tag_count(all_books, ref_tags);
		console.log("created tag count");
		const json = { list: [...count_books_tag] };
		await fs.writeFile(
			`./json/${name}_tag_count.json`,
			JSON.stringify(json)
		);
	}
	return count_books_tag;
};

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
		const { id, thumbnail_url } = movie;
		const path = "./public/thumbnails/" + id + "-thumb.jpg";
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
	filter_recommended,
	get_recommended,
	get_TF_IDF_Vectors,
	get_database,
	avg_vectors,
	gen_ref_tags,
	get_tag_count,
	scrapeThumbnails
};
