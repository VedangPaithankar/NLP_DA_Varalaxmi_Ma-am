const { fetchArticleContent } = require('../services/nlpServices');
const { HfInference } = require('@huggingface/inference');

const hf = new HfInference(process.env.HUGGING_FACE_API_KEY); 

// Define main news categories
const NEWS_CATEGORIES = [
    "Technology",
    "Business",
    "Politics",
    "Entertainment",
    "Sports",
    "Health",
    "Science",
    "World News"
];

/**
 * Classifies text into predefined categories using Hugging Face's zero-shot classification
 * @param {string} text - Text content to classify
 * @returns {Promise<Object>} Classification result with categories and confidence scores
 */
async function classifyText(text) {
    try {
        // Perform zero-shot classification
        const result = await hf.zeroShotClassification({
            model: 'facebook/bart-large-mnli',
            inputs: text,
            parameters: {
                candidate_labels: NEWS_CATEGORIES,
                multi_label: false
            }
        });

        // The API returns labels and scores directly, not nested in an array
        const { labels, scores } = result[0];

        // Get the most likely category and its score
        const topCategory = {
            category: labels[0],
            confidence: Math.round(scores[0] * 100) / 100
        };

        const secondaryCategories = labels
            .slice(1)
            .map((label, index) => ({
                category: label,
                confidence: scores[index + 1]
            }))
            .filter(cat => cat.confidence > 0.15);

        return {
            primary_category: topCategory,
            secondary_categories: secondaryCategories,
            classification_model: 'distilbert-base-uncased',
            timestamp: new Date().toISOString()
        };

    } catch (error) {
        console.error('Classification error:', error);
        throw new Error('Failed to classify text: ' + error.message);
    }
}

/**
 * Controller function to handle article classification requests
 */
exports.classifyArticle = async (req, res) => {
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

        // Classify the article content
        const category = await classifyText(articleContent.articleBody);
        
        // Send the response back to the client
        res.json({
            title: articleContent.headline,
            category,
            source_url: url
        });
    } catch (error) {
        // Handle errors and send a response
        console.error("Error classifying article:", error.message);
        res.status(500).json({ error: error.message });
    }
};