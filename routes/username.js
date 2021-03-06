"use strict";
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
var express_1 = __importDefault(require("express"));
var router = express_1.default.Router();
var express_validator_1 = require("express-validator");
var route_functions_1 = require("../util/route-functions");
var recommendation_engine_1 = require("../util/recommendation_engine");
var _a = require("../util/db-functions"), get_user_movie_ids = _a.get_user_movie_ids, get_recommendations = _a.get_recommendations, get_user_movies = _a.get_user_movies;
router.get("/:username/personal", route_functions_1.validationParams({
    min_vote_count: 1,
    min_vote_average: 0.5,
    min_runtime: 1
}, true), function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var errors, filterParams, username, sort_by, user_movie_ids, _a, user_movies, total, total_pages;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                errors = express_validator_1.validationResult(req);
                if (!!errors.isEmpty()) return [3 /*break*/, 1];
                // There are errors. Render form again with sanitized values/errors messages.
                // Error messages can be returned in an array using `errors.array()`.
                return [2 /*return*/, next({
                        message: "Please fix the following fields:",
                        status: 400,
                        error: errors.array()
                    })];
            case 1:
                filterParams = req.query;
                username = req.params.username;
                sort_by = route_functions_1.sort_order(filterParams.sort_type, filterParams.order);
                return [4 /*yield*/, get_user_movie_ids(username)];
            case 2:
                user_movie_ids = _b.sent();
                return [4 /*yield*/, get_user_movies(username, user_movie_ids, filterParams, sort_by)];
            case 3:
                _a = _b.sent(), user_movies = _a[0], total = _a[1], total_pages = _a[2];
                // Get thumbnails if not already saved
                recommendation_engine_1.scrapeThumbnails(user_movies);
                res.status(200).json({
                    movies: user_movies,
                    filterParams: filterParams,
                    page: filterParams.page,
                    total: total,
                    numPages: total_pages
                });
                _b.label = 4;
            case 4: return [2 /*return*/];
        }
    });
}); });
router.get("/:username", route_functions_1.validationParams({
    min_vote_count: 300,
    min_vote_average: 6,
    min_runtime: 30
}, true), function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var errors, filterParams, username, sort_by, user_movie_ids, _a, recommendations, total, total_pages;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                errors = express_validator_1.validationResult(req);
                if (!!errors.isEmpty()) return [3 /*break*/, 1];
                // There are errors. Render form again with sanitized values/errors messages.
                // Error messages can be returned in an array using `errors.array()`.
                return [2 /*return*/, next({
                        message: "Please fix the following fields:",
                        status: 400,
                        error: errors.array()
                    })];
            case 1:
                filterParams = req.query;
                username = req.params.username;
                sort_by = route_functions_1.sort_order(filterParams.sort_type, filterParams.order);
                return [4 /*yield*/, get_user_movie_ids(username)];
            case 2:
                user_movie_ids = _b.sent();
                return [4 /*yield*/, get_recommendations(username, user_movie_ids, filterParams, sort_by)];
            case 3:
                _a = _b.sent(), recommendations = _a[0], total = _a[1], total_pages = _a[2];
                // Get thumbnails if not already saved
                recommendation_engine_1.scrapeThumbnails(recommendations);
                res.status(200).json({
                    movies: recommendations,
                    filterParams: filterParams,
                    page: filterParams.page,
                    total: total,
                    numPages: total_pages
                });
                _b.label = 4;
            case 4: return [2 /*return*/];
        }
    });
}); });
module.exports = router;
