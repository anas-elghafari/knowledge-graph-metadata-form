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
          }
        },
        required: ["value", "explanation"]
      },
      minItems: 1,
      maxItems: 3
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
 * @returns {Promise<string>} - Formatted AI response
 */
export const getFieldSuggestions = async (fieldName, context) => {
  try {
    // Debug: Check if API key is available
    const apiKey = process.env.REACT_APP_OPENAI_API_KEY;
    console.log('API Key available:', !!apiKey);
    console.log('API Key starts with:', apiKey ? apiKey.substring(0, 10) + '...' : 'undefined');
    
    const prompt = `You are helping fill out metadata for a knowledge graph dataset. 
    
Field: "${fieldName}"
Dataset Context: "${context}"

Provide 1-3 appropriate suggestions for this field. Consider:
- The field name and its likely purpose in metadata
- The dataset context provided
- Best practices for knowledge graph metadata
- Be specific and actionable`;

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
    
    // Format the structured response for display
    const formattedSuggestions = result.suggestions.map((suggestion, index) => 
      `${index + 1}. ${suggestion.value}\n   ${suggestion.explanation}`
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

export default { getFieldSuggestions };
