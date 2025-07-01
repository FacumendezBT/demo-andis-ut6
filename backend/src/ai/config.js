const {
    defaultSafetySettings,
    defaultGenerationConfig,
    maxInputLength,
} = require('@common/config/ai-configs/base-config');
const geminiModel = require('@common/config/ai-configs/models/gemini');
const vertexModel = require('@common/config/ai-configs/models/vertex');

function getMessageProcessorConfig(modelProvider = 'gemini') {
    const messageProcessorPrompt = require('./prompts');

    if (modelProvider === 'gemini') {
        return _getMessageProcessorConfigForGemini(messageProcessorPrompt);
    } else if (modelProvider === 'vertex') {
        return _getMessageProcessorConfigForVertex(messageProcessorPrompt);
    }
}

function _getMessageProcessorConfigForGemini(messageProcessorPrompt) {
    const config = geminiModel.getConfig();

    return {
        ...config,
        systemInstruction: messageProcessorPrompt.systemInstruction,
        promptTemplate: messageProcessorPrompt.promptTemplate,
        safetySettings: defaultSafetySettings,
        generationConfig: {
            ...defaultGenerationConfig,
            temperature: 0.7,
            maxInputLength: 8192,
            maxOutputTokens: 4096,
            responseMimeType: 'application/json',
        },
        maxInputLength: maxInputLength,
    };
}

function _getMessageProcessorConfigForVertex(messageProcessorPrompt) {
    const config = vertexModel.getConfig();

    return {
        ...config,
        systemInstruction: messageProcessorPrompt.systemInstruction,
        promptTemplate: messageProcessorPrompt.promptTemplate,
        safetySettings: defaultSafetySettings,
        generationConfig: {
            ...defaultGenerationConfig,
            temperature: 0.7,
            maxInputLength: 8192,
            maxOutputTokens: 4096,
            responseMimeType: 'application/json',
        },
        maxInputLength: maxInputLength,
    };
}

module.exports = {
    getMessageProcessorConfig,
};
