const fieldInstructions = {
    "identifier": "The identifier for KG metadata.",
    "type": "The type of object in the description.",
    "title": "The name or formal title for the KG.",
    "alternativeTitle": "Another name for the KG.",
    "acronym": "An acronym used to identify the KG.",
    "description": "Provide a human readable description of the KG. Minimally, the description should be in English, and ideally, there would be descriptions available in other languages.",
    
    // URL fields
    "homepageURL": "A page or document about the KG.",
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
    "kgSchema": "To provide a formal specification to validate the KG data.",
    
    // Documentation
    "primaryReferenceDocument": "Provide a reference to a document, preprint or data paper describing the KG.",
    "metaGraph": "Provide an illustration of the graph connectivity through its types and relations between instances.",
    "statistics": "Number of Triples: Provide a computational representation of the summary statistics of the knowledge graph, such as the number of triples for different properties. See HCLS: https://www.w3.org/TR/hcls-dataset/#s6.",
    
    // Distribution related - not in the reference spreadsheet
    "distTitle": "Required title for this distribution",
    "distReleaseDate": "Provide the release date for this specific distribution.",
    "distModificationDate": "The date when this distribution was modified.",
    

    "restAPI": "Provide a REST API endpoint IRI for the KG.",
    "sparqlEndpoint": "Provide a SPARQL endpoint for the KG.",
    "sparqlEndpoints": " ... ",
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
    "distAccessService": " A service that provides access to the distribution. ",
    "distAccessURL": " A URL of the resource that gives access to a distribution of the dataset. E.g., landing page, feed, SPARQL endpoint. ",
    "distByteSize": " The size of the distribution in bytes. ",
    "distCompressionFormat": " The compression format of the distribution in which the data is contained in a compressed form, e.g., to reduce the size of the downloadable file. ",
    "distDescription": " A free-text account of the distribution. ",
    "distDownloadURL": " The URL of the downloadable file in a given format. E.g., CSV file or RDF file. The format is indicated by the distribution's dcterms:format and/or dcat:mediaType ",
    "distHasPolicy": " An ODRL conformant policy expressing the rights associated with the distribution. ",
    "distLicense": " A legal document under which the distribution is made available. ",
    "distMediaType": " The media type of the distribution as defined by IANA [IANA-MEDIA-TYPES]. ",
    "distPackagingFormat": " The package format of the distribution in which one or more data files are grouped together, e.g., to enable a set of related files to be downloaded together. ",
    "linkedResourceTarget": "Provide the URI of the external dataset or resource linked to this dataset (e.g., Wikidata, DBpedia). This indicates the target of the linkset.",
    "linkedResourceTriples": "Enter the number of RDF triples that connect this dataset to the linked target resource. Use an integer value.",
    "distRights": " Information about rights held in and over the distribution. ",
    "distSpatialResolution": "Specify the spatial resolution of this distribution in meters.",
    "distTemporalResolution": " Minimum time period resolvable in the dataset distribution. ",
    "distIssued": "The date when this distribution was issued or published.",
    "exampleResourceAccessURL": " URL of the resource ",
    "exampleResourceDescription": " A free-text describing the example resource ",
    "exampleResourceMediaType": " ... ",
    "exampleResourceStatus": " The status of the resource in the context of a particular workflow process [VOCAB-ADMS]. ",
    "exampleResourceTitle": " A name given to the resource. ",
    "homepageURLInput": " ... ",
    "otherPagesInput": " ... ",
    "primaryReferenceDocInput": " ... ",
    "publicationReferencesInput": " ... ",
    "roleCreatorAgent": " ... ",
    "roleCreatorGivenName": " name of the agent. ",
    "roleCreatorMbox": " ... ",
    "roleFunderAgent": " ... ",
    "roleFunderGivenName": " name of the agent. ",
    "roleFunderMbox": " ... ",
    "rolePublisherAgent": " ... ",
    "rolePublisherGivenName": " name of the agent. ",
    "rolePublisherMbox": " ... ",
    "sourceInput": " ... ",
    "sparqlDataService": " ... ",
    "sparqlEndpointDescription": " A description of the services available via the end-points, including their operations, parameters etc. ",
    "sparqlEndpointURL": " The root location or primary endpoint of the service (a Web-resolvable IRI).  ",
    "sparqlIdentifier": " A unique identifier of the resource being described or cataloged. ",
    "sparqlStatus": " The status of the resource in the context of a particular workflow process [VOCAB-ADMS]. ",
    "sparqlTitle": " A name given to the resource. ",
    "vocabulariesUsedInput": " ... ",
    
    // Role form fields
    "roleType": "Select the type of role this person or organization plays in relation to the knowledge graph (Creator, Publisher, or Funder).",
    "roleAgent": "The IRI (Internationalized Resource Identifier) that uniquely identifies the person or organization in this role.",
    "roleGivenName": "The given name (first name) of the person in this role.",
    "roleMbox": "The email address of the person or organization in this role.",
  };
  
  export default fieldInstructions;
