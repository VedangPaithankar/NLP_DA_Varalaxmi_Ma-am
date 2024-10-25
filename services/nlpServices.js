const { pipeline } = require('@xenova/transformers');
const axios = require('axios');
const { HfInference } = require('@huggingface/inference');
const natural = require('natural');
const tfidf = new natural.TfIdf();
const cheerio = require('cheerio');
const { kmeans } = require('ml-kmeans');

// Initialize Hugging Face Inference API
const hf = new HfInference(process.env.HUGGING_FACE_API_KEY); // Make sure to set your Hugging Face API key

// Fetch article content from the URL
async function fetchArticleContent(url) {
    try {
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);

        // Extract the JSON-LD script
        const jsonData = $('script[type="application/ld+json"]#articleschemascript').html();
        const articleData = JSON.parse(jsonData);

        // Get the headline and article body
        const headline = articleData.headline;
        const articleBody = articleData.articleBody;

        return {
            headline,
            articleBody,
        };
    } catch (error) {
        throw new Error('Failed to fetch article content');
    }
}

// Summerize the text of the given article
const summarizeText = async (text) => {
    try {
        // Use the Hugging Face summarization model
        const response = await hf.summarization({
            model: 'facebook/bart-large-cnn', 
            inputs: text,
        });

        // Return the summary
        return response.summary_text || "No summary available.";
    } catch (error) {
        console.error("Error during text summarization:", error);
        throw new Error("Failed to summarize text");
    }
};

async function translateText(text, targetLang, sourceLang="en") {
    try {
        const response = await hf.request({
            model: 'facebook/nllb-200-distilled-600M',
            inputs: text,
            parameters: {
                max_length: 512,
                temperature: 0.7,
                num_beams: 4,
                early_stopping: true,
                src_lang: getLanguageCode(sourceLang),
                tgt_lang: getLanguageCode(targetLang)
            },
            task: 'translation'
        });

        if (!response || !Array.isArray(response)) {
            throw new Error('Invalid response format from the model');
        }

        const translatedText = response[0]?.translation_text;
        
        if (!translatedText) {
            throw new Error('No translation received from the model');
        }

        return translatedText;
    } catch (error) {
        console.error('Translation error:', error);
        throw new Error(`Translation failed: ${error.message}`);
    }
}

// Helper function to get NLLB language codes
function getLanguageCode(language) {
    // Map of common language codes to NLLB language codes
    const languageMap = {
        'en': 'eng_Latn',
        'fr': 'fra_Latn',
        'es': 'spa_Latn',
        'de': 'deu_Latn',
        'it': 'ita_Latn',
        'pt': 'por_Latn',
        'ru': 'rus_Cyrl',
        'zh': 'zho_Hans',
        'ja': 'jpn_Jpan',
        'ko': 'kor_Hang',
        'hi': 'hin_Deva',
        'ar': 'ara_Arab',
        'bn': 'ben_Beng',
        'ta': 'tam_Taml',
        'te': 'tel_Telu',
        'ml': 'mal_Mlym'
    };

    const nllbCode = languageMap[language];
    if (!nllbCode) {
        throw new Error(`Unsupported language: ${language}`);
    }
    
    return nllbCode;
}

// Perform sentiment analysis using DistilBERT
async function analyzeSentiment(text) {
    try {
        const pipe = await pipeline('sentiment-analysis');
        const sentimentAnalysis = await pipe(text);
        console.log(sentimentAnalysis)
        return sentimentAnalysis;
    } catch (error) {
        throw new Error('Failed to analyze sentiment');
    }
}

// Extract named entities using DistilBERT
async function extractEntities(text) {
    try {
        const entityRecognition = await hf.tokenClassification({
            model: 'dslim/distilbert-NER',
            inputs: text
        });
        console.log(entityRecognition)
        return entityRecognition;
    } catch (error) {
        throw new Error('Failed to extract entities');
    }
}

// Summarize article content using DistilBERT
async function summarizeArticle(text) {
    try {
        const summary = await hf.summarization({
            model: 'distilbert/distilbert-base-uncased',
            inputs: text
        });
        return summary[0].summary_text;
    } catch (error) {
        throw new Error('Failed to summarize article');
    }
}

