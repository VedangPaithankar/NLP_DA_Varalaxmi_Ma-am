# NLP-Driven News Processing API

## Project Overview

The **NLP-Driven News Processing API** is a comprehensive solution that enhances the way users interact with news articles. By leveraging advanced Natural Language Processing (NLP) techniques, this API allows users to summarize, analyze, and categorize articles simply by providing their URLs. The API serves various functions including sentiment analysis, keyword extraction, and more, making it an invaluable tool for news aggregation, research, and content curation.

## Features

- **Article Summarization**: Generates concise summaries of articles for quick consumption.
- **Sentiment Analysis**: Analyzes and classifies the sentiment of articles as positive, negative, or neutral.
- **Named Entity Recognition (NER)**: Identifies important entities within articles (people, organizations, locations).
- **Keyword Extraction**: Extracts key terms and phrases from articles.
- **Topic Modeling**: Groups related articles into overarching themes.
- **Similarity Search**: Finds articles similar to a specified one using content embeddings.
- **Text Classification**: Classifies articles into predefined categories (e.g., technology, politics).
- **Language Translation**: Translates article content into different languages.
- **Article Search**: Searches for articles based on semantic keywords.

## Endpoints

| Endpoint                  | Description                                             | Method | Request Body                                                   | Response                                                             |
|---------------------------|---------------------------------------------------------|--------|----------------------------------------------------------------|----------------------------------------------------------------------|
| `/summarize_article`      | Summarizes article content.                            | POST   | `{ "url": "https://example.com/article" }`                   | `{ "title": "...", "summary": "...", "source_url": "..." }`        |
| `/analyze_sentiment`      | Analyzes the sentiment of the article.                | POST   | `{ "url": "https://example.com/article" }`                   | `{ "title": "...", "sentiment": "...", "confidence": "...", "source_url": "..." }` |
| `/extract_entities`       | Extracts named entities from the article.             | POST   | `{ "url": "https://example.com/article" }`                   | `{ "title": "...", "entities": [ ... ], "source_url": "..." }`     |
| `/extract_keywords`       | Extracts important keywords from the article.         | POST   | `{ "url": "https://example.com/article" }`                   | `{ "title": "...", "keywords": [ ... ], "source_url": "..." }`     |
| `/get_topics`             | Groups articles into themes/topics.                   | POST   | `{ "urls": ["https://example.com/article1", ...] }`         | `{ "topics": [ ... ] }`                                             |
| `/get_similar_articles`   | Finds similar articles by comparing content.          | POST   | `{ "query_url": "...", "article_urls": [ ... ] }`          | `{ "query_article": "...", "similar_articles": [ ... ] }`          |
| `/classify_article`       | Classifies article content into categories.           | POST   | `{ "url": "https://example.com/article" }`                   | `{ "title": "...", "category": "...", "source_url": "..." }`       |
| `/translate_article`      | Translates article content to a specified language.   | POST   | `{ "url": "https://example.com/article", "target_language": "es" }` | `{ "title": "...", "original_text": "...", "translated_text": "..." }` |
| `/search_articles`        | Searches articles based on keywords.                   | POST   | `{ "query": "..." }`                                         | `{ "matching_articles": [ ... ] }`                                 |
