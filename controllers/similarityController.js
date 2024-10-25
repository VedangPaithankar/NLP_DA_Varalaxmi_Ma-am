const { fetchArticleContent } = require('../services/nlpServices');
const natural = require('natural');
const TfIdf = natural.TfIdf;
const tokenizer = new natural.WordTokenizer();
const stopwords = require('stopwords').english;

/**
 * Calculates cosine similarity between two vectors
 * @param {number[]} vec1 - First vector
 * @param {number[]} vec2 - Second vector
 * @returns {number} Cosine similarity score
 */
function cosineSimilarity(vec1, vec2) {
    if (vec1.length !== vec2.length) return 0;
    
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;
    
    for (let i = 0; i < vec1.length; i++) {
        dotProduct += vec1[i] * vec2[i];
        norm1 += vec1[i] * vec1[i];
        norm2 += vec2[i] * vec2[i];
    }
    
    norm1 = Math.sqrt(norm1);
    norm2 = Math.sqrt(norm2);
    
    return dotProduct / (norm1 * norm2);
}

/**
 * Preprocesses text by tokenizing, removing stopwords, and converting to lowercase
 * @param {string} text - Input text
 * @returns {string[]} Array of processed tokens
 */
function preprocessText(text) {
    const tokens = tokenizer.tokenize(text.toLowerCase());
    return tokens.filter(token => !stopwords.includes(token));
}

/**
 * Creates TF-IDF vectors for a collection of documents
 * @param {string[]} documents - Array of document texts
 * @returns {Object} TF-IDF vectors and terms
 */
function createTfIdfVectors(documents) {
    const tfidf = new TfIdf();
    
    // Add all documents to TF-IDF
    documents.forEach(doc => {
        const processedDoc = preprocessText(doc).join(' ');
        tfidf.addDocument(processedDoc);
    });
    
    // Get all unique terms
    const terms = new Set();
    tfidf.documents.forEach(doc => {
        Object.keys(doc).forEach(term => {
            if (term !== '__key') terms.add(term);
        });
    });
    
    // Create vectors
    const vectors = documents.map((_, docIndex) => {
        const vector = [];
        terms.forEach(term => {
            vector.push(tfidf.tfidf(term, docIndex));
        });
        return vector;
    });
    
    return {
        vectors,
        terms: Array.from(terms)
    };
}

/**
 * Finds articles similar to the given article based on the URL.
 * @param {Object} req - The request object containing the query URL and article URLs in the body.
 * @param {Object} res - The response object used to send back the similarity results.
 */

exports.getSimilarArticles = async (req, res) => {
    const { query_url, article_urls } = req.body;

    // Validate input
    if (!query_url || !Array.isArray(article_urls) || article_urls.length === 0) {
        return res.status(400).json({ error: "Query URL and a non-empty list of article URLs are required." });
    }

    try {
        // Fetch content for all articles
        const fetchPromises = [query_url, ...article_urls].map(url => fetchArticleContent(url));
        const articles = await Promise.all(fetchPromises);
        
        // Extract article bodies and titles
        const articleBodies = articles.map(article => article.articleBody);
        const articleTitles = articles.map(article => article.title);
        
        // Create TF-IDF vectors for all documents
        const { vectors } = createTfIdfVectors(articleBodies);
        
        // Calculate similarity scores between query article and others
        const queryVector = vectors[0]; // First vector is the query article
        const similarities = vectors.slice(1).map((vector, index) => ({
            title: articleTitles[index + 1],
            url: article_urls[index],
            similarity: cosineSimilarity(queryVector, vector)
        }));
        
        // Sort by similarity score in descending order
        const similarArticles = similarities
            .sort((a, b) => b.similarity - a.similarity)
            .map(article => ({
                ...article,
                similarity: Math.round(article.similarity * 100) / 100 // Round to 2 decimal places
            }));

        res.json({
            query_article: articleTitles[0],
            similar_articles: similarArticles
        });
    } catch (error) {
        console.error("Error finding similar articles:", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
};