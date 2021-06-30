"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var mongoose_1 = __importDefault(require("mongoose"));
var Schema = mongoose_1.default.Schema;
var movieSchema = new Schema({
    _id: { type: Number, unique: true },
    rating: { type: Number, min: 1, max: 10 }
});
var watchListSchema = new Schema({
    _id: { type: Number, unique: true }
});
var followingSchema = new Schema({
    _id: { type: String, unique: true }
});
var userSchema = new Schema({
    _id: { type: String },
    movies: [movieSchema],
    watchList: [watchListSchema],
    following: [followingSchema]
}, { timestamps: true });
var User = mongoose_1.default.model("User", userSchema);
exports.default = User;
