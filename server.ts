import { NextFunction, Request, Response } from "express";
import { Error } from "./util/types";
import express from "express";
import path from "path";
import cors from "cors";
require("dotenv").config();

import mongoose from "mongoose";

const app = express();

app.use(cors());

// Set static folder
app.use(express.static(path.join(__dirname, "public")));

// Body Parser Middleware
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.use("/user", require("./routes/username"));
app.use("/movie", require("./routes/movies"));
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
	console.error(err);
	return res.status(err.status).json(err);
});

mongoose
	.connect(process.env.MONGODB_URI as string, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
		useFindAndModify: false,
		useCreateIndex: true
	})
	.then(async () => {
		console.log("Successfully Connected to MongoDB Atlas Database");

		app.listen(process.env.PORT || 5000, () =>
			console.log(`Server started on PORT: ${process.env.PORT || 5000}`)
		);
	})
	.catch((err) => console.error(err));
