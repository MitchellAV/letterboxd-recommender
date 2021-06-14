const dotenv = require("dotenv");
const axios = require("axios");

const get_recommendations_by_movie_id = async (id, params) => {
	let recommendations;

	try {
		const res = await axios.post(
			process.env.RECOMMENDATION_URI || "http://localhost:8080/movie/",
			{
				id,
				params
			}
		);
		recommendations = res.data;
	} catch (err) {
		console.error(err);
		return [];
	}
	return recommendations;
};

module.exports = { get_recommendations_by_movie_id };
