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

IMPORTANT INSTRUCTIONS:

SEMANTIC MATCHING AND INFERENCE:
- Matching fields to narrative content should happen at a SEMANTIC LEVEL, not just surface-level keyword matching
- Think deeply about the MEANING of both:
  1. What the field is asking for (its conceptual purpose)
  2. What information the narrative text is conveying (its semantic content)
- If direct keyword matching fails, use semantic reasoning to find relevant information:
  * Example: A field asking for "publisher" might match narrative text about "released by", "made available by", "maintained by"
  * Example: A field asking for "statistics" might match phrases about "contains X entities", "includes Y triples", "covers Z domains"
  * Example: A field asking for "temporal coverage" might match text about "spans from 2010 to 2020", "historical data", "time period"
- Consider synonyms, related concepts, and implied meanings
- Use domain knowledge about knowledge graphs, ontologies, and metadata to make intelligent connections

PARTIAL COMPLETION IS ACCEPTABLE:
- For complex sections with many subfields (distributions, SPARQL endpoints, example resources, linked resources, roles):
  * You do NOT need to find values for ALL subfields
  * Provide suggestions for AS MANY subfields as you can reasonably extract from the narrative
  * It is perfectly acceptable to suggest a distribution with only title and downloadURL if other fields are not mentioned
  * It is acceptable to suggest a role with only roleType and givenName if an agent IRI is not available
  * LOOSEN your criteria as needed - partial information is better than no suggestion
- Quality over completeness: A suggestion with 2-3 accurate subfields is more valuable than no suggestion at all
- If you can infer even ONE relevant subfield value with confidence, create a suggestion for that section

FORMAT CONSTRAINTS AND VALIDATION REQUIREMENTS:
- Many fields have specific format requirements that MUST be respected
- IRI/URL FIELDS: The following fields require valid IRI (Internationalized Resource Identifier) values:
  * homepageURL, otherPages, vocabulariesUsed, primaryReferenceDocument, category, publicationReferences, source, kgSchema, metaGraph, nameSpace
  * NOTE: The following fields do NOT require IRI validation:
    - iriTemplate: contains patterns/variables (e.g., "http://example.org/{id}")
    - statistics: can be text descriptions (e.g., "900,000 entities", "5 million facts")
    - restAPI: can be endpoint descriptions or non-URI identifiers
  * Distribution subfields: downloadURL, accessURL, accessService, hasPolicy, license (when not from dropdown)
  * SPARQL endpoint: endpointURL
  * Example resource: accessURL
  * Role: agent (when using Agent IRI mode)
