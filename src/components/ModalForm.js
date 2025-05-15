import React, { useState, useEffect, useRef } from 'react';

function ModalForm({ onSubmit, onClose }) {
  // Initial form state
  const initialFormState = {
    identifier: [],
    type: [],
    title: '',
    description: '',
    
    // Date fields
    createdDate: '',
    modifiedDate: [],
    publishedDate: '',
    
    alternativeTitle: [],
    acronym: [],
    homepageURL: [],
    otherPages: [],
    
    // Role fields
    roleCreator: {
      agent: '',
      givenName: '',
      mbox: ''
    },
    rolePublisher: {
      agent: '',
      givenName: '',
      mbox: ''
    },
    roleFunder: {
      agent: '',
      givenName: '',
      mbox: ''
    },
    
    // Other fields
    license: '',
    version: '',

    // Distributions array
    distributions: [],
    
    // Primary Reference Document, Meta Graph, Statistics
    primaryReferenceDocument: [],
    metaGraph: [],
    statistics: [],
    vocabulariesUsed: [],
    metadataSchema: [],
    kgSchema: [],
    restAPI: [],
    sparqlEndpoint: [],
    exampleQueries: [],
    keywords: [],
    category: [],
    publicationReferences: [],
    language: [],
    iriTemplate: [],
    linkedResources: [],
    exampleResource: [],
    accessStatement: '',
    source: [],
    nameSpace: []
  };

  const [formData, setFormData] = useState(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [identifierInput, setIdentifierInput] = useState('');
  const [typeInput, setTypeInput] = useState('');
  const [alternativeTitleInput, setAlternativeTitleInput] = useState('');
  const [acronymInput, setAcronymInput] = useState('');
  const [homepageURLInput, setHomepageURLInput] = useState('');
  const [otherPagesInput, setOtherPagesInput] = useState('');
  const [modifiedDateInput, setModifiedDateInput] = useState('');
  const [primaryReferenceDocInput, setPrimaryReferenceDocInput] = useState('');
  const [statisticsInput, setStatisticsInput] = useState('');
  const [keywordsInput, setKeywordsInput] = useState('');
  const [categoryInput, setCategoryInput] = useState('');
  const [publicationReferencesInput, setPublicationReferencesInput] = useState('');
  const [languageInput, setLanguageInput] = useState('');
  const [iriTemplateInput, setIriTemplateInput] = useState('');
  const [linkedResourcesInput, setLinkedResourcesInput] = useState('');
  const [exampleResourceInput, setExampleResourceInput] = useState('');
  const [sourceInput, setSourceInput] = useState('');
  const [nameSpaceInput, setNameSpaceInput] = useState('');
  const [imageFileName, setImageFileName] = useState('');
  const fileInputRef = useRef(null);
  
  // New state for distribution editing
  const [currentDistribution, setCurrentDistribution] = useState({
    title: '',
    description: '',
    mediaType: '',
    downloadURL: '',
    accessURL: '',
    accessService: '',
    byteSize: '',
    compressionFormat: '',
    packagingFormat: '',
    hasPolicy: '',
    license: '',
    rights:'',
    releaseDate: '',
    modificationDate: ''
  });

    const [vocabulariesUsedInput, setVocabulariesUsedInput] = useState('');
    const [metadataSchemaInput, setMetadataSchemaInput] = useState('');
    const [kgSchemaInput, setKgSchemaInput] = useState('');
    const [restAPIInput, setRestAPIInput] = useState('');
    const [sparqlEndpointInput, setSparqlEndpointInput] = useState('');
    const [exampleQueriesInput, setExampleQueriesInput] = useState('');

  // Disable body scrolling when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    
    // Re-enable scrolling when component unmounts
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);
  

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  // Handle role field changes
  const handleRoleChange = (role, field, value) => {
    setFormData({
      ...formData,
      [role]: {
        ...formData[role],
        [field]: value
      }
    });
  };
  
  // Handle adding a tag
  const handleAddTag = (fieldName, inputValue, setInputFunc) => {
    if (inputValue.trim()) {
      setFormData({
        ...formData,
        [fieldName]: [...formData[fieldName], inputValue.trim()]
      });
      setInputFunc('');
    }
  };
  
  // Handle adding a date tag
  const handleAddDate = (e) => {
    if (modifiedDateInput) {
      setFormData({
        ...formData,
        modifiedDate: [...formData.modifiedDate, modifiedDateInput]
      });
      setModifiedDateInput('');
    }
  };
  
  // Handle removing a tag
  const handleRemoveTag = (fieldName, index) => {
    const newTags = [...formData[fieldName]];
    newTags.splice(index, 1);
    setFormData({
      ...formData,
      [fieldName]: newTags
    });
  };
  
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFileName(file.name);
      setFormData({
        ...formData,
        metaGraph: [...formData.metaGraph, file.name]
      });
    }
  };
  
  const addPendingTagInputs = () => {
    if (identifierInput.trim()) {
      setFormData(prev => ({
        ...prev,
        identifier: [...prev.identifier, identifierInput.trim()]
      }));
    }
    
    if (typeInput.trim()) {
      setFormData(prev => ({
        ...prev,
        type: [...prev.type, typeInput.trim()]
      }));
    }
    
    if (alternativeTitleInput.trim()) {
      setFormData(prev => ({
        ...prev,
        alternativeTitle: [...prev.alternativeTitle, alternativeTitleInput.trim()]
      }));
    }
    
    if (acronymInput.trim()) {
      setFormData(prev => ({
        ...prev,
        acronym: [...prev.acronym, acronymInput.trim()]
      }));
    }
    
    if (homepageURLInput.trim()) {
      setFormData(prev => ({
        ...prev,
        homepageURL: [...prev.homepageURL, homepageURLInput.trim()]
      }));
    }
    
    if (otherPagesInput.trim()) {
      setFormData(prev => ({
        ...prev,
        otherPages: [...prev.otherPages, otherPagesInput.trim()]
      }));
    }
    
    if (modifiedDateInput) {
      setFormData(prev => ({
        ...prev,
        modifiedDate: [...prev.modifiedDate, modifiedDateInput]
      }));
    }
    
    if (primaryReferenceDocInput.trim()) {
      setFormData(prev => ({
        ...prev,
        primaryReferenceDocument: [...prev.primaryReferenceDocument, primaryReferenceDocInput.trim()]
      }));
    }
    
    if (statisticsInput.trim()) {
      setFormData(prev => ({
        ...prev,
        statistics: [...prev.statistics, statisticsInput.trim()]
      }));
    }
    
    if (keywordsInput.trim()) {
      setFormData(prev => ({
        ...prev,
        keywords: [...prev.keywords, keywordsInput.trim()]
      }));
    }
    
    if (categoryInput.trim()) {
      setFormData(prev => ({
        ...prev,
        category: [...prev.category, categoryInput.trim()]
      }));
    }
    
    if (publicationReferencesInput.trim()) {
      setFormData(prev => ({
        ...prev,
        publicationReferences: [...prev.publicationReferences, publicationReferencesInput.trim()]
      }));
    }
    
    if (languageInput.trim()) {
      setFormData(prev => ({
        ...prev,
        language: [...prev.language, languageInput.trim()]
      }));
    }
    
    if (iriTemplateInput.trim()) {
      setFormData(prev => ({
        ...prev,
        iriTemplate: [...prev.iriTemplate, iriTemplateInput.trim()]
      }));
    }
    
    if (linkedResourcesInput.trim()) {
      setFormData(prev => ({
        ...prev,
        linkedResources: [...prev.linkedResources, linkedResourcesInput.trim()]
      }));
    }
    
    if (exampleResourceInput.trim()) {
      setFormData(prev => ({
        ...prev,
        exampleResource: [...prev.exampleResource, exampleResourceInput.trim()]
      }));
    }
    
    if (sourceInput.trim()) {
      setFormData(prev => ({
        ...prev,
        source: [...prev.source, sourceInput.trim()]
      }));
    }
    
    if (nameSpaceInput.trim()) {
      setFormData(prev => ({
        ...prev,
        nameSpace: [...prev.nameSpace, nameSpaceInput.trim()]
      }));
    }


    if (vocabulariesUsedInput.trim()) {
        setFormData(prev => ({
          ...prev,
          vocabulariesUsed: [...prev.vocabulariesUsed, vocabulariesUsedInput.trim()]
        }));
      }
      
      if (metadataSchemaInput.trim()) {
        setFormData(prev => ({
          ...prev,
          metadataSchema: [...prev.metadataSchema, metadataSchemaInput.trim()]
        }));
      }
      
      if (kgSchemaInput.trim()) {
        setFormData(prev => ({
          ...prev,
          kgSchema: [...prev.kgSchema, kgSchemaInput.trim()]
        }));
      }
      
      if (restAPIInput.trim()) {
        setFormData(prev => ({
          ...prev,
          restAPI: [...prev.restAPI, restAPIInput.trim()]
        }));
      }
      
      if (sparqlEndpointInput.trim()) {
        setFormData(prev => ({
          ...prev,
          sparqlEndpoint: [...prev.sparqlEndpoint, sparqlEndpointInput.trim()]
        }));
      }
      
      if (exampleQueriesInput.trim()) {
        setFormData(prev => ({
          ...prev,
          exampleQueries: [...prev.exampleQueries, exampleQueriesInput.trim()]
        }));
      }
  };

  const handleDistributionChange = (field, value) => {
    setCurrentDistribution({
      ...currentDistribution,
      [field]: value
    });
  };

  // Validate a distribution before adding it
  const validateDistribution = (dist) => {
    return dist.title && dist.description && dist.mediaType && 
           dist.downloadURL && dist.accessURL;
  };

  // Add a distribution
  const handleAddDistribution = () => {
    if (!validateDistribution(currentDistribution)) {
      setMessage('Please fill in all required fields for the distribution');
      return;
    }
    
    setFormData({
      ...formData,
      distributions: [...formData.distributions, {...currentDistribution}]
    });
    
    // Reset the current distribution form
    setCurrentDistribution({
      title: '',
      description: '',
      mediaType: '',
      downloadURL: '',
      accessURL: '',
      accessService: '',
      byteSize: '',
      compressionFormat: '',
      packagingFormat: '',
      hasPolicy: '',
      license: '',
       rights:'',
      releaseDate: '',
      modificationDate: ''
    });

    setMessage('Distribution added successfully');
    setTimeout(() => setMessage(''), 2000);
  };

  // Remove a distribution
  const handleRemoveDistribution = (index) => {
    const newDistributions = [...formData.distributions];
    newDistributions.splice(index, 1);
    setFormData({
      ...formData,
      distributions: newDistributions
    });
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // First add any pending tag inputs
    addPendingTagInputs();
    
    // Then proceed with submission
    setIsSubmitting(true);
    setMessage('');
    
    // Use setTimeout to ensure state updates have happened
    setTimeout(async () => {
      try {
        
        if (!formData.title || !formData.description || 
            formData.type.length === 0 || !formData.publishedDate ||
            formData.distributions.length === 0 ||
            formData.primaryReferenceDocument.length === 0 ||
            formData.keywords.length === 0 ||
            formData.language.length === 0 ||
            !formData.accessStatement ||
            formData.vocabulariesUsed.length === 0 ||
            formData.metadataSchema.length === 0) {
          setMessage('Please fill in all required fields');
          setIsSubmitting(false);
          return;
        }

        // Submit form data to parent component
        const result = await onSubmit(formData);
        
        if (result.success) {
          // Close modal on success
          onClose();
        } else {
          setMessage(result.message);
        }
      } catch (error) {
        console.error('Error in form submission:', error);
        setMessage('An unexpected error occurred. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    }, 0);
  };

  // Handle key press in tag input fields
  const handleKeyPress = (e, fieldName, inputValue, setInputFunc) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag(fieldName, inputValue, setInputFunc);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch (e) {
      return dateString;
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Knowledge Graph Metadata</h2>
          <button className="modal-close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body" onClick={(e) => e.stopPropagation()}>
          {message && <div className={message.includes('success') ? 'success-message' : 'error-message'}>{message}</div>}
          
          <form onSubmit={handleSubmit}>
            
            {/* Identifier (now optional, multiple values) */}
            <div className="form-group">
              <label htmlFor="identifier">
                Identifier <span className="field-indicator optional-indicator">optional, multiple values allowed</span>
              </label>
              <div className="tag-input-container">
                <div className="tag-input-row">
                  <input
                    type="text"
                    id="identifier"
                    value={identifierInput}
                    onChange={(e) => setIdentifierInput(e.target.value)}
                    onKeyPress={(e) => handleKeyPress(e, 'identifier', identifierInput, setIdentifierInput)}
                    placeholder="Enter identifier"
                  />
                  <button 
                    type="button" 
                    className="tag-add-button"
                    onClick={() => handleAddTag('identifier', identifierInput, setIdentifierInput)}
                  >
                    +
                  </button>
                </div>
                <div className="tag-list">
                  {formData.identifier.map((id, index) => (
                    <div key={`identifier-${index}`} className="tag-item">
                      <span className="tag-text">{id}</span>
                      <button 
                        type="button"
                        className="tag-remove"
                        onClick={() => handleRemoveTag('identifier', index)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                <div className="field-hint">Press Enter or click + to add</div>
              </div>
            </div>
            
            {/* Type (required, multiple values) */}
            <div className="form-group">
              <label htmlFor="type">
                Type <span className="field-indicator required-indicator">required, multiple values allowed</span>
              </label>
              <div className="tag-input-container">
                <div className="tag-input-row">
                  <input
                    type="text"
                    id="type"
                    value={typeInput}
                    onChange={(e) => setTypeInput(e.target.value)}
                    onKeyPress={(e) => handleKeyPress(e, 'type', typeInput, setTypeInput)}
                    placeholder="Enter type"
                  />
                  <button 
                    type="button" 
                    className="tag-add-button"
                    onClick={() => handleAddTag('type', typeInput, setTypeInput)}
                  >
                    +
                  </button>
                </div>
                <div className="tag-list">
                  {formData.type.map((type, index) => (
                    <div key={`type-${index}`} className="tag-item">
                      <span className="tag-text">{type}</span>
                      <button 
                        type="button"
                        className="tag-remove"
                        onClick={() => handleRemoveTag('type', index)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                <div className="field-hint">Press Enter or click + to add</div>
              </div>
            </div>
            
            {/* Title */}
            <div className="form-group">
              <label htmlFor="title">
                Title <span className="field-indicator required-indicator">required, 1 value only</span>
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="alternativeTitle">
                Alternative Title <span className="field-indicator optional-indicator">optional, multiple values allowed</span>
              </label>
              <div className="tag-input-container">
                <div className="tag-input-row">
                  <input
                    type="text"
                    id="alternativeTitle"
                    value={alternativeTitleInput}
                    onChange={(e) => setAlternativeTitleInput(e.target.value)}
                    onKeyPress={(e) => handleKeyPress(e, 'alternativeTitle', alternativeTitleInput, setAlternativeTitleInput)}
                    placeholder="Enter alternative title"
                  />
                  <button 
                    type="button" 
                    className="tag-add-button"
                    onClick={() => handleAddTag('alternativeTitle', alternativeTitleInput, setAlternativeTitleInput)}
                  >
                    +
                  </button>
                </div>
                <div className="tag-list">
                  {formData.alternativeTitle.map((title, index) => (
                    <div key={`alt-title-${index}`} className="tag-item">
                      <span className="tag-text">{title}</span>
                      <button 
                        type="button"
                        className="tag-remove"
                        onClick={() => handleRemoveTag('alternativeTitle', index)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                <div className="field-hint">Press Enter or click + to add</div>
              </div>
            </div>
            
            {/* Description */}
            <div className="form-group">
              <label htmlFor="description">
                Description <span className="field-indicator required-indicator">required, 1 value only</span>
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows="3"
              ></textarea>
            </div>
            
            {/* Date fields */}
            <div className="form-group">
              <label htmlFor="createdDate">
                Created Date <span className="field-indicator optional-indicator">optional, 1 value only</span>
              </label>
              <input
                type="date"
                id="createdDate"
                name="createdDate"
                value={formData.createdDate}
                onChange={handleChange}
                className="date-input"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="modifiedDate">
                Modified Date <span className="field-indicator optional-indicator">optional, multiple values allowed</span>
              </label>
              <div className="tag-input-container">
                <div className="tag-input-row">
                  <input
                    type="date"
                    id="modifiedDate"
                    value={modifiedDateInput}
                    onChange={(e) => setModifiedDateInput(e.target.value)}
                    className="date-input"
                  />
                  <button 
                    type="button" 
                    className="tag-add-button"
                    onClick={handleAddDate}
                    disabled={!modifiedDateInput}
                  >
                    +
                  </button>
                </div>
                <div className="tag-list">
                  {formData.modifiedDate.map((date, index) => (
                    <div key={`modified-date-${index}`} className="tag-item">
                      <span className="tag-text">{formatDate(date)}</span>
                      <button 
                        type="button"
                        className="tag-remove"
                        onClick={() => handleRemoveTag('modifiedDate', index)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                <div className="field-hint">Select a date and click + to add</div>
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="publishedDate">
                Published Date <span className="field-indicator required-indicator">required, 1 value only</span>
              </label>
              <input
                type="date"
                id="publishedDate"
                name="publishedDate"
                value={formData.publishedDate}
                onChange={handleChange}
                required
                className="date-input"
              />
            </div>
            



            <div className="form-group">
            <label htmlFor="vocabulariesUsed">
                Vocabularies Used <span className="field-indicator required-indicator">required, multiple values allowed</span>
            </label>
            <div className="tag-input-container">
                <div className="tag-input-row">
                <input
                    type="text"
                    id="vocabulariesUsed"
                    value={vocabulariesUsedInput}
                    onChange={(e) => setVocabulariesUsedInput(e.target.value)}
                    onKeyPress={(e) => handleKeyPress(e, 'vocabulariesUsed', vocabulariesUsedInput, setVocabulariesUsedInput)}
                    placeholder="Enter vocabulary"
                />
                <button 
                    type="button" 
                    className="tag-add-button"
                    onClick={() => handleAddTag('vocabulariesUsed', vocabulariesUsedInput, setVocabulariesUsedInput)}
                >
                    +
                </button>
                </div>
                <div className="tag-list">
                {formData.vocabulariesUsed.map((item, index) => (
                    <div key={`vocabulary-${index}`} className="tag-item">
                    <span className="tag-text">{item}</span>
                    <button 
                        type="button"
                        className="tag-remove"
                        onClick={() => handleRemoveTag('vocabulariesUsed', index)}
                    >
                        ×
                    </button>
                    </div>
                ))}
                </div>
                <div className="field-hint">Press Enter or click + to add</div>
            </div>
            </div>

            {/* Metadata Schema [1,∞] - Required, multiple values */}
            <div className="form-group">
            <label htmlFor="metadataSchema">
                Metadata Schema <span className="field-indicator required-indicator">required, multiple values allowed</span>
            </label>
            <div className="tag-input-container">
                <div className="tag-input-row">
                <input
                    type="text"
                    id="metadataSchema"
                    value={metadataSchemaInput}
                    onChange={(e) => setMetadataSchemaInput(e.target.value)}
                    onKeyPress={(e) => handleKeyPress(e, 'metadataSchema', metadataSchemaInput, setMetadataSchemaInput)}
                    placeholder="Enter metadata schema"
                />
                <button 
                    type="button" 
                    className="tag-add-button"
                    onClick={() => handleAddTag('metadataSchema', metadataSchemaInput, setMetadataSchemaInput)}
                >
                    +
                </button>
                </div>
                <div className="tag-list">
                {formData.metadataSchema.map((item, index) => (
                    <div key={`metadata-schema-${index}`} className="tag-item">
                    <span className="tag-text">{item}</span>
                    <button 
                        type="button"
                        className="tag-remove"
                        onClick={() => handleRemoveTag('metadataSchema', index)}
                    >
                        ×
                    </button>
                    </div>
                ))}
                </div>
                <div className="field-hint">Press Enter or click + to add</div>
            </div>
            </div>

            {/* KG Schema [0,∞] - Optional, multiple values */}
            <div className="form-group">
            <label htmlFor="kgSchema">
                KG Schema <span className="field-indicator optional-indicator">optional, multiple values allowed</span>
            </label>
            <div className="tag-input-container">
                <div className="tag-input-row">
                <input
                    type="text"
                    id="kgSchema"
                    value={kgSchemaInput}
                    onChange={(e) => setKgSchemaInput(e.target.value)}
                    onKeyPress={(e) => handleKeyPress(e, 'kgSchema', kgSchemaInput, setKgSchemaInput)}
                    placeholder="Enter KG schema"
                />
                <button 
                    type="button" 
                    className="tag-add-button"
                    onClick={() => handleAddTag('kgSchema', kgSchemaInput, setKgSchemaInput)}
                >
                    +
                </button>
                </div>
                <div className="tag-list">
                {formData.kgSchema.map((item, index) => (
                    <div key={`kg-schema-${index}`} className="tag-item">
                    <span className="tag-text">{item}</span>
                    <button 
                        type="button"
                        className="tag-remove"
                        onClick={() => handleRemoveTag('kgSchema', index)}
                    >
                        ×
                    </button>
                    </div>
                ))}
                </div>
                <div className="field-hint">Press Enter or click + to add</div>
            </div>
            </div>

            {/* Primary Reference Document */}
            <div className="form-group">
              <label htmlFor="primaryReferenceDocument">
                Primary Reference Document <span className="field-indicator required-indicator">required, multiple values allowed</span>
              </label>
              <div className="tag-input-container">
                <div className="tag-input-row">
                  <input
                    type="text"
                    id="primaryReferenceDocument"
                    value={primaryReferenceDocInput}
                    onChange={(e) => setPrimaryReferenceDocInput(e.target.value)}
                    onKeyPress={(e) => handleKeyPress(e, 'primaryReferenceDocument', primaryReferenceDocInput, setPrimaryReferenceDocInput)}
                    placeholder="Enter reference document"
                  />
                  <button 
                    type="button" 
                    className="tag-add-button"
                    onClick={() => handleAddTag('primaryReferenceDocument', primaryReferenceDocInput, setPrimaryReferenceDocInput)}
                  >
                    +
                  </button>
                </div>
                <div className="tag-list">
                  {formData.primaryReferenceDocument.map((doc, index) => (
                    <div key={`ref-doc-${index}`} className="tag-item">
                      <span className="tag-text">{doc}</span>
                      <button 
                        type="button"
                        className="tag-remove"
                        onClick={() => handleRemoveTag('primaryReferenceDocument', index)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                <div className="field-hint">Press Enter or click + to add</div>
              </div>
            </div>
            
            {/* Meta Graph */}
            <div className="form-group">
              <label htmlFor="metaGraph">
                Meta Graph <span className="field-indicator optional-indicator">optional, multiple values allowed</span>
              </label>
              <div className="file-upload-section">
                <div className="file-upload-label">
                  <span className="file-name">{imageFileName || "No file selected"}</span>
                  <button 
                    type="button" 
                    className="browse-button"
                    onClick={() => fileInputRef.current.click()}
                  >
                    Browse
                  </button>
                  <input
                    type="file"
                    id="metaGraph"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/*"
                    className="file-upload-input"
                    style={{ display: "none" }}
                  />
                </div>
                <div className="tag-list">
                  {formData.metaGraph.map((graph, index) => (
                    <div key={`meta-graph-${index}`} className="tag-item">
                      <span className="tag-text">{graph}</span>
                      <button 
                        type="button"
                        className="tag-remove"
                        onClick={() => handleRemoveTag('metaGraph', index)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                <div className="field-hint">Upload image files to add to meta graph</div>
              </div>
            </div>
            
            {/* Statistics */}
            <div className="form-group">
              <label htmlFor="statistics">
                Statistics <span className="field-indicator optional-indicator">optional, multiple values allowed</span>
              </label>
              <div className="tag-input-container">
                <div className="tag-input-row">
                  <input
                    type="text"
                    id="statistics"
                    value={statisticsInput}
                    onChange={(e) => setStatisticsInput(e.target.value)}
                    onKeyPress={(e) => handleKeyPress(e, 'statistics', statisticsInput, setStatisticsInput)}
                    placeholder="Enter statistics"
                  />
                  <button 
                    type="button" 
                    className="tag-add-button"
                    onClick={() => handleAddTag('statistics', statisticsInput, setStatisticsInput)}
                  >
                    +
                  </button>
                </div>
                <div className="tag-list">
                  {formData.statistics.map((stat, index) => (
                    <div key={`stat-${index}`} className="tag-item">
                      <span className="tag-text">{stat}</span>
                      <button 
                        type="button"
                        className="tag-remove"
                        onClick={() => handleRemoveTag('statistics', index)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                <div className="field-hint">Press Enter or click + to add</div>
              </div>
            </div>

            {/* Acronym */}
            <div className="form-group">
              <label htmlFor="acronym">
                Acronym <span className="field-indicator optional-indicator">optional, multiple values allowed</span>
              </label>
              <div className="tag-input-container">
                <div className="tag-input-row">
                  <input
                    type="text"
                    id="acronym"
                    value={acronymInput}
                    onChange={(e) => setAcronymInput(e.target.value)}
                    onKeyPress={(e) => handleKeyPress(e, 'acronym', acronymInput, setAcronymInput)}
                    placeholder="Enter acronym"
                  />
                  <button 
                    type="button" 
                    className="tag-add-button"
                    onClick={() => handleAddTag('acronym', acronymInput, setAcronymInput)}
                  >
                    +
                  </button>
                </div>
                <div className="tag-list">
                  {formData.acronym.map((acr, index) => (
                    <div key={`acronym-${index}`} className="tag-item">
                      <span className="tag-text">{acr}</span>
                      <button 
                        type="button"
                        className="tag-remove"
                        onClick={() => handleRemoveTag('acronym', index)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                <div className="field-hint">Press Enter or click + to add</div>
              </div>
            </div>
            
            {/* Homepage URL */}
            <div className="form-group">
              <label htmlFor="homepageURL">
                Homepage URL <span className="field-indicator optional-indicator">optional, multiple values allowed</span>
              </label>
              <div className="tag-input-container">
                <div className="tag-input-row">
                  <input
                    type="url"
                    id="homepageURL"
                    value={homepageURLInput}
                    onChange={(e) => setHomepageURLInput(e.target.value)}
                    onKeyPress={(e) => handleKeyPress(e, 'homepageURL', homepageURLInput, setHomepageURLInput)}
                    placeholder="Enter homepage URL"
                  />
                  <button 
                    type="button" 
                    className="tag-add-button"
                    onClick={() => handleAddTag('homepageURL', homepageURLInput, setHomepageURLInput)}
                  >
                    +
                  </button>
                </div>
                <div className="tag-list">
                  {formData.homepageURL.map((url, index) => (
                    <div key={`homepage-${index}`} className="tag-item">
                      <span className="tag-text">{url}</span>
                      <button 
                        type="button"
                        className="tag-remove"
                        onClick={() => handleRemoveTag('homepageURL', index)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                <div className="field-hint">Press Enter or click + to add</div>
              </div>
            </div>
            
            {/* Other Pages */}
            <div className="form-group">
              <label htmlFor="otherPages">
                Other Pages <span className="field-indicator optional-indicator">optional, multiple values allowed</span>
              </label>
              <div className="tag-input-container">
                <div className="tag-input-row">
                  <input
                    type="url"
                    id="otherPages"
                    value={otherPagesInput}
                    onChange={(e) => setOtherPagesInput(e.target.value)}
                    onKeyPress={(e) => handleKeyPress(e, 'otherPages', otherPagesInput, setOtherPagesInput)}
                    placeholder="Enter page URL"
                  />
                  <button 
                    type="button" 
                    className="tag-add-button"
                    onClick={() => handleAddTag('otherPages', otherPagesInput, setOtherPagesInput)}
                  >
                    +
                  </button>
                </div>
                <div className="tag-list">
                  {formData.otherPages.map((page, index) => (
                    <div key={`other-page-${index}`} className="tag-item">
                      <span className="tag-text">{page}</span>
                      <button 
                        type="button"
                        className="tag-remove"
                        onClick={() => handleRemoveTag('otherPages', index)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                <div className="field-hint">Press Enter or click + to add</div>
              </div>
            </div>
            
            {/* Role fields */}
            <div className="role-section">
                {/* Role: Creator */}
             <div className="form-group">
               <label className="role-label">
                 Role: Creator <span className="field-indicator optional-indicator">optional, 1 set of values</span>
               </label>
               <div className="role-fields">
                 <div className="role-field">
                   <label htmlFor="roleCreatorAgent" className="subfield-label">Agent</label>
                   <input
                     type="text"
                     id="roleCreatorAgent"
                     value={formData.roleCreator.agent}
                     onChange={(e) => handleRoleChange('roleCreator', 'agent', e.target.value)}
                     className="subfield-input"
                   />
                 </div>
                 <div className="role-field">
                   <label htmlFor="roleCreatorGivenName" className="subfield-label">Given Name</label>
                   <input
                     type="text"
                     id="roleCreatorGivenName"
                     value={formData.roleCreator.givenName}
                     onChange={(e) => handleRoleChange('roleCreator', 'givenName', e.target.value)}
                     className="subfield-input"
                   />
                 </div>
                 <div className="role-field">
                   <label htmlFor="roleCreatorMbox" className="subfield-label">Mbox</label>
                   <input
                     type="email"
                     id="roleCreatorMbox"
                     value={formData.roleCreator.mbox}
                     onChange={(e) => handleRoleChange('roleCreator', 'mbox', e.target.value)}
                     className="subfield-input"
                   />
                 </div>
               </div>
             </div>
             
             {/* Role: Publisher */}
             <div className="form-group">
               <label className="role-label">
                 Role: Publisher <span className="field-indicator optional-indicator">optional, 1 set of values</span>
               </label>
               <div className="role-fields">
                 <div className="role-field">
                   <label htmlFor="rolePublisherAgent" className="subfield-label">Agent</label>
                   <input
                     type="text"
                     id="rolePublisherAgent"
                     value={formData.rolePublisher.agent}
                     onChange={(e) => handleRoleChange('rolePublisher', 'agent', e.target.value)}
                     className="subfield-input"
                   />
                 </div>
                 <div className="role-field">
                   <label htmlFor="rolePublisherGivenName" className="subfield-label">Given Name</label>
                   <input
                     type="text"
                     id="rolePublisherGivenName"
                     value={formData.rolePublisher.givenName}
                     onChange={(e) => handleRoleChange('rolePublisher', 'givenName', e.target.value)}
                     className="subfield-input"
                   />
                 </div>
                 <div className="role-field">
                   <label htmlFor="rolePublisherMbox" className="subfield-label">Mbox</label>
                   <input
                     type="email"
                     id="rolePublisherMbox"
                     value={formData.rolePublisher.mbox}
                     onChange={(e) => handleRoleChange('rolePublisher', 'mbox', e.target.value)}
                     className="subfield-input"
                   />
                 </div>
               </div>
             </div>
             
             {/* Role: Funder */}
             <div className="form-group">
               <label className="role-label">
                 Role: Funder <span className="field-indicator optional-indicator">optional, 1 set of values</span>
               </label>
               <div className="role-fields">
                 <div className="role-field">
                   <label htmlFor="roleFunderAgent" className="subfield-label">Agent</label>
                   <input
                     type="text"
                     id="roleFunderAgent"
                     value={formData.roleFunder.agent}
                     onChange={(e) => handleRoleChange('roleFunder', 'agent', e.target.value)}
                     className="subfield-input"
                   />
                 </div>
                 <div className="role-field">
                   <label htmlFor="roleFunderGivenName" className="subfield-label">Given Name</label>
                   <input
                     type="text"
                     id="roleFunderGivenName"
                     value={formData.roleFunder.givenName}
                     onChange={(e) => handleRoleChange('roleFunder', 'givenName', e.target.value)}
                     className="subfield-input"
                   />
                 </div>
                 <div className="role-field">
                   <label htmlFor="roleFunderMbox" className="subfield-label">Mbox</label>
                   <input
                     type="email"
                     id="roleFunderMbox"
                     value={formData.roleFunder.mbox}
                     onChange={(e) => handleRoleChange('roleFunder', 'mbox', e.target.value)}
                     className="subfield-input"
                   />
                 </div>
               </div>
             </div>
           </div>
           
           {/* License */}
           <div className="form-group">
             <label htmlFor="license">
               License <span className="field-indicator required-indicator">required, 1 value only</span>
             </label>
             <input
               type="text"
               id="license"
               name="license"
               value={formData.license}
               onChange={handleChange}
               required
             />
           </div>
           
           {/* Version */}
           <div className="form-group">
             <label htmlFor="version">
               Version <span className="field-indicator required-indicator">required, 1 value only</span>
             </label>
             <input
               type="text"
               id="version"
               name="version"
               value={formData.version}
               onChange={handleChange}
               required
             />
           </div>

           {/* Distributions Section */}
           <div className="form-section">
             <h3 className="section-title">Distributions</h3>
             <div className="field-indicator required-indicator">required, multiple submissions allowed</div>
           </div>

           {/* Display existing distributions */}
           <div className="distributions-list">
             {formData.distributions.map((dist, index) => (
               <div key={`distribution-${index}`} className="distribution-item">
                 <div className="distribution-header">
                   <div className="distribution-title">{dist.title}</div>
                   <button 
                     type="button"
                     className="tag-remove"
                     onClick={() => handleRemoveDistribution(index)}
                   >
                     ×
                   </button>
                 </div>
                 <div className="distribution-preview">
                   <div className="distribution-field">
                     <span className="field-label">Description:</span>
                     <span className="field-value">{dist.description}</span>
                   </div>
                   <div className="distribution-field">
                     <span className="field-label">Media Type:</span>
                     <span className="field-value">{dist.mediaType}</span>
                   </div>
                   <div className="distribution-field">
                     <span className="field-label">Download URL:</span>
                     <span className="field-value">{dist.downloadURL}</span>
                   </div>
                   <div className="distribution-field">
                     <span className="field-label">Access URL:</span>
                     <span className="field-value">{dist.accessURL}</span>
                   </div>
                   {dist.accessService && (
                     <div className="distribution-field">
                       <span className="field-label">Access Service:</span>
                       <span className="field-value">{dist.accessService}</span>
                     </div>
                   )}
                   {dist.byteSize && (
                     <div className="distribution-field">
                       <span className="field-label">Byte Size:</span>
                       <span className="field-value">{dist.byteSize}</span>
                     </div>
                   )}
                   {dist.compressionFormat && (
                     <div className="distribution-field">
                       <span className="field-label">Compression Format:</span>
                       <span className="field-value">{dist.compressionFormat}</span>
                     </div>
                   )}
                   {dist.packagingFormat && (
                     <div className="distribution-field">
                       <span className="field-label">Packaging Format:</span>
                       <span className="field-value">{dist.packagingFormat}</span>
                     </div>
                   )}


                   {dist.hasPolicy && (
                     <div className="distribution-field">
                       <span className="field-label">Has Policy:</span>
                       <span className="field-value">{dist.hasPolicy}</span>
                     </div>
                   )}
                   {dist.license && (
                     <div className="distribution-field">
                       <span className="field-label">license:</span>
                       <span className="field-value">{dist.license}</span>
                     </div>
                   )}
                   {dist.rights && (
                     <div className="distribution-field">
                       <span className="field-label">Rights:</span>
                       <span className="field-value">{dist.rights}</span>
                     </div>
                   )}




                   {dist.releaseDate && (
                     <div className="distribution-field">
                       <span className="field-label">Release Date:</span>
                       <span className="field-value">{formatDate(dist.releaseDate)}</span>
                     </div>
                   )}
                   {dist.modificationDate && (
                     <div className="distribution-field">
                       <span className="field-label">Modification Date:</span>
                       <span className="field-value">{formatDate(dist.modificationDate)}</span>
                     </div>
                   )}
                 </div>
               </div>
             ))}
           </div>

           {/* Distribution Form */}
           <div className="distribution-form">
             <div className="distribution-form-header">
               <h4>Add New Distribution</h4>
             </div>
             
             {/* Required distribution fields */}
             <div className="form-group">
               <label htmlFor="distTitle">
                 Title <span className="field-indicator required-indicator">required</span>
               </label>
               <input
                 type="text"
                 id="distTitle"
                 value={currentDistribution.title}
                 onChange={(e) => handleDistributionChange('title', e.target.value)}
                 className="subfield-input"
               />
             </div>
             
             <div className="form-group">
               <label htmlFor="distDescription">
                 Description <span className="field-indicator required-indicator">required</span>
               </label>
               <textarea
                 id="distDescription"
                 value={currentDistribution.description}
                 onChange={(e) => handleDistributionChange('description', e.target.value)}
                 rows="2"
                 className="subfield-input"
               ></textarea>
             </div>
             
             <div className="form-group">
               <label htmlFor="distMediaType">
                 Media Type <span className="field-indicator required-indicator">required</span>
               </label>
               <input
                 type="text"
                 id="distMediaType"
                 value={currentDistribution.mediaType}
                 onChange={(e) => handleDistributionChange('mediaType', e.target.value)}
                 className="subfield-input"
               />
             </div>
             
             <div className="form-group">
               <label htmlFor="distDownloadURL">
                 Download URL (dcat:downloadURL) <span className="field-indicator required-indicator">required</span>
               </label>
               <input
                 type="url"
                 id="distDownloadURL"
                 value={currentDistribution.downloadURL}
                 onChange={(e) => handleDistributionChange('downloadURL', e.target.value)}
                 className="subfield-input"
               />
             </div>
             
             <div className="form-group">
               <label htmlFor="distAccessURL">
                 Access URL <span className="field-indicator required-indicator">required</span>
               </label>
               <input
                 type="url"
                 id="distAccessURL"
                 value={currentDistribution.accessURL}
                 onChange={(e) => handleDistributionChange('accessURL', e.target.value)}
                 className="subfield-input"
               />
             </div>
             
             {/* Optional distribution fields */}
             <div className="form-group">
               <label htmlFor="distAccessService">
                 Access Service <span className="field-indicator optional-indicator">optional</span>
               </label>
               <input
                 type="text"
                 id="distAccessService"
                 value={currentDistribution.accessService}
                 onChange={(e) => handleDistributionChange('accessService', e.target.value)}
                 className="subfield-input"
               />
             </div>
             
             <div className="form-group">
               <label htmlFor="distByteSize">
                 Byte Size <span className="field-indicator optional-indicator">optional</span>
               </label>
               <input
                 type="text"
                 id="distByteSize"
                 value={currentDistribution.byteSize}
                 onChange={(e) => handleDistributionChange('byteSize', e.target.value)}
                 className="subfield-input"
               />
             </div>
             
             <div className="form-group">
               <label htmlFor="distCompressionFormat">
                 Compression Format <span className="field-indicator optional-indicator">optional</span>
               </label>
               <input
                 type="text"
                 id="distCompressionFormat"
                 value={currentDistribution.compressionFormat}
                 onChange={(e) => handleDistributionChange('compressionFormat', e.target.value)}
                 className="subfield-input"
               />
             </div>
             
             <div className="form-group">
               <label htmlFor="distPackagingFormat">
                 Packaging Format <span className="field-indicator optional-indicator">optional</span>
               </label>
               <input
                 type="text"
                 id="distPackagingFormat"
                 value={currentDistribution.packagingFormat}
                 onChange={(e) => handleDistributionChange('packagingFormat', e.target.value)}
                 className="subfield-input"
               />
             </div>
             <div className="form-group">
               <label htmlFor="distHasPolicy">
                 Has Policy <span className="field-indicator optional-indicator">optional</span>
               </label>
               <input
                 type="text"
                 id="distHasPolicy"
                 value={currentDistribution.hasPolicy}
                 onChange={(e) => handleDistributionChange('hasPolicy', e.target.value)}
                 className="subfield-input"
               />
             </div>
             
             <div className="form-group">
               <label htmlFor="distLicense">
                 License <span className="field-indicator optional-indicator">optional</span>
               </label>
               <input
                 type="text"
                 id="distLicense"
                 value={currentDistribution.license}
                 onChange={(e) => handleDistributionChange('license', e.target.value)}
                 className="subfield-input"
               />
             </div>
             
             <div className="form-group">
               <label htmlFor="distRights">
                 Rights <span className="field-indicator optional-indicator">optional</span>
               </label>
               <input
                 type="text"
                 id="distRights"
                 value={currentDistribution.packagingFormat}
                 onChange={(e) => handleDistributionChange('rights', e.target.value)}
                 className="subfield-input"
               />
             </div>
             <div className="form-group">
               <label htmlFor="distReleaseDate">
                 Release Date <span className="field-indicator optional-indicator">optional</span>
               </label>
               <input
                 type="date"
                 id="distReleaseDate"
                 value={currentDistribution.releaseDate}
                 onChange={(e) => handleDistributionChange('releaseDate', e.target.value)}
                 className="date-input subfield-input"
               />
             </div>
             
             <div className="form-group">
               <label htmlFor="distModificationDate">
                 Update/Modification Date <span className="field-indicator optional-indicator">optional</span>
               </label>
               <input
                 type="date"
                 id="distModificationDate"
                 value={currentDistribution.modificationDate}
                 onChange={(e) => handleDistributionChange('modificationDate', e.target.value)}
                 className="date-input subfield-input"
               />
             </div>
             
             <div className="distribution-actions">
               <button 
                 type="button" 
                 className="add-button"
                 onClick={handleAddDistribution}
               >
                 Add Distribution
               </button>
             </div>
           </div>
           
           <div className="form-group">
            <label htmlFor="restAPI">
                REST API <span className="field-indicator optional-indicator">optional, multiple values allowed</span>
            </label>
            <div className="tag-input-container">
                <div className="tag-input-row">
                <input
                    type="text"
                    id="restAPI"
                    value={restAPIInput}
                    onChange={(e) => setRestAPIInput(e.target.value)}
                    onKeyPress={(e) => handleKeyPress(e, 'restAPI', restAPIInput, setRestAPIInput)}
                    placeholder="Enter REST API"
                />
                <button 
                    type="button" 
                    className="tag-add-button"
                    onClick={() => handleAddTag('restAPI', restAPIInput, setRestAPIInput)}
                >
                    +
                </button>
                </div>
                <div className="tag-list">
                {formData.restAPI.map((item, index) => (
                    <div key={`rest-api-${index}`} className="tag-item">
                    <span className="tag-text">{item}</span>
                    <button 
                        type="button"
                        className="tag-remove"
                        onClick={() => handleRemoveTag('restAPI', index)}
                    >
                        ×
                    </button>
                    </div>
                ))}
                </div>
                <div className="field-hint">Press Enter or click + to add</div>
            </div>
            </div>

            {/* SPARQL Endpoint [0,∞] - Optional, multiple values */}
            <div className="form-group">
            <label htmlFor="sparqlEndpoint">
                SPARQL Endpoint <span className="field-indicator optional-indicator">optional, multiple values allowed</span>
            </label>
            <div className="tag-input-container">
                <div className="tag-input-row">
                <input
                    type="text"
                    id="sparqlEndpoint"
                    value={sparqlEndpointInput}
                    onChange={(e) => setSparqlEndpointInput(e.target.value)}
                    onKeyPress={(e) => handleKeyPress(e, 'sparqlEndpoint', sparqlEndpointInput, setSparqlEndpointInput)}
                    placeholder="Enter SPARQL endpoint"
                />
                <button 
                    type="button" 
                    className="tag-add-button"
                    onClick={() => handleAddTag('sparqlEndpoint', sparqlEndpointInput, setSparqlEndpointInput)}
                >
                    +
                </button>
                </div>
                <div className="tag-list">
                {formData.sparqlEndpoint.map((item, index) => (
                    <div key={`sparql-endpoint-${index}`} className="tag-item">
                    <span className="tag-text">{item}</span>
                    <button 
                        type="button"
                        className="tag-remove"
                        onClick={() => handleRemoveTag('sparqlEndpoint', index)}
                    >
                        ×
                    </button>
                    </div>
                ))}
                </div>
                <div className="field-hint">Press Enter or click + to add</div>
            </div>
            </div>

            {/* Example Queries [0,∞] - Optional, multiple values */}
            <div className="form-group">
            <label htmlFor="exampleQueries">
                Example Queries <span className="field-indicator optional-indicator">optional, multiple values allowed</span>
            </label>
            <div className="tag-input-container">
                <div className="tag-input-row">
                <input
                    type="text"
                    id="exampleQueries"
                    value={exampleQueriesInput}
                    onChange={(e) => setExampleQueriesInput(e.target.value)}
                    onKeyPress={(e) => handleKeyPress(e, 'exampleQueries', exampleQueriesInput, setExampleQueriesInput)}
                    placeholder="Enter example query"
                />
                <button 
                    type="button" 
                    className="tag-add-button"
                    onClick={() => handleAddTag('exampleQueries', exampleQueriesInput, setExampleQueriesInput)}
                >
                    +
                </button>
                </div>
                <div className="tag-list">
                {formData.exampleQueries.map((item, index) => (
                    <div key={`example-query-${index}`} className="tag-item">
                    <span className="tag-text">{item}</span>
                    <button 
                        type="button"
                        className="tag-remove"
                        onClick={() => handleRemoveTag('exampleQueries', index)}
                    >
                        ×
                    </button>
                    </div>
                ))}
                </div>
                <div className="field-hint">Press Enter or click + to add</div>
            </div>
        </div>

           {/* Keywords [1,∞] - Required, multiple values */}
           <div className="form-group">
             <label htmlFor="keywords">
               Keywords <span className="field-indicator required-indicator">required, multiple values allowed</span>
             </label>
             <div className="tag-input-container">
               <div className="tag-input-row">
                 <input
                   type="text"
                   id="keywords"
                   value={keywordsInput}
                   onChange={(e) => setKeywordsInput(e.target.value)}
                   onKeyPress={(e) => handleKeyPress(e, 'keywords', keywordsInput, setKeywordsInput)}
                   placeholder="Enter keyword"
                 />
                 <button 
                   type="button" 
                   className="tag-add-button"
                   onClick={() => handleAddTag('keywords', keywordsInput, setKeywordsInput)}
                 >
                   +
                 </button>
               </div>
               <div className="tag-list">
                 {formData.keywords.map((keyword, index) => (
                   <div key={`keyword-${index}`} className="tag-item">
                     <span className="tag-text">{keyword}</span>
                     <button 
                       type="button"
                       className="tag-remove"
                       onClick={() => handleRemoveTag('keywords', index)}
                     >
                       ×
                     </button>
                   </div>
                 ))}
               </div>
               <div className="field-hint">Press Enter or click + to add</div>
             </div>
           </div>

           {/* Category [0,∞] - Optional, multiple values */}
           <div className="form-group">
             <label htmlFor="category">
               Category <span className="field-indicator optional-indicator">optional, multiple values allowed</span>
             </label>
             <div className="tag-input-container">
               <div className="tag-input-row">
                 <input
                   type="text"
                   id="category"
                   value={categoryInput}
                   onChange={(e) => setCategoryInput(e.target.value)}
                   onKeyPress={(e) => handleKeyPress(e, 'category', categoryInput, setCategoryInput)}
                   placeholder="Enter category"
                 />
                 <button 
                   type="button" 
                   className="tag-add-button"
                   onClick={() => handleAddTag('category', categoryInput, setCategoryInput)}
                 >
                   +
                 </button>
               </div>
               <div className="tag-list">
                 {formData.category.map((cat, index) => (
                   <div key={`category-${index}`} className="tag-item">
                     <span className="tag-text">{cat}</span>
                     <button 
                       type="button"
                       className="tag-remove"
                       onClick={() => handleRemoveTag('category', index)}
                     >
                       ×
                     </button>
                   </div>
                 ))}
               </div>
               <div className="field-hint">Press Enter or click + to add</div>
             </div>
           </div>

           {/* Publication/References [0,∞] - Optional, multiple values */}
           <div className="form-group">
             <label htmlFor="publicationReferences">
               Publication/References <span className="field-indicator optional-indicator">optional, multiple values allowed</span>
             </label>
             <div className="tag-input-container">
               <div className="tag-input-row">
                 <input
                   type="text"
                   id="publicationReferences"
                   value={publicationReferencesInput}
                   onChange={(e) => setPublicationReferencesInput(e.target.value)}
                   onKeyPress={(e) => handleKeyPress(e, 'publicationReferences', publicationReferencesInput, setPublicationReferencesInput)}
                   placeholder="Enter publication or reference"
                 />
                 <button 
                   type="button" 
                   className="tag-add-button"
                   onClick={() => handleAddTag('publicationReferences', publicationReferencesInput, setPublicationReferencesInput)}
                 >
                   +
                 </button>
               </div>
               <div className="tag-list">
                 {formData.publicationReferences.map((ref, index) => (
                   <div key={`pub-ref-${index}`} className="tag-item">
                     <span className="tag-text">{ref}</span>
                     <button 
                       type="button"
                       className="tag-remove"
                       onClick={() => handleRemoveTag('publicationReferences', index)}
                     >
                       ×
                     </button>
                   </div>
                 ))}
               </div>
               <div className="field-hint">Press Enter or click + to add</div>
             </div>
           </div>

           {/* Language [1,∞] - Required, multiple values */}
           <div className="form-group">
             <label htmlFor="language">
               Language <span className="field-indicator required-indicator">required, multiple values allowed</span>
             </label>
             <div className="tag-input-container">
               <div className="tag-input-row">
                 <input
                   type="text"
                   id="language"
                   value={languageInput}
                   onChange={(e) => setLanguageInput(e.target.value)}
                   onKeyPress={(e) => handleKeyPress(e, 'language', languageInput, setLanguageInput)}
                   placeholder="Enter language (e.g., en-US, de, fr)"
                 />
                 <button 
                   type="button" 
                   className="tag-add-button"
                   onClick={() => handleAddTag('language', languageInput, setLanguageInput)}
                 >
                   +
                 </button>
               </div>
               <div className="tag-list">
                 {formData.language.map((lang, index) => (
                   <div key={`language-${index}`} className="tag-item">
                     <span className="tag-text">{lang}</span>
                     <button 
                       type="button"
                       className="tag-remove"
                       onClick={() => handleRemoveTag('language', index)}
                     >
                       ×
                     </button>
                   </div>
                 ))}
               </div>
               <div className="field-hint">Press Enter or click + to add</div>
             </div>
           </div>

           {/* IRI Template [0,∞] - Optional, multiple values */}
           <div className="form-group">
             <label htmlFor="iriTemplate">
               IRI Template <span className="field-indicator optional-indicator">optional, multiple values allowed</span>
             </label>
             <div className="tag-input-container">
               <div className="tag-input-row">
                 <input
                   type="text"
                   id="iriTemplate"
                   value={iriTemplateInput}
                   onChange={(e) => setIriTemplateInput(e.target.value)}
                   onKeyPress={(e) => handleKeyPress(e, 'iriTemplate', iriTemplateInput, setIriTemplateInput)}
                   placeholder="Enter IRI template"
                 />
                 <button 
                   type="button" 
                   className="tag-add-button"
                   onClick={() => handleAddTag('iriTemplate', iriTemplateInput, setIriTemplateInput)}
                 >
                   +
                 </button>
               </div>
               <div className="tag-list">
                 {formData.iriTemplate.map((iri, index) => (
                   <div key={`iri-${index}`} className="tag-item">
                     <span className="tag-text">{iri}</span>
                     <button 
                       type="button"
                       className="tag-remove"
                       onClick={() => handleRemoveTag('iriTemplate', index)}
                     >
                       ×
                     </button>
                   </div>
                 ))}
               </div>
               <div className="field-hint">Press Enter or click + to add</div>
             </div>
           </div>

           {/* Linked Resources [0,∞] - Optional, multiple values */}
           <div className="form-group">
             <label htmlFor="linkedResources">
               Linked Resources <span className="field-indicator optional-indicator">optional, multiple values allowed</span>
             </label>
             <div className="tag-input-container">
               <div className="tag-input-row">
                 <input
                   type="text"
                   id="linkedResources"
                   value={linkedResourcesInput}
                   onChange={(e) => setLinkedResourcesInput(e.target.value)}
                   onKeyPress={(e) => handleKeyPress(e, 'linkedResources', linkedResourcesInput, setLinkedResourcesInput)}
                   placeholder="Enter linked resource"
                 />
                 <button 
                   type="button" 
                   className="tag-add-button"
                   onClick={() => handleAddTag('linkedResources', linkedResourcesInput, setLinkedResourcesInput)}
                 >
                   +
                 </button>
               </div>
               <div className="tag-list">
                 {formData.linkedResources.map((resource, index) => (
                   <div key={`linked-resource-${index}`} className="tag-item">
                     <span className="tag-text">{resource}</span>
                     <button 
                       type="button"
                       className="tag-remove"
                       onClick={() => handleRemoveTag('linkedResources', index)}
                     >
                       ×
                     </button>
                   </div>
                 ))}
               </div>
               <div className="field-hint">Press Enter or click + to add</div>
             </div>
           </div>

           {/* Example Resource [0,∞] - Optional, multiple values */}
           <div className="form-group">
             <label htmlFor="exampleResource">
               Example Resource <span className="field-indicator optional-indicator">optional, multiple values allowed</span>
             </label>
             <div className="tag-input-container">
               <div className="tag-input-row">
                 <input
                   type="text"
                   id="exampleResource"
                   value={exampleResourceInput}
                   onChange={(e) => setExampleResourceInput(e.target.value)}
                   onKeyPress={(e) => handleKeyPress(e, 'exampleResource', exampleResourceInput, setExampleResourceInput)}
                   placeholder="Enter example resource"
                 />
                 <button 
                   type="button" 
                   className="tag-add-button"
                   onClick={() => handleAddTag('exampleResource', exampleResourceInput, setExampleResourceInput)}
                 >
                   +
                 </button>
               </div>
               <div className="tag-list">
                 {formData.exampleResource.map((example, index) => (
                   <div key={`example-resource-${index}`} className="tag-item">
                     <span className="tag-text">{example}</span>
                     <button 
                       type="button"
                       className="tag-remove"
                       onClick={() => handleRemoveTag('exampleResource', index)}
                     >
                       ×
                     </button>
                   </div>
                 ))}
               </div>
               <div className="field-hint">Press Enter or click + to add</div>
             </div>
           </div>

           {/* Access Statement [1] - Required, single value */}
           <div className="form-group">
             <label htmlFor="accessStatement">
               Access Statement <span className="field-indicator required-indicator">required, 1 value only</span>
             </label>
             <textarea
               id="accessStatement"
               name="accessStatement"
               value={formData.accessStatement}
               onChange={handleChange}
               required
               rows="3"
             ></textarea>
           </div>

           {/* Source [0,∞] - Optional, multiple values */}
           <div className="form-group">
             <label htmlFor="source">
               Source <span className="field-indicator optional-indicator">optional, multiple values allowed</span>
             </label>
             <div className="tag-input-container">
               <div className="tag-input-row">
                 <input
                   type="text"
                   id="source"
                   value={sourceInput}
                   onChange={(e) => setSourceInput(e.target.value)}
                   onKeyPress={(e) => handleKeyPress(e, 'source', sourceInput, setSourceInput)}
                   placeholder="Enter source"
                 />
                 <button 
                   type="button" 
                   className="tag-add-button"
                   onClick={() => handleAddTag('source', sourceInput, setSourceInput)}
                 >
                   +
                 </button>
               </div>
               <div className="tag-list">
                 {formData.source.map((src, index) => (
                   <div key={`source-${index}`} className="tag-item">
                     <span className="tag-text">{src}</span>
                     <button 
                       type="button"
                       className="tag-remove"
                       onClick={() => handleRemoveTag('source', index)}
                     >
                       ×
                     </button>
                   </div>
                 ))}
               </div>
               <div className="field-hint">Press Enter or click + to add</div>
             </div>
           </div>

           {/* Name Space [0,∞] - Optional, multiple values */}
           <div className="form-group">
             <label htmlFor="nameSpace">
               Name Space <span className="field-indicator optional-indicator">optional, multiple values allowed</span>
             </label>
             <div className="tag-input-container">
               <div className="tag-input-row">
                 <input
                   type="text"
                   id="nameSpace"
                   value={nameSpaceInput}
                   onChange={(e) => setNameSpaceInput(e.target.value)}
                   onKeyPress={(e) => handleKeyPress(e, 'nameSpace', nameSpaceInput, setNameSpaceInput)}
                   placeholder="Enter name space"
                 />
                 <button 
                   type="button" 
                   className="tag-add-button"
                   onClick={() => handleAddTag('nameSpace', nameSpaceInput, setNameSpaceInput)}
                 >
                   +
                 </button>
               </div>
               <div className="tag-list">
                 {formData.nameSpace.map((ns, index) => (
                   <div key={`namespace-${index}`} className="tag-item">
                     <span className="tag-text">{ns}</span>
                     <button 
                       type="button"
                       className="tag-remove"
                       onClick={() => handleRemoveTag('nameSpace', index)}
                     >
                       ×
                     </button>
                   </div>
                 ))}
               </div>
               <div className="field-hint">Press Enter or click + to add</div>
             </div>
           </div>
         </form>
       </div>
       
       <div className="modal-footer">
         <button 
           className="cancel-button"
           onClick={onClose}
         >
           Cancel
         </button>
         <button 
           className="submit-button"
           onClick={handleSubmit}
           disabled={isSubmitting}
         >
           {isSubmitting ? 'Submitting...' : 'Submit'}
         </button>
       </div>
     </div>
   </div>
 );
}

export default ModalForm;