// Extract keywords from the text
async function extractKeywords(text, numKeywords = 10) {
    try {
        // Clear previous data
        tfidf.removeDocument(text);  // Clear previous documents to avoid overlap
        tfidf.addDocument(text);      // Add the document for TF-IDF calculation
        
        const keywords = [];

        // Get the TF-IDF values and sort them
        tfidf.listTerms(0 /* index of the first document */).forEach(item => {
            keywords.push(item.term); // Collect the terms
        });

        // Return the top 'numKeywords' keywords
        return keywords.slice(0, numKeywords);
    } catch (error) {
        throw new Error('Failed to extract keywords: ' + error.message);
    }
}

async function performTopicModeling(articles) {
    try {
        // Extract texts from articles
        const texts = articles.map(article => article.text);
        
        // Ensure that the input is structured as a string array
        if (texts.length === 0) {
            throw new Error("No articles provided for topic modeling.");
        }
        
        // Use a Sentence Transformer model for embedding extraction
        const embeddings = await hf.featureExtraction({
            model: 'sentence-transformers/all-MiniLM-L6-v2', 
            inputs: texts,
        });

        // Check if embeddings were returned correctly
        if (!embeddings || !Array.isArray(embeddings)) {
            throw new Error("Failed to retrieve embeddings.");
        }

        // Perform KMeans clustering
        const numTopics = 2; 
        const clusters = kmeans(embeddings, numTopics);

        // Map each article to its closest cluster to gather representative texts
        const clusteredTexts = Array(numTopics).fill().map(() => []);
        texts.forEach((text, i) => {
            const clusterIndex = clusters.clusters[i]; // Get the cluster assignment
            clusteredTexts[clusterIndex].push(text);      // Group text by its cluster
        });

        // Extract keywords for each cluster using TF-IDF or simple word frequency
        const topics = clusteredTexts.map((clusterTexts, index) => {
            // Compute TF-IDF or frequency-based keywords for each cluster
            const keywords = extractKeywords(clusterTexts); // Implement a function to get keywords
            return {
                topic: `Topic ${index + 1}`,
                keywords: keywords.slice(0, 5) // Take the top 5 keywords
            };
        });

        return topics;
    } catch (error) {
        console.error("Error in performTopicModeling:", error);
        throw new Error('Failed to perform topic modeling');
    }
}

// Function to extract keywords from a set of texts (simple word frequency)
function extractKeywords(texts) {
    const wordCounts = {};
    const stopWords = new Set(['the', 'is', 'in', 'and', 'a', 'of', 'to', 'for', 'with', 'that', 'on', 'as', 'at']); // Basic stopwords
    
    // Count frequency of each word in all texts
    texts.forEach(text => {
        const words = text.toLowerCase().split(/\W+/); // Split on non-word characters
        words.forEach(word => {
            if (!stopWords.has(word) && word.length > 2) { // Filter stopwords and short words
                wordCounts[word] = (wordCounts[word] || 0) + 1;
            }
        });
    });

    // Sort words by frequency
    const sortedWords = Object.entries(wordCounts)
        .sort((a, b) => b[1] - a[1])
        .map(entry => entry[0]);
    
    return sortedWords; // Return sorted words as keywords
}

async function searchArticlesByKeywords(query) {
    const apiKey = process.env.NEWS_API_KEY; // Make sure to set your API key in an environment variable
    const url = `https://newsapi.org/v2/everything?q=${query}&apiKey=${apiKey}`;

    try {
        const response = await axios.get(url);
        const articles = response.data.articles;

        // Return matching articles
        return articles; // Return articles instead of trying to use res
    } catch (error) {
        console.error(error);
        throw new Error('An error occurred while fetching articles.'); // Throw an error to be caught in the calling function
    }
}

module.exports = {
    fetchArticleContent,
    translateText,
    analyzeSentiment,
    extractEntities,
    summarizeArticle,
    extractKeywords,
    performTopicModeling,
    searchArticlesByKeywords,
    summarizeText,
};