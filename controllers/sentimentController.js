const { fetchArticleContent, analyzeSentiment } = require('../services/nlpServices');

/**
 * Analyzes the sentiment of an article fetched from the given URL.
 *
 * @param {Object} req - The request object containing the URL in the body.
 * @param {Object} res - The response object used to send back the sentiment analysis result.
 */

exports.analyzeArticleSentiment = async (req, res) => {
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

        // Analyze sentiment of the article content
        const result = await analyzeSentiment(articleContent.articleBody);

        // Send the response back to the client
        res.json({
            title: articleContent.headline,    // Article title
            sentiment: result[0].label,        // Analyzed sentiment (positive, negative, neutral)
            confidence: result[0].score,       // Confidence score of the sentiment analysis
            source_url: url                    // Original URL of the article
        });
    } catch (error) {
        // Handle errors and send a response
        console.error("Error analyzing sentiment:", error.message);
        res.status(500).json({ error: error.message });
    }
};