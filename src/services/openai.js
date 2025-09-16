// src/services/openai.js - OpenAI library integration with structured outputs
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.REACT_APP_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Required for browser usage
});

// Define structured output schema for field suggestions
const suggestionSchema = {
  type: "object",
  properties: {
    suggestions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          value: {
            type: "string",
            description: "The suggested value for the field"
          },
          explanation: {
            type: "string",
            description: "Brief explanation of why this suggestion is appropriate"
          },
          confidence: {
            type: "string",
            enum: ["high", "medium", "low"],
            description: "Confidence level for this suggestion"
          }
        },
        required: ["value", "explanation", "confidence"]
      },
      minItems: 1,
      maxItems: 5
    },
    fieldType: {
      type: "string",
      description: "Type of field being suggested for"
    }
  },
  required: ["suggestions", "fieldType"]
};

/**
 * Get AI suggestions for a form field with structured output
 * @param {string} fieldName - The field name
 * @param {string} context - Context about the dataset
 * @param {string} cheatSheetContent - Optional cheat sheet content to help generate better suggestions
 * @returns {Promise<string>} - Formatted AI response
 */
export const getFieldSuggestions = async (fieldName, context, cheatSheetContent = '') => {
  try {
    // Debug: Check if API key is available
    const apiKey = process.env.REACT_APP_OPENAI_API_KEY;
    console.log('API Key available:', !!apiKey);
    console.log('API Key starts with:', apiKey ? apiKey.substring(0, 10) + '...' : 'undefined');
    
    let prompt = `You are helping fill out metadata for a knowledge graph dataset. 
    
Field: "${fieldName}"
Dataset Context: "${context}"

${cheatSheetContent ? `
Reference Information (Cheat Sheet):
${cheatSheetContent}

Use the above reference information to provide more accurate and relevant suggestions.
` : ''}

Provide 1-5 appropriate suggestions for this field, ordered by likelihood of being correct (most likely first). Consider:
- The field name and its likely purpose in metadata
- The dataset context provided
- Best practices for knowledge graph metadata
${cheatSheetContent ? '- The reference information provided in the cheat sheet' : ''}
- Be specific and actionable

For each suggestion, provide:
1. The actual value/content
2. A brief explanation of why it's appropriate
3. A confidence level (high/medium/low)`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { 
          role: "system", 
          content: "You are an expert in knowledge graph metadata and data cataloging. Provide structured, helpful suggestions for metadata fields." 
        },
        { role: "user", content: prompt }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "field_suggestions",
          schema: suggestionSchema
        }
      },
      max_tokens: 300,
      temperature: 0.7
    });

    const result = JSON.parse(response.choices[0].message.content);
    
    // Format the structured response for display as bullet points
    const formattedSuggestions = result.suggestions
      .sort((a, b) => {
        // Sort by confidence: high > medium > low
        const confidenceOrder = { high: 3, medium: 2, low: 1 };
        return confidenceOrder[b.confidence] - confidenceOrder[a.confidence];
      })
      .map((suggestion, index) => 
        `• ${suggestion.value}\n  ${suggestion.explanation} (${suggestion.confidence} confidence)`
      ).join('\n\n');

    return formattedSuggestions;

  } catch (error) {
    console.error('Detailed error getting field suggestions:', {
      message: error.message,
      status: error.status,
      type: error.type,
      code: error.code
    });
    
    // Fallback to simple suggestion if structured output fails
    try {
      const fallbackResponse = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "user", content: `Help me fill out the "${fieldName}" field for a dataset. Context: ${context}. Provide a brief suggestion.` }
        ],
        max_tokens: 200,
        temperature: 0.7
      });
      
      return fallbackResponse.choices[0].message.content.trim();
    } catch (fallbackError) {
      console.error('Fallback request also failed:', fallbackError);
      throw error;
    }
  }
};

// Define schema for bulk field suggestions
const bulkSuggestionSchema = {
  type: "object",
  properties: {
    fieldSuggestions: {
      type: "object",
      additionalProperties: {
        type: "array",
        items: {
          type: "object",
          properties: {
            value: {
              type: "string",
              description: "The suggested value for the field"
            },
            explanation: {
              type: "string", 
              description: "Brief explanation of why this suggestion is appropriate"
            },
            confidence: {
              type: "string",
              enum: ["high", "medium", "low"],
              description: "Confidence level for this suggestion"
            }
          },
          required: ["value", "explanation", "confidence"]
        }
      }
    }
  },
  required: ["fieldSuggestions"]
};

// Function to get bulk suggestions for all fields at once
export const getBulkFieldSuggestions = async (fieldDefinitions, cheatSheetContent) => {
  try {
    const fieldDescriptions = fieldDefinitions.map(field => 
      `- ${field.name}: ${field.instruction || 'No specific instruction provided'}`
    ).join('\n');

    const prompt = `You are helping fill out metadata for a knowledge graph dataset using the provided cheat sheet content.

Field Definitions:
${fieldDescriptions}

Reference Information (Cheat Sheet):
${cheatSheetContent}

Based on the cheat sheet content, provide 1-3 appropriate suggestions for each field, ordered by likelihood of being correct (most likely first). For each suggestion, provide:
1. The actual value/content
2. A brief explanation of why it's appropriate based on the cheat sheet
3. A confidence level (high/medium/low)

Consider:
- The field name and its likely purpose in metadata
- The specific content and context from the cheat sheet
- Best practices for knowledge graph metadata
- Be specific and actionable based on the cheat sheet content`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are an expert in knowledge graph metadata and data cataloging. Analyze the provided cheat sheet content and provide structured, helpful suggestions for each metadata field based on that content." },
        { role: "user", content: prompt }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "bulk_field_suggestions",
          schema: bulkSuggestionSchema
        }
      },
      max_tokens: 2000,
      temperature: 0.7
    });

    const result = JSON.parse(response.choices[0].message.content);
    
    // Format suggestions for each field
    const formattedSuggestions = {};
    Object.entries(result.fieldSuggestions).forEach(([fieldName, suggestions]) => {
      formattedSuggestions[fieldName] = suggestions
        .sort((a, b) => {
          const confidenceOrder = { high: 3, medium: 2, low: 1 };
          return confidenceOrder[b.confidence] - confidenceOrder[a.confidence];
        })
        .map((suggestion, index) => 
          `• ${suggestion.value}\n  ${suggestion.explanation} (${suggestion.confidence} confidence)`
        ).join('\n\n');
    });

    return formattedSuggestions;
  } catch (error) {
    console.error('Error getting bulk field suggestions:', error);
    throw error;
  }
};

export { getBulkFieldSuggestions };
