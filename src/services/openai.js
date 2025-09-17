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
        type: "string",
        description: "A candidate value for the field"
      }
    }
  },
  required: ["suggestions"]
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

${cheatSheetContent ? `Reference Information (Cheat Sheet):
${cheatSheetContent}

Use the above reference information to provide more accurate and relevant suggestions.
` : ''}

Provide 1-5 candidate values for this field, ordered by likelihood of being correct (most likely first). Return only the actual values that could be entered into the field - no explanations, no descriptions, just the values themselves.

If you cannot find good candidates or do not understand the field/question, return an empty list.

Consider:
- The field name and its likely purpose in metadata
- The dataset context provided
- Best practices for knowledge graph metadata
${cheatSheetContent ? '- The reference information provided in the cheat sheet' : ''}
- Be specific and actionable`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { 
          role: "system", 
          content: "You are an expert in knowledge graph metadata and data cataloging. Provide only candidate values that can be directly entered into form fields - no explanations or descriptions." 
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
    
    if (!result.suggestions || result.suggestions.length === 0) {
      return 'No suitable suggestions found for this field.';
    }
    
    const formattedSuggestions = result.suggestions
      .map((suggestion, index) => `• ${suggestion}`)
      .join('\n');
    
    return `Ranked by confidence (most likely first):\n\n${formattedSuggestions}`;

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
          type: "string",
          description: "A candidate value for the field"
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

Based on the cheat sheet content, provide 1-3 candidate values for each field, ordered by likelihood of being correct (most likely first). Return only the actual values that could be entered into each field - no explanations, no descriptions, just the values themselves.

If you cannot find good candidates for a field or do not understand the field/question, return an empty list for that field.

Consider:
- The field name and its likely purpose in metadata
- The specific content and context from the cheat sheet
- Best practices for knowledge graph metadata
- Be specific and actionable based on the cheat sheet content`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are an expert in knowledge graph metadata and data cataloging. Provide only candidate values that can be directly entered into form fields - no explanations or descriptions." },
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
      if (!suggestions || suggestions.length === 0) {
        formattedSuggestions[fieldName] = 'No suitable suggestions found for this field.';
      } else {
        const suggestionList = suggestions
          .map((suggestion, index) => `• ${suggestion}`)
          .join('\n');
        formattedSuggestions[fieldName] = `Ranked by confidence (most likely first):\n\n${suggestionList}`;
      }
    });

    return formattedSuggestions;
  } catch (error) {
    console.error('Error getting bulk field suggestions:', error);
    throw error;
  }
};
