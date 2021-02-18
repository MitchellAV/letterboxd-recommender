/**
 *
 * @param {Array} words An array containing the all terms for the document (may contain duplicate entries)
 * @param {String} term The term to compare with all the terms in the doucment to calculate the TF score
 */
const TF = (words, term) => {
	let count = 0;
	for (let i = 0; i < words.length; i++) {
		const word = words[i];
		if (word === term) {
			count++;
		}
	}
	const numTerms = new Set(words).length;
	return count / numTerms;
};

const IDF = (term) => {
	return 1 + Math.log((1 + total_num_docs) / (1 + num_docs_with_tag));
};

const getRecommended = () => {
	// Get TFIDF vector for each movie
	// Get TFIDF vector for User
};

module.exports = { TF };
