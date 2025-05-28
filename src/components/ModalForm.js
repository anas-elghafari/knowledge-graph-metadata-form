import React, { useState, useEffect, useRef } from 'react';
import fieldInstructions from '../fieldInstructions';

function ModalForm({ onSubmit, onClose, initialFormData = null, onDraftSaved = null }) {
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

  const [formData, setFormData] = useState(initialFormData || initialFormState);
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

  const [createdDateError, setCreatedDateError] = useState('');
  const [publishedDateError, setPublishedDateError] = useState('');
  const [modifiedDateError, setModifiedDateError] = useState('');
  const [distReleaseDateError, setDistReleaseDateError] = useState('');
  const [distModificationDateError, setDistModificationDateError] = useState('');


  
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
    const [restAPIInput, setRestAPIInput] = useState('');
    const [sparqlEndpointInput, setSparqlEndpointInput] = useState('');
    const [exampleQueriesInput, setExampleQueriesInput] = useState('');




  useEffect(() => {
      if (initialFormData) {
        setFormData(initialFormData);
      }
    }, [initialFormData]);

    
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    
    // Re-enable scrolling when component unmounts
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);
  
  useEffect(() => {
    const labels = document.querySelectorAll('.form-group label');
    
    // Loop through each label
    labels.forEach(label => {
      // Get the 'for' attribute which connects to the input ID
      const fieldId = label.getAttribute('for');
      
      // If we have instructions for this field, add the tooltip
      if (fieldId && fieldInstructions[fieldId]) {
        label.setAttribute('data-tooltip', fieldInstructions[fieldId]);
        label.setAttribute('tabindex', '0'); // Make focusable for accessibility
      }
    });
  }, []);


  useEffect(() => {
    let timeoutId;
    if (message) {
      timeoutId = setTimeout(() => {
        setMessage(null);
      }, 20000);
    }
    return () => timeoutId && clearTimeout(timeoutId);
  }, [message]);



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

  const validateDateInput = (e) => {
    const { name, value } = e.target;
    let errorMessage = '';
    
    // Skip empty optional fields
    if (!value && name !== 'publishedDate') {
      e.target.setCustomValidity('');
      
      // Clear error for the specific field
      if (name === 'createdDate') setCreatedDateError('');
      else if (name === 'modifiedDate') setModifiedDateError('');
      else if (name === 'distReleaseDate') setDistReleaseDateError('');
      else if (name === 'distModificationDate') setDistModificationDateError('');
      
      return;
    }
    
    // Check if the value matches YYYY/MM/DD pattern
    const datePattern = /^\d{4}\/\d{2}\/\d{2}$/;
    if (!datePattern.test(value)) {
      errorMessage = 'Please use YYYY/MM/DD format';
      e.target.setCustomValidity(errorMessage);
      
      // Set error for the specific field
      if (name === 'createdDate') setCreatedDateError(errorMessage);
      else if (name === 'publishedDate') setPublishedDateError(errorMessage);
      else if (name === 'modifiedDate') setModifiedDateError(errorMessage);
      else if (name === 'distReleaseDate') setDistReleaseDateError(errorMessage);
      else if (name === 'distModificationDate') setDistModificationDateError(errorMessage);
      
      return;
    }
    
    // Parse date parts
    const parts = value.split('/');
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const day = parseInt(parts[2], 10);
    
    // Check year range (reasonable range)
    if (year < 1900 || year > 2100) {
      errorMessage = 'Year should be between 1900 and 2100';
      e.target.setCustomValidity(errorMessage);
      
      // Set error for the specific field
      if (name === 'createdDate') setCreatedDateError(errorMessage);
      else if (name === 'publishedDate') setPublishedDateError(errorMessage);
      else if (name === 'modifiedDate') setModifiedDateError(errorMessage);
      else if (name === 'distReleaseDate') setDistReleaseDateError(errorMessage);
      else if (name === 'distModificationDate') setDistModificationDateError(errorMessage);
      
      return;
    }
    
    // Check month range
    if (month < 1 || month > 12) {
      errorMessage = 'Month should be between 1 and 12';
      e.target.setCustomValidity(errorMessage);
      
      // Set error for the specific field
      if (name === 'createdDate') setCreatedDateError(errorMessage);
      else if (name === 'publishedDate') setPublishedDateError(errorMessage);
      else if (name === 'modifiedDate') setModifiedDateError(errorMessage);
      else if (name === 'distReleaseDate') setDistReleaseDateError(errorMessage);
      else if (name === 'distModificationDate') setDistModificationDateError(errorMessage);
      
      return;
    }
    
    // Check day range based on month
    const daysInMonth = [
      31, // January
      isLeapYear(year) ? 29 : 28, // February (leap year check)
      31, // March
      30, // April
      31, // May
      30, // June
      31, // July
      31, // August
      30, // September
      31, // October
      30, // November
      31  // December
    ];
    
    if (day < 1 || day > daysInMonth[month - 1]) {
      errorMessage = `Day should be between 1 and ${daysInMonth[month - 1]} for this month`;
      e.target.setCustomValidity(errorMessage);
      
      // Set error for the specific field
      if (name === 'createdDate') setCreatedDateError(errorMessage);
      else if (name === 'publishedDate') setPublishedDateError(errorMessage);
      else if (name === 'modifiedDate') setModifiedDateError(errorMessage);
      else if (name === 'distReleaseDate') setDistReleaseDateError(errorMessage);
      else if (name === 'distModificationDate') setDistModificationDateError(errorMessage);
      
      return;
    }
    
    // Final check: Create date object and verify
    const date = new Date(year, month - 1, day);
    if (
      isNaN(date.getTime()) || 
      date.getFullYear() !== year || 
      date.getMonth() !== month - 1 || 
      date.getDate() !== day
    ) {
      errorMessage = 'Invalid date';
      e.target.setCustomValidity(errorMessage);
      
      // Set error for the specific field
      if (name === 'createdDate') setCreatedDateError(errorMessage);
      else if (name === 'publishedDate') setPublishedDateError(errorMessage);
      else if (name === 'modifiedDate') setModifiedDateError(errorMessage);
      else if (name === 'distReleaseDate') setDistReleaseDateError(errorMessage);
      else if (name === 'distModificationDate') setDistModificationDateError(errorMessage);
      
      return;
    }
    
    // Reset validation if all checks pass
    e.target.setCustomValidity('');
    
    // Clear error for the specific field
    if (name === 'createdDate') setCreatedDateError('');
    else if (name === 'publishedDate') setPublishedDateError('');
    else if (name === 'modifiedDate') setModifiedDateError('');
    else if (name === 'distReleaseDate') setDistReleaseDateError('');
    else if (name === 'distModificationDate') setDistModificationDateError('');
  };
  
  

  const isLeapYear = (year) => {
    return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
  };
  
  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    
    if (/^\d{4}\/\d{2}\/\d{2}$/.test(dateString)) {
      return dateString;
    }
    
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return dateString.replace(/-/g, '/');
    }
    
    //try to parse and format
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      
      return `${year}/${month}/${day}`;
    } catch (e) {
      return '';
    }
  };
  
  const convertToISODate = (dateString) => {
    if (!dateString) return '';
    
    if (/^\d{4}\/\d{2}\/\d{2}$/.test(dateString)) {
      return dateString.replace(/\//g, '-');
    }
    
    return dateString;
  };

  
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
    // Create a copy of the current form data that we'll update
    let updatedFormData = {...formData};
    
    // Handle all tag input fields
    if (identifierInput.trim()) {
      updatedFormData = {
        ...updatedFormData,
        identifier: [...updatedFormData.identifier, identifierInput.trim()]
      };
    }
    
    if (typeInput.trim()) {
      updatedFormData = {
        ...updatedFormData,
        type: [...updatedFormData.type, typeInput.trim()]
      };
    }
    
    if (alternativeTitleInput.trim()) {
      updatedFormData = {
        ...updatedFormData,
        alternativeTitle: [...updatedFormData.alternativeTitle, alternativeTitleInput.trim()]
      };
    }
    
    if (acronymInput.trim()) {
      updatedFormData = {
        ...updatedFormData,
        acronym: [...updatedFormData.acronym, acronymInput.trim()]
      };
    }
    
    if (homepageURLInput.trim()) {
      updatedFormData = {
        ...updatedFormData,
        homepageURL: [...updatedFormData.homepageURL, homepageURLInput.trim()]
      };
    }
    
    if (otherPagesInput.trim()) {
      updatedFormData = {
        ...updatedFormData,
        otherPages: [...updatedFormData.otherPages, otherPagesInput.trim()]
      };
    }
    
    if (modifiedDateInput) {
      updatedFormData = {
        ...updatedFormData,
        modifiedDate: [...updatedFormData.modifiedDate, modifiedDateInput]
      };
    }
    
    if (primaryReferenceDocInput.trim()) {
      updatedFormData = {
        ...updatedFormData,
        primaryReferenceDocument: [...updatedFormData.primaryReferenceDocument, primaryReferenceDocInput.trim()]
      };
    }
    
    if (statisticsInput.trim()) {
      updatedFormData = {
        ...updatedFormData,
        statistics: [...updatedFormData.statistics, statisticsInput.trim()]
      };
    }
    
    if (keywordsInput.trim()) {
      updatedFormData = {
        ...updatedFormData,
        keywords: [...updatedFormData.keywords, keywordsInput.trim()]
      };
    }
    
    if (categoryInput.trim()) {
      updatedFormData = {
        ...updatedFormData,
        category: [...updatedFormData.category, categoryInput.trim()]
      };
    }
    
    if (publicationReferencesInput.trim()) {
      updatedFormData = {
        ...updatedFormData,
        publicationReferences: [...updatedFormData.publicationReferences, publicationReferencesInput.trim()]
      };
    }
    
    if (languageInput.trim()) {
      updatedFormData = {
        ...updatedFormData,
        language: [...updatedFormData.language, languageInput.trim()]
      };
    }
    
    if (iriTemplateInput.trim()) {
      updatedFormData = {
        ...updatedFormData,
        iriTemplate: [...updatedFormData.iriTemplate, iriTemplateInput.trim()]
      };
    }
    
    if (linkedResourcesInput.trim()) {
      updatedFormData = {
        ...updatedFormData,
        linkedResources: [...updatedFormData.linkedResources, linkedResourcesInput.trim()]
      };
    }
    
    if (exampleResourceInput.trim()) {
      updatedFormData = {
        ...updatedFormData,
        exampleResource: [...updatedFormData.exampleResource, exampleResourceInput.trim()]
      };
    }
    
    if (sourceInput.trim()) {
      updatedFormData = {
        ...updatedFormData,
        source: [...updatedFormData.source, sourceInput.trim()]
      };
    }
    
    if (nameSpaceInput.trim()) {
      updatedFormData = {
        ...updatedFormData,
        nameSpace: [...updatedFormData.nameSpace, nameSpaceInput.trim()]
      };
    }
  
    if (vocabulariesUsedInput.trim()) {
      updatedFormData = {
        ...updatedFormData,
        vocabulariesUsed: [...updatedFormData.vocabulariesUsed, vocabulariesUsedInput.trim()]
      };
    }
    
    if (metadataSchemaInput.trim()) {
      updatedFormData = {
        ...updatedFormData,
        metadataSchema: [...updatedFormData.metadataSchema, metadataSchemaInput.trim()]
      };
    }
    
    
    if (restAPIInput.trim()) {
      updatedFormData = {
        ...updatedFormData,
        restAPI: [...updatedFormData.restAPI, restAPIInput.trim()]
      };
    }
    
    if (sparqlEndpointInput.trim()) {
      updatedFormData = {
        ...updatedFormData,
        sparqlEndpoint: [...updatedFormData.sparqlEndpoint, sparqlEndpointInput.trim()]
      };
    }
    
    if (exampleQueriesInput.trim()) {
      updatedFormData = {
        ...updatedFormData,
        exampleQueries: [...updatedFormData.exampleQueries, exampleQueriesInput.trim()]
      };
    }
    
    // Check if current distribution is partially filled and valid
    const currDist = currentDistribution;
    if (currDist.title || currDist.description || currDist.mediaType || 
        currDist.downloadURL || currDist.accessURL) {
      // Only add the distribution if it has the required fields
      if (currDist.title && currDist.description && currDist.mediaType && 
          currDist.downloadURL && currDist.accessURL) {
        updatedFormData = {
          ...updatedFormData,
          distributions: [...updatedFormData.distributions, {...currDist}]
        };
      }
    }
    
    // Update the state with all changes
    setFormData(updatedFormData);
    
    // Return the updated form data for immediate use
    return updatedFormData;
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





  const validateDateField = (fieldName, dateValue) => {
    if (!dateValue) {
      // For required fields, this would be caught later
      return true;
    }
    
    if (!isValidDate(dateValue)) {
      // Create a synthetic event to pass to validateDateInput
      const syntheticEvent = {
        target: {
          name: fieldName,
          value: dateValue,
          setCustomValidity: () => {} // Mock function
        }
      };
      
      validateDateInput(syntheticEvent);
      return false;
    }
    
    return true;
  };
  
  // Helper function to check if a date string is valid
  const isValidDate = (dateString) => {
    // Skip empty values
    if (!dateString) return true;
    
    // Check format
    const datePattern = /^\d{4}\/\d{2}\/\d{2}$/;
    if (!datePattern.test(dateString)) {
      return false;
    }
    
    // Parse date parts
    const parts = dateString.split('/');
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const day = parseInt(parts[2], 10);
    
    // Check ranges
    if (year < 1990 || year > 2030) return false;
    if (month < 1 || month > 12) return false;
    
    // Check days in month
    const daysInMonth = [
      31, isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31
    ];
    
    if (day < 1 || day > daysInMonth[month - 1]) return false;
    
    return true;
  };



  const handleDatePickerChange = (e, targetFieldName) => {
    const selectedDate = e.target.value; // This will be in YYYY-MM-DD format
    
    // Convert from YYYY-MM-DD to YYYY/MM/DD
    const formattedDate = selectedDate.replace(/-/g, '/');
    
    // Set the value in the appropriate field based on targetFieldName
    if (targetFieldName === 'createdDate') {
      // For direct form fields
      setFormData({
        ...formData,
        createdDate: formattedDate
      });
    } else if (targetFieldName === 'publishedDate') {
      setFormData({
        ...formData,
        publishedDate: formattedDate
      });
    } else if (targetFieldName === 'modifiedDate') {
      // For the modified date input
      setModifiedDateInput(formattedDate);
    } else if (targetFieldName === 'distReleaseDate') {
      // For distribution date fields
      setCurrentDistribution({
        ...currentDistribution,
        releaseDate: formattedDate
      });
    } else if (targetFieldName === 'distModificationDate') {
      setCurrentDistribution({
        ...currentDistribution,
        modificationDate: formattedDate
      });
    }
    
    // Validate the date after setting it
    setTimeout(() => {
      const syntheticEvent = {
        target: {
          name: targetFieldName,
          value: formattedDate,
          setCustomValidity: () => {}
        }
      };
      validateDateInput(syntheticEvent);
    }, 0);
  };


  const formatDatesForSubmission = (formData) => {
    const updatedForm = { ...formData };
    
    // Format single date fields
    if (updatedForm.createdDate) {
      updatedForm.createdDate = convertToISODate(updatedForm.createdDate);
    }
    
    if (updatedForm.publishedDate) {
      updatedForm.publishedDate = convertToISODate(updatedForm.publishedDate);
    }
    
    // Format date arrays
    if (updatedForm.modifiedDate && updatedForm.modifiedDate.length > 0) {
      updatedForm.modifiedDate = updatedForm.modifiedDate.map(date => 
        convertToISODate(date)
      );
    }
    
    // Format dates in distributions
    if (updatedForm.distributions && updatedForm.distributions.length > 0) {
      updatedForm.distributions = updatedForm.distributions.map(dist => {
        const newDist = { ...dist };
        if (newDist.releaseDate) {
          newDist.releaseDate = convertToISODate(newDist.releaseDate);
        }
        if (newDist.modificationDate) {
          newDist.modificationDate = convertToISODate(newDist.modificationDate);
        }
        return newDist;
      });
    }
    
    return updatedForm;
  };
  
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const updatedForm = addPendingTagInputs();
    
    // Separate arrays for different types of errors
    const missingFields = [];
    const invalidDates = [];
    
    // Check for missing required fields (including dates)
    if (!updatedForm.title) missingFields.push('Title');
    if (!updatedForm.description) missingFields.push('Description'); 
    if (updatedForm.type.length === 0) missingFields.push('Type');
    if (!updatedForm.publishedDate) missingFields.push('Published Date');
    if (updatedForm.distributions.length === 0) missingFields.push('Distribution');
    if (updatedForm.primaryReferenceDocument.length === 0) missingFields.push('Primary Reference Document');
    if (updatedForm.keywords.length === 0) missingFields.push('Keywords');
    if (updatedForm.language.length === 0) missingFields.push('Language');
    if (!updatedForm.accessStatement) missingFields.push('Access Statement');
    if (updatedForm.vocabulariesUsed.length === 0) missingFields.push('Vocabularies Used');
    if (updatedForm.metadataSchema.length === 0) missingFields.push('Metadata Schema');
    
    // Check for invalid dates (only for dates that are filled)
    if (createdDateError && updatedForm.createdDate) invalidDates.push(`Created Date: ${createdDateError}`);
    if (publishedDateError && updatedForm.publishedDate) invalidDates.push(`Published Date: ${publishedDateError}`);
    if (modifiedDateError && updatedForm.modifiedDate.length > 0) invalidDates.push(`Modified Date: ${modifiedDateError}`);
    if (distReleaseDateError) invalidDates.push(`Distribution Release Date: ${distReleaseDateError}`);
    if (distModificationDateError) invalidDates.push(`Distribution Modification Date: ${distModificationDateError}`);
    
    // For optional date fields that have values, validate them
    if (updatedForm.createdDate) {
      const e = {
        target: {
          name: 'createdDate',
          value: updatedForm.createdDate,
          setCustomValidity: () => {}
        }
      };
      validateDateInput(e);
      if (createdDateError) {
        invalidDates.push(`Created Date: ${createdDateError}`);
      }
    }

    // Construct error message
    let errorMessage = '';
    
    if (missingFields.length > 0) {
      errorMessage += `The following fields are required but have not been filled: ${missingFields.join(', ')}`;
    }
    
    if (invalidDates.length > 0) {
      if (errorMessage) errorMessage += '\n\n';
      errorMessage += `The following dates are invalid:\n${invalidDates.join('\n')}`;
    }

    if (errorMessage) {
      setMessage(errorMessage);
      setIsSubmitting(false);
      return;
    }
    
    // Proceed with submission
    setIsSubmitting(true);
    setMessage('');
    
    try {
      // Submit form data to parent component
      const result = await onSubmit(updatedForm);
      
      if (result.success) {
        setMessage('Form submitted successfully!');
        setTimeout(() => {
          setMessage('');
          onClose();
        }, 3000);
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


  // handle key press in tag input fields
  const handleKeyPress = (e, fieldName, inputValue, setInputFunc) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag(fieldName, inputValue, setInputFunc);
    }
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toISOString().split('T')[0]; //YYYY-MM-DD
    } catch (e) {
      return dateString;
    }
  };


  const handleSaveDraft = () => {
    // First add any pending tag inputs
    const updatedForm = addPendingTagInputs();
    
    
    const existingDraftId = updatedForm.draftId || null;
    const draftId = existingDraftId || `draft-${Date.now()}`;
    const draft = {
      id: draftId,
      name: updatedForm.title || 'Untitled Draft',
      date: new Date().toISOString(),
      formData: {
        ...updatedForm,
        draftId: draftId // Store the draft ID in the form data
      }
    };
    
    // Get existing drafts from localStorage
    let savedDrafts = [];
    try {
      const draftsString = localStorage.getItem('kg-metadata-drafts');
      if (draftsString) {
        savedDrafts = JSON.parse(draftsString);
      }
    } catch (error) {
      console.error('Error loading saved drafts:', error);
    }
    
    
    if (existingDraftId) {
      savedDrafts = savedDrafts.filter(d => d.id !== existingDraftId);
    }
    
    
    savedDrafts.push(draft);
    localStorage.setItem('kg-metadata-drafts', JSON.stringify(savedDrafts));
    
    
    setMessage('Draft saved successfully!');
    setTimeout(() => setMessage(''), 2000);

    if (onDraftSaved) {
      onDraftSaved();
    }
    setTimeout(() => {
      onClose();
    }, 2000); 
  };


  return (
    <div className="modal-overlay">
      <div className="modal-content" onClick={e => e.stopPropagation()}>

      {message && (
        <div className="floating-message">
          <div className={message.includes('success') ? 'success-message' : 'error-message'}>
            <div className="message-content">{message}</div>
            <button 
              type="button" 
              className="message-close-button" 
              onClick={() => setMessage(null)} 
              aria-label="Dismiss message"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
        <div className="modal-header">
          <h2>Knowledge Graph Metadata</h2>
          <button className="modal-close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body" onClick={(e) => e.stopPropagation()}>
          
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
              <div className="date-input-container">
                <input
                  type="text"
                  id="createdDate"
                  name="createdDate"
                  value={formData.createdDate}
                  onChange={handleChange}
                  onBlur={validateDateInput}
                  placeholder="YYYY/MM/DD"
                  className={`date-input ${createdDateError ? 'date-input-error' : ''}`}
                />
                <input
                  type="date"
                  className="date-picker-control"
                  onChange={(e) => handleDatePickerChange(e, 'createdDate')}
                  aria-label="Date picker for Created Date"
                />
              </div>
              {createdDateError && <div className="date-error-message">{createdDateError}</div>}
            </div>
            

            <div className="form-group">
              <label htmlFor="modifiedDate">
                Modified Date <span className="field-indicator optional-indicator">optional, multiple values allowed</span>
              </label>
              <div className="tag-input-container">
                <div className="tag-input-row">
                  <input
                    type="text"
                    id="modifiedDate"
                    name="modifiedDate"
                    value={modifiedDateInput}
                    onChange={(e) => setModifiedDateInput(e.target.value)}
                    onBlur={validateDateInput}
                    placeholder="YYYY/MM/DD"
                    className={`date-input ${modifiedDateError ? 'date-input-error' : ''}`}
                  />
                  <input
                    type="date"
                    className="date-picker-control"
                    onChange={(e) => handleDatePickerChange(e, 'modifiedDate')}
                    aria-label="Date picker for Modified Date"
                  />
                  <button 
                    type="button" 
                    className="tag-add-button"
                    onClick={handleAddDate}
                    disabled={!modifiedDateInput || modifiedDateError}
                  >
                    +
                  </button>
                </div>
                {modifiedDateError && <div className="date-error-message">{modifiedDateError}</div>}
                <div className="tag-list">
                  {formData.modifiedDate.map((date, index) => (
                    <div key={`modified-date-${index}`} className="tag-item">
                      <span className="tag-text date-tag">{date}</span>
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
                <div className="field-hint">Enter date in YYYY/MM/DD format or use the date picker</div>
              </div>
            </div>

                        
            <div className="form-group">
              <label htmlFor="publishedDate">
                Published Date <span className="field-indicator required-indicator">required, 1 value only</span>
              </label>
              <div className="date-input-container">
                <input
                  type="text"
                  id="publishedDate"
                  name="publishedDate"
                  value={formData.publishedDate}
                  onChange={handleChange}
                  onBlur={validateDateInput}
                  placeholder="YYYY/MM/DD"
                  required
                  className={`date-input ${publishedDateError ? 'date-input-error' : ''}`}
                />
                <input
                  type="date"
                  className="date-picker-control"
                  onChange={(e) => handleDatePickerChange(e, 'publishedDate')}
                  aria-label="Date picker for Published Date"
                />
              </div>
              {publishedDateError && <div className="date-error-message">{publishedDateError}</div>}
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
                   <div className="distribution-actions">
                        <button 
                          type="button"
                          className="edit-button"
                          onClick={() => {
                            setCurrentDistribution({...dist});
                            handleRemoveDistribution(index);
                            document.querySelector('.distribution-form').scrollIntoView({ behavior: 'smooth' });
                          }}
                        >
                          Edit
                        </button>
                        <button 
                          type="button"
                          className="tag-remove"
                          onClick={() => handleRemoveDistribution(index)}
                        >
                          ×
                        </button>
                      </div>
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
              <div className="date-input-container">
                <input
                  type="text"
                  id="distReleaseDate"
                  name="distReleaseDate"
                  value={currentDistribution.releaseDate}
                  onChange={(e) => handleDistributionChange('releaseDate', e.target.value)}
                  onBlur={validateDateInput}
                  placeholder="YYYY/MM/DD"
                  className={`date-input subfield-input ${distReleaseDateError ? 'date-input-error' : ''}`}
                />
                <input
                  type="date"
                  className="date-picker-control"
                  onChange={(e) => handleDatePickerChange(e, 'distReleaseDate')}
                  aria-label="Date picker for Release Date"
                  defaultValue=""
                  tabIndex="-1"
                />
              </div>
              {distReleaseDateError && <div className="date-error-message">{distReleaseDateError}</div>}
            </div>

            <div className="form-group">
              <label htmlFor="distModificationDate">
                Update/Modification Date <span className="field-indicator optional-indicator">optional</span>
              </label>
              <div className="date-input-container">
                <input
                  type="text"
                  id="distModificationDate"
                  name="distModificationDate"
                  value={currentDistribution.modificationDate}
                  onChange={(e) => handleDistributionChange('modificationDate', e.target.value)}
                  onBlur={validateDateInput}
                  placeholder="YYYY/MM/DD"
                  className={`date-input subfield-input ${distModificationDateError ? 'date-input-error' : ''}`}
                />
                <input
                  type="date"
                  className="date-picker-control"
                  onChange={(e) => handleDatePickerChange(e, 'distModificationDate')}
                  aria-label="Date picker for Modification Date"
                  defaultValue=""
                  tabIndex="-1"
                />
              </div>
              {distModificationDateError && <div className="date-error-message">{distModificationDateError}</div>}
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
          className="save-draft-button"
        onClick={handleSaveDraft}
        >
          Save Draft
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
