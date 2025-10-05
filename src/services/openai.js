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
 * @param {string} cheatSheetContent - Optional cheat sheet content to help generate better suggestions
 * @returns {Promise<string>} - Formatted AI response
 */
export const getFieldSuggestions = async (fieldName, context, cheatSheetContent = '') => {
  try {
     
    let prompt = `You are helping fill out metadata form based on a provided cheat sheet.
    
Field: "${fieldName}"
Dataset Context: "${context}"

${cheatSheetContent ? `Reference Information (Cheat Sheet):
${cheatSheetContent}

Use the above reference information to provide more accurate and relevant suggestions.
` : ''}

Provide 1 to 3 candidate values for this field, ordered by likelihood of being correct (most likely first).
For each suggestion, provide both the value and a short explanation of why you suggested it.

If you cannot find good candidates, provide a "noSuggestionsReason" explaining why:
- Does the field name not appear in the cheat sheet?
- Does the field name appear but without a valid value?
- Is the cheat sheet data unclear or incomplete for this field?

Consider:
- the cheat sheet provided is a spreadsheet of 3 columns
- The field names are in the first column in cheatsheet  
- The values (answers to be filled in) are in the third column in cheatsheet`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { 
          role: "system", 
          content: "Your task is to fill a metadata form based on cheat sheet data. For each suggestion, provide both the value and a brief explanation of why you suggested it based on the cheat sheet content." 
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
      temperature: 0.7
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

// Function to get bulk suggestions for all fields at once
export const getBulkFieldSuggestions = async (fieldDefinitions, cheatSheetContent) => {
  try {
    const fieldDescriptions = fieldDefinitions.map(field => 
      `- ${field.name}: ${field.instruction || 'No specific instruction provided'}`
    ).join('\n');

    const prompt = `You are helping fill out metadata for a knowledge graph dataset. The cheat sheet provided below contains ALL the information you need to generate accurate suggestions.

Field Definitions:
${fieldDescriptions}

CRITICAL REFERENCE INFORMATION (Cheat Sheet):
${cheatSheetContent}

IMPORTANT INSTRUCTIONS:
- The cheat sheet above is your PRIMARY and MOST IMPORTANT source of information
- Extract specific values, names, URLs, dates, and details DIRECTLY from the cheat sheet content
- Do NOT use generic or placeholder suggestions - use ACTUAL data from the cheat sheet
- For each field, scan the cheat sheet thoroughly to find relevant information
- If the cheat sheet mentions specific datasets, organizations, people, URLs, or technical details, use those exact values
- Prioritize information that appears explicitly in the cheat sheet over general knowledge
- SPECIAL CASE: If a field contains "NS" (not supplied), return empty suggestions with explanation that the field exists but has no value provided

FIELD NAME MATCHING:
- Field names in the form may NOT match exactly with names in the cheat sheet
- Look for variations in capitalization, spacing, and slightly different wording or phrasing.

SPECIAL HANDLING FOR ROLES FIELD:
- Look for role-related fields in cheat sheet and map them to these role types: resourceProvider, custodian, owner, user, distributor, originator, pointOfContact, principalInvestigator, processor, publisher, author, sponsor, coAuthor, collaborator, editor, mediator, rightsHolder, contributor, funder, stakeholder
- Common mappings:
  * "publishedBy", "publisher", "published by" → "publisher"
  * "fundedBy", "funder", "funded by", "funding" → "funder" 
  * "createdBy", "creator", "created by", "author" → "author"
  * "maintainedBy", "maintainer" → "custodian"
  * "ownedBy", "owner" → "owner"
- IMPORTANT: Create separate suggestions for EACH role type found, even if multiple roles exist
- Handle comma-separated values: if you find "Published by: Org A, Org B, Org C", create separate roleData for each
- EMAIL HANDLING: The "mbox" field refers to email addresses
  * If you find an email address (e.g., "contact@example.org", "john.doe@university.edu"), put it in the "email" field of roleData
  * Use the email address exactly as found in the cheat sheet - do NOT add any prefix
  * Look for email patterns in the cheat sheet: text containing "@" followed by a domain
  * Common field names for emails: "email", "e-mail", "contact", "mbox"
- For roles field, return multiple suggestions with roleData:
  {
    "suggestions": [
      {
        "value": "publisher: XYZ Organization (contact@xyz.org)",
        "explanation": "Found 'published by XYZ Organization' with email in cheat sheet",
        "roleData": {
          "roleType": "publisher",
          "mode": "name_mbox",
          "name": "XYZ Organization",
          "email": "contact@xyz.org"
        }
      },
      {
        "value": "funder: ABC Foundation", 
        "explanation": "Found 'funded by ABC Foundation' in cheat sheet",
        "roleData": {
          "roleType": "funder",
          "mode": "name_mbox", 
          "name": "ABC Foundation"
        }
      }
    ]
  }
- Extract actual names/organizations from the cheat sheet, don't use generic placeholders
- Use "name_mbox" mode when you have name and/or email; use "iri" mode only if you find a clear IRI/URL for the entity
- If multiple entities for same role type, create separate roleData entries for each (don't combine them)

SPECIAL HANDLING FOR LICENSE FIELD:
- For license field, the available options will be provided in the field instruction
- Match license names (MIT, Apache, GPL, BSD, Creative Commons, etc.) to the corresponding URLs
- If the cheat sheet contains a license URL directly, extract and match it exactly to one of the available options
- Look for URLs in the cheat sheet content even if surrounded by other text (e.g., "Licensed under https://opensource.org/licenses/MIT for open use")
- Return only URLs that exactly match the available dropdown options

SPECIAL HANDLING FOR DISTRIBUTIONS FIELD:
- Distributions are complex subsections with multiple subfields (title, description, mediaType, downloadURL, accessURL, etc.)
- Look for distribution-related data in the cheat sheet under names like: "distributions", "download", "access", "files", "downloadURL", "accessURL"
- Extract ALL distribution-related information you find and format as JSON-like structure
- Example: If you find downloadURL and accessURL, suggest: {"title": "YAGO files", "downloadURL": "http://yago-knowledge.org", "accessURL": "http://yago-knowledge.org"}
- Return the full distribution object as the "value" field in your suggestion
- Provide multiple suggestions if multiple distributions are found

SPECIAL HANDLING FOR SPARQL ENDPOINT FIELD:
- SPARQL endpoints are complex subsections with subfields (endpointURL, identifier, title, endpointDescription, status)
- Look for SPARQL-related data under names like: "sparql endpoint", "sparql", "query endpoint", "sparqlEndpoint", "endpoint"
- Extract ALL SPARQL endpoint information and format as JSON-like structure
- Example: If you find endpoint URL and description, suggest: {"endpointURL": "https://query.Yago.org/sparql", "title": "Yago Query Service", "endpointDescription": "The Wikidata Query Service"}
- Return the full SPARQL endpoint object as the "value" field in your suggestion
- Provide multiple suggestions if multiple endpoints are found

SPECIAL HANDLING FOR EXAMPLE RESOURCE FIELD:
- Example resources are complex subsections with subfields (title, description, status, accessURL)
- Look for example resource data under names like: "example resource", "example", "sample resource", "sample", "exampleResource"
- Extract ALL example resource information and format as JSON-like structure
- Example: If you find title and accessURL, suggest: {"title": "Sample Entity", "description": "Example of a resource", "accessURL": "http://example.org/resource"}
- Return the full example resource object as the "value" field in your suggestion
- Provide multiple suggestions if multiple example resources are found

SPECIAL HANDLING FOR LINKED RESOURCES FIELD:
- Linked resources are complex subsections with subfields (target, triples)
- Look for linked resource data under names like: "linked resources", "linkset", "links", "linkedResources", "void:linkset"
- Extract ALL linked resource information and format as JSON-like structure
- Example: If you find target and triples, suggest: {"target": "http://dbpedia.org", "triples": "1000000"}
- Return the full linked resource object as the "value" field in your suggestion
- Provide multiple suggestions if multiple linked resources are found

RESPONSE FORMAT:
You must return a JSON object with "fieldSuggestions" containing each field. For each field, provide either:
1. An object with "suggestions" array (each item has "value" and "explanation")
2. An object with "noSuggestionsReason" string if no suggestions found. In the case of no suggestions, provide a short explanation of why (e.g. "Field name from form has no match, even fuzzy matching failed")

Example:
{
  "fieldSuggestions": {
    "title": {
      "suggestions": [
        {"value": "QuoteKG Dataset", "explanation": "Found in cheat sheet as main dataset name"}
      ]
    },
    "someField": {
      "noSuggestionsReason": "Field name does not appear in the cheat sheet"
    }
  }
}

Provide 1-4 candidate values for each field, ordered by likelihood of being correct.

HANDLING "NS" VALUES:
- If you find a field in the cheat sheet but its value is "NS" (not supplied), return:
  {
    "noSuggestionsReason": "Field found in cheat sheet but marked as 'NS' (not supplied) - no value provided"
  }`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are an expert in knowledge graph metadata and data cataloging. Your PRIMARY task is to extract specific information from the provided cheat sheet content. NEVER use generic suggestions - only use actual data found in the cheat sheet. Use semantic matching to find relevant data even when field names don't match exactly - look for variations in capitalization, spacing, and wording. IMPORTANT: If a field value is 'NS' (not supplied), return empty suggestions with explanation that the field exists but no value is provided. For each suggestion, provide both the value and a brief explanation of why you suggested it based on the cheat sheet content." },
        { role: "user", content: prompt }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "bulk_field_suggestions",
          schema: bulkSuggestionSchema
        }
      },
      max_tokens: 4000,
      temperature: 0.2
    });

    const rawContent = response.choices[0].message.content;
    console.log('Raw AI response:', rawContent);
    
    try {
      const result = JSON.parse(rawContent);
      console.log('Bulk suggestion result:', result);
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
