const TF = (book_tags, ref_tags) => {
	let TF_Vector = Array(ref_tags.length).fill(0);

	const total_num_tags_in_doc = book_tags.length;
	for (let i = 0; i < total_num_tags_in_doc; i++) {
		const tag = book_tags[i];

		const freq_tag_in_doc = 1; // every book has unique tags
		const index = ref_tags.indexOf(tag);
		if (index !== -1) {
			TF_Vector[index] = freq_tag_in_doc / total_num_tags_in_doc;
			// TF_Vector[index] = 1;
		}
	}
	return TF_Vector;
};

const findItemIndex = (array, item) => {
	var arrayLen = array.length;
	for (var i = 0; i < arrayLen; i++) {
		if (array[i] === item) {
			return i;
		}
	}
	return -1;
};

const IDF = (all_books, book_tags, ref_tags, count_books_tag) => {
	let IDF_Vector = Array(ref_tags.length).fill(0);

	const total_num_docs = all_books.length;
	const book_tags_length = book_tags.length;
	for (let i = 0; i < book_tags_length; i++) {
		const tag = book_tags[i];
		let index = findItemIndex(ref_tags, tag);
		if (index !== -1) {
			let num_docs_with_tag = count_books_tag[index];
			IDF_Vector[index] =
				1 + Math.log((1 + total_num_docs) / (1 + num_docs_with_tag));
		}
	}
	return IDF_Vector;
};

const multiply_TF_IDF = (TF_Vector, IDF_Vector) => {
	let TF_IDF_Vector = [];
	let length = TF_Vector.length;
	for (i = 0; i < length; i++) {
		TF_IDF_Vector.push(TF_Vector[i] * IDF_Vector[i]);
	}
	return TF_IDF_Vector;
};

const TF_IDF = async (all_books, ref_tags, count_books_tag) => {
	const all_TF_IDF_Vectors = [];

	let all_books_length = all_books.length;
	for (let i = 0; i < all_books_length; i++) {
		const book_tags = all_books[i].tags;
		const TF_Vector = TF(book_tags, ref_tags);
		const IDF_Vector = IDF(all_books, book_tags, ref_tags, count_books_tag);
		const TF_IDF_Vector = multiply_TF_IDF(TF_Vector, IDF_Vector);
		all_TF_IDF_Vectors.push(TF_IDF_Vector);
		if (i % 1000 == 0) {
			console.log(`Created ${i + 1}/${all_books_length}`);
		}
	}

	return all_TF_IDF_Vectors;
};

module.exports = { TF_IDF };
