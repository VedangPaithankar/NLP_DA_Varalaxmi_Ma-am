const { fetchArticleContent, translateText, summarizeText } = require('../services/nlpServices');

/**
 * Translates the content of an article based on the given URL and target language.
 *
 * @param {Object} req - The request object containing the URL and target language.
 * @param {Object} res - The response object used to send back the translation results.
 */

exports.translateArticle = async (req, res) => {
    const { url, target_language } = req.body;

    // Check if URL and target language are provided
    if (!url || !target_language) {
        return res.status(400).json({ error: "URL and target language are required" });
    }

    try {
        // Fetch the content of the article
        const articleContent = await fetchArticleContent(url);

        // Summarize text
        const summary = await summarizeText(articleContent.articleBody);

        // Translate the article text
        const translatedText = await translateText(summary, target_language);

        // Send the response back to the client
        res.json({
            title: articleContent.headline,
            original_text: summary,
            translated_text: translatedText,
            source_url: url
        });
    } catch (error) {
        // Handle errors and send a response
        console.error("Error translating article:", error.message);
        res.status(500).json({ error: error.message });
    }
};