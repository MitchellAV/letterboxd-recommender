import { query, param, ValidationChain } from "express-validator";
import { Request } from "express";

export const format_query = (req: Request): string => {
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

export const sort_order = (sort_type: string, order: -1 | 1) => {
	let sort_by: object;

	switch (sort_type) {
		case "recommended":
			sort_by = { "score.score": order };
			break;
		case "runtime":
			sort_by = { runtime: order };
			break;
		case "movie_rating":
			sort_by = { adjusted_rating: order };
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

export const filter_params = (req: Request) => {
	const default_min_vote_count = 100;
	const default_min_vote_average = 6;
	const default_min_runtime = 40;
	const default_num_per_page = 25;
	const default_sort_type = "score.score";
	const default_order = -1;

	let {
		filter,
		min_vote_count,
		min_vote_average,
		min_runtime,
		page,
		num_per_page,
		sort_type,
		order
	} = req.query as {
		filter: string;
		min_vote_count: string;
		min_vote_average: string;
		min_runtime: string;
		page: string;
		num_per_page: string;
		sort_type: string;
		order: string;
	};

	return {
		filter,
		min_vote_count: parseInt(min_vote_count) || default_min_vote_count,
		min_vote_average:
			parseFloat(min_vote_average) || default_min_vote_average,
		min_runtime: parseInt(min_runtime) || default_min_runtime,
		page: parseInt(page) || 0,
		num_per_page: parseInt(num_per_page) || default_num_per_page,
		sort_type: sort_type || default_sort_type,
		order: parseInt(order) || default_order
	};
};

export const format_url = (req: Request) => {
	let url =
		req.originalUrl.indexOf("?") !== -1
			? req.originalUrl.slice(0, req.originalUrl.indexOf("?"))
			: req.originalUrl;
	return url;
};

export const validationParams = (
	{
		min_vote_count,
		min_vote_average,
		min_runtime
	}: {
		min_vote_count: number;
		min_vote_average: number;
		min_runtime: number;
	},
	isUsername: boolean
) => {
	const validation: ValidationChain[] = [];
	if (isUsername)
		validation.push(
			param("username", "Please enter your letterboxd username")
				.trim()
				.isString()
				.toLowerCase()
				.notEmpty()
				.escape()
		);

	validation.push(
		query("filter").trim().isString().toLowerCase().escape().default(""),
		query("min_vote_count")
			.customSanitizer((value, { req, location, path }) => {
				return req[location][path] ? value : min_vote_count;
			})
			.toInt()
			.isInt({ min: 1 }),
		query("min_vote_average")
			.customSanitizer((value, { req, location, path }) => {
				return req[location][path] ? value : min_vote_average;
			})
			.toFloat()
			.isFloat({ min: 0.5 }),
		query("min_runtime")
			.customSanitizer((value, { req, location, path }) => {
				return req[location][path] ? value : min_runtime;
			})
			.toInt()
			.isInt({ min: 1 }),
		query("page")
			.customSanitizer((value, { req, location, path }) => {
				return req[location][path] ? value : 1;
			})
			.toInt()
			.isInt({ min: 1 }),
		query("num_per_page")
			.customSanitizer((value, { req, location, path }) => {
				return req[location][path] ? value : 30;
			})
			.toInt()
			.isIn([30, 60, 90, 120]),
		query("sort_type")
			.customSanitizer((value, { req, location, path }) => {
				return req[location][path] ? value : "recommended";
			})
			.trim()
			.isString()
			.toLowerCase()
			.escape()
			.isIn([
				"recommended",
				"runtime",
				"movie_rating",
				"user_rating",
				"votes",
				"release_date"
			]),
		query("order")
			.customSanitizer((value, { req, location, path }) => {
				return req[location][path] ? value : -1;
			})
			.toInt()
			.isIn([-1, 1])
	);
	return validation;
};
