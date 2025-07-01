const { GoogleGenerativeAI } = require('@google/generative-ai');
const { VertexAI } = require('@google-cloud/vertexai');
const { internal, security } = require('../config/logger');
const { getMessageProcessorConfig } = require('./config');

const aiClients = {};
let activeModel = null;

const PROVIDERS = {
    GEMINI: 'gemini',
    VERTEX: 'vertex',
};

/**
 * Get the default model provider based on environment
 * Uses Vertex AI in production, Gemini in development
 * @returns {string} The default model provider to use
 */
function getDefaultModelProvider() {
    return process.env.NODE_ENV === 'production' ? PROVIDERS.VERTEX : PROVIDERS.GEMINI;
}

/**
 * Messaging Processor Client
 * Manages AI client initialization and provides access to the active model
 */
class MessagingProcessorClient {
    constructor() {
        this.initialized = false;
    }

    /**
     * Initializes the AI service with the appropriate model configuration
     * @param {string} modelProvider - The AI provider to use (default from environment)
     * @returns {boolean} - Success status of initialization
     */
    initialize(modelProvider = getDefaultModelProvider()) {
        // Validate the provider
        if (!Object.values(PROVIDERS).includes(modelProvider)) {
            internal.warn(`Unsupported model provider: ${modelProvider}`);
            return false;
        }

        // Get required credentials based on the provider
        const credentials = this._getProviderCredentials(modelProvider);
        if (!credentials.isValid) {
            internal.error(
                `${modelProvider.toUpperCase()} ${
                    credentials.missingConfig
                } not found in global config. AI Messaging Processor client will not be initialized.`
            );
            security.error(
                `AI service failed to initialize: Missing ${modelProvider} ${credentials.missingConfig}`
            );
            return false;
        }

        try {
            const config = getMessageProcessorConfig(modelProvider);
            let initResult = false;

            if (modelProvider === PROVIDERS.GEMINI) {
                initResult = this._initializeGemini(credentials.apiKey, config);
            } else if (modelProvider === PROVIDERS.VERTEX) {
                initResult = this._initializeVertex(config);
            }

            this.initialized = initResult;
            return initResult;
        } catch (error) {
            this._handleInitializationError(modelProvider, error);
            return false;
        }
    }

    /**
     * Get necessary credentials for the specified provider
     * @param {string} modelProvider - The AI provider
     * @returns {Object} - Credentials object with validation status
     * @private
     */
    _getProviderCredentials(modelProvider) {
        if (modelProvider === PROVIDERS.GEMINI) {
            const apiKey = global.messagingAIConfig?.[modelProvider]?.apiKey;
            return {
                apiKey,
                isValid: !!apiKey,
                missingConfig: 'API Key',
            };
        } else if (modelProvider === PROVIDERS.VERTEX) {
            const projectId = process.env.GCP_PROJECT_ID;
            return {
                projectId,
                isValid: !!projectId,
                missingConfig: 'Project ID',
            };
        }
        return { isValid: false, missingConfig: 'Configuration' };
    }

