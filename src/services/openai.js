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
            description: "A candidate value for the field"
          },
          explanation: {
            type: "string",
            description: "Short explanation of why this value was suggested"
          }
        },
        required: ["value", "explanation"]
      }
    },
    noSuggestionsReason: {
      type: "string",
      description: "Explanation for why no suggestions were found (only if suggestions array is empty)"
    }
  },
  required: ["suggestions"]
};

/**
 * Get AI suggestions for a form field with structured output
 * @param {string} fieldName - The field name
 * @param {string} context - Context about the dataset
 * @param {string} narrativeContent - Optional ontology narrative content to help generate better suggestions
 * @returns {Promise<string>} - Formatted AI response
 */
export const getFieldSuggestions = async (fieldName, context, narrativeContent = '') => {
  try {
     
    let prompt = `You are helping fill out metadata form for a knowledge graph dataset about the YAGO ontology.
    
Field: "${fieldName}"
Dataset Context: "${context}"

This metadata form is specifically for the YAGO ontology, a large semantic knowledge base.

Provide 1 to 3 candidate values for this field, ordered by likelihood of being correct (most likely first).
For each suggestion, provide both the value and a short explanation of why you suggested it based on your knowledge of YAGO and knowledge graph metadata best practices.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { 
          role: "system", 
          content: "Your task is to fill a metadata form for the YAGO ontology knowledge graph. For each suggestion, provide both the value and a brief explanation of why you suggested it based on your knowledge of YAGO and knowledge graph best practices." 
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
      max_tokens: 1000,
      temperature: 0.3
    });

    const result = JSON.parse(response.choices[0].message.content);
    
    console.log('Individual suggestion result:', result);
    
    if (!result.suggestions || result.suggestions.length === 0) {
      return result.noSuggestionsReason || 'No suitable suggestions found for this field.';
    }
    
    const formattedSuggestions = result.suggestions
      .map((suggestion, index) => `• ${suggestion.value}\n  ${suggestion.explanation}`)
      .join('\n\n');
    
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
        type: "object",
        properties: {
          suggestions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                value: {
                  type: "string",
                  description: "A candidate value for the field"
                },
                explanation: {
                  type: "string",
                  description: "Short explanation of why this value was suggested"
                },
                roleData: {
                  type: "object",
                  description: "Special data for roles field only",
                  properties: {
                    roleType: {
                      type: "string",
                      description: "The role type (e.g., publisher, funder, creator)"
                    },
                    mode: {
                      type: "string",
                      enum: ["iri", "name_mbox"],
                      description: "Whether to use IRI or name+email"
                    },
                    iri: {
                      type: "string",
                      description: "IRI when mode is 'iri'"
                    },
                    name: {
                      type: "string", 
                      description: "Name when mode is 'name_mbox'"
                    },
                    email: {
                      type: "string",
                      description: "Email when mode is 'name_mbox'"
                    }
                  },
                  required: ["roleType", "mode"]
                }
              },
              required: ["value", "explanation"]
            }
          },
          noSuggestionsReason: {
            type: "string",
            description: "Explanation for why no suggestions were found (only if suggestions array is empty)"
          }
        },
        required: ["suggestions"]
      }
    }
  },
  required: ["fieldSuggestions"]
};

// Build the prompt for bulk field suggestions
export const buildBulkSuggestionsPrompt = (fieldDefinitions, narrativeContent) => {
  const fieldDescriptions = fieldDefinitions.map(field => 
    `- ${field.name}: ${field.instruction || 'No specific instruction provided'}`
  ).join('\n');

  return `We would like to fill out the following form based on the information in the following narrative file.

Form Fields and Descriptions:
${fieldDescriptions}

Ontology Narrative Description:
${narrativeContent}

Please find all potential answers for each field from the narrative description above.

Important Instructions
Semantic Matching and Inference

Match fields to narrative content semantically, not just by keywords.

Understand both:

What the field requests (its conceptual purpose).

What the narrative conveys (its meaning).

If direct keyword matches fail, infer semantically:

Example: “publisher” might match “released by,” “maintained by.”

Example: “Number of Triples” might match “contains X entities,” “includes Y triples.”

Example: “temporal coverage” might match “spans 2010–2020,” “historical data.”

Consider synonyms, related terms, and implied meanings.

Use domain knowledge of KGs, ontologies, and metadata to infer connections.

Partial Completion

For complex sections (distributions, SPARQL endpoints, example resources, linked resources, roles):

You don’t need to fill all subfields.

Suggest as many as can be confidently inferred.

Partial data is better than none.

Quality over completeness: 2–3 accurate subfields are better than none.

Even one confident inference should be included.

Format Constraints and Validation

IRI/URL fields: Must be valid IRIs for:
homepageURL, otherPages, vocabulariesUsed, primaryReferenceDocument, category, publicationReferences, source, kgSchema, metaGraph, nameSpace.

The following fields don’t require strict IRIs:* iriTemplate, statistics (Number of Triples), restAPI.

IRI Format Rules:

Must use proper schemes (http://, https://, ftp://, etc.)

Convert partial identifiers if possible (e.g., “DBpedia” → “http://dbpedia.org/”
).

If unknown, provide the value as-is.

Date fields: Use ISO 8601 (YYYY-MM-DD). Convert other date formats when needed.

Language codes: Follow BCP-47 format (e.g., “en”, “fr”, “de”). Convert names to codes.

Email fields: Must be valid (name@domain.com
).

Numeric fields: Use numeric strings for byteSize, spatialResolution, triples, etc.

Multi-Value Fields

Fields like vocabulariesUsed, keywords, category, language, etc., may have multiple values.

Split values by commas, semicolons, “and,” or “|”.

Each atomic value should appear as a separate suggestion.

Special Handling

Number of Triples: Split into separate factual statements. Don’t paraphrase.

Roles: Map role expressions (e.g., “funded by,” “published by”) to role types. Extract names and emails when available.

License: Match exact URLs or names from the approved list.

Distributions: Infer from URLs, formats, file sizes, and release info.

SPARQL Endpoint: Identify query-related URLs or descriptions.

Example Resource: Find example entities or sample resources.

Linked Resources: Detect interlinks to other datasets (e.g., DBpedia, Wikidata).

Response Format

Return a JSON object with "fieldSuggestions" for each field.
Each should include either:

A "suggestions" array (each with "value" and "explanation"), or

A "noSuggestionsReason" if none found.

Example:

{
  "fieldSuggestions": {
    "title": {
      "suggestions": [
        {"value": "QuoteKG Dataset", "explanation": "Found in narrative as main dataset name"}
      ]
    },
    "someField": {
      "noSuggestionsReason": "Field name not found in narrative"
    }
  }
}


Ensure all candidate values are listed and, if possible, ordered by likelihood.

`;
};

// Function to get bulk suggestions for all fields at once
export const getBulkFieldSuggestions = async (fieldDefinitions, narrativeContent) => {
  try {
    const prompt = buildBulkSuggestionsPrompt(fieldDefinitions, narrativeContent);

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are an expert in knowledge graph metadata and data cataloging. You are also an expert in semantic understanding of text and in generating structured data from unstructured text.  Your task is to extract information from the provided ontology narrative description to fill out metadata form fields. For each suggestion, provide both the value and a brief explanation of where you found it in the narrative." },
        { role: "user", content: prompt }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "bulk_field_suggestions",
          schema: bulkSuggestionSchema
        }
      },
      max_tokens: 16000,
      temperature: 0.2
    });

    const rawContent = response.choices[0].message.content;
    const finishReason = response.choices[0].finish_reason;
    console.log('Raw AI response:', rawContent);
    console.log('Raw AI response length:', rawContent.length);
    console.log('Finish reason:', finishReason);
    
    if (finishReason === 'length') {
      console.warn('⚠️ WARNING: OpenAI response was truncated due to max_tokens limit!');
      console.warn('Some field suggestions may be missing. Consider increasing max_tokens or reducing field count.');
    }
    
    try {
      const result = JSON.parse(rawContent);
      console.log('Bulk suggestion result:', result);
      console.log('Number of fields in parsed result:', result.fieldSuggestions ? Object.keys(result.fieldSuggestions).length : 0);
      return result;
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Raw content that failed to parse:', rawContent);
      
      // Return a fallback structure
      return {
        fieldSuggestions: {
          error: {
            noSuggestionsReason: "AI response was not valid JSON. Please try again."
          }
        }
      };
    }
  } catch (error) {
    console.error('Error getting bulk field suggestions:', error);
    throw error;
  }
};

// Function to get bulk suggestions with a custom edited prompt
export const getBulkFieldSuggestionsWithCustomPrompt = async (customPrompt) => {
  try {
    console.log('Using custom prompt for bulk suggestions');

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are an expert in knowledge graph metadata and data cataloging. You are also an expert in semantic understanding of text and in generating structured data from unstructured text. Your task is to extract information from the provided ontology narrative description to fill out metadata form fields. For each suggestion, provide both the value and a brief explanation of where you found it in the narrative." },
        { role: "user", content: customPrompt }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "bulk_field_suggestions",
          schema: bulkSuggestionSchema
        }
      },
      max_tokens: 16000,
      temperature: 0.2
    });

    const rawContent = response.choices[0].message.content;
    const finishReason = response.choices[0].finish_reason;
    console.log('Raw AI response:', rawContent);
    console.log('Raw AI response length:', rawContent.length);
    console.log('Finish reason:', finishReason);
    
    if (finishReason === 'length') {
      console.warn('⚠️ WARNING: OpenAI response was truncated due to max_tokens limit!');
      console.warn('Some field suggestions may be missing. Consider increasing max_tokens or reducing field count.');
    }
    
    try {
      const result = JSON.parse(rawContent);
      console.log('Bulk suggestion result with custom prompt:', result);
      console.log('Number of fields in parsed result:', result.fieldSuggestions ? Object.keys(result.fieldSuggestions).length : 0);
      return result;
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Raw content that failed to parse:', rawContent);
      
      // Return a fallback structure
      return {
        fieldSuggestions: {
          error: {
            noSuggestionsReason: "AI response was not valid JSON. Please try again."
          }
        }
      };
    }
  } catch (error) {
    console.error('Error getting bulk field suggestions with custom prompt:', error);
    throw error;
  }
};
