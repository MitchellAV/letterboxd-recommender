const express = require("express");
const fs = require("fs");

const router = express.Router();
const math = require("mathjs");
const merge_movies = (filtered_database, user_movies) => {
	const movies = [];
	for (let i = 0; i < filtered_database.length; i++) {
		const movie = filtered_database[i];
		for (let j = 0; j < user_movies.length; j++) {
			const user_movie = user_movies[j];
			if (movie.id == parseInt(user_movie.id)) {
				movie.user_rating = parseInt(user_movie.rating);
				movies.push(movie);
				break;
			}
		}
	}
	return movies;
};
const merge_movies_keywords = (filtered_database, user_movies) => {
	const filtered_database_length = filtered_database.length;

	for (let i = 0; i < filtered_database_length; i++) {
		const movie = filtered_database[i];
		const user_movie = user_movies.find((e) => parseInt(e.id) == movie.id);
		if (user_movie) {
			user_movie.keywords = [...movie.keywords];
			user_movie.tags = [...user_movie.tags, ...movie.keywords];
		}

		if (i % 1000 == 0) {
			console.log(`Merged ${i + 1}/${filtered_database_length}`);
		}
	}
};
const merge_movies_credits = (filtered_database, user_movies) => {
	const filtered_database_length = filtered_database.length;
	for (let i = 0; i < filtered_database_length; i++) {
		const movie = filtered_database[i];
		const user_movie = user_movies.find((e) => parseInt(e.id) == movie.id);
		if (user_movie) {
			user_movie.cast = [...movie.cast];
			user_movie.crew = [...movie.crew];
			user_movie.tags = [
				...user_movie.tags,
				...movie.cast,
				...movie.crew
			];
		}

		if (i % 1000 == 0) {
			console.log(`Merged ${i + 1}/${filtered_database_length}`);
		}
	}
};

const {
	cleanDatabase,
	cleanDatabaseKeywords,
	cleanDatabaseCredits
} = require("../filter");
const {
	filter_recommended,
	get_recommended,
	get_TF_IDF_Vectors,
	gen_ref_tags,
	get_tag_count,
	scrapeThumbnails,
	get_database
} = require("../recommendation_engine.js");

let filtered_database;
let overwrite = false;
if (!overwrite) {
	filtered_database = [...get_database(0, Infinity, "./json/filtered/")];
} else {
	filtered_database = [...get_database(0, Infinity, "./json/database/")];
	let filtered_database_keywords = [
		...get_database(0, Infinity, "./json/keywords/")
	];
	let filtered_database_credits = [
		...get_database(0, Infinity, "./json/credits/")
	];

	filtered_database = cleanDatabase(filtered_database);
	console.log("created filtered database");
	filtered_database_keywords = cleanDatabaseKeywords(
		filtered_database_keywords
	);
	console.log("created filtered database");
	filtered_database_credits = cleanDatabaseCredits(filtered_database_credits);
	console.log("created filtered database");
	merge_movies_keywords(filtered_database_keywords, filtered_database);
	merge_movies_credits(filtered_database_credits, filtered_database);
	filtered_database_keywords = [];
	filtered_database_credits = [];

	let json = { posts: [] };
	let page = 0;
	let itemsPerPage = 1000;
	for (let i = 0; i < filtered_database.length; i++) {
		const movie = filtered_database[i];
		json.posts.push(movie);
		if (
			json.posts.length == itemsPerPage ||
			i == filtered_database.length - 1
		) {
			fs.writeFileSync(
				`./json/filtered/${page}-${itemsPerPage}-tmdb.json`,
				JSON.stringify(json)
			);
			page++;
			json = { posts: [] };
		}
	}
}
function indexOfMax(arr) {
	if (arr.length === 0) {
		return -1;
	}

	var max = arr[0];
	var maxIndex = 0;

	for (var i = 1; i < arr.length; i++) {
		if (arr[i] > max) {
			maxIndex = i;
			max = arr[i];
		}
	}

	return [maxIndex, max];
}
const filter_tags = (ref_tags, count_books_tag) => {
	let c = [];
	for (let i = 0; i < ref_tags.length; i++) {
		const tag = ref_tags[i];
		const count = count_books_tag[i];
		c.push({ tag, count });
	}
	const low = 1;
	c = c.filter((movie) => {
		return movie.count > low;
	});
	// count_books_tag = count_books_tag.sort((a, b) => a - b);
	// count_books_tag = c.map((movie) => movie.count);
	// const median = math.median(count_books_tag);
	// c = c.filter((movie) => {
	// 	return movie.count > median;
	// });
	// count_books_tag = c.map((movie) => movie.count);
	const avg_tag_count = math.mean(count_books_tag);
	const std_tag_count = math.std(count_books_tag);
	const max = math.max(count_books_tag);
	const min = math.min(count_books_tag);
	const mode = math.mode(count_books_tag);
	const high = avg_tag_count + 1.96 * std_tag_count;
	c = c.filter((movie) => {
		return movie.count < high;
	});
	c = c.sort((a, b) => b.count - a.count);
	// c = c.slice(0, 100);
	count_books_tag = c.map((movie) => movie.count);
	ref_tags = c.map((movie) => movie.tag);
	return [ref_tags, count_books_tag];
};
router.get("/personal", async (req, res) => {
	let user_movies = require("../json/users/ropeiscut-movies.json").movies;
	user_movies = merge_movies(filtered_database, user_movies);

	let ignore_list = [];
	let search = req.query.tag;
	let search_list = [];
	search ? (search_list = [search]) : (search_list = []);
	const filterlist = {
		tags: search_list
	};

	const filtered_recommended_list = filter_recommended(
		user_movies,
		ignore_list,
		filterlist,
		user_movies.length
	);

	await scrapeThumbnails(filtered_recommended_list);

	res.render("pages/recommended", {
		data: filtered_recommended_list,
		search: search
	});
});