    /**
     * Initialize the Gemini AI client
     * @param {string} apiKey - The Gemini API key
     * @param {Object} config - The model configuration
     * @returns {boolean} - Success status of initialization
     * @private
     */
    _initializeGemini(apiKey, config) {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: config.modelName,
            systemInstruction: config.systemInstruction,
        });

        aiClients.gemini = {
            client: genAI,
            model: model,
            config: config,
        };

        activeModel = {
            provider: PROVIDERS.GEMINI,
            model: model,
            config: config,
        };

        internal.info(`Gemini AI client initialized successfully with model: ${config.modelName}`);
        return true;
    }

    /**
     * Initialize the Vertex AI client
     * @param {Object} config - The model configuration
     * @returns {boolean} - Success status of initialization
     * @private
     */
    _initializeVertex(config) {
        internal.info(
            `Initializing Vertex AI with project: ${config.project}, location: ${config.location}, model: ${config.modelName}`
        );

        if (!config.project) {
            internal.error('Missing Google Cloud project ID for Vertex AI initialization');
            return false;
        }

        try {
            const vertexAI = new VertexAI({
                project: config.project,
                location: config.location,
            });

            const generationConfig = {
                temperature: config.generationConfig.temperature,
                maxOutputTokens: config.generationConfig.maxOutputTokens,
                topP: config.generationConfig.topP,
                topK: config.generationConfig.topK,
            };

            const safetySettings = config.safetySettings.map(setting => ({
                category: setting.category,
                threshold: setting.threshold,
            }));

            const generativeModel = vertexAI.getGenerativeModel({
                model: config.modelName,
                generationConfig: generationConfig,
                safetySettings: safetySettings,
            });

            aiClients.vertex = {
                client: vertexAI,
                model: generativeModel,
                config: config,
            };

            activeModel = {
                provider: PROVIDERS.VERTEX,
                model: generativeModel,
                config: config,
            };

            internal.info(
                `Vertex AI client initialized successfully with model: ${config.modelName} in ${config.location}`
            );
            return true;
        } catch (error) {
            internal.error(`Failed to initialize Vertex AI client`, {
                error: error.message,
                stack: error.stack,
            });
            return false;
        }
    }

    /**
     * Handle initialization errors
     * @param {string} modelProvider - The AI provider
     * @param {Error} error - The error that occurred
     * @private
     */
    _handleInitializationError(modelProvider, error) {
        internal.error(`Failed to initialize ${modelProvider} AI client`, {
            error: error.message,
            stack: error.stack,
            details: error.details || 'No additional details',
            code: error.code || 'No error code',
        });
        security.error(`AI service initialization failed for ${modelProvider}`, {
            error: error.message,
        });

        if (aiClients[modelProvider]) {
            delete aiClients[modelProvider];
        }

        if (activeModel?.provider === modelProvider) {
            activeModel = null;
        }

        this.initialized = false;
    }

    /**
     * Gets the currently active AI model
     * @returns {Object|null} - The active model or null if not initialized
     */
    getActiveModel() {
        return activeModel;
    }

    /**
     * Checks if the AI client is properly initialized
     * @returns {boolean} - Initialization status
     */
    isInitialized() {
        return this.initialized && activeModel !== null;
    }

    /**
     * Switch between available AI providers
     * @param {string} modelProvider - The provider to switch to ('gemini' or 'vertex')
     * @returns {boolean} - Success status of the switch
     */
    switchProvider(modelProvider) {
        if (!Object.values(PROVIDERS).includes(modelProvider)) {
            internal.warn(`Unsupported model provider: ${modelProvider}`);
            return false;
        }

        return this.initialize(modelProvider);
    }

    /**
     * Generate a translation using the active model
     */
    async generateTranslate(message, language) {
        if (!this.isInitialized()) throw new Error('AI client is not initialized');

        const { model, config } = activeModel;
        const promptTemplate = config.promptTemplate.translate;

        try {
            const escapedMessage = message.replace(/"/g, '\\"');
            const prompt = promptTemplate(escapedMessage, language);
            const result = await model.generateContent(prompt.content);
            const candidate = result?.response?.candidates?.[0];
            const aiResponseText = candidate?.content?.parts?.[0]?.text;
            internal.info('Translation generated successfully', {
                originalMessage: message,
                message: aiResponseText,
                language: language,
                response: result,
            });
            return aiResponseText;
        } catch (error) {
            internal.error('Error generating translation', {
                error: error.message,
                stack: error.stack,
                operation: 'translate',
                language: language,
            });
            throw error;
        }
    }

    /**
     * Generate a simplification of the message text
     */
    async generateSimplification(message, language, level) {
        if (!this.isInitialized()) throw new Error('AI client is not initialized');

        const { model, config } = activeModel;
        const promptTemplate = config.promptTemplate.simplify;

        try {
            const escapedMessage = message.replace(/"/g, '\\"');
            const prompt = promptTemplate(escapedMessage, language, level);
            const result = await model.generateContent(prompt.content);
            const candidate = result?.response?.candidates?.[0];
            const aiResponseText = candidate?.content?.parts?.[0]?.text;
            internal.info('Simplification generated successfully', {
                originalMessage: message,
                message: aiResponseText,
                level: level,
                response: result,
            });
            return aiResponseText;
        } catch (error) {
            internal.error('Error generating simplification', {
                error: error.message,
                stack: error.stack,
                operation: 'simplify',
                level: level,
                language: options.language,
            });
            throw error;
        }
    }
}

module.exports = new MessagingProcessorClient();
