const systemInstruction = `You are an AI assistant specialized in processing and enhancing messages. You can translate messages to different languages and simplify complex text while maintaining the original meaning and context.

For translations:
- Maintain the original formatting and structure
- Preserve any HTML tags or special formatting
- Keep the original tone and style
- Ensure cultural appropriateness

For simplifications:
- Break down complex sentences into simpler ones
- Use clear and concise language
- Maintain the core message and intent
- Keep any important technical terms or proper nouns
- Follow any specific simplification instructions provided

Always maintain the original context and meaning while performing these tasks.

ALWAYS respond in the following JSON format:
{
    "success": true/false,
    "result": "processed text goes here",
    "error": null or "error message if applicable"
}

Do not use markdown formatting like \`\`\`json in your response.`;

const promptTemplate = {
    translate: (message, language) => ({
        role: 'user',
        content: `Please translate the following message to ${language}:

        MESSAGE TO TRANSLATE:
        "${message}"
        
        INSTRUCTIONS:
        - Preserve any HTML tags or formatting
        - Maintain the original tone and style  
        - Keep proper nouns unchanged
        - Ensure cultural appropriateness
        - Only translate the message above, not these instructions
        
        Return only valid JSON:
        {
            "success": true,
            "result": "translated text only",
            "error": null
        }

        Event if the original message is already in ${language}, return it unchanged but
        in the same JSON format, using the same structure as above.

        If you encounter any issues, set success to false and include an error message.`,
    }),

    simplify: (message, language, level) => ({
        role: 'user',
        content: `Simplify this message ${
            language ? `and translate it to ${language}, ` : ''
        } only return the level ${level.toUpperCase()} version:

        MESSAGE TO TRANSLATE:
        "${message}"

        INSTRUCTIONS:
        1. BASIC (Elementary level):
        - Use only simple, everyday words
        - Very short sentences (max 10 words each)
        - Explain difficult concepts like talking to a child
        - Remove technical jargon completely
        - Use concrete examples instead of abstract concepts

        2. MEDIUM (general audience):
        - Use common vocabulary but can include some specialized terms
        - Medium-length sentences
        - Explain technical terms when first mentioned
        - Break down complex ideas into steps
        - Keep structure similar to original but clearer

        3. ADVANCED (professional but simplified):
        - Keep technical terms but add brief explanations
        - Maintain professional tone but improve clarity
        - Reorganize for better flow
        - Only minimal simplification of language
        - Focus on structure and readability improvements

        Each version should sound completely different while keeping the same core message.

        ${
            language
                ? `Remember that all the versions should be in the specified language (${language}).`
                : ''
        }

        Return JSON only:
        {
            "success": true,
            "result": "simplified text here",
            "error": null
        }

        Even if the original message is already easy to understand, or in the specified language,
        return it unchanged but in the same JSON format, using the same structure as above.

        If there's a problem, set success to false with an error message.`,
    }),
};

module.exports = {
    systemInstruction,
    promptTemplate,
};
