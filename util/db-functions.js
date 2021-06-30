"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var user_1 = __importDefault(require("../models/user"));
var movie_1 = __importDefault(require("../models/movie"));
var format_movies = function (movies) {
    return movies.map(function (movie) {
        return __assign(__assign({}, movie), { tags: movie.tags.map(function (tag) { return tag.term; }), score: movie.score.score, maxTag: movie.score.maxTag, userRating: movie.score.userRating });
    });
};
var get_user_movie_ids = function (username) { return __awaiter(void 0, void 0, void 0, function () {
    var user_movie_ids, err_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, user_1.default.aggregate([
                        {
                            $match: {
                                _id: username
                            }
                        },
                        {
                            $project: {
                                movies: {
                                    $map: {
                                        input: "$movies",
                                        as: "el",
                                        in: "$$el._id"
                                    }
                                }
                            }
                        }
                    ])];
            case 1:
                user_movie_ids = _a.sent();
                user_movie_ids = user_movie_ids[0].movies;
                return [3 /*break*/, 3];
            case 2:
                err_1 = _a.sent();
                console.error(err_1);
                user_movie_ids = [];
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/, user_movie_ids];
        }
    });
}); };
var get_recommendations = function (username, user_movie_ids, filterParams, sort_by) { return __awaiter(void 0, void 0, void 0, function () {
    var filter, min_vote_average, min_runtime, min_vote_count, num_per_page, page, match_expr, data, total, recommendations, total_pages, err_2, total, total_pages;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                filter = filterParams.filter, min_vote_average = filterParams.min_vote_average, min_runtime = filterParams.min_runtime, min_vote_count = filterParams.min_vote_count, num_per_page = filterParams.num_per_page, page = filterParams.page;
                match_expr = [
                    {
                        $in: [username, "$score._id"]
                    },
                    {
                        $gte: ["$vote_count", min_vote_count]
                    },
                    {
                        $gte: ["$runtime", min_runtime]
                    },
                    {
                        $gte: ["$vote_average", min_vote_average]
                    },
                    {
                        $not: [{ $in: ["$_id", user_movie_ids] }]
                    }
                ];
                if (filter) {
                    match_expr.push({
                        $in: [filter, "$filter"]
                    });
                }
                _a.label = 1;
            case 1:
                _a.trys.push([1, 4, , 5]);
                return [4 /*yield*/, movie_1.default.aggregate([
                        {
                            $match: {
                                $expr: {
                                    $and: match_expr
                                }
                            }
                        },
                        {
                            $addFields: {
                                score: {
                                    $filter: {
                                        input: "$score",
                                        as: "el",
                                        cond: {
                                            $eq: ["$$el._id", username]
                                        }
                                    }
                                }
                            }
                        },
                        {
                            $set: {
                                score: {
                                    $arrayElemAt: ["$score", 0]
                                }
                            }
                        },
                        {
                            $match: {
                                $expr: {
                                    $ne: ["$score.score", 0]
                                }
                            }
                        },
                        {
                            $sort: sort_by
                        },
                        {
                            $skip: (page - 1) * num_per_page
                        },
                        {
                            $limit: num_per_page
                        }
                        // {
                        // 	$facet: {
                        // 		metadata: [{ $count: "total" }],
                        // 		data: [
                        // 			{
                        // 				$skip: (page - 1) * num_per_page
                        // 			},
                        // 			{
                        // 				$limit: num_per_page
                        // 			}
                        // 		]
                        // 	}
                        // }
                    ]).allowDiskUse(true)];
            case 2:
                data = _a.sent();
                return [4 /*yield*/, movie_1.default.countDocuments({
                        $expr: {
                            $and: match_expr
                        },
                        score: {
                            $elemMatch: { _id: username, score: { $gt: 0 } }
                        }
                    })];
            case 3:
                total = _a.sent();
                recommendations = format_movies(data);
                total_pages = Math.ceil(total / num_per_page);
                return [2 /*return*/, [recommendations, total, total_pages]];
            case 4:
                err_2 = _a.sent();
                console.error(err_2);
                total = 0;
                total_pages = Math.ceil(total / num_per_page);
                return [2 /*return*/, [[], total, total_pages]];
            case 5: return [2 /*return*/];
        }
    });
}); };
var get_user_movies = function (username, user_movie_ids, filterParams, sort_by) { return __awaiter(void 0, void 0, void 0, function () {
    var filter, min_vote_average, min_runtime, min_vote_count, num_per_page, page, match_expr, db_response, _a, metadata, data, total, user_movies, total_pages, err_3, total, total_pages;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                filter = filterParams.filter, min_vote_average = filterParams.min_vote_average, min_runtime = filterParams.min_runtime, min_vote_count = filterParams.min_vote_count, num_per_page = filterParams.num_per_page, page = filterParams.page;
                match_expr = [
                    {
                        $in: [username, "$score._id"]
                    },
                    {
                        $gte: ["$vote_count", min_vote_count]
                    },
                    {
                        $gte: ["$runtime", min_runtime]
                    },
                    {
                        $gte: ["$vote_average", min_vote_average]
                    },
                    {
                        $in: ["$_id", user_movie_ids]
                    }
                ];
                if (filter) {
                    match_expr.push({
                        $in: [filter, "$filter"]
                    });
                }
                _b.label = 1;
            case 1:
                _b.trys.push([1, 3, , 4]);
                return [4 /*yield*/, movie_1.default.aggregate([
                        {
                            $match: {
                                $expr: {
                                    $and: match_expr
                                }
                            }
                        },
                        {
                            $addFields: {
                                score: {
                                    $filter: {
                                        input: "$score",
                                        as: "el",
                                        cond: {
                                            $eq: ["$$el._id", username]
                                        }
                                    }
                                }
                            }
                        },
                        {
                            $set: {
                                score: {
                                    $arrayElemAt: ["$score", 0]
                                }
                            }
                        },
                        {
                            $lookup: {
                                from: "users",
                                let: {
                                    movie_id: "$_id",
                                    user_id: "$score._id"
                                },
                                pipeline: [
                                    {
                                        $match: {
                                            $expr: {
                                                $eq: ["$$user_id", "$_id"]
                                            }
                                        }
                                    },
                                    {
                                        $unwind: {
                                            path: "$movies"
                                        }
                                    },
                                    {
                                        $match: {
                                            $expr: {
                                                $eq: ["$$movie_id", "$movies._id"]
                                            }
                                        }
                                    },
                                    {
                                        $project: {
                                            "movies.rating": 1
                                        }
                                    },
                                    {
                                        $set: {
                                            rating: "$movies.rating"
                                        }
                                    },
                                    {
                                        $unset: ["movies"]
                                    }
                                ],
                                as: "score.userRating"
                            }
                        },
                        {
                            $set: {
                                "score.userRating": {
                                    $arrayElemAt: ["$score.userRating", 0]
                                }
                            }
                        },
                        {
                            $set: {
                                "score.userRating": "$score.userRating.rating"
                            }
                        },
                        {
                            $sort: sort_by
                        },
                        {
                            $facet: {
                                metadata: [{ $count: "total" }],
                                data: [
                                    {
                                        $skip: (page - 1) * num_per_page
                                    },
                                    {
                                        $limit: num_per_page
                                    }
                                ]
                            }
                        }
                    ]).allowDiskUse(true)];
            case 2:
                db_response = _b.sent();
                _a = db_response[0], metadata = _a.metadata, data = _a.data;
                total = metadata[0].total;
                user_movies = format_movies(data);
                total_pages = Math.ceil(total / num_per_page);
                return [2 /*return*/, [user_movies, total, total_pages]];
            case 3:
                err_3 = _b.sent();
                console.error(err_3);
                total = 0;
                total_pages = Math.ceil(total / num_per_page);
                return [2 /*return*/, [[], total, total_pages]];
            case 4: return [2 /*return*/];
        }
    });
}); };
module.exports = { get_user_movie_ids: get_user_movie_ids, get_recommendations: get_recommendations, get_user_movies: get_user_movies };
