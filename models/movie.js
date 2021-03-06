"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var mongoose_1 = __importDefault(require("mongoose"));
var Schema = mongoose_1.default.Schema;
var hasOverview = function (str) {
    return str !== "" && str.toLowerCase() !== "none available";
};
var scoreSchema = new Schema({
    _id: {
        type: String,
        unique: true
    },
    score: {
        type: Number
    },
    maxTag: {
        type: String
    },
    userRating: { type: Number }
});
var movieSchema = new Schema({
    _id: Number,
    letterboxd_id: { type: Number, default: null },
    letterboxd_url: { type: String, default: null },
    title: { type: String, required: true },
    overview: {
        type: String,
        required: true,
        validate: {
            validator: hasOverview
        }
    },
    keywords: [String],
    tags: [String],
    thumbnail_url: { type: String, required: true },
    score: [scoreSchema],
    adult: { type: Boolean, required: true },
    genres: [{ type: String, required: true }],
    cast: [String],
    crew: [String],
    directors: [String],
    producers: [String],
    writers: [String],
    dp: [String],
    screenplay: [String],
    overview_words: [{ type: String, required: true }],
    original_title: { type: String, required: true },
    original_language: { type: String, required: true },
    imdb_id: { type: String, required: true },
    vote_count: { type: Number, required: true, min: 1 },
    vote_average: { type: Number, required: true, min: 0.5 },
    release_date: { type: String, required: true },
    production_countries: [String],
    production_companies: [String],
    spoken_languages: [String],
    runtime: { type: Number, required: true, min: 1 },
    revenue: Number,
    budget: Number
}, { timestamps: true });
var Movie = mongoose_1.default.model("Movie", movieSchema);
exports.default = Movie;