- IRI FORMAT RULES:
  * IRIs must be complete, valid URLs with proper scheme (http://, https://, ftp://, etc.)
  * If you find a partial identifier or name that should be an IRI, try to construct a valid IRI if you know the proper format
  * Examples of converting to IRIs:
    - "DBpedia" → "http://dbpedia.org" or "http://dbpedia.org/resource/"
    - "schema.org" → "http://schema.org/" or "https://schema.org/"
    - "YAGO" → "http://yago-knowledge.org" or the full resource URI if known
  * If the narrative provides a domain/base URI, use it to construct full IRIs for entities
  * If you cannot determine a valid IRI format, provide the value as-is (the user can fix it later)
  * CRITICAL: Hierarchical URI schemes (http, https, ftp, ftps, sftp, file, ws, wss, git, ssh) MUST use :// format (not just :/)

- DATE FIELDS: Dates must be formatted as YYYY-MM-DD (ISO 8601 format):
  * createdDate, publishedDate, modifiedDate (array of dates)
  * Distribution subfields: releaseDate, modificationDate, issued
  * Examples: "2023-05-15", "2022-01-01", "2024-12-31"
  * If you find dates in other formats (e.g., "May 15, 2023", "15/05/2023"), convert them to YYYY-MM-DD
  * If only year is provided (e.g., "2023"), use "2023-01-01" or indicate year-only format appropriately
  * If only month and year (e.g., "May 2023"), use "2023-05-01"

- LANGUAGE CODES: Language field values MUST follow BCP-47 (IETF language tag) format:
  * Use lowercase 2-letter ISO 639-1 codes: "en", "fr", "de", "es", "it", "ja", "zh", "ar", "ru", "pt"
  * Convert language names to codes: "English" → "en", "French" → "fr", "German" → "de", "Spanish" → "es"
  * Regional variants: "en-US", "en-GB", "zh-CN", "zh-TW", "pt-BR", "pt-PT"
  * If you find language names in the narrative, always convert them to BCP-47 codes

- EMAIL ADDRESSES: Email fields must be valid email format (name@domain.com)
  * Role subfield: email (when using Name + Email mode)

- NUMERIC FIELDS: Some fields expect numeric values:
  * byteSize - file size in bytes (numeric string, e.g., "3200000000" for 3.2 GB)
  * spatialResolution - value in meters (numeric)
  * triples - number of RDF triples (numeric string)

PRIORITY OF FORMAT ADHERENCE:
1. ALWAYS try to provide values in the correct format first
2. If you can infer or construct the correct format, do so
3. Only as a last resort, provide the value in its original format with a note in the explanation that it may need formatting

MULTI-VALUE FIELDS HANDLING:
- The following fields accept multiple values: vocabulariesUsed, keywords, category, language, otherPages, statistics, source, alternativeTitle, acronym, homepageURL, modifiedDate, primaryReferenceDocument, metaGraph, kgSchema, restAPI, exampleQueries, publicationReferences, iriTemplate, nameSpace
- If the narrative contains multiple values for these fields, you MUST split them into separate suggestions
- Split on ANY of these delimiters: commas (,), semicolons (;), the word "and", pipe symbols (|), or line breaks
- Each atomic value should be a separate suggestion
- IMPORTANT: For multi-value fields, provide ALL relevant values as a LIST of separate suggestions so users can select and add them all at once
- Examples:
  * "English, French, German" → 3 separate suggestions: ["en", "fr", "de"] (for language field, use BCP-47 codes)
  * "keyword1; keyword2 and keyword3" → 3 separate suggestions: ["keyword1", "keyword2", "keyword3"]
  * "http://vocab1.org | http://vocab2.org" → 2 separate suggestions
- Trim whitespace from each value
- Return each atomic value as a separate item in the suggestions array
- The UI will display an "Add All" button for multi-value fields so users can populate all values in one click

SPECIAL HANDLING FOR STATISTICS FIELD:
- The statistics field requires SEMANTIC SPLITTING - each distinct fact or piece of information should be a separate suggestion
- Split based on MEANING, not just delimiters - identify individual statistical facts
- Remove conjunction words like "and", "also", but preserve the complete fact text
- IMPORTANT: Statistics can be text descriptions OR IRIs - both are valid
  * Text descriptions: "900,000 entities", "5 million facts", "subClassOf: 126792 facts"
  * IRIs: "http://stats.example.org/classCount" (if provided in narrative)
- Examples:
  * "subClassOf: 126792 facts, type: 2011072 facts, context: 40000000 facts" → 3 suggestions: ["subClassOf: 126792 facts", "type: 2011072 facts", "context: 40000000 facts"]
  * "describes: 997061 facts, bornInYear: 189950 facts, diedInYear: 93827 facts" → 3 suggestions: ["describes: 997061 facts", "bornInYear: 189950 facts", "diedInYear: 93827 facts"]
  * "The dataset contains 900,000 entities and 5 million facts" → 2 suggestions: ["900,000 entities", "5 million facts"]
- Each suggestion should be a complete, standalone statistical statement
- Do NOT rewrite or paraphrase - use the exact text from the narrative, only removing conjunctions
- Do NOT try to force text descriptions into IRI format

SPECIAL HANDLING FOR ROLES FIELD:
- Look for role-related fields in narrative and map them to these role types: resourceProvider, custodian, owner, user, distributor, originator, pointOfContact, principalInvestigator, processor, publisher, author, sponsor, coAuthor, collaborator, editor, mediator, rightsHolder, contributor, funder, stakeholder
- Common mappings:
  * "publishedBy", "publisher", "published by" → "publisher"
  * "fundedBy", "funder", "funded by", "funding" → "funder" 
  * "createdBy", "creator", "created by", "author" → "author"
  * "maintainedBy", "maintainer" → "custodian"
  * "ownedBy", "owner" → "owner"
- IMPORTANT: Create separate suggestions for EACH role type found, even if multiple roles exist
- If you find multiple entities for the same role (e.g., "Published by: Org A, Org B, Org C"), create separate roleData for EACH entity
- Split on commas, semicolons, "and", or other delimiters to identify individual entities
- EMAIL HANDLING: The "email" field refers to email addresses
  * If you find an email address (e.g., "contact@example.org", "john.doe@university.edu"), put it in the "email" field of roleData
- For roles field, return multiple suggestions with roleData:
  {
    "suggestions": [
      {
        "value": "publisher: XYZ Organization (contact@xyz.org)",
        "explanation": "Found 'published by XYZ Organization' with email in narrative",
        "roleData": {
          "roleType": "publisher",
          "mode": "name_mbox",
          "name": "XYZ Organization",
          "email": "contact@xyz.org"
        }
      },
      {
        "value": "funder: ABC Foundation", 
        "explanation": "Found 'funded by ABC Foundation' in narrative",
        "roleData": {
          "roleType": "funder",
          "mode": "name_mbox", 
          "name": "ABC Foundation"
        }
      }
    ]
  }
- Extract actual names/organizations from the narrative, don't use generic placeholders
- Use "name_mbox" mode when you have name and/or email; use "iri" mode only if you find a clear IRI/URL for the entity
- If multiple entities for same role type, create separate roleData entries for each (don't combine them)

SPECIAL HANDLING FOR LICENSE FIELD:
- For license field, the available options will be provided in the field instruction
- Match license names (MIT, Apache, GPL, BSD, Creative Commons, etc.) to the corresponding URLs
- If the narrative contains a license URL directly, extract and match it exactly to one of the available options
- Look for URLs in the narrative content even if surrounded by other text (e.g., "Licensed under https://opensource.org/licenses/MIT for open use")
- Return only URLs that exactly match the available dropdown options

SPECIAL HANDLING FOR DISTRIBUTIONS FIELD:
- Distributions are complex subsections with multiple subfields (title, description, mediaType, downloadURL, accessURL, byteSize, license, rights, spatialResolution, temporalResolution, releaseDate, modificationDate, issued, accessService, compressionFormat, packagingFormat, hasPolicy)
- CRITICAL: The "value" field MUST be a valid JSON string containing the distribution object
- IMPORTANT: Escape quotes in the JSON string properly

SEMANTIC INFERENCE FOR DISTRIBUTIONS:
- Distribution information may NOT be explicitly labeled - you must INFER it from context
- Think semantically about what each field means and match narrative content accordingly:
  * "title" - Any mention of file names, dataset versions, download packages, or distribution names
  * "description" - Text describing what the distribution contains, how to access it, or what format it's in
  * "downloadURL" - Any URL for downloading files, data dumps, or accessing downloadable content (look for: "download", "get", "fetch", "files available at")
  * "accessURL" - Any URL for accessing the dataset, web interfaces, landing pages, or information pages (look for: "access", "visit", "available at", "hosted at", "home page")
  * "mediaType" - File formats, MIME types, or data formats mentioned (e.g., "RDF", "Turtle", "N-Triples", "JSON", "CSV", "XML", "TSV", "application/ld+json", "text/turtle")
  * "license" - Any licensing information (MIT, Apache, CC-BY, etc.)
  * "byteSize" - File sizes mentioned anywhere (e.g., "3.2 GB", "450 MB", "2.1 TB")
  * "spatialResolution" - Geographic or spatial precision mentioned (in meters)
  * "temporalResolution" - Time-based precision or update frequency (e.g., "daily", "monthly", "yearly")
  * "releaseDate", "modificationDate", "issued" - Any dates associated with releases, updates, or publications

INFERENCE STRATEGIES:
- If the narrative mentions URLs, web pages, or online resources → likely downloadURL or accessURL
- If file formats or data formats are mentioned → use as mediaType and create a distribution around it
- If the narrative describes "where to get the data" → create a distribution with that information
- If dates are mentioned in relation to data releases → use as releaseDate or issued
- If file sizes are mentioned → use as byteSize
- Even if only partial information is available, create a distribution suggestion with the fields you can infer
- Look for implicit distribution info like: "The dataset is available in RDF format", "Data can be downloaded from...", "Access the knowledge graph at...", "Files are hosted at..."

EXAMPLE INFERENCES:
- "YAGO is available at http://yago-knowledge.org" → {"accessURL": "http://yago-knowledge.org", "title": "YAGO Dataset", "description": "Access point for YAGO dataset"}
- "Download the Turtle files from ftp://example.org/data" → {"downloadURL": "ftp://example.org/data", "mediaType": "text/turtle", "title": "Turtle Format Download"}
- "The RDF dump is 3.2 GB" → {"mediaType": "application/rdf+xml", "byteSize": "3200000000", "description": "RDF dump"}
- "Data is provided under CC-BY 4.0 license" → {"license": "https://creativecommons.org/licenses/by/4.0/"}

- Example format for the value field:
  {
    "value": "{\"title\": \"YAGO files\", \"description\": \"YAGO download page\", \"mediaType\": \"link\", \"downloadURL\": \"http://yago-knowledge.org\", \"accessURL\": \"http://yago-knowledge.org\"}",
    "explanation": "Found distribution data in narrative"
  }
- Include ALL fields you can extract or infer from the narrative (title, description, mediaType, downloadURL, accessURL, byteSize, etc.)
- Provide multiple suggestions if multiple distributions are found or can be inferred from the narrative

SPECIAL HANDLING FOR SPARQL ENDPOINT FIELD:
- SPARQL endpoints are complex subsections with subfields (endpointURL, identifier, title, endpointDescription, status)
- CRITICAL: The "value" field MUST be a valid JSON string containing the endpoint object
- SEMANTIC INFERENCE: Look for any mention of SPARQL, query services, query endpoints, or interactive query interfaces
  * "endpointURL" - Any URL mentioning "sparql", "query", or providing a query interface
  * "title" - Name of the query service (e.g., "YAGO Query Service", "Dataset SPARQL Endpoint")
  * "endpointDescription" - Any text describing the query capabilities or how to use the endpoint
  * "status" - If mentioned, whether the endpoint is active, stable, beta, etc.
- INFER from phrases like: "query the data at...", "SPARQL endpoint available at...", "interactive queries via...", "query interface: ..."
- Example format:
  {
    "value": "{\"endpointURL\": \"https://query.yago.org/sparql\", \"title\": \"Yago Query Service\", \"endpointDescription\": \"SPARQL endpoint for querying YAGO knowledge graph\"}",
    "explanation": "Inferred SPARQL endpoint from narrative"
  }
- Include ALL fields you can extract or infer from the narrative
- Provide multiple suggestions if multiple endpoints are found or can be inferred

SPECIAL HANDLING FOR EXAMPLE RESOURCE FIELD:
- Example resources are complex subsections with subfields (title, description, status, accessURL)
- CRITICAL: The "value" field MUST be a valid JSON string containing the resource object
- SEMANTIC INFERENCE: Look for mentions of specific entities, examples, sample data, or representative resources
  * "title" - Name of an example entity or resource (e.g., "Albert Einstein", "Paris", "example:Person123")
  * "description" - Any text describing what the example represents or demonstrates
  * "accessURL" - URL to access or view this specific example resource
  * "status" - Whether the example is stable, available, or demonstrative
- INFER from phrases like: "for example, ...", "such as ...", "e.g., entity ...", "sample resource: ...", "instance of ...", "example entity: ..."
- Look for specific URIs or entity mentions that could serve as examples (e.g., "http://yago-knowledge.org/resource/Albert_Einstein")
- Example format:
  {
    "value": "{\"title\": \"Albert Einstein\", \"description\": \"Example person entity in YAGO\", \"accessURL\": \"http://yago-knowledge.org/resource/Albert_Einstein\"}",
    "explanation": "Found example resource mentioned in narrative"
  }
- Include ALL fields you can extract or infer from the narrative
- Provide multiple suggestions if multiple example resources are found or mentioned

SPECIAL HANDLING FOR LINKED RESOURCES FIELD:
- Linked resources are complex subsections with subfields (target, triples)
- CRITICAL: The "value" field MUST be a valid JSON string containing the linked resource object
- SEMANTIC INFERENCE: Look for mentions of connections to other datasets, interlinking, or relationships with external knowledge bases
  * "target" - Name or URL of another dataset/knowledge base that this dataset links to (e.g., "DBpedia", "Wikidata", "http://dbpedia.org")
  * "triples" - Number of links/triples connecting to that target (look for numbers associated with links, connections, or triples)
- INFER from phrases like: "linked to ...", "connects to ...", "interlinked with ...", "... links to DBpedia", "aligned with ...", "mappings to ...", "... triples to Wikidata"
- Look for dataset names mentioned in context of linking: DBpedia, Wikidata, Schema.org, UMBEL, GeoNames, etc.
- Example format:
  {
    "value": "{\"target\": \"http://dbpedia.org\", \"triples\": \"1523000\"}",
    "explanation": "Found linkset information to DBpedia in narrative"
  }
- Include ALL fields you can extract or infer from the narrative
- Provide multiple suggestions if multiple linked resources are found or mentioned

RESPONSE FORMAT:
You must return a JSON object with "fieldSuggestions" containing each field. For each field, provide either:
1. An object with "suggestions" array (each item has "value" and "explanation")
2. An object with "noSuggestionsReason" string if no suggestions found. In the case of no suggestions, provide a short explanation of why (e.g. "Field name from form has no match, even fuzzy matching failed")

Example:
{
  "fieldSuggestions": {
    "title": {
      "suggestions": [
        {"value": "QuoteKG Dataset", "explanation": "Found in narrative as main dataset name"}
      ]
    },
    "someField": {
      "noSuggestionsReason": "Field name does not appear in the narrative"
    }
  }
}

Please return all possible candidate values for each field, ordered by likelihood of being correct.

`;
};

// Function to get bulk suggestions for all fields at once
export const getBulkFieldSuggestions = async (fieldDefinitions, narrativeContent) => {
  try {
    const prompt = buildBulkSuggestionsPrompt(fieldDefinitions, narrativeContent);

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are an expert in knowledge graph metadata and data cataloging. Your task is to extract information from the provided ontology narrative description to fill out metadata form fields. For each suggestion, provide both the value and a brief explanation of where you found it in the narrative." },
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
      temperature: 0.7
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
