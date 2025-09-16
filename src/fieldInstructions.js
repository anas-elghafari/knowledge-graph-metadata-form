const fieldInstructions = {
    "identifier": "The identifier for KG metadata.",
    "type": "The type of object in the description.",
    "title": "The name or formal title for the KG.",
    "alternativeTitle": "Another name for the KG.",
    "acronym": "An acronym used to identify the KG.",
    "description": "Provide a human readable description of the KG. Minimally, the description should be in English, and ideally, there would be descriptions available in other languages.",
    
    // URL fields
    "homepageURL": "Provides minimal information, link to access to data.",
    "otherPages": "Provide additional relevant pages for the KG.",
    
    // Roles
    "roleCreator": "The author of the KG.",
    "rolePublisher": "The publisher of the KG (this ID typically has an ROR ID corresponding to the institution to which the authors belong).",
    "roleFunder": "The organization(s) that funded the KG building and/or publication.",
    "prov:qualifiedAttribution": "The contact point for inquiries about the KG, name and Email of the contact person.",
    
    // Date fields
    "createdDate": "Provide the date when the KG is created.",
    "modifiedDate": "The date when the KG is lastly modified.",
    "publishedDate": "The date when the KG is published.",
    
    // Vocabularies and schemas
    "vocabulariesUsed": "Specify the vocabularies used in the knowledge.",
    "metadataSchema": "Specify the file against which to validate the KG metadata. Recommend that IRI is a Profile (https://www.w3.org/TR/dx-prof/).",
    
    // Documentation
    "primaryReferenceDocument": "Provide a reference to a document, preprint or data paper describing the KG.",
    "metaGraph": "Provide an illustration of the graph connectivity through its types and relations between instances.",
    "statistics": "Provide a computational representation of the summary statistics of the knowledge graph. See HCLS: https://www.w3.org/TR/hcls-dataset/#s6.",
    
    // Distribution related - not in the reference spreadsheet
    "distTitle": "Required title for this distribution",
    "distReleaseDate": "Provide the release date for this specific distribution.",
    "distModificationDate": "The date when this distribution was modified.",
    

    "restAPI": "Provide a REST API for the KG.",
    "sparqlEndpoint": "Provide a SPARQL endpoint for the KG.",
    "exampleQueries": "Provide an exemplar query against the KG.",
    
  
    "version": "Specify the version of the dataset, if defined.",
    "license": "Provide the license that the KG is released with. The Software Ontology defines a set of standard licenses to could be chosen from (see http://www.ebi.ac.uk/swo/license/SWO_0000002).",
    "keywords": "Provide a set of keywords for the KG.",
    "category": "A main category of the resource. A resource can have multiple themes.",
    "publicationReferences": "Provide references for the KG.",
    "language": "Languages represented in the knowledge graph.",
    "iriTemplate": "Provide a 'J' IRI Templates, following RFC 6570, that individuals are typically identified by.",
    "linkedResources": "Specify linkable resources to the knowledge graph.Link to a description of a relationship with another resource.",
    "exampleResource": "Provide an example instance in the KG.",
    "accessStatement": "Specify any restrictions on the access to the resource, and how to gain legitimate access.",
    "source": "Specify the origin or source of data for the KG.",
    "nameSpace": "Often, the entities described in a dataset share URIs of a common form. For example, all DBpedia entity URIs start with http://dbpedia.org/resource/. The void:uriSpace property can be used to state that all entity URIs in a dataset start with a given string. In other words, they share a common “URI namespace",

    // --- ModalForm.js fields missing instructions (auto-added 2025-07-01) ---
    "categoryInput": " ... ",
    "distAccessService": " ... ",
    "distAccessURL": " ... ",
    "distByteSize": " ... ",
    "distCompressionFormat": " ... ",
    "distDescription": " ... ",
    "distDownloadURL": " ... ",
    "distHasPolicy": " ... ",
    "distLicense": " ... ",
    "distMediaType": " ... ",
    "distPackagingFormat": " ... ",
    "linkedResourceTarget": "...",
    "linkedResourceTriples": "...",
    "distRights": " ... ",
    "distSpatialResolution": "Specify the spatial resolution of this distribution in meters.",
    "distTemporalResolution": " ... ",
    "distIssued": "The date when this distribution was issued or published.",
    "exampleResourceAccessURL": " ... ",
    "exampleResourceDescription": " ... ",
    "exampleResourceMediaType": " ... ",
    "exampleResourceStatus": " ... ",
    "exampleResourceTitle": " ... ",
    "homepageURLInput": " ... ",
    "metadataSchemaInput": " ... ",
    "otherPagesInput": " ... ",
    "primaryReferenceDocInput": " ... ",
    "publicationReferencesInput": " ... ",
    "roleCreatorAgent": " ... ",
    "roleCreatorGivenName": " ... ",
    "roleCreatorMbox": " ... ",
    "roleFunderAgent": " ... ",
    "roleFunderGivenName": " ... ",
    "roleFunderMbox": " ... ",
    "rolePublisherAgent": " ... ",
    "rolePublisherGivenName": " ... ",
    "rolePublisherMbox": " ... ",
    "sourceInput": " ... ",
    "sparqlDataService": " ... ",
    "sparqlEndpointDescription": " ... ",
    "sparqlEndpointURL": " ... ",
    "sparqlIdentifier": " ... ",
    "sparqlStatus": " ... ",
    "sparqlTitle": " ... ",
    "vocabulariesUsedInput": " ... ",
    
    // Role form fields
    "roleType": "Select the type of role this person or organization plays in relation to the knowledge graph (Creator, Publisher, or Funder).",
    "roleAgent": "The IRI (Internationalized Resource Identifier) that uniquely identifies the person or organization in this role.",
    "roleGivenName": "The given name (first name) of the person in this role.",
    "roleMbox": "The email address of the person or organization in this role.",
  };
  
  export default fieldInstructions;