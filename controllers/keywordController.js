const { fetchArticleContent, extractKeywords } = require('../services/nlpServices');

/**
 * Extracts keywords from an article fetched from the given URL.
 *
 * @param {Object} req - The request object containing the URL in the body.
 * @param {Object} res - The response object used to send back the extracted keywords.
 */
exports.extractKeywordsFromArticle = async (req, res) => {
    const { url } = req.body;

    // Check if URL is provided
    if (!url) {
        return res.status(400).json({ error: "URL is required" });
    }

    try {
        // Fetch article content from the URL
        const articleContent = await fetchArticleContent(url);

        // Ensure article content has the required structure
        if (!articleContent || !articleContent.articleBody || !articleContent.headline) {
            return res.status(500).json({ error: "Invalid article content structure" });
        }

        // Extract keywords from the article content
        const keywords = await extractKeywords(articleContent.headline);
        // Send the response back to the client
        res.json({
            title: articleContent.headline,  // Article title
            keywords,                    // Extracted keywords
            source_url: url              // Original URL of the article
        });
    } catch (error) {
        // Handle errors and send a response
        console.error("Error extracting keywords:", error.message);
        res.status(500).json({ error: error.message });
    }
};