"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validationParams = exports.format_url = exports.filter_params = exports.sort_order = exports.format_query = void 0;
var express_validator_1 = require("express-validator");
var format_query = function (req) {
    var qIndex = req.url.indexOf("?");
    var queryString;
    if (qIndex !== -1) {
        queryString = req.url.substr(qIndex);
    }
    else {
        queryString = "";
    }
    queryString = queryString.replace(/[&?]page=\d+/g, "");
    return queryString;
};
exports.format_query = format_query;
var sort_order = function (sort_type, order) {
    var sort_by;
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
exports.sort_order = sort_order;
var filter_params = function (req) {
    var default_min_vote_count = 100;
    var default_min_vote_average = 6;
    var default_min_runtime = 40;
    var default_num_per_page = 25;
    var default_sort_type = "score.score";
    var default_order = -1;
    var _a = req.query, filter = _a.filter, min_vote_count = _a.min_vote_count, min_vote_average = _a.min_vote_average, min_runtime = _a.min_runtime, page = _a.page, num_per_page = _a.num_per_page, sort_type = _a.sort_type, order = _a.order;
    return {
        filter: filter,
        min_vote_count: parseInt(min_vote_count) || default_min_vote_count,
        min_vote_average: parseFloat(min_vote_average) || default_min_vote_average,
        min_runtime: parseInt(min_runtime) || default_min_runtime,
        page: parseInt(page) || 0,
        num_per_page: parseInt(num_per_page) || default_num_per_page,
        sort_type: sort_type || default_sort_type,
        order: parseInt(order) || default_order
    };
};
exports.filter_params = filter_params;
var format_url = function (req) {
    var url = req.originalUrl.indexOf("?") !== -1
        ? req.originalUrl.slice(0, req.originalUrl.indexOf("?"))
        : req.originalUrl;
    return url;
};
exports.format_url = format_url;
var validationParams = function (_a, isUsername) {
    var min_vote_count = _a.min_vote_count, min_vote_average = _a.min_vote_average, min_runtime = _a.min_runtime;
    var validation = [];
    if (isUsername)
        validation.push(express_validator_1.param("username", "Please enter your letterboxd username")
            .trim()
            .isString()
            .toLowerCase()
            .notEmpty()
            .escape());
    validation.push(express_validator_1.query("filter").trim().isString().toLowerCase().escape().default(""), express_validator_1.query("min_vote_count")
        .customSanitizer(function (value, _a) {
        var req = _a.req, location = _a.location, path = _a.path;
        return req[location][path] ? value : min_vote_count;
    })
        .toInt()
        .isInt({ min: 1 }), express_validator_1.query("min_vote_average")
        .customSanitizer(function (value, _a) {
        var req = _a.req, location = _a.location, path = _a.path;
        return req[location][path] ? value : min_vote_average;
    })
        .toFloat()
        .isFloat({ min: 0.5 }), express_validator_1.query("min_runtime")
        .customSanitizer(function (value, _a) {
        var req = _a.req, location = _a.location, path = _a.path;
        return req[location][path] ? value : min_runtime;
    })
        .toInt()
        .isInt({ min: 1 }), express_validator_1.query("page")
        .customSanitizer(function (value, _a) {
        var req = _a.req, location = _a.location, path = _a.path;
        return req[location][path] ? value : 1;
    })
        .toInt()
        .isInt({ min: 1 }), express_validator_1.query("num_per_page")
        .customSanitizer(function (value, _a) {
        var req = _a.req, location = _a.location, path = _a.path;
        return req[location][path] ? value : 30;
    })
        .toInt()
        .isIn([30, 60, 90, 120]), express_validator_1.query("sort_type")
        .customSanitizer(function (value, _a) {
        var req = _a.req, location = _a.location, path = _a.path;
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
    ]), express_validator_1.query("order")
        .customSanitizer(function (value, _a) {
        var req = _a.req, location = _a.location, path = _a.path;
        return req[location][path] ? value : -1;
    })
        .toInt()
        .isIn([-1, 1]));
    return validation;
};
exports.validationParams = validationParams;
