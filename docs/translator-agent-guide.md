# 🌍 Translator Agent Usage Guide

The Translator Agent in AgenWork provides seamless, on-the-go translation using Chrome's built-in AI Translation API. This guide shows you how to use the translation features effectively.

## Quick Start Examples

### Basic Translation Commands

```
User: "Translate this page to Spanish"
→ Translates the entire current page to Spanish

User: "Translate 'Hello, how are you?' to French"
→ Translates the specific text to French

User: "Convert this to German"
→ Auto-detects source language and translates to German

User: "What does this mean in Japanese?"
→ Translates content to Japanese with auto-detection
```

### Advanced Translation Examples

```
User: "Translate this from English to Portuguese"
→ Explicitly specifies both source and target languages

User: "Can you translate this page to Italian and also summarize it?"
→ Multi-task: translates AND summarizes the page

User: "Help me understand this French text"
→ Detects French, translates to user's preferred language

User: "Translate the current article to Chinese"
→ Focuses on main article content for translation
```

## Supported Languages

The Translator Agent supports the following languages with their ISO codes:

| Language | Code | Language | Code |
|----------|------|----------|------|
| English | en | Portuguese | pt |
| Spanish | es | Russian | ru |
| French | fr | Japanese | ja |
| German | de | Korean | ko |
| Italian | it | Chinese | zh |
| Arabic | ar | Hindi | hi |
| Turkish | tr | Polish | pl |
| Dutch | nl | Swedish | sv |
| Danish | da | Norwegian | no |
| Finnish | fi | | |

## Features

### 🔍 Auto Language Detection
- Automatically detects the source language when not specified
- Provides confidence scores for detection accuracy
- Handles mixed-language content intelligently

### 📄 Page Translation
- Extracts and translates main page content
- Preserves formatting and structure where possible
- Works with articles, blog posts, and text-heavy pages

### 🎯 Smart Intent Recognition
- Understands natural language translation requests
- Extracts language preferences from conversational prompts
- Supports multi-step workflows with other agents

### ⚡ Real-time Progress
- Shows model download progress for first-time use
- Provides translation status updates
- Graceful handling of network issues

## How It Works

### 1. Intent Detection
When you send a message, the Prompter Agent analyzes your intent:
```javascript
// Example intent analysis
{
  "primary": "translate",
  "confidence": 0.95,
  "targetLanguage": "es",
  "sourceLanguage": "auto",
  "reasoning": "User wants to translate content to Spanish"
}
```

### 2. Language Detection (if needed)
For auto-detection, the system analyzes the source text:
```javascript
// Example detection result
{
  "language": "fr",
  "confidence": 0.89,
  "allResults": [
    {"detectedLanguage": "fr", "confidence": 0.89},
    {"detectedLanguage": "en", "confidence": 0.11}
  ]
}
```

### 3. Translation Execution
The translation is performed with validation:
```javascript
// Example translation result
{
  "originalText": "Bonjour, comment allez-vous?",
  "translatedText": "Hello, how are you?",
  "sourceLanguage": "fr",
  "targetLanguage": "en",
  "wordCount": 4
}
```

## Best Practices

### ✅ Do's
- Use natural language - the system understands conversational requests
- Specify target language clearly when possible
- Try multiple language variations if one isn't supported
- Use the system for both short phrases and longer content
- Combine with other agents for enhanced workflows

### ❌ Don'ts
- Don't expect perfect translations for highly technical jargon
- Don't translate extremely long documents (over 10,000 characters)
- Don't rely on translation for critical legal or medical content
- Don't expect support for very rare or regional language variants

## Troubleshooting

### Common Issues

**"Translation API not available"**
- Ensure you're using Chrome 138+ 
- Check chrome://flags/ for AI API settings
- Verify sufficient system resources (16GB RAM, 22GB storage)

**"Language pair not supported"**
- Try alternative language codes or names
- Check available language pairs using the test suite
- Some combinations may require model downloads

**"Content extraction failed"**
- Some pages may have restrictions on content access
- Try refreshing the page and attempting again
- Works best with standard web pages and articles

**"Auto-detection failed"**
- Provide source language explicitly
- Ensure text is long enough (minimum 10 characters)
- Check that text is in a supported language

## Integration Examples

### With Summarizer
```
User: "Translate this article to Spanish and give me a summary"
→ 1. Translates article to Spanish
→ 2. Summarizes the translated content
```

### With Research
```
User: "What is this French article about? Translate and explain"
→ 1. Detects French language
→ 2. Translates to English
→ 3. Provides research/explanation of content
```

### Multi-language Workflow
```
User: "Translate this to German, then tell me the key points"
→ 1. Translates content to German
→ 2. Extracts key points from translated text
```

## Testing and Validation

Use the comprehensive test suite at `tests/test-translator-agent.html` to:
- Verify API availability and system requirements
- Test language detection with various text samples
- Validate translation quality across language pairs
- Check intent detection for natural language requests
- Test full coordination workflows with other agents

The test suite provides detailed diagnostics and helps identify any configuration issues.

## Privacy and Security

- All translation happens locally using Chrome's built-in AI
- No data is sent to external servers
- Translation models are downloaded and run on-device
- Respects user privacy and Chrome's security model
- Works offline once models are downloaded

---

For technical details and implementation information, see the main project documentation and the AI Agents source code.