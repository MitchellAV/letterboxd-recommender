"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var mongoose_1 = __importDefault(require("mongoose"));
var Schema = mongoose_1.default.Schema;
var usersSchema = new Schema({
    _id: { type: String, unique: true },
    idf: { type: Number, default: 0, min: 0 }
});
var tagSchema = new Schema({
    _id: String,
    count: { type: Number, min: 2 },
    idf: { type: Number, default: 0 },
    users: [usersSchema]
}, { timestamps: true });
var Tag = mongoose_1.default.model("Tag", tagSchema);
exports.default = Tag;
