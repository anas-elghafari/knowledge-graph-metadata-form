// src/components/ModalForm.js - Enhanced with fields from the spreadsheet
import React, { useState } from 'react';

function ModalForm({ onSubmit, onClose }) {
  const initialFormState = {
    // Required fields
    identifier: '', // [1..1] Identifier
    title: '', // [1..1] Title
    description: '', // [1..1] Description
    
    // Multiple entry fields
    alternativeTitle: [''], // [0..n] Alternative Title
    acronym: [''], // [0..n] Acronym
    homepageURL: [''], // [0..n] Homepage URL
    otherPages: [''], // [0..n] Other Pages
    
    // Roles (complex field with multiple entries)
    roles: [{ role: 'creator', agent: '' }], // Roles [Creator, publisher, etc]
    
    // Dates
    createdDate: '', // [0..1] Created Date
    modifiedDate: '', // [0..1] Modified Date
    publishedDate: '', // [1] Published Date
    
    // Vocabulary fields
    vocabulariesUsed: [''], // [1..n] Vocabularies used
    conformsTo: [''], // [0..n] Conforms to schema
    isSchema: false, // [0..1] Is schema
    isPrimaryReferenceDocument: false, // [1..n] Primary reference document
    
    // Complex fields
    distributions: [{ 
      title: '', 
      description: '', 
      mediaType: '',
      downloadURL: '',
      accessURL: '',
      // Optional fields
      accessService: '',
      byteSize: '',
      compressionFormat: '',
      format: '',
      hasPolicy: '',
      license: '',
      packagingFormat: '',
      releaseDate: '',
      rights: '',
      spatialResolution: '',
      temporalResolution: '',
      updateDate: ''
    }],
    
    // Additional fields
    language: [''], // [1..n] Language
    keywords: [''], // [1..n] Keywords
    category: [''], // [0..n] Category
    publicationReferences: [''], // [0..n] Publication/References
    accessStatement: '', // [1] Access Statement
    license: '', // [1] License
    version: '', // [1] Version
    
    // API related fields
    restAPI: [''], // [0..n] REST API
    sparqlEndpoint: [''], // [0..n] SPARQL endpoint
    exampleQueries: [''], // [0..n] Example queries
    exampleResources: [''], // [0..n] Example resources
    rdfTemplate: [''], // [0..1] RDF template
    linkedResources: [''], // [0..n] Linked resources
    source: [''], // [0..n] Source
    nameSpace: [''] // [0..n] Name space
  };

  const [formData, setFormData] = useState(initialFormState);
  const [currentSection, setCurrentSection] = useState('basic'); // For tab navigation
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [showDistributionDetails, setShowDistributionDetails] = useState(false);
  const [currentDistributionIndex, setCurrentDistributionIndex] = useState(0);

  // Handle simple field changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  // Handle array field changes
  const handleArrayChange = (e, index, fieldName) => {
    const { value } = e.target;
    const newArray = [...formData[fieldName]];
    newArray[index] = value;
    setFormData({
      ...formData,
      [fieldName]: newArray
    });
  };

  // Add a new item to an array field
  const addArrayItem = (fieldName) => {
    setFormData({
      ...formData,
      [fieldName]: [...formData[fieldName], '']
    });
  };

  // Remove an item from an array field
  const removeArrayItem = (index, fieldName) => {
    const newArray = [...formData[fieldName]];
    newArray.splice(index, 1);
    setFormData({
      ...formData,
      [fieldName]: newArray
    });
  };

  // Handle distribution field changes
  const handleDistributionChange = (e, index, field) => {
    const { value } = e.target;
    const newDistributions = [...formData.distributions];
    newDistributions[index] = {
      ...newDistributions[index],
      [field]: value
    };
    setFormData({
      ...formData,
      distributions: newDistributions
    });
  };

  // Add a new distribution
  const addDistribution = () => {
    setFormData({
      ...formData,
      distributions: [
        ...formData.distributions, 
        {
          title: '', 
          description: '', 
          mediaType: '',
          downloadURL: '',
          accessURL: '',
          accessService: '',
          byteSize: '',
          compressionFormat: '',
          format: '',
          hasPolicy: '',
          license: '',
          packagingFormat: '',
          releaseDate: '',
          rights: '',
          spatialResolution: '',
          temporalResolution: '',
          updateDate: ''
        }
      ]
    });
  };

  // Remove a distribution
  const removeDistribution = (index) => {
    const newDistributions = [...formData.distributions];
    newDistributions.splice(index, 1);
    setFormData({
      ...formData,
      distributions: newDistributions
    });
  };

  // Open distribution details modal
  const openDistributionDetails = (index) => {
    setCurrentDistributionIndex(index);
    setShowDistributionDetails(true);
  };

  // Close distribution details modal
  const closeDistributionDetails = () => {
    setShowDistributionDetails(false);
  };

  // Handle role field changes
  const handleRoleChange = (e, index, field) => {
    const { value } = e.target;
    const newRoles = [...formData.roles];
    newRoles[index] = {
      ...newRoles[index],
      [field]: value
    };
    setFormData({
      ...formData,
      roles: newRoles
    });
  };

  // Add a new role
  const addRole = () => {
    setFormData({
      ...formData,
      roles: [...formData.roles, { role: 'publisher', agent: '' }]
    });
  };

  // Remove a role
  const removeRole = (index) => {
    const newRoles = [...formData.roles];
    newRoles.splice(index, 1);
    setFormData({
      ...formData,
      roles: newRoles
    });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage('');
    
    try {
      // Basic validation
      if (!formData.identifier || !formData.title || !formData.description) {
        setMessage('Please fill in all required fields');
        setIsSubmitting(false);
        return;
      }
      
      // Distributions validation (required fields)
      const distributionsValid = formData.distributions.every(dist => 
        dist.title && dist.description && dist.mediaType && 
        dist.downloadURL && dist.accessURL
      );
      
      if (!distributionsValid) {
        setMessage('Please fill in all required fields in distributions');
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
  };

  // Render distribution details modal
  const renderDistributionDetails = () => {
    if (!showDistributionDetails) return null;
    
    const distribution = formData.distributions[currentDistributionIndex];
    
    return (
      <div className="modal-overlay" onClick={closeDistributionDetails}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h2>Distribution Details</h2>
            <button className="modal-close-button" onClick={closeDistributionDetails}>×</button>
          </div>
          
          <div className="modal-body">
            <h3>Required Fields</h3>
            <div className="form-group">
              <label htmlFor={`dist-title-${currentDistributionIndex}`}>
                Title <span className="required">(required)</span>
              </label>
              <input
                type="text"
                id={`dist-title-${currentDistributionIndex}`}
                value={distribution.title}
                onChange={(e) => handleDistributionChange(e, currentDistributionIndex, 'title')}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor={`dist-description-${currentDistributionIndex}`}>
                Description <span className="required">(required)</span>
              </label>
              <textarea
                id={`dist-description-${currentDistributionIndex}`}
                value={distribution.description}
                onChange={(e) => handleDistributionChange(e, currentDistributionIndex, 'description')}
                required
                rows="3"
              ></textarea>
            </div>
            
            <div className="form-group">
              <label htmlFor={`dist-mediaType-${currentDistributionIndex}`}>
                Media Type <span className="required">(required)</span>
              </label>
              <input
                type="text"
                id={`dist-mediaType-${currentDistributionIndex}`}
                value={distribution.mediaType}
                onChange={(e) => handleDistributionChange(e, currentDistributionIndex, 'mediaType')}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor={`dist-downloadURL-${currentDistributionIndex}`}>
                Download URL <span className="required">(required)</span>
              </label>
              <input
                type="url"
                id={`dist-downloadURL-${currentDistributionIndex}`}
                value={distribution.downloadURL}
                onChange={(e) => handleDistributionChange(e, currentDistributionIndex, 'downloadURL')}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor={`dist-accessURL-${currentDistributionIndex}`}>
                Access URL <span className="required">(required)</span>
              </label>
              <input
                type="url"
                id={`dist-accessURL-${currentDistributionIndex}`}
                value={distribution.accessURL}
                onChange={(e) => handleDistributionChange(e, currentDistributionIndex, 'accessURL')}
                required
              />
            </div>
            
            <h3>Optional Fields</h3>
            <div className="form-row">
              <div className="form-group half-width">
                <label htmlFor={`dist-accessService-${currentDistributionIndex}`}>
                  Access Service
                </label>
                <input
                  type="text"
                  id={`dist-accessService-${currentDistributionIndex}`}
                  value={distribution.accessService}
                  onChange={(e) => handleDistributionChange(e, currentDistributionIndex, 'accessService')}
                />
              </div>
              
              <div className="form-group half-width">
                <label htmlFor={`dist-byteSize-${currentDistributionIndex}`}>
                  Byte Size
                </label>
                <input
                  type="text"
                  id={`dist-byteSize-${currentDistributionIndex}`}
                  value={distribution.byteSize}
                  onChange={(e) => handleDistributionChange(e, currentDistributionIndex, 'byteSize')}
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group half-width">
                <label htmlFor={`dist-compressionFormat-${currentDistributionIndex}`}>
                  Compression Format
                </label>
                <input
                  type="text"
                  id={`dist-compressionFormat-${currentDistributionIndex}`}
                  value={distribution.compressionFormat}
                  onChange={(e) => handleDistributionChange(e, currentDistributionIndex, 'compressionFormat')}
                />
              </div>
              
              <div className="form-group half-width">
                <label htmlFor={`dist-format-${currentDistributionIndex}`}>
                  Format
                </label>
                <input
                  type="text"
                  id={`dist-format-${currentDistributionIndex}`}
                  value={distribution.format}
                  onChange={(e) => handleDistributionChange(e, currentDistributionIndex, 'format')}
                />
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor={`dist-hasPolicy-${currentDistributionIndex}`}>
                Has Policy
              </label>
              <input
                type="text"
                id={`dist-hasPolicy-${currentDistributionIndex}`}
                value={distribution.hasPolicy}
                onChange={(e) => handleDistributionChange(e, currentDistributionIndex, 'hasPolicy')}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor={`dist-license-${currentDistributionIndex}`}>
                License
              </label>
              <input
                type="text"
                id={`dist-license-${currentDistributionIndex}`}
                value={distribution.license}
                onChange={(e) => handleDistributionChange(e, currentDistributionIndex, 'license')}
              />
            </div>
            
            <div className="form-row">
              <div className="form-group half-width">
                <label htmlFor={`dist-packagingFormat-${currentDistributionIndex}`}>
                  Packaging Format
                </label>
                <input
                  type="text"
                  id={`dist-packagingFormat-${currentDistributionIndex}`}
                  value={distribution.packagingFormat}
                  onChange={(e) => handleDistributionChange(e, currentDistributionIndex, 'packagingFormat')}
                />
              </div>
              
              <div className="form-group half-width">
                <label htmlFor={`dist-releaseDate-${currentDistributionIndex}`}>
                  Release Date
                </label>
                <input
                  type="date"
                  id={`dist-releaseDate-${currentDistributionIndex}`}
                  value={distribution.releaseDate}
                  onChange={(e) => handleDistributionChange(e, currentDistributionIndex, 'releaseDate')}
                />
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor={`dist-rights-${currentDistributionIndex}`}>
                Rights
              </label>
              <input
                type="text"
                id={`dist-rights-${currentDistributionIndex}`}
                value={distribution.rights}
                onChange={(e) => handleDistributionChange(e, currentDistributionIndex, 'rights')}
              />
            </div>
            
            <div className="form-row">
              <div className="form-group half-width">
                <label htmlFor={`dist-spatialResolution-${currentDistributionIndex}`}>
                  Spatial Resolution
                </label>
                <input
                  type="text"
                  id={`dist-spatialResolution-${currentDistributionIndex}`}
                  value={distribution.spatialResolution}
                  onChange={(e) => handleDistributionChange(e, currentDistributionIndex, 'spatialResolution')}
                />
              </div>
              
              <div className="form-group half-width">
                <label htmlFor={`dist-temporalResolution-${currentDistributionIndex}`}>
                  Temporal Resolution
                </label>
                <input
                  type="text"
                  id={`dist-temporalResolution-${currentDistributionIndex}`}
                  value={distribution.temporalResolution}
                  onChange={(e) => handleDistributionChange(e, currentDistributionIndex, 'temporalResolution')}
                />
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor={`dist-updateDate-${currentDistributionIndex}`}>
                Update/Modification Date
              </label>
              <input
                type="date"
                id={`dist-updateDate-${currentDistributionIndex}`}
                value={distribution.updateDate}
                onChange={(e) => handleDistributionChange(e, currentDistributionIndex, 'updateDate')}
              />
            </div>
          </div>
          
          <div className="modal-footer">
            <button 
              className="cancel-button"
              onClick={closeDistributionDetails}
            >
              Close
            </button>
            <button 
              className="submit-button"
              onClick={closeDistributionDetails}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Navigation tabs for form sections
  const renderTabs = () => {
    return (
      <div className="form-tabs">
        <button 
          className={`tab-button ${currentSection === 'basic' ? 'active' : ''}`}
          onClick={() => setCurrentSection('basic')}
        >
          Basic Information
        </button>
        <button 
          className={`tab-button ${currentSection === 'metadata' ? 'active' : ''}`}
          onClick={() => setCurrentSection('metadata')}
        >
          Metadata
        </button>
        <button 
          className={`tab-button ${currentSection === 'api' ? 'active' : ''}`}
          onClick={() => setCurrentSection('api')}
        >
          API & Resources
        </button>
        <button 
          className={`tab-button ${currentSection === 'distributions' ? 'active' : ''}`}
          onClick={() => setCurrentSection('distributions')}
        >
          Distributions
        </button>
      </div>
    );
  };

  // Render the appropriate section based on currentSection
  const renderFormSection = () => {
    switch (currentSection) {
      case 'basic':
        return renderBasicSection();
      case 'metadata':
        return renderMetadataSection();
      case 'api':
        return renderApiSection();
      case 'distributions':
        return renderDistributionsSection();
      default:
        return renderBasicSection();
    }
  };

  // Basic Information section
  const renderBasicSection = () => {
    return (
      <>
        <div className="form-group">
          <label htmlFor="identifier">
            Identifier <span className="required">(required)</span>
          </label>
          <input
            type="text"
            id="identifier"
            name="identifier"
            value={formData.identifier}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="title">
            Title <span className="required">(required)</span>
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
          <label htmlFor="description">
            Description <span className="required">(required)</span>
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
        
        {/* Alternative Titles */}
        <div className="form-group">
          <label>Alternative Title [0..n]</label>
          {formData.alternativeTitle.map((title, index) => (
            <div key={`alt-title-${index}`} className="array-item">
              <input
                type="text"
                value={title}
                onChange={(e) => handleArrayChange(e, index, 'alternativeTitle')}
              />
              <button 
                type="button" 
                className="remove-button"
                onClick={() => removeArrayItem(index, 'alternativeTitle')}
                disabled={formData.alternativeTitle.length <= 1}
              >
                -
              </button>
            </div>
          ))}
          <button 
            type="button" 
            className="add-button"
            onClick={() => addArrayItem('alternativeTitle')}
          >
            + Add Alternative Title
          </button>
        </div>
        
        {/* Acronym */}
        <div className="form-group">
          <label>Acronym [0..n]</label>
          {formData.acronym.map((acr, index) => (
            <div key={`acronym-${index}`} className="array-item">
              <input
                type="text"
                value={acr}
                onChange={(e) => handleArrayChange(e, index, 'acronym')}
              />
              <button 
                type="button" 
                className="remove-button"
                onClick={() => removeArrayItem(index, 'acronym')}
                disabled={formData.acronym.length <= 1}
              >
                -
              </button>
            </div>
          ))}
          <button 
            type="button" 
            className="add-button"
            onClick={() => addArrayItem('acronym')}
          >
            + Add Acronym
          </button>
        </div>
        
        {/* URLs */}
        <div className="form-group">
          <label>Homepage URL [0..n]</label>
          {formData.homepageURL.map((url, index) => (
            <div key={`homepage-${index}`} className="array-item">
              <input
                type="url"
                value={url}
                onChange={(e) => handleArrayChange(e, index, 'homepageURL')}
              />
              <button 
                type="button" 
                className="remove-button"
                onClick={() => removeArrayItem(index, 'homepageURL')}
                disabled={formData.homepageURL.length <= 1}
              >
                -
              </button>
            </div>
          ))}
          <button 
            type="button" 
            className="add-button"
            onClick={() => addArrayItem('homepageURL')}
          >
            + Add Homepage URL
          </button>
        </div>
        
        <div className="form-group">
          <label>Other Pages [0..n]</label>
          {formData.otherPages.map((page, index) => (
            <div key={`other-page-${index}`} className="array-item">
              <input
                type="url"
                value={page}
                onChange={(e) => handleArrayChange(e, index, 'otherPages')}
              />
              <button 
                type="button" 
                className="remove-button"
                onClick={() => removeArrayItem(index, 'otherPages')}
                disabled={formData.otherPages.length <= 1}
              >
                -
              </button>
            </div>
          ))}
          <button 
            type="button" 
            className="add-button"
            onClick={() => addArrayItem('otherPages')}
          >
            + Add Other Page
          </button>
        </div>
        
        {/* Roles */}
        <div className="form-group">
          <label>Roles [Creator, publisher, etc]</label>
          {formData.roles.map((role, index) => (
            <div key={`role-${index}`} className="array-item role-item">
              <select
                value={role.role}
                onChange={(e) => handleRoleChange(e, index, 'role')}
              >
                <option value="creator">Creator</option>
                <option value="publisher">Publisher</option>
                <option value="contributor">Contributor</option>
                <option value="rights-holder">Rights Holder</option>
                <option value="maintainer">Maintainer</option>
              </select>
              <input
                type="text"
                placeholder="Agent name"
                value={role.agent}
                onChange={(e) => handleRoleChange(e, index, 'agent')}
              />
              <button 
                type="button" 
                className="remove-button"
                onClick={() => removeRole(index)}
                disabled={formData.roles.length <= 1}
              >
                -
              </button>
            </div>
          ))}
          <button 
            type="button" 
            className="add-button"
            onClick={addRole}
          >
            + Add Role
          </button>
        </div>
      </>
    );
  };

  // Metadata section
  const renderMetadataSection = () => {
    return (
      <>
        {/* Dates */}
        <div className="form-row">
          <div className="form-group half-width">
            <label htmlFor="createdDate">Created Date [0..1]</label>
            <input
              type="date"
              id="createdDate"
              name="createdDate"
              value={formData.createdDate}
              onChange={handleChange}
            />
          </div>
          <div className="form-group half-width">
            <label htmlFor="modifiedDate">Modified Date [0..1]</label>
            <input
              type="date"
              id="modifiedDate"
              name="modifiedDate"
              value={formData.modifiedDate}
              onChange={handleChange}
            />
          </div>
        </div>
        
        <div className="form-group">
          <label htmlFor="publishedDate">
            Published Date <span className="required">(required)</span>
          </label>
          <input
            type="date"
            id="publishedDate"
            name="publishedDate"
            value={formData.publishedDate}
            onChange={handleChange}
            required
          />
        </div>
        
        {/* Vocabularies */}
        <div className="form-group">
          <label>Vocabularies used [1..n]</label>
          {formData.vocabulariesUsed.map((vocab, index) => (
            <div key={`vocab-${index}`} className="array-item">
              <input
                type="text"
                value={vocab}
                onChange={(e) => handleArrayChange(e, index, 'vocabulariesUsed')}
                required={index === 0}
              />
              <button 
                type="button" 
                className="remove-button"
                onClick={() => removeArrayItem(index, 'vocabulariesUsed')}
                disabled={formData.vocabulariesUsed.length <= 1}
              >
                -
              </button>
            </div>
          ))}
          <button 
            type="button" 
            className="add-button"
            onClick={() => addArrayItem('vocabulariesUsed')}
          >
            + Add Vocabulary
          </button>
        </div>
        
        <div className="form-group">
          <label>Conforms to schema [0..n]</label>
          {formData.conformsTo.map((schema, index) => (
            <div key={`schema-${index}`} className="array-item">
              <input
                type="text"
                value={schema}
                onChange={(e) => handleArrayChange(e, index, 'conformsTo')}
              />
              <button 
                type="button" 
                className="remove-button"
                onClick={() => removeArrayItem(index, 'conformsTo')}
                disabled={formData.conformsTo.length <= 1}
              >
                -
              </button>
            </div>
          ))}
          <button 
            type="button" 
            className="add-button"
            onClick={() => addArrayItem('conformsTo')}
          >
            + Add Schema
          </button>
        </div>
        
        <div className="form-row">
          <div className="form-group half-width">
            <label htmlFor="isSchema">Is schema [0..1]</label>
            <div className="checkbox-wrapper">
              <input
                type="checkbox"
                id="isSchema"
                name="isSchema"
                checked={formData.isSchema}
                onChange={handleChange}
              />
              <span className="checkbox-label">Is a schema</span>
            </div>
          </div>
          <div className="form-group half-width">
            <label htmlFor="isPrimaryReferenceDocument">Primary reference document [1..n]</label>
            <div className="checkbox-wrapper">
              <input
                type="checkbox"
                id="isPrimaryReferenceDocument"
                name="isPrimaryReferenceDocument"
                checked={formData.isPrimaryReferenceDocument}
                onChange={handleChange}
              />
              <span className="checkbox-label">Is primary reference</span>
            </div>
          </div>
        </div>
        
        {/* Keywords & Categories */}
        <div className="form-group">
          <label>Keywords [1..n]</label>
          {formData.keywords.map((keyword, index) => (
            <div key={`keyword-${index}`} className="array-item">
              <input
                type="text"
                value={keyword}
                onChange={(e) => handleArrayChange(e, index, 'keywords')}
                required={index === 0}
              />
              <button 
                type="button" 
                className="remove-button"
                onClick={() => removeArrayItem(index, 'keywords')}
                disabled={formData.keywords.length <= 1}
              >
                -
              </button>
            </div>
          ))}
          <button 
            type="button" 
            className="add-button"
            onClick={() => addArrayItem('keywords')}
          >
            + Add Keyword
          </button>
        </div>
        
        <div className="form-group">
          <label>Category [0..n]</label>
          {formData.category.map((cat, index) => (
            <div key={`category-${index}`} className="array-item">
              <input
                type="text"
                value={cat}
                onChange={(e) => handleArrayChange(e, index, 'category')}
              />
              <button 
                type="button" 
                className="remove-button"
                onClick={() => removeArrayItem(index, 'category')}
                disabled={formData.category.length <= 1}
              >
                -
              </button>
            </div>
          ))}
          <button 
            type="button" 
            className="add-button"
            onClick={() => addArrayItem('category')}
          >
            + Add Category
          </button>
        </div>
        
        {/* Publication References */}
        <div className="form-group">
          <label>Publication/References [0..n]</label>
          {formData.publicationReferences.map((ref, index) => (
            <div key={`pub-ref-${index}`} className="array-item">
              <input
                type="text"
                value={ref}
                onChange={(e) => handleArrayChange(e, index, 'publicationReferences')}
              />
              <button 
                type="button" 
                className="remove-button"
                onClick={() => removeArrayItem(index, 'publicationReferences')}
                disabled={formData.publicationReferences.length <= 1}
              >
                -
              </button>
            </div>
          ))}
          <button 
            type="button" 
            className="add-button"
            onClick={() => addArrayItem('publicationReferences')}
          >
            + Add Reference
          </button>
        </div>
        
        {/* Language */}
        <div className="form-group">
          <label>Language [1..n]</label>
          {formData.language.map((lang, index) => (
            <div key={`lang-${index}`} className="array-item">
              <input
                type="text"
                value={lang}
                onChange={(e) => handleArrayChange(e, index, 'language')}
                required={index === 0}
              />
              <button 
                type="button" 
                className="remove-button"
                onClick={() => removeArrayItem(index, 'language')}
                disabled={formData.language.length <= 1}
              >
                -
              </button>
            </div>
          ))}
          <button 
            type="button" 
            className="add-button"
            onClick={() => addArrayItem('language')}
          >
            + Add Language
          </button>
        </div>
      </>
    );
  };

  // API & Resources section
  const renderApiSection = () => {
    return (
      <>
        {/* REST API */}
        <div className="form-group">
          <label>REST API [0..n]</label>
          {formData.restAPI.map((api, index) => (
            <div key={`rest-api-${index}`} className="array-item">
              <input
                type="url"
                value={api}
                onChange={(e) => handleArrayChange(e, index, 'restAPI')}
              />
              <button 
                type="button" 
                className="remove-button"
                onClick={() => removeArrayItem(index, 'restAPI')}
                disabled={formData.restAPI.length <= 1}
              >
                -
              </button>
            </div>
          ))}
          <button 
            type="button" 
            className="add-button"
            onClick={() => addArrayItem('restAPI')}
          >
            + Add REST API
          </button>
        </div>
        
        {/* SPARQL Endpoint */}
        <div className="form-group">
          <label>SPARQL Endpoint [0..n]</label>
          {formData.sparqlEndpoint.map((endpoint, index) => (
            <div key={`sparql-${index}`} className="array-item">
              <input
                type="url"
                value={endpoint}
                onChange={(e) => handleArrayChange(e, index, 'sparqlEndpoint')}
              />
              <button 
                type="button" 
                className="remove-button"
                onClick={() => removeArrayItem(index, 'sparqlEndpoint')}
                disabled={formData.sparqlEndpoint.length <= 1}
              >
                -
              </button>
            </div>
          ))}
          <button 
            type="button" 
            className="add-button"
            onClick={() => addArrayItem('sparqlEndpoint')}
          >
            + Add SPARQL Endpoint
          </button>
        </div>
        
        {/* Example Queries */}
        <div className="form-group">
          <label>Example Queries [0..n]</label>
          {formData.exampleQueries.map((query, index) => (
            <div key={`query-${index}`} className="array-item">
              <textarea
                value={query}
                onChange={(e) => handleArrayChange(e, index, 'exampleQueries')}
                rows="2"
              ></textarea>
              <button 
                type="button" 
                className="remove-button"
                onClick={() => removeArrayItem(index, 'exampleQueries')}
                disabled={formData.exampleQueries.length <= 1}
              >
                -
              </button>
            </div>
          ))}
          <button 
            type="button" 
            className="add-button"
            onClick={() => addArrayItem('exampleQueries')}
          >
            + Add Example Query
          </button>
        </div>
        
        {/* RDF Template */}
        <div className="form-group">
          <label>RDF Template [0..1]</label>
          {formData.rdfTemplate.map((template, index) => (
            <div key={`template-${index}`} className="array-item">
              <textarea
                value={template}
                onChange={(e) => handleArrayChange(e, index, 'rdfTemplate')}
                rows="3"
              ></textarea>
              <button 
                type="button" 
                className="remove-button"
                onClick={() => removeArrayItem(index, 'rdfTemplate')}
                disabled={formData.rdfTemplate.length <= 1}
              >
                -
              </button>
            </div>
          ))}
        </div>
        
        {/* Linked Resources */}
        <div className="form-group">
          <label>Linked Resources [0..n]</label>
          {formData.linkedResources.map((resource, index) => (
            <div key={`linked-res-${index}`} className="array-item">
              <input
                type="text"
                value={resource}
                onChange={(e) => handleArrayChange(e, index, 'linkedResources')}
              />
              <button 
                type="button" 
                className="remove-button"
                onClick={() => removeArrayItem(index, 'linkedResources')}
                disabled={formData.linkedResources.length <= 1}
              >
                -
              </button>
            </div>
          ))}
          <button 
            type="button" 
            className="add-button"
            onClick={() => addArrayItem('linkedResources')}
          >
            + Add Linked Resource
          </button>
        </div>
        
        {/* Example Resources */}
        <div className="form-group">
          <label>Example Resources [0..n]</label>
          {formData.exampleResources.map((resource, index) => (
            <div key={`example-res-${index}`} className="array-item">
              <input
                type="text"
                value={resource}
                onChange={(e) => handleArrayChange(e, index, 'exampleResources')}
              />
              <button 
                type="button" 
                className="remove-button"
                onClick={() => removeArrayItem(index, 'exampleResources')}
                disabled={formData.exampleResources.length <= 1}
              >
                -
              </button>
            </div>
          ))}
          <button 
            type="button" 
            className="add-button"
            onClick={() => addArrayItem('exampleResources')}
          >
            + Add Example Resource
          </button>
        </div>
        
        {/* Access Statement, License, Version */}
        <div className="form-group">
          <label htmlFor="accessStatement">
            Access Statement <span className="required">(required)</span>
          </label>
          <textarea
            id="accessStatement"
            name="accessStatement"
            value={formData.accessStatement}
            onChange={handleChange}
            required
            rows="2"
          ></textarea>
        </div>
        
        <div className="form-group">
          <label htmlFor="license">
            License <span className="required">(required)</span>
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
        
        <div className="form-group">
          <label htmlFor="version">
            Version <span className="required">(required)</span>
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
        
        {/* Source & Namespace */}
        <div className="form-group">
          <label>Source [0..n]</label>
          {formData.source.map((src, index) => (
            <div key={`source-${index}`} className="array-item">
              <input
                type="text"
                value={src}
                onChange={(e) => handleArrayChange(e, index, 'source')}
              />
              <button 
                type="button" 
                className="remove-button"
                onClick={() => removeArrayItem(index, 'source')}
                disabled={formData.source.length <= 1}
              >
                -
              </button>
            </div>
          ))}
          <button 
            type="button" 
            className="add-button"
            onClick={() => addArrayItem('source')}
          >
            + Add Source
          </button>
        </div>
        
        <div className="form-group">
          <label>Name Space [0..n]</label>
          {formData.nameSpace.map((ns, index) => (
            <div key={`namespace-${index}`} className="array-item">
              <input
                type="text"
                value={ns}
                onChange={(e) => handleArrayChange(e, index, 'nameSpace')}
              />
              <button 
                type="button" 
                className="remove-button"
                onClick={() => removeArrayItem(index, 'nameSpace')}
                disabled={formData.nameSpace.length <= 1}
              >
                -
              </button>
            </div>
          ))}
          <button 
            type="button" 
            className="add-button"
            onClick={() => addArrayItem('nameSpace')}
          >
            + Add Namespace
          </button>
        </div>
      </>
    );
  };

  // Distributions section
  const renderDistributionsSection = () => {
    return (
      <>
        <div className="form-group">
          <label>Distributions <span className="required">(required)</span></label>
          <p className="field-description">
            Each distribution must include title, description, media type, download URL, and access URL.
          </p>
          
          <div className="distributions-list">
            {formData.distributions.map((dist, index) => (
              <div key={`dist-${index}`} className="distribution-item">
                <div className="distribution-header">
                  <span className="distribution-title">
                    {dist.title || `Distribution ${index + 1}`}
                  </span>
                  <div className="distribution-actions">
                    <button 
                      type="button" 
                      className="edit-button"
                      onClick={() => openDistributionDetails(index)}
                    >
                      Edit
                    </button>
                    <button 
                      type="button" 
                      className="remove-button"
                      onClick={() => removeDistribution(index)}
                      disabled={formData.distributions.length <= 1}
                    >
                      Remove
                    </button>
                  </div>
                </div>
                <div className="distribution-preview">
                  <div className="distribution-field">
                    <span className="field-label">Title:</span>
                    <span className="field-value">{dist.title || '(Not set)'}</span>
                  </div>
                  <div className="distribution-field">
                    <span className="field-label">Media Type:</span>
                    <span className="field-value">{dist.mediaType || '(Not set)'}</span>
                  </div>
                  <div className="distribution-field">
                    <span className="field-label">Download URL:</span>
                    <span className="field-value">{dist.downloadURL || '(Not set)'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <button 
            type="button" 
            className="add-button"
            onClick={addDistribution}
          >
            + Add Distribution
          </button>
        </div>
      </>
    );
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content large-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add Mapping</h2>
          <button className="modal-close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          {message && <div className={message.includes('success') ? 'success-message' : 'error-message'}>{message}</div>}
          
          {/* Tabs navigation */}
          {renderTabs()}
          
          <form onSubmit={handleSubmit}>
            {/* Form sections */}
            {renderFormSection()}
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
            {isSubmitting ? 'Creating...' : 'Create'}
          </button>
        </div>
      </div>
      
      {/* Distribution details modal */}
      {renderDistributionDetails()}
    </div>
  );
}

export default ModalForm;Name