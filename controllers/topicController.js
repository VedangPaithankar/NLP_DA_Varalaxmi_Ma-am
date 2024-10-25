const { fetchArticleContent, performTopicModeling } = require('../services/nlpServices');

/**
 * Retrieves topics from multiple articles based on their URLs.
 *
 * @param {Object} req - The request object containing the list of article URLs.
 * @param {Object} res - The response object used to send back the topic modeling results.
 */

exports.getTopics = async (req, res) => {
    const { urls } = req.body;

    // Check if URLs are provided
    if (!urls || !Array.isArray(urls) || urls.length === 0) {
        return res.status(400).json({ error: "A list of article URLs is required" });
    }

    try {
        // Fetch content for each article URL
        const articles = await Promise.all(urls.map(async (url) => {
            const articleContent = await fetchArticleContent(url);
            return {
                title: articleContent.headline,
                text: articleContent.articleBody
            };
        }));

        // Perform topic modeling on the articles
        const topics = await performTopicModeling(articles);

        // Send the response back to the client
        res.json({ topics });
    } catch (error) {
        // Handle errors and send a response
        console.error("Error retrieving topics:", error.message);
        res.status(500).json({ error: error.message });
    }
};