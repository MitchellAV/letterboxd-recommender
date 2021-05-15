const format_query = (req) => {
	const qIndex = req.url.indexOf("?");
	let queryString;
	if (qIndex !== -1) {
		queryString = req.url.substr(qIndex);
	} else {
		queryString = "";
	}
	queryString = queryString.replace(/[&?]page=\d+/g, "");
	return queryString;
};

const sort_order = (sort_type, order) => {
	let sort_by;

	switch (sort_type) {
		case "recommended":
			sort_by = { "score.score": order };
			break;
		case "runtime":
			sort_by = { runtime: order };
			break;
		case "movie_rating":
			sort_by = { vote_average: order };
			break;
		case "user_rating":
			sort_by = { "score.userRating": order };
			break;
		case "votes":
			sort_by = { vote_count: order };
			break;
		case "release_date":
			sort_by = { release_date: order };
			break;
		default:
			sort_by = { "score.score": order };
			break;
	}
	return sort_by;
};

const filter_params = (req) => {
	const default_min_vote_count = 100;
	const default_min_vote_average = 6;
	const default_min_runtime = 40;
	const default_num_per_page = 25;
	const default_sort_type = "score.score";
	const default_order = -1;

	let filter = req.query.filter;
	let min_vote_count =
		parseInt(req.query.min_vote_count) || default_min_vote_count;
	let min_vote_average =
		parseFloat(req.query.min_vote_average) || default_min_vote_average;
	let min_runtime = parseInt(req.query.min_runtime) || default_min_runtime;
	let page = parseInt(req.query.page) || 0;
	let num_per_page = parseInt(req.query.num_per_page) || default_num_per_page;
	let sort_type = req.query.sort_type || default_sort_type;
	let order = parseInt(req.query.order) || default_order;

	return {
		filter,
		min_vote_count,
		min_vote_average,
		min_runtime,
		page,
		num_per_page,
		sort_type,
		order
	};
};

const format_url = (req) => {
	let url =
		req.originalUrl.indexOf("?") !== -1
			? req.originalUrl.slice(0, req.originalUrl.indexOf("?"))
			: req.originalUrl;
	return url;
};

module.exports = { format_query, sort_order, filter_params, format_url };
