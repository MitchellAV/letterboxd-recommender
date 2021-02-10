const express = require("express");
const router = express.Router();
const math = require("mathjs");

const { cleanDatabase } = require("../filter");
const {
	filter_recommended,
	get_recommended,
	get_TF_IDF_Vectors,
	get_database,
	gen_ref_tags,
	get_tag_count,
	scrapeThumbnails
} = require("../recommendation_engine.js");

const database = [...get_database(500, 510)];

const filtered_database = cleanDatabase(database);
console.log("created filtered database");

router.get("/personal", async (req, res) => {
	// Array of Strings
	let ref_tags = await gen_ref_tags(filtered_fav);
	ref_tags = ref_tags.filter((tag) => !common_tags.includes(tag));
	const count_books_tag = await get_tag_count(
		filtered_fav,
		ref_tags,
		"favorites"
	);

	// Sparse 2D Array of Vectors with TFIDF scores from tags
	let favorites_TF_IDF_Vectors = await get_TF_IDF_Vectors(
		filtered_fav,
		ref_tags,
		count_books_tag,
		"favorites_TFIDF"
	);
	// If rating multiply each vector by rating here

	// Average all vectors to create average user preferences from tags
	let search_vector = math.apply(favorites_TF_IDF_Vectors, 0, math.sum);
	// let search_vector = avg_vectors(favorites_TF_IDF_Vectors);

	let search_vector_name = "favorites";
	let recommended_list = await get_recommended(
		search_vector,
		favorites_TF_IDF_Vectors,
		filtered_fav,
		search_vector_name
	);
	let ignore_list = [];
	let search = req.query.tag;
	let search_list = [];
	search ? (search_list = [search]) : (search_list = []);
	const filterlist = {
		num_pages: -1,
		num_favorites: -1,
		tags: search_list
	};

	// recommended_list = recommended_list.filter((item) => {return });

	const filtered_recommended_list = filter_recommended(
		recommended_list,
		ignore_list,
		filterlist,
		blacklist,
		100
	);

	await scrapeThumbnails(filtered_recommended_list);

	res.render("pages/recommended", {
		data: filtered_recommended_list,
		search: search
	});
});

const merge_movies = (filtered_database, user_movies) => {
	const merged_movies = [];
	for (let i = 0; i < filtered_database.length; i++) {
		const movie = filtered_database[i];
		for (let i = 0; i < user_movies.length; i++) {
			const user_movie = user_movies[i];
			if (movie.id == parseInt(user_movie.id)) {
				const merged_movie = {
					...movie,
					user_rating: parseInt(user_movie.rating)
				};
				merged_movies.push(merged_movie);
				break;
			}
		}
	}
	return merged_movies;
};
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

	let database_TF_IDF_Vectors = await get_TF_IDF_Vectors(
		filtered_database,
		ref_tags,
		count_books_tag,
		"database_TFIDF"
	);

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

		search_vector = math.multiply(
			math.apply(user_TF_IDF_Vectors, 0, math.sum),
			1 / user_TF_IDF_Vectors.length
		);
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
		num_pages: 101,
		num_favorites: -1,
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
