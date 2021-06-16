require("dotenv").config();
import axios from "axios";

export const get_recommendations_by_movie_id = async (
	id: number | string,
	params: any
) => {
	let recommendations: {
		recommendations: any[];
		total: number;
		total_pages: number;
	};
	const res = await axios.post(
		process.env.RECOMMENDATION_URI || "http://localhost:8080/movie/",
		{
			id,
			params
		}
	);
	recommendations = res.data;
	return recommendations;
};