router.get("/", async (req, res) => {
	let id = parseInt(req.query.id);
	let user_movies = require("../json/users/ropeiscut-movies.json").movies;
	user_movies = merge_movies(filtered_database, user_movies);

	let ref_tags = await gen_ref_tags(user_movies);

	// ref_tags = gen_ref_tags(filtered_database);
	let count_books_tag = await get_tag_count(
		filtered_database,
		ref_tags,
		"database"
	);

	[ref_tags, count_books_tag] = filter_tags(ref_tags, count_books_tag);

	let database_TF_IDF_Vectors = await get_TF_IDF_Vectors(
		filtered_database,
		ref_tags,
		count_books_tag,
		"database_TFIDF"
	);

	// apply movie rating to each movie vector
	for (let i = 0; i < database_TF_IDF_Vectors.length; i++) {
		const vector = database_TF_IDF_Vectors[i];
		let rating = filtered_database[i].vote_average;
		database_TF_IDF_Vectors[i] = math.multiply(vector, rating);
		const [maxIndex, maxValue] = indexOfMax(vector);
		filtered_database[i].maxTag = ref_tags[maxIndex];
		let a = [];
		// for (let j = 0; j < filtered_database[i].tags.length; j++) {
		// 	const tag = filtered_database[i].tags[j];
		// 	const tagIndex = ref_tags.indexOf(tag);
		// 	const tagScore = vector[tagIndex];
		// 	a.push({ tag, tagScore });
		// }
		// console.log("");
	}

	let search_vector;
	let search_vector_name;
	if (id) {
		search_vector_name = "id";
		for (let i = 0; i < filtered_database.length; i++) {
			const book = filtered_database[i];
			if (book.id == id) {
				search_vector = database_TF_IDF_Vectors[i];
				break;
			}
		}
	} else {
		search_vector_name = "user";
		count_books_tag = await get_tag_count(user_movies, ref_tags, "user");

		let user_TF_IDF_Vectors = await get_TF_IDF_Vectors(
			user_movies,
			ref_tags,
			count_books_tag,
			"user_TFIDF"
		);
		const movies_w_rating = user_movies.filter(
			(movie) => !isNaN(movie.user_rating)
		);
		const movies_ratings = movies_w_rating.map(
			(movie) => movie.user_rating
		);
		const avg_user_rating = math.mean(movies_ratings);

		user_movies.forEach((movie) => {
			if (isNaN(movie.user_rating)) {
				movie.user_rating = avg_user_rating;
			}
		});

		for (let i = 0; i < user_TF_IDF_Vectors.length; i++) {
			const vector = user_TF_IDF_Vectors[i];
			const rating = user_movies[i].user_rating;
			user_TF_IDF_Vectors[i] = math.multiply(vector, rating);
		}

		search_vector = math.multiply(
			math.apply(user_TF_IDF_Vectors, 0, math.sum),
			1 / user_TF_IDF_Vectors.length
		);
		let v = [];
		for (let i = 0; i < search_vector.length; i++) {
			const el = search_vector[i];
			v.push({ tag: ref_tags[i], score: el });
		}
		v = v.sort((a, b) => a.score - b.score);
		// print("");
	}

	let recommended_list = await get_recommended(
		search_vector,
		database_TF_IDF_Vectors,
		filtered_database,
		search_vector_name
	);

	let ignore_list = [...user_movies];
	let search = req.query.tag;
	let search_list = [];
	search ? (search_list = [search]) : (search_list = []);
	const filterlist = {
		tags: search_list
	};

	let filtered_recommended_list = filter_recommended(
		recommended_list,
		ignore_list,
		filterlist,
		100
	);

	await scrapeThumbnails(filtered_recommended_list);

	res.render("pages/recommended", {
		data: filtered_recommended_list,
		search: search
	});
});
module.exports = router;
