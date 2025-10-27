import React, { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Parser } from 'n3';
import fieldInstructions from '../fieldInstructions';
import { getFieldSuggestions, getBulkFieldSuggestions, buildBulkSuggestionsPrompt, getBulkFieldSuggestionsWithCustomPrompt } from '../services/openai';
import CodeMirror from '@uiw/react-codemirror';
import { StreamLanguage } from '@codemirror/language';
import { turtle } from '@codemirror/legacy-modes/mode/turtle';
import mammoth from 'mammoth';


function ModalForm({ onSubmit, onClose, initialFormData = null, onDraftSaved = null, aiEnabledByDefault = false, turtleModeEnabled = false }) {
  console.log('ModalForm initialized with props:', { 
    aiEnabledByDefault, 
    turtleModeEnabled, 
    hasInitialFormData: !!initialFormData 
  });
  
  // Initial form state
  const initialFormState = {
    identifier: [uuidv4()], // Auto-generate UUID
    type: ['dcat:Dataset', 'void:Dataset'], // Both types checked by default
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
    
    // Roles array (replaces individual role objects)
    roles: [],
    
    // Other fields
    license: '',
    version: '', // No default version

    // Distributions array
    distributions: [],
    
    primaryReferenceDocument: [],
    metaGraph: [],
    kgSchema: [],
    statistics: [],
    vocabulariesUsed: [],
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
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [bypassValidation, setBypassValidation] = useState(true);
  // Track invalid tags with their error messages: { fieldName: { tagValue: errorMessage } }
  const [invalidTags, setInvalidTags] = useState({});
  // State for AI suggestions
  const [showAISuggestions, setShowAISuggestions] = useState(false); // Hidden by default, user can toggle
  const [aiSuggestions, setAiSuggestions] = useState({});
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [processingStartTime, setProcessingStartTime] = useState(null);
  const [processingDuration, setProcessingDuration] = useState(0);
  const [currentProcessingTime, setCurrentProcessingTime] = useState(0);
  const [activeField, setActiveField] = useState(null);
  const [openaiProcessingTime, setOpenaiProcessingTime] = useState(0);
  const [showScrollIndicator, setShowScrollIndicator] = useState(false);
  const [aiPanelExpanded, setAiPanelExpanded] = useState(false);
  const aiPanelContentRef = useRef(null);
  
  // Countdown timer state (20 minutes = 1200 seconds)
  const [timeRemaining, setTimeRemaining] = useState(1200);
  const [timerActive, setTimerActive] = useState(true);
  const [formOpenedAt] = useState(new Date().toISOString());
  const [autoSubmittedByTimer, setAutoSubmittedByTimer] = useState(false);
  
  // Session tracking - keeps history of all times form was opened/worked on
  const [currentSessionStart] = useState(new Date().toISOString());
  const [editSessions, setEditSessions] = useState([]);
  
  // Helper function to calculate current session duration in seconds
  const getCurrentSessionDuration = () => {
    return Math.round((new Date() - new Date(currentSessionStart)) / 1000);
  };
  
  // Helper function to get all sessions including current one
  const getAllSessions = () => {
    const currentSession = {
      startTime: currentSessionStart,
      endTime: new Date().toISOString(),
      durationSeconds: getCurrentSessionDuration()
    };
    return [...editSessions, currentSession];
  };
  
  // Helper function to calculate total time spent across all sessions
  const getTotalTimeSpent = () => {
    const allSessions = getAllSessions();
    return allSessions.reduce((total, session) => total + session.durationSeconds, 0);
  };
  
  // Turtle mode state
  const [turtleContent, setTurtleContent] = useState('');
  const [showTurtleMode, setShowTurtleMode] = useState(turtleModeEnabled);
  const [turtleValidation, setTurtleValidation] = useState({ isValid: true, errors: [] });
  
  // Debug: Track showTurtleMode changes
  useEffect(() => {
    console.log('showTurtleMode changed to:', showTurtleMode);
  }, [showTurtleMode]);
  
  // Modal resize state - default to 85% width and 90% height of viewport
  const [modalSize, setModalSize] = useState({ 
    width: Math.floor(window.innerWidth * 0.85), 
    height: Math.floor(window.innerHeight * 0.90) 
  });
  const [isResizing, setIsResizing] = useState(false);
  const resizeRef = useRef({ startX: 0, startY: 0, startWidth: 0, startHeight: 0 });
  
  const handleResizeStart = (e, direction) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    resizeRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startWidth: modalSize.width,
      startHeight: modalSize.height,
      direction
    };
  };
  
  useEffect(() => {
    if (!isResizing) return;
    
    const handleMouseMove = (e) => {
      const { startX, startY, startWidth, startHeight, direction } = resizeRef.current;
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;
      
      let newWidth = startWidth;
      let newHeight = startHeight;
      
      if (direction.includes('e')) {
        newWidth = Math.max(600, startWidth + deltaX);
      }
      if (direction.includes('w')) {
        newWidth = Math.max(600, startWidth - deltaX);
      }
      if (direction.includes('s')) {
        newHeight = Math.max(500, startHeight + deltaY);
      }
      if (direction.includes('n')) {
        newHeight = Math.max(500, startHeight - deltaY);
      }
      
      setModalSize({ width: newWidth, height: newHeight });
    };
    
    const handleMouseUp = () => {
      setIsResizing(false);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);
  
  // Turtle validation function - uses N3.js (works reliably in browsers, GitHub Pages compatible)
  const validateTurtleContent = (content) => {
    if (!content.trim()) {
      return { isValid: true, errors: [] }; // Empty content is valid (not required to validate)
    }
    
    // N3 supports both @prefix (Turtle) and PREFIX (SPARQL) syntax
    const parser = new Parser({ format: 'text/turtle' });
    let validationResult = { isValid: true, errors: [] };
    
    try {
      // Parse the content - callback is called synchronously for each quad or error
      parser.parse(content, (error, quad, prefixes) => {
        if (error) {
          console.error('N3 Parser error:', error);
          // Set result to invalid and add error
          validationResult.isValid = false;
          validationResult.errors.push({
            line: error.context?.line || 'unknown',
            column: error.context?.column || 'unknown',
            message: error.message || 'Turtle syntax error'
          });
          console.log('Error added, current errors:', validationResult.errors);
        }
      });
      
      console.log('N3 validation - final result:', validationResult);
      return validationResult;
      
    } catch (e) {
      console.error('N3 Parser exception:', e);
      return {
        isValid: false,
        errors: [{
          line: 'unknown',
          column: 'unknown',
          message: e.message || 'Turtle syntax error'
        }]
      };
    }
  };
  
  // Countdown timer effect
  useEffect(() => {
    if (!timerActive || timeRemaining <= 0) return;
    
    const intervalId = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          setTimerActive(false);
          setAutoSubmittedByTimer(true);
          // Show message before auto-submit
          setMessage('⏱️ Time expired! Form is being automatically submitted...');
          // Auto-submit when timer reaches zero
          setTimeout(() => {
            if (showTurtleMode) {
              handleTurtleSubmit();
            } else {
              // Create a synthetic event for handleSubmit
              const syntheticEvent = {
                preventDefault: () => {}
              };
              handleSubmit(syntheticEvent, true);
            }
          }, 100);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(intervalId);
  }, [timerActive, timeRemaining, showTurtleMode]);
  
  // Debounced turtle validation
  useEffect(() => {
    if (!showTurtleMode) return;
    
    const timeoutId = setTimeout(() => {
      console.log('Running validation on content:', turtleContent.substring(0, 50) + '...');
      const validation = validateTurtleContent(turtleContent);
      console.log('Validation result:', validation);
      setTurtleValidation(validation);
    }, 500); // 500ms debounce
    
    return () => clearTimeout(timeoutId);
  }, [turtleContent, showTurtleMode]);
  
  // Use aiEnabledByDefault prop to determine if this is LLM mode
  const isLlmMode = aiEnabledByDefault;

  // Ontology narrative description upload state
  const [narrativeFile, setNarrativeFile] = useState(null);
  const [narrativeContent, setNarrativeContent] = useState('');
  const [processingNarrative, setProcessingNarrative] = useState(false);
  const [bulkSuggestionsReady, setBulkSuggestionsReady] = useState(false);

  // State for prompt preview and editing
  const [showPromptPreview, setShowPromptPreview] = useState(false);
  const [isEditingPrompt, setIsEditingPrompt] = useState(false);
  const [editedPrompt, setEditedPrompt] = useState('');
  const [promptHasBeenEdited, setPromptHasBeenEdited] = useState(false);
  const [originalPrompt, setOriginalPrompt] = useState('');

  // Auto-show AI panel when narrative file is uploaded (LLM form), hide for normal entry
  useEffect(() => {
    console.log('=== AI PANEL VISIBILITY CHECK ===');
    console.log('isLlmMode:', isLlmMode);
    console.log('narrativeFile:', narrativeFile);
    console.log('Should show AI panel:', isLlmMode && narrativeFile);
    
    if (isLlmMode && narrativeFile) {
      console.log('Setting showAISuggestions to TRUE');
      setShowAISuggestions(true); // Show AI panel for LLM-assisted form
    } else {
      console.log('Setting showAISuggestions to FALSE');
      setShowAISuggestions(false); // Hide AI panel for normal manual entry
    }
  }, [narrativeFile, isLlmMode]);

  // Debug logging for AI suggestions state
  useEffect(() => {
    console.log('=== AI SUGGESTIONS STATE DEBUG ===');
    console.log('showAISuggestions:', showAISuggestions);
    console.log('bulkSuggestionsReady:', bulkSuggestionsReady);
    console.log('activeField:', activeField);
    console.log('aiSuggestions keys:', Object.keys(aiSuggestions));
    console.log('Number of suggestions:', Object.keys(aiSuggestions).length);
  }, [showAISuggestions, bulkSuggestionsReady, activeField, aiSuggestions]);

  // Detect if AI panel content is scrollable
  useEffect(() => {
    const checkScrollable = () => {
      const element = aiPanelContentRef.current;
      if (element) {
        const isScrollable = element.scrollHeight > element.clientHeight;
        const isNearBottom = element.scrollHeight - element.scrollTop - element.clientHeight < 30;
        setShowScrollIndicator(isScrollable && !isNearBottom);
      }
    };

    const element = aiPanelContentRef.current;
    if (element) {
      checkScrollable();
      element.addEventListener('scroll', checkScrollable);
      window.addEventListener('resize', checkScrollable);
      
      return () => {
        element.removeEventListener('scroll', checkScrollable);
        window.removeEventListener('resize', checkScrollable);
      };
    }
  }, [aiSuggestions, activeField, bulkSuggestionsReady]);

  // Function to generate prompt preview using the same prompt builder as the actual API call
  const generatePromptPreview = () => {
    // Build field definitions (same as processBulkSuggestions)
    const fieldDefinitions = [];
    
    // Get all simple string/text fields from formData
    Object.keys(formData).forEach(fieldName => {
      const fieldValue = formData[fieldName];
      const instruction = fieldInstructions[fieldName];
      
      if (instruction && (
        typeof fieldValue === 'string' || 
        (Array.isArray(fieldValue) && fieldValue.length === 0)
      )) {
        fieldDefinitions.push({
          name: fieldName,
          instruction: instruction
        });
      }
    });
    
    // Add special case fields
    fieldDefinitions.push({
      name: 'roles',
      instruction: 'Roles and responsibilities for this dataset (e.g., creator, publisher, funder)'
    });
    
    fieldDefinitions.push({
      name: 'distributions',
      instruction: 'Distribution information for the dataset including title, description, mediaType, downloadURL, accessURL, byteSize, license, rights, spatial/temporal resolution, and dates. Look for fields like "distributions", "download", "access", "files", or similar in the cheat sheet.'
    });
    
    fieldDefinitions.push({
      name: 'sparqlEndpoint',
      instruction: 'SPARQL endpoint information including endpointURL, identifier, title, description, and status. Look for fields like "sparql endpoint", "sparql", "query endpoint", or similar in the cheat sheet.'
    });
    
    fieldDefinitions.push({
      name: 'exampleResource',
      instruction: 'Example resource information including title, description, status, and accessURL. Look for fields like "example resource", "example", "sample resource", or similar in the cheat sheet.'
    });
    
    fieldDefinitions.push({
      name: 'linkedResources',
      instruction: 'Linked resources information including target and triples. Look for fields like "linked resources", "linkset", "links", or similar in the cheat sheet.'
    });
    
    // Add special case for license field with available options (same as processBulkSuggestions)
    if (formData.license === '') {
      const licenseOptions = [
        'https://opensource.org/licenses/MIT',
        'https://opensource.org/licenses/Apache-2.0',
        'https://opensource.org/licenses/GPL-3.0',
        'https://opensource.org/licenses/GPL-2.0',
        'https://opensource.org/licenses/LGPL-3.0',
        'https://opensource.org/licenses/BSD-3-Clause',
        'https://opensource.org/licenses/BSD-2-Clause',
        'https://opensource.org/licenses/ISC',
        'https://www.boost.org/LICENSE_1_0.txt',
        'https://opensource.org/licenses/Zlib',
        'http://www.wtfpl.net/',
        'https://opensource.org/licenses/AGPL-3.0',
        'https://opensource.org/licenses/MPL-2.0',
        'https://opensource.org/licenses/EPL-1.0',
        'https://opensource.org/licenses/EUPL-1.1',
        'https://opensource.org/licenses/MS-PL',
        'https://opensource.org/licenses/MS-RL',
        'https://opensource.org/licenses/CDDL-1.0',
        'https://opensource.org/licenses/Artistic-2.0',
        'https://opensource.org/licenses/AFL-3.0',
        'https://creativecommons.org/licenses/by/4.0/',
        'https://creativecommons.org/licenses/by-sa/4.0/',
        'https://creativecommons.org/licenses/by-nc/4.0/',
        'https://creativecommons.org/licenses/by-nc-sa/4.0/',
        'https://creativecommons.org/publicdomain/zero/1.0/',
        'https://unlicense.org/'
      ];
      
      fieldDefinitions.push({
        name: 'license',
        instruction: `License for the metadata. Available options: ${licenseOptions.join(', ')}. Match license names (MIT, Apache, GPL, etc.) or extract exact URLs from cheat sheet content.`
      });
    }
    
    // Use placeholder text if narrative not uploaded yet
    const contentForPreview = narrativeContent || 
      `[NARRATIVE FILE CONTENT - ${narrativeFile ? narrativeFile.name : 'No file uploaded'} - ${narrativeContent ? `${narrativeContent.length} characters` : '0 characters'}]`;
    
    // Use the same prompt builder function that's used for the actual API call
    return buildBulkSuggestionsPrompt(fieldDefinitions, contentForPreview);
  };

  // Function to get AI suggestion for a field
  const getAISuggestion = async (fieldName) => {
    try {
      setLoadingSuggestions(prev => ({ ...prev, [fieldName]: true }));
      setActiveField(fieldName);
      
      // Create context from current form data
      const context = formData.title || formData.description || 'Dataset metadata form';
      
      const suggestion = await getFieldSuggestions(fieldName, context, narrativeContent);
      setAiSuggestions(prev => ({ ...prev, [fieldName]: suggestion }));
    } catch (error) {
      console.error(`Error getting AI suggestion for ${fieldName}:`, error);
      setAiSuggestions(prev => ({ ...prev, [fieldName]: 'Error getting suggestion' }));
    } finally {
      setLoadingSuggestions(prev => ({ ...prev, [fieldName]: false }));
    }
  };

  // Helper function to render complex objects in card format
  const renderComplexFieldCard = (fieldType, data) => {
    const entries = [];
    
    // Define which fields to show for each type and in what order
    const fieldConfigs = {
      distributions: [
        { key: 'title', label: 'Title' },
        { key: 'description', label: 'Description' },
        { key: 'mediaType', label: 'Media Type' },
        { key: 'downloadURL', label: 'Download URL' },
        { key: 'accessURL', label: 'Access URL' },
        { key: 'byteSize', label: 'Size' },
        { key: 'license', label: 'License' }
      ],
      sparqlEndpoint: [
        { key: 'title', label: 'Title' },
        { key: 'endpointURL', label: 'Endpoint URL' },
        { key: 'endpointDescription', label: 'Description' },
        { key: 'status', label: 'Status' },
        { key: 'identifier', label: 'Identifier' }
      ],
      exampleResource: [
        { key: 'title', label: 'Title' },
        { key: 'description', label: 'Description' },
        { key: 'accessURL', label: 'Access URL' },
        { key: 'status', label: 'Status' }
      ],
      linkedResources: [
        { key: 'target', label: 'Target' },
        { key: 'triples', label: 'Number of Triples' }
      ]
    };
    
    const config = fieldConfigs[fieldType];
    if (!config) return null;
    
    // Extract and format fields
    config.forEach(({ key, label }) => {
      if (data[key]) {
        entries.push({ label, value: data[key] });
      }
    });
    
    if (entries.length === 0) return null;
    
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '8px',
        width: '100%'
      }}>
        {entries.map((entry, idx) => (
          <div key={idx} style={{ 
            display: 'flex',
            flexDirection: 'column',
            gap: '2px'
          }}>
            <div style={{ 
              fontSize: '0.75rem', 
              fontWeight: '600',
              color: 'var(--primary-blue)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              {entry.label}
            </div>
            <div style={{ 
              fontSize: '0.95rem',
              color: 'var(--dark-text)',
              wordBreak: 'break-word'
            }}>
              {entry.value}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Helper function to render JSON with syntax highlighting
  const renderJsonValue = (value) => {
    try {
      // Try to parse as JSON
      const parsed = JSON.parse(value);
      
      // Pretty print with syntax highlighting
      const formatValue = (val, indent = 0) => {
        const indentStr = '  '.repeat(indent);
        
        if (typeof val === 'object' && val !== null) {
          if (Array.isArray(val)) {
            return '[\n' + val.map(item => indentStr + '  ' + formatValue(item, indent + 1)).join(',\n') + '\n' + indentStr + ']';
          } else {
            const entries = Object.entries(val).map(([key, value]) => {
              return `${indentStr}  <span class="json-key">"${key}"</span>: <span class="json-value">${typeof value === 'string' ? '"' + value + '"' : formatValue(value, indent + 1)}</span>`;
            });
            return '{\n' + entries.join(',\n') + '\n' + indentStr + '}';
          }
        } else if (typeof val === 'string') {
          return `<span class="json-string">"${val}"</span>`;
        } else if (typeof val === 'number') {
          return `<span class="json-number">${val}</span>`;
        } else if (typeof val === 'boolean') {
          return `<span class="json-boolean">${val}</span>`;
        } else if (val === null) {
          return `<span class="json-null">null</span>`;
        }
        return String(val);
      };
      
      return <pre className="json-display" dangerouslySetInnerHTML={{ __html: formatValue(parsed) }} />;
    } catch (e) {
      // Not JSON, return as-is
      return value;
    }
  };

  // Function to populate field with selected suggestion (single or multiple values)
  const populateFieldWithSuggestion = (fieldName, value, suggestionIndex = null) => {
    // Special handling for roles field - populate the form fields for review
    if (fieldName === 'roles') {
      const rawData = aiSuggestions['roles_raw'];
      if (rawData && rawData.suggestions) {
        // If adding all, add directly to form data
        if (Array.isArray(value)) {
          rawData.suggestions.forEach(suggestion => {
            if (suggestion.roleData) {
              const roleData = suggestion.roleData;
              const newRole = {
                roleType: roleData.roleType,
                inputMode: roleData.mode === 'iri' ? 'agentIRI' : 'nameEmail',
                agent: roleData.mode === 'iri' ? (roleData.iri || '') : '',
                givenName: roleData.mode === 'name_mbox' ? (roleData.name || '') : '',
                email: roleData.mode === 'name_mbox' ? (roleData.email || '') : ''
              };
              setFormData(prev => ({
                ...prev,
                roles: [...prev.roles, newRole]
              }));
            }
          });
        } else {
          // Single suggestion - populate form fields for review/editing
          const suggestion = rawData.suggestions[suggestionIndex];
          console.log('Role suggestion clicked:', { suggestionIndex, suggestion, rawData });
          
          if (suggestion && suggestion.roleData) {
            const roleData = suggestion.roleData;
            console.log('Setting currentRole with roleData:', roleData);
            
            const newInputMode = roleData.mode === 'iri' ? 'agentIRI' : 'nameEmail';
            
            setCurrentRole({
              roleType: roleData.roleType || '',
              inputMode: newInputMode,
              agent: roleData.mode === 'iri' ? (roleData.iri || '') : '',
              givenName: roleData.mode === 'name_mbox' ? (roleData.name || '') : '',
              email: roleData.mode === 'name_mbox' ? (roleData.email || '') : ''
            });
            
            // Validate populated fields
            if (newInputMode === 'agentIRI') {
              const iriValue = roleData.iri || '';
              if (iriValue && iriValue.trim()) {
                const iriError = isValidIriString(iriValue);
                if (iriError) {
                  setCurrentRoleAgentError(iriError);
                  setCurrentRoleAgentValid(false);
                } else {
                  setCurrentRoleAgentError('');
                  setCurrentRoleAgentValid(true);
                }
              } else {
                setCurrentRoleAgentError('');
                setCurrentRoleAgentValid(false);
              }
              // Clear email validation for IRI mode
              setCurrentRoleEmailError('');
              setCurrentRoleEmailValid(false);
            } else {
              // nameEmail mode - validate email if present
              const emailValue = roleData.email || '';
              if (emailValue && emailValue.trim()) {
                const validation = isValidEmailFormat(emailValue);
                if (validation.isValid) {
                  setCurrentRoleEmailError('');
                  setCurrentRoleEmailValid(true);
                } else {
                  setCurrentRoleEmailError(validation.error);
                  setCurrentRoleEmailValid(false);
                }
              } else {
                setCurrentRoleEmailError('');
                setCurrentRoleEmailValid(false);
              }
              // Clear agent IRI validation for name/email mode
              setCurrentRoleAgentError('');
              setCurrentRoleAgentValid(false);
            }
            
            console.log('CurrentRole set to:', {
              roleType: roleData.roleType || '',
              inputMode: newInputMode,
              agent: roleData.mode === 'iri' ? (roleData.iri || '') : '',
              givenName: roleData.mode === 'name_mbox' ? (roleData.name || '') : '',
              email: roleData.mode === 'name_mbox' ? (roleData.email || '') : ''
            });
            
            // Scroll to the role form
            setTimeout(() => {
              const roleForm = document.querySelector('.role-form');
              if (roleForm) {
                roleForm.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
              }
            }, 100);
          } else {
            console.error('No roleData found in suggestion:', suggestion);
          }
        }
      }
      return;
    }
    
    // Special handling for distributions field - populate form for review or add directly
    if (fieldName === 'distributions') {
      const rawData = aiSuggestions['distributions_raw'];
      if (rawData && rawData.suggestions) {
        // If adding all, add directly to form data
        if (Array.isArray(value)) {
          rawData.suggestions.forEach(suggestion => {
            try {
              const distData = typeof suggestion.value === 'string' ? 
                JSON.parse(suggestion.value) : suggestion.value;
              
              const newDistribution = {
                title: distData.title || '',
                description: distData.description || '',
                mediaType: distData.mediaType || '',
                downloadURL: distData.downloadURL || '',
                accessURL: distData.accessURL || '',
                byteSize: distData.byteSize || '',
                license: distData.license || '',
                rights: distData.rights || '',
                accessService: distData.accessService || '',
                compressionFormat: distData.compressionFormat || '',
                packagingFormat: distData.packagingFormat || '',
                hasPolicy: distData.hasPolicy || '',
                spatialResolution: distData.spatialResolution || '',
                temporalResolution: distData.temporalResolution || '',
                releaseDate: distData.releaseDate || '',
                modificationDate: distData.modificationDate || '',
                issued: distData.issued || ''
              };
              
              setFormData(prev => ({
                ...prev,
                distributions: [...prev.distributions, newDistribution]
              }));
            } catch (error) {
              console.error('Error parsing distribution suggestion:', error);
            }
          });
        } else {
          // Single suggestion - populate form fields for review/editing
          try {
            const suggestion = rawData.suggestions[suggestionIndex];
            const distData = typeof suggestion.value === 'string' ? 
              JSON.parse(suggestion.value) : suggestion.value;
            
            setCurrentDistribution({
              title: distData.title || '',
              description: distData.description || '',
              mediaType: distData.mediaType || '',
              downloadURL: distData.downloadURL || '',
              accessURL: distData.accessURL || '',
              byteSize: distData.byteSize || '',
              license: distData.license || '',
              rights: distData.rights || '',
              accessService: distData.accessService || '',
              compressionFormat: distData.compressionFormat || '',
              packagingFormat: distData.packagingFormat || '',
              hasPolicy: distData.hasPolicy || '',
              spatialResolution: distData.spatialResolution || '',
              temporalResolution: distData.temporalResolution || '',
              releaseDate: distData.releaseDate || '',
              modificationDate: distData.modificationDate || '',
              issued: distData.issued || ''
            });
            // Scroll to the distribution form
            setTimeout(() => {
              const distForm = document.querySelector('.distribution-form');
              if (distForm) {
                distForm.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
              }
            }, 100);
          } catch (error) {
            console.error('Error parsing distribution suggestion:', error);
          }
        }
      }
      return;
    }
    
    // Special handling for SPARQL endpoint field - populate form for review or add directly
    if (fieldName === 'sparqlEndpoint') {
      const rawData = aiSuggestions['sparqlEndpoint_raw'];
      if (rawData && rawData.suggestions) {
        // If adding all, add directly to form data
        if (Array.isArray(value)) {
          rawData.suggestions.forEach(suggestion => {
            try {
              const endpointData = typeof suggestion.value === 'string' ? 
                JSON.parse(suggestion.value) : suggestion.value;
              
              const newEndpoint = {
                endpointURL: endpointData.endpointURL || '',
                identifier: endpointData.identifier || '',
                title: endpointData.title || '',
                endpointDescription: endpointData.endpointDescription || endpointData.description || '',
                status: endpointData.status || ''
              };
              
              setFormData(prev => ({
                ...prev,
                sparqlEndpoint: [...prev.sparqlEndpoint, newEndpoint]
              }));
            } catch (error) {
              console.error('Error parsing SPARQL endpoint suggestion:', error);
            }
          });
        } else {
          // Single suggestion - populate form fields for review/editing
          try {
            const suggestion = rawData.suggestions[suggestionIndex];
            const endpointData = typeof suggestion.value === 'string' ? 
              JSON.parse(suggestion.value) : suggestion.value;
            
            setCurrentSparqlEndpoint({
              endpointURL: endpointData.endpointURL || '',
              identifier: endpointData.identifier || '',
              title: endpointData.title || '',
              endpointDescription: endpointData.endpointDescription || endpointData.description || '',
              status: endpointData.status || ''
            });
            // Scroll to the SPARQL endpoint form
            setTimeout(() => {
              const sparqlForm = document.querySelector('.sparql-endpoint-form');
              if (sparqlForm) {
                sparqlForm.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
              }
            }, 100);
          } catch (error) {
            console.error('Error parsing SPARQL endpoint suggestion:', error);
          }
        }
      }
      return;
    }
    
    // Special handling for example resource field - populate form for review or add directly
    if (fieldName === 'exampleResource') {
      const rawData = aiSuggestions['exampleResource_raw'];
      if (rawData && rawData.suggestions) {
        // If adding all, add directly to form data
        if (Array.isArray(value)) {
          rawData.suggestions.forEach(suggestion => {
            try {
              const resourceData = typeof suggestion.value === 'string' ? 
                JSON.parse(suggestion.value) : suggestion.value;
              
              const newResource = {
                title: resourceData.title || '',
                description: resourceData.description || '',
                status: resourceData.status || '',
                accessURL: resourceData.accessURL || ''
              };
              
              setFormData(prev => ({
                ...prev,
                exampleResource: [...prev.exampleResource, newResource]
              }));
            } catch (error) {
              console.error('Error parsing example resource suggestion:', error);
            }
          });
        } else {
          // Single suggestion - populate form fields for review/editing
          try {
            const suggestion = rawData.suggestions[suggestionIndex];
            const resourceData = typeof suggestion.value === 'string' ? 
              JSON.parse(suggestion.value) : suggestion.value;
            
            setCurrentExampleResource({
              title: resourceData.title || '',
              description: resourceData.description || '',
              status: resourceData.status || '',
              accessURL: resourceData.accessURL || ''
            });
            // Scroll to the example resource form
            setTimeout(() => {
              const exampleForm = document.querySelector('.example-resource-form');
              if (exampleForm) {
                exampleForm.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
              }
            }, 100);
          } catch (error) {
            console.error('Error parsing example resource suggestion:', error);
          }
        }
      }
      return;
    }
    
    // Special handling for linked resources field - populate form for review or add directly
    if (fieldName === 'linkedResources') {
      const rawData = aiSuggestions['linkedResources_raw'];
      if (rawData && rawData.suggestions) {
        // If adding all, add directly to form data
        if (Array.isArray(value)) {
          rawData.suggestions.forEach(suggestion => {
            try {
              const linkData = typeof suggestion.value === 'string' ? 
                JSON.parse(suggestion.value) : suggestion.value;
              
              const newLinkedResource = {
                target: linkData.target || '',
                triples: linkData.triples || ''
              };
              
              setFormData(prev => ({
                ...prev,
                linkedResources: [...prev.linkedResources, newLinkedResource]
              }));
            } catch (error) {
              console.error('Error parsing linked resource suggestion:', error);
            }
          });
        } else {
          // Single suggestion - populate form fields for review/editing
          try {
            const suggestion = rawData.suggestions[suggestionIndex];
            const linkData = typeof suggestion.value === 'string' ? 
              JSON.parse(suggestion.value) : suggestion.value;
            
            setCurrentLinkedResource({
              target: linkData.target || '',
              triples: linkData.triples || ''
            });
            // Scroll to the linked resource form
            setTimeout(() => {
              const linkedForm = document.querySelector('.linked-resource-form');
              if (linkedForm) {
                linkedForm.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
              }
            }, 100);
          } catch (error) {
            console.error('Error parsing linked resource suggestion:', error);
          }
        }
      }
      return;
    }
    
    // Handle different field types
    if (fieldName === 'title' || fieldName === 'description') {
      setFormData(prev => ({ ...prev, [fieldName]: value }));
    } else if (fieldName === 'createdDate' || fieldName === 'publishedDate') {
      setFormData(prev => ({ ...prev, [fieldName]: value }));
    } else if (Array.isArray(formData[fieldName])) {
      // For array fields, value can be a single string or an array of strings
      const valuesToAdd = Array.isArray(value) ? value : [value];
      setFormData(prev => ({
        ...prev,
        [fieldName]: [...prev[fieldName], ...valuesToAdd.filter(v => !prev[fieldName].includes(v))]
      }));
    } else {
      // For other fields, set directly
      setFormData(prev => ({ ...prev, [fieldName]: value }));
    }
  };

  // Handle file upload for ontology narrative description (TXT or DOCX)
  const handleNarrativeUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      // Check if it's a TXT or DOCX file
      const isText = file.name.endsWith('.txt');
      const isDocx = file.name.endsWith('.docx');
      
      if (!isText && !isDocx) {
        alert('Please upload a TXT or DOCX file only.');
        event.target.value = ''; // Clear the input
        return;
      }
      
      setNarrativeFile(file);
      
      // Start timing BEFORE file reading begins
      const startTime = Date.now();
      setProcessingStartTime(startTime);
      console.log('=== TIMING START ===');
      console.log('Upload button clicked at:', startTime);
      
      try {
        let content = '';
        
        if (isText) {
          // Handle TXT files
          const reader = new FileReader();
          
          reader.onload = async (e) => {
            const fileReadTime = Date.now();
            console.log('File read completed at:', fileReadTime);
            console.log('File reading took:', fileReadTime - startTime, 'ms');
            
            content = e.target.result;
            setNarrativeContent(content);
            console.log('Ontology narrative uploaded (TXT):', content.substring(0, 200) + '...');
            
            // Process bulk suggestions with the startTime from upload
            await processBulkSuggestions(content, startTime);
            
            // Auto-focus the title field after upload
            setTimeout(() => {
              if (titleInputRef.current) {
                titleInputRef.current.focus();
              }
            }, 100);
          };
          
          reader.readAsText(file);
        } else if (isDocx) {
          // Handle DOCX files using mammoth
          const arrayBuffer = await file.arrayBuffer();
          const fileReadTime = Date.now();
          console.log('File read completed at:', fileReadTime);
          console.log('File reading took:', fileReadTime - startTime, 'ms');
          
          const result = await mammoth.extractRawText({ arrayBuffer });
          content = result.value;
          setNarrativeContent(content);
          console.log('Ontology narrative uploaded (DOCX):', content.substring(0, 200) + '...');
          
          // Process bulk suggestions with the startTime from upload
          await processBulkSuggestions(content, startTime);
          
          // Auto-focus the title field after upload
          setTimeout(() => {
            if (titleInputRef.current) {
              titleInputRef.current.focus();
            }
          }, 100);
        }
      } catch (error) {
        console.error('Error reading file:', error);
        alert('Error reading file. Please try again.');
        event.target.value = ''; // Clear the input
      }
    }
  };

  // Process bulk AI suggestions for all fields
  const processBulkSuggestions = async (narrativeContent, startTime = null) => {
    try {
      setLoadingSuggestions(true);
      console.log('Processing bulk suggestions with narrative content');
      
      // Dynamically construct field definitions from form data and field instructions
      const fieldDefinitions = [];
      
      // Get all simple string/text fields from formData
      Object.keys(formData).forEach(fieldName => {
        const fieldValue = formData[fieldName];
        const instruction = fieldInstructions[fieldName];
        
        // Include fields that are strings, empty arrays, or have instructions
        // Exclude complex objects and arrays that already have values
        if (instruction && (
          typeof fieldValue === 'string' || 
          (Array.isArray(fieldValue) && fieldValue.length === 0)
        )) {
          fieldDefinitions.push({
            name: fieldName,
            instruction: instruction
          });
        }
      });
      
      // Add special case for roles field
      fieldDefinitions.push({
        name: 'roles',
        instruction: 'Roles and responsibilities for this dataset (e.g., creator, publisher, funder)'
      });
      
      // Add special case for distributions (complex subsection)
      fieldDefinitions.push({
        name: 'distributions',
        instruction: 'Distribution information for the dataset including title, description, mediaType, downloadURL, accessURL, byteSize, license, rights, spatial/temporal resolution, and dates. Look for fields like "distributions", "download", "access", "files", or similar in the cheat sheet.'
      });
      
      // Add special case for SPARQL endpoints (complex subsection)
      fieldDefinitions.push({
        name: 'sparqlEndpoint',
        instruction: 'SPARQL endpoint information including endpointURL, identifier, title, description, and status. Look for fields like "sparql endpoint", "sparql", "query endpoint", or similar in the cheat sheet.'
      });
      
      // Add special case for Example Resources (complex subsection)
      fieldDefinitions.push({
        name: 'exampleResource',
        instruction: 'Example resource information including title, description, status, and accessURL. Look for fields like "example resource", "example", "sample resource", or similar in the cheat sheet.'
      });
      
      // Add special case for Linked Resources (complex subsection)
      fieldDefinitions.push({
        name: 'linkedResources',
        instruction: 'Linked resources information including target and triples. Look for fields like "linked resources", "linkset", "links", or similar in the cheat sheet.'
      });
      
      // Add special case for license field with available options
      if (formData.license === '') {
        const licenseOptions = [
          'https://opensource.org/licenses/MIT',
          'https://opensource.org/licenses/Apache-2.0',
          'https://opensource.org/licenses/GPL-3.0',
          'https://opensource.org/licenses/GPL-2.0',
          'https://opensource.org/licenses/LGPL-3.0',
          'https://opensource.org/licenses/BSD-3-Clause',
          'https://opensource.org/licenses/BSD-2-Clause',
          'https://opensource.org/licenses/ISC',
          'https://www.boost.org/LICENSE_1_0.txt',
          'https://opensource.org/licenses/Zlib',
          'http://www.wtfpl.net/',
          'https://opensource.org/licenses/AGPL-3.0',
          'https://opensource.org/licenses/MPL-2.0',
          'https://opensource.org/licenses/EPL-1.0',
          'https://opensource.org/licenses/EUPL-1.1',
          'https://opensource.org/licenses/MS-PL',
          'https://opensource.org/licenses/MS-RL',
          'https://opensource.org/licenses/CDDL-1.0',
          'https://opensource.org/licenses/Artistic-2.0',
          'https://opensource.org/licenses/AFL-3.0',
          'https://creativecommons.org/licenses/by/4.0/',
          'https://creativecommons.org/licenses/by-sa/4.0/',
          'https://creativecommons.org/licenses/by-nc/4.0/',
          'https://creativecommons.org/licenses/by-nc-sa/4.0/',
          'https://creativecommons.org/publicdomain/zero/1.0/',
          'https://unlicense.org/'
        ];
        
        fieldDefinitions.push({
          name: 'license',
          instruction: `License for the metadata. Available options: ${licenseOptions.join(', ')}. Match license names (MIT, Apache, GPL, etc.) or extract exact URLs from cheat sheet content.`
        });
      }
      
      console.log('Dynamic field definitions:', fieldDefinitions);
      console.log('Number of field definitions being sent to OpenAI:', fieldDefinitions.length);
      console.log('Field names being sent:', fieldDefinitions.map(f => f.name));
      
      // Track OpenAI API processing time specifically
      const openaiStartTime = Date.now();
      console.log('OpenAI API call started at:', openaiStartTime);
      const bulkResponse = await getBulkFieldSuggestions(fieldDefinitions, narrativeContent);
      const openaiEndTime = Date.now();
      const openaiDuration = openaiEndTime - openaiStartTime;
      console.log('OpenAI API call ended at:', openaiEndTime);
      console.log('OpenAI API took:', openaiDuration, 'ms');
      setOpenaiProcessingTime(openaiDuration);
      
      console.log('Bulk response received:', bulkResponse);
      console.log('Fields in bulkResponse:', bulkResponse?.fieldSuggestions ? Object.keys(bulkResponse.fieldSuggestions) : 'no fieldSuggestions');
      console.log('Number of fields in response:', bulkResponse?.fieldSuggestions ? Object.keys(bulkResponse.fieldSuggestions).length : 0);
      
      const formattedSuggestions = {};
      const bulkSuggestionTexts = {};
      
      // Check if the response has the expected structure
      if (!bulkResponse || !bulkResponse.fieldSuggestions) {
        console.error('Invalid bulk response structure:', bulkResponse);
        return;
      }
      
      Object.entries(bulkResponse.fieldSuggestions).forEach(([fieldName, fieldData]) => {
        console.log(`Processing field: ${fieldName}`, fieldData);
        if (fieldData.suggestions && fieldData.suggestions.length > 0) {
          // Format suggestions - only show values, no explanations
          const suggestionText = fieldData.suggestions.map(suggestion => 
            `• ${suggestion.value}`
          ).join('\n');
          
          formattedSuggestions[fieldName] = suggestionText;
          bulkSuggestionTexts[fieldName] = suggestionText;
          
          // Store raw response data for special field processing (like roles)
          formattedSuggestions[fieldName + '_raw'] = fieldData;
        } else if (fieldData.noSuggestionsReason) {
          const noSuggestionText = `No suitable suggestions found.\n${fieldData.noSuggestionsReason}`;
          formattedSuggestions[fieldName] = noSuggestionText;
          bulkSuggestionTexts[fieldName] = noSuggestionText;
        }
      });
      
      console.log('Formatted suggestions:', formattedSuggestions);
      console.log('Number of fields with suggestions:', Object.keys(formattedSuggestions).length);
      console.log('Fields with suggestions (detailed):', Object.keys(formattedSuggestions)
        .filter(key => !key.endsWith('_raw')) // Skip raw objects
        .map(key => {
          const value = formattedSuggestions[key];
          const preview = typeof value === 'string' ? value.substring(0, 100) : 'non-string value';
          return `${key}: ${preview}`;
        }));
      setAiSuggestions(formattedSuggestions);
      
      // No longer auto-populating fields - users will manually select from AI panel
      console.log('Suggestions ready for manual selection in AI panel');
      console.log('AI suggestions state updated with fields:', Object.keys(formattedSuggestions));
      
      // Calculate total processing duration
      const currentTime = Date.now();
      console.log('=== TIMING END ===');
      console.log('Total process ended at:', currentTime);
      console.log('startTime:', startTime, 'currentTime:', currentTime);
      if (startTime) {
        const totalDuration = currentTime - startTime;
        console.log('TOTAL DURATION:', totalDuration, 'ms');
        console.log('OpenAI API time:', openaiDuration, 'ms');
        console.log('Other processing time (file read + parsing + auto-populate):', totalDuration - openaiDuration, 'ms');
        console.log('Setting processingDuration state to:', totalDuration);
        setProcessingDuration(totalDuration);
        console.log('Setting openaiProcessingTime state to:', openaiDuration);
        // Re-set openaiProcessingTime to ensure it's updated
        setOpenaiProcessingTime(openaiDuration);
      } else {
        console.log('ERROR: No startTime parameter found for total duration calculation');
      }
      
      // Mark bulk suggestions as ready
      console.log('Setting bulkSuggestionsReady to TRUE');
      setBulkSuggestionsReady(true);
      console.log('Bulk suggestions processing complete!');
      
    } catch (error) {
      console.error('Error processing bulk suggestions:', error);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  // Process bulk suggestions with custom edited prompt
  const processBulkSuggestionsWithCustomPrompt = async (customPrompt) => {
    try {
      setLoadingSuggestions(true);
      setIsEditingPrompt(false); // Close edit mode
      console.log('Processing bulk suggestions with custom prompt');
      
      const startTime = Date.now();
      setProcessingStartTime(startTime);
      
      // Track OpenAI API processing time
      const openaiStartTime = Date.now();
      console.log('OpenAI API call with custom prompt started at:', openaiStartTime);
      
      // Call API with custom prompt directly
      const bulkResponse = await getBulkFieldSuggestionsWithCustomPrompt(customPrompt);
      
      const openaiEndTime = Date.now();
      const openaiDuration = openaiEndTime - openaiStartTime;
      console.log('OpenAI API call ended at:', openaiEndTime);
      console.log('OpenAI API took:', openaiDuration, 'ms');
      setOpenaiProcessingTime(openaiDuration);
      
      console.log('Bulk response received:', bulkResponse);
      
      const formattedSuggestions = {};
      const bulkSuggestionTexts = {};
      
      // Check if the response has the expected structure
      if (!bulkResponse || !bulkResponse.fieldSuggestions) {
        console.error('Invalid bulk response structure:', bulkResponse);
        return;
      }
      
      Object.entries(bulkResponse.fieldSuggestions).forEach(([fieldName, fieldData]) => {
        console.log(`Processing field: ${fieldName}`, fieldData);
        if (fieldData.suggestions && fieldData.suggestions.length > 0) {
          const suggestionText = fieldData.suggestions.map(suggestion => 
            `• ${suggestion.value}`
          ).join('\n');
          
          formattedSuggestions[fieldName] = suggestionText;
          bulkSuggestionTexts[fieldName] = suggestionText;
          formattedSuggestions[fieldName + '_raw'] = fieldData;
        } else if (fieldData.noSuggestionsReason) {
          const noSuggestionText = `No suitable suggestions found.\n${fieldData.noSuggestionsReason}`;
          formattedSuggestions[fieldName] = noSuggestionText;
          bulkSuggestionTexts[fieldName] = noSuggestionText;
        }
      });
      
      console.log('Formatted suggestions:', formattedSuggestions);
      setAiSuggestions(formattedSuggestions);
      
      // Calculate total processing duration
      const currentTime = Date.now();
      const totalDuration = currentTime - startTime;
      console.log('TOTAL DURATION:', totalDuration, 'ms');
      setProcessingDuration(totalDuration);
      setOpenaiProcessingTime(openaiDuration);
      
      // Mark bulk suggestions as ready
      setBulkSuggestionsReady(true);
      console.log('Bulk suggestions with custom prompt complete!');
      
    } catch (error) {
      console.error('Error processing bulk suggestions with custom prompt:', error);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  // Handle turtle form submission
  const handleTurtleSubmit = async () => {
    if (!turtleContent.trim()) {
      setMessage('Please enter some Turtle content before submitting.');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    setIsSubmitting(true);

    try {
      // Validate turtle content and capture any errors
      const validation = validateTurtleContent(turtleContent);
      
      const submissionData = {
        formData: {
          turtleContent: turtleContent.trim(),
          submissionType: 'turtle',
          title: 'Turtle Entry', // Default title for turtle submissions
          timestamp: new Date().toISOString()
        },
        validationErrors: {
          turtleValidation: {
            isValid: validation.isValid,
            errors: validation.errors,
            errorCount: validation.errors.length
          }
        },
        aiSuggestions: aiSuggestions, // Store all OpenAI suggestions
        metadata: {
          submissionType: 'turtle',
          contentLength: turtleContent.trim().length,
          hasValidationErrors: !validation.isValid,
          validationErrorCount: validation.errors.length,
          formOpenedAt: formOpenedAt,
          formSubmittedAt: new Date().toISOString(),
          autoSubmittedByTimer: autoSubmittedByTimer,
          timeSpentSeconds: Math.round((new Date() - new Date(formOpenedAt)) / 1000),
          // Session tracking
          editSessions: getAllSessions(),
          totalTimeSpentSeconds: getTotalTimeSpent(),
          numberOfEditSessions: getAllSessions().length
        }
      };

      const result = await onSubmit(submissionData);
      
      if (result.success) {
        setMessage(result.message);
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setMessage(result.message);
        setTimeout(() => setMessage(''), 5000);
      }
    } catch (error) {
      console.error('Error submitting turtle form:', error);
      setMessage('Error submitting turtle content. Please try again.');
      setTimeout(() => setMessage(''), 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle turtle draft saving
  const handleTurtleSaveDraft = () => {
    if (!turtleContent.trim()) {
      setMessage('Please enter some Turtle content before saving draft.');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    console.log('=== SAVING TURTLE DRAFT ===');
    console.log('turtleContent length:', turtleContent.length);

    const draftId = `turtle-draft-${Date.now()}`;
    
    // Save current session before closing
    const currentSession = {
      startTime: currentSessionStart,
      endTime: new Date().toISOString(),
      durationSeconds: getCurrentSessionDuration()
    };
    const allSessions = [...editSessions, currentSession];
    const totalTimeSpent = allSessions.reduce((sum, s) => sum + s.durationSeconds, 0);
    
    console.log('Saving turtle draft with', allSessions.length, 'session(s), total time:', totalTimeSpent, 'seconds');
    
    // Use the new flat structure with explicit formType
    const draft = {
      id: draftId,
      name: 'Turtle Text',
      date: new Date().toISOString(),
      formType: 'turtle', // Explicit form type
      turtleContent: turtleContent.trim(), // Turtle content at top level
      submissionType: 'turtle', // Keep for backward compatibility
      draftId: draftId,
      aiSuggestions: {}, // Empty for turtle drafts
      editSessions: allSessions, // Store all edit sessions
      totalTimeSpentSeconds: totalTimeSpent // Store cumulative time spent
    };

    console.log('Turtle draft to be saved:', draft);

    // Save to localStorage
    const existingDrafts = JSON.parse(localStorage.getItem('kg-metadata-drafts') || '[]');
    existingDrafts.push(draft);
    localStorage.setItem('kg-metadata-drafts', JSON.stringify(existingDrafts));

    console.log('Turtle draft saved successfully');

    setMessage('Turtle draft saved successfully!');
    
    if (onDraftSaved) {
      onDraftSaved();
    }
    
    setTimeout(() => {
      onClose();
    }, 2000);
  };

  // Auto-populate fields with top suggestions from bulk results
  const autoPopulateFieldsFromSuggestions = (bulkSuggestions, formattedSuggestions = null) => {
    console.log('Auto-populating fields with suggestions:', bulkSuggestions);
    console.log('Formatted suggestions with raw data:', formattedSuggestions);
    const updatedFormData = { ...formData };
    
    Object.entries(bulkSuggestions).forEach(([fieldName, suggestionText]) => {
      console.log(`Processing field ${fieldName} with text:`, suggestionText);
      
      // Skip auto-population if this is a "no suggestions" message
      if (suggestionText.includes('No suitable suggestions') || suggestionText.includes('noSuggestionsReason')) {
        console.log(`Skipping auto-population for ${fieldName} - no suggestions available`);
        return;
      }
      
      // Special handling for roles field
      if (fieldName === 'roles') {
        console.log('Processing roles field...', suggestionText);
        try {
          // Get the raw AI response data for roles
          const rawResponse = formattedSuggestions ? formattedSuggestions[fieldName + '_raw'] : null;
          console.log('Raw roles response:', rawResponse);
          
          if (rawResponse && rawResponse.suggestions) {
            // Process all role suggestions
            rawResponse.suggestions.forEach(suggestion => {
              console.log('Processing role suggestion:', suggestion);
              
              if (suggestion.roleData) {
                const roleData = suggestion.roleData;
                
                // Handle comma-separated values in role data
                const processRole = (name, email = '') => {
                  const newRole = {
                    roleType: roleData.roleType,
                    agent: roleData.mode === 'iri' ? (roleData.iri || '') : '',
                    givenName: roleData.mode === 'name_mbox' ? name.trim() : '',
                    email: roleData.mode === 'name_mbox' ? email.trim() : ''
                  };
                  
                  // Add role to form data, avoiding duplicates
                  const existingRoles = updatedFormData.roles || [];
                  const isDuplicate = existingRoles.some(existing => 
                    existing.roleType === newRole.roleType &&
                    existing.agent === newRole.agent &&
                    existing.givenName === newRole.givenName &&
                    existing.email === newRole.email
                  );
                  
                  if (!isDuplicate) {
                    updatedFormData.roles = [...(updatedFormData.roles || []), newRole];
                    console.log(`Added role: ${roleData.roleType}`, newRole);
                  }
                };
                
                if (roleData.mode === 'name_mbox' && roleData.name) {
                  // NOTE: Splitting is now handled by OpenAI - it creates separate suggestions for each entity
                  // Process single name/email from this roleData
                  processRole(roleData.name, roleData.email || '');
                  
                  /* DEPRECATED: Client-side splitting - now handled by OpenAI
                  const names = roleData.name.split(',').map(n => n.trim()).filter(n => n.length > 0);
                  const emails = roleData.email ? roleData.email.split(',').map(e => e.trim()).filter(e => e.length > 0) : [''];
                  
                  names.forEach((name, index) => {
                    const email = emails[index] || emails[0] || '';
                    processRole(name, email);
                  });
                  */
                } else if (roleData.mode === 'iri' && roleData.iri) {
                  // NOTE: Splitting is now handled by OpenAI - it creates separate suggestions for each IRI
                  // Process single IRI from this roleData
                  const newRole = {
                    roleType: roleData.roleType,
                    agent: roleData.iri.trim(),
                    givenName: '',
                    email: ''
                  };
                  
                  const existingRoles = updatedFormData.roles || [];
                  const isDuplicate = existingRoles.some(existing => 
                    existing.roleType === newRole.roleType &&
                    existing.agent === newRole.agent
                  );
                  
                  if (!isDuplicate) {
                    updatedFormData.roles = [...(updatedFormData.roles || []), newRole];
                    console.log(`Added IRI role: ${roleData.roleType}`, newRole);
                  }
                  
                  /* DEPRECATED: Client-side splitting - now handled by OpenAI
                  const iris = roleData.iri.split(',').map(i => i.trim()).filter(i => i.length > 0);
                  iris.forEach(iri => {
                    const newRole = {
                      roleType: roleData.roleType,
                      agent: iri.trim(),
                      givenName: '',
                      email: ''
                    };
                    
                    const existingRoles = updatedFormData.roles || [];
                    const isDuplicate = existingRoles.some(existing => 
                      existing.roleType === newRole.roleType &&
                      existing.agent === newRole.agent
                    );
                    
                    if (!isDuplicate) {
                      updatedFormData.roles = [...(updatedFormData.roles || []), newRole];
                      console.log(`Added IRI role: ${roleData.roleType}`, newRole);
                    }
                  });
                  */
                }
              } else {
                console.log('No roleData found in suggestion:', suggestion);
              }
            });
          } else {
            console.log('No suggestions found in raw response for roles');
          }
        } catch (error) {
          console.error('Error processing roles field:', error);
        }
        return;
      }
      
      // Special handling for distributions field
      if (fieldName === 'distributions') {
        console.log('Processing distributions field...', suggestionText);
        try {
          const rawResponse = formattedSuggestions ? formattedSuggestions[fieldName + '_raw'] : null;
          console.log('Raw distributions response:', rawResponse);
          
          if (rawResponse && rawResponse.suggestions) {
            rawResponse.suggestions.forEach(suggestion => {
              console.log('Processing distribution suggestion:', suggestion);
              
              try {
                // Parse the JSON-like value string
                const distData = typeof suggestion.value === 'string' ? 
                  JSON.parse(suggestion.value) : suggestion.value;
                
                // Create distribution object with all fields
                const newDistribution = {
                  title: distData.title || '',
                  description: distData.description || '',
                  mediaType: distData.mediaType || '',
                  downloadURL: distData.downloadURL || '',
                  accessURL: distData.accessURL || '',
                  accessService: distData.accessService || '',
                  byteSize: distData.byteSize || '',
                  compressionFormat: distData.compressionFormat || '',
                  packagingFormat: distData.packagingFormat || '',
                  hasPolicy: distData.hasPolicy || '',
                  license: distData.license || '',
                  rights: distData.rights || '',
                  spatialResolution: distData.spatialResolution || '',
                  temporalResolution: distData.temporalResolution || '',
                  releaseDate: distData.releaseDate || '',
                  modificationDate: distData.modificationDate || '',
                  issued: distData.issued || ''
                };
                
                // Add to distributions array
                updatedFormData.distributions = [...(updatedFormData.distributions || []), newDistribution];
                console.log('Added distribution:', newDistribution);
              } catch (parseError) {
                console.error('Error parsing distribution data:', parseError);
              }
            });
          }
        } catch (error) {
          console.error('Error processing distributions field:', error);
        }
        return;
      }
      
      // Special handling for sparqlEndpoint field
      if (fieldName === 'sparqlEndpoint') {
        console.log('Processing sparqlEndpoint field...', suggestionText);
        try {
          const rawResponse = formattedSuggestions ? formattedSuggestions[fieldName + '_raw'] : null;
          console.log('Raw sparqlEndpoint response:', rawResponse);
          
          if (rawResponse && rawResponse.suggestions) {
            rawResponse.suggestions.forEach(suggestion => {
              console.log('Processing SPARQL endpoint suggestion:', suggestion);
              
              try {
                const endpointData = typeof suggestion.value === 'string' ? 
                  JSON.parse(suggestion.value) : suggestion.value;
                
                const newEndpoint = {
                  endpointURL: endpointData.endpointURL || '',
                  identifier: endpointData.identifier || '',
                  title: endpointData.title || '',
                  endpointDescription: endpointData.endpointDescription || endpointData.description || '',
                  status: endpointData.status || ''
                };
                
                // Add to sparqlEndpoints array (note: this is a separate state, not in formData)
                setSparqlEndpoints(prev => [...prev, newEndpoint]);
                console.log('Added SPARQL endpoint:', newEndpoint);
              } catch (parseError) {
                console.error('Error parsing SPARQL endpoint data:', parseError);
              }
            });
          }
        } catch (error) {
          console.error('Error processing sparqlEndpoint field:', error);
        }
        return;
      }
      
      // Special handling for exampleResource field
      if (fieldName === 'exampleResource') {
        console.log('Processing exampleResource field...', suggestionText);
        try {
          const rawResponse = formattedSuggestions ? formattedSuggestions[fieldName + '_raw'] : null;
          console.log('Raw exampleResource response:', rawResponse);
          
          if (rawResponse && rawResponse.suggestions) {
            rawResponse.suggestions.forEach(suggestion => {
              console.log('Processing example resource suggestion:', suggestion);
              
              try {
                const resourceData = typeof suggestion.value === 'string' ? 
                  JSON.parse(suggestion.value) : suggestion.value;
                
                const newResource = {
                  title: resourceData.title || '',
                  description: resourceData.description || '',
                  status: resourceData.status || '',
                  accessURL: resourceData.accessURL || ''
                };
                
                // Add to exampleResources array (note: this is a separate state, not in formData)
                setExampleResources(prev => [...prev, newResource]);
                console.log('Added example resource:', newResource);
              } catch (parseError) {
                console.error('Error parsing example resource data:', parseError);
              }
            });
          }
        } catch (error) {
          console.error('Error processing exampleResource field:', error);
        }
        return;
      }
      
      // Special handling for linkedResources field
      if (fieldName === 'linkedResources') {
        console.log('Processing linkedResources field...', suggestionText);
        try {
          const rawResponse = formattedSuggestions ? formattedSuggestions[fieldName + '_raw'] : null;
          console.log('Raw linkedResources response:', rawResponse);
          
          if (rawResponse && rawResponse.suggestions) {
            rawResponse.suggestions.forEach(suggestion => {
              console.log('Processing linked resource suggestion:', suggestion);
              
              try {
                const linkData = typeof suggestion.value === 'string' ? 
                  JSON.parse(suggestion.value) : suggestion.value;
                
                const newLinkedResource = {
                  target: linkData.target || '',
                  triples: linkData.triples || ''
                };
                
                // Add to linkedResources array (note: this is a separate state, not in formData)
                setLinkedResources(prev => [...prev, newLinkedResource]);
                console.log('Added linked resource:', newLinkedResource);
              } catch (parseError) {
                console.error('Error parsing linked resource data:', parseError);
              }
            });
          }
        } catch (error) {
          console.error('Error processing linkedResources field:', error);
        }
        return;
      }
      
      // Special handling for license field
      if (fieldName === 'license') {
        const firstSuggestionMatch = suggestionText.match(/• (.+?)\n/);
        if (firstSuggestionMatch) {
          const licenseValue = firstSuggestionMatch[1].trim();
          updatedFormData.license = licenseValue;
          console.log(`Set license to: ${licenseValue}`);
        }
        return;
      }
      
      // Special handling for multi-value fields
      // NOTE: Splitting is now handled by OpenAI API - it returns separate suggestions for each value
      const multiValueFields = ['vocabulariesUsed', 'keywords', 'category', 'language', 'otherPages', 'statistics', 'linkedResources', 'source'];
      if (multiValueFields.includes(fieldName)) {
        // OpenAI now returns multiple suggestions, one for each value
        // We process all suggestions from the raw response
        const rawResponse = formattedSuggestions ? formattedSuggestions[fieldName + '_raw'] : null;
        if (rawResponse && rawResponse.suggestions) {
          const values = rawResponse.suggestions.map(s => s.value.trim()).filter(v => v.length > 0);
          
          if (values.length > 0) {
            // Add all values to the existing array, avoiding duplicates
            const currentValues = updatedFormData[fieldName] || [];
            const newValues = values.filter(val => !currentValues.includes(val));
            updatedFormData[fieldName] = [...currentValues, ...newValues];
            console.log(`Added multi-values to ${fieldName}:`, newValues);
          }
        }
        return;
      }
      
      /* DEPRECATED: Client-side splitting - now handled by OpenAI
      const multiValueFields = ['vocabulariesUsed', 'keywords', 'category', 'language', 'otherPages', 'statistics', 'linkedResources'];
      if (multiValueFields.includes(fieldName)) {
        const firstSuggestionMatch = suggestionText.match(/• (.+?)\n/);
        if (firstSuggestionMatch) {
          const suggestionValue = firstSuggestionMatch[1].trim();
          // Split on commas for all multi-value fields
          let values = suggestionValue.split(',').map(val => val.trim()).filter(val => val.length > 0);
          
          if (values.length > 0) {
            // Add all values to the existing array, avoiding duplicates
            const currentValues = updatedFormData[fieldName] || [];
            const newValues = values.filter(val => !currentValues.includes(val));
            updatedFormData[fieldName] = [...currentValues, ...newValues];
            console.log(`Added multi-values to ${fieldName}:`, newValues);
          }
        }
        return;
      }
      */
      
      // Extract the first suggestion value from the formatted text
      const firstSuggestionMatch = suggestionText.match(/• (.+?)\n/);
      if (firstSuggestionMatch) {
        const topSuggestion = firstSuggestionMatch[1].trim();
        console.log(`Extracted top suggestion for ${fieldName}:`, topSuggestion);
        
        // Handle different field types
        if (fieldName === 'title' || fieldName === 'description') {
          updatedFormData[fieldName] = topSuggestion;
        } else if (fieldName === 'createdDate' || fieldName === 'publishedDate') {
          updatedFormData[fieldName] = topSuggestion;
        } else if (Array.isArray(formData[fieldName])) {
          // For array fields, add to the array if not already present
          if (!updatedFormData[fieldName].includes(topSuggestion)) {
            updatedFormData[fieldName] = [...updatedFormData[fieldName], topSuggestion];
          }
        } else {
          // For other fields, set directly
          updatedFormData[fieldName] = topSuggestion;
        }
      } else {
        console.log(`No suggestion match found for ${fieldName}`);
      }
    });
    
    console.log('Updated form data:', updatedFormData);
    setFormData(updatedFormData);
  };

  // Handle upload button click
  const handleUploadClick = () => {
    narrativeInputRef.current?.click();
  };

  // No longer need identifierInput state since it's auto-generated
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
  // Linked Resources collection state (similar to example resources)
  const emptyLinkedResource = {
    target: '',
    triples: ''
  };
  const [currentLinkedResource, setCurrentLinkedResource] = useState(emptyLinkedResource);
  const [linkedResources, setLinkedResources] = useState([]);
  const [editingLinkedResourceIdx, setEditingLinkedResourceIdx] = useState(null);
  const [linkedResourceTargetValid, setLinkedResourceTargetValid] = useState(false);
  const [linkedResourceTriplesValid, setLinkedResourceTriplesValid] = useState(false);
  const [exampleResourceInput, setExampleResourceInput] = useState('');
  const [sourceInput, setSourceInput] = useState('');
  const [nameSpaceInput, setNameSpaceInput] = useState('');
  const [imageFileName, setImageFileName] = useState('');
  // Role editing state (similar to distribution editing)
  const [currentRole, setCurrentRole] = useState({
    roleType: '',
    inputMode: 'agentIRI', // 'agentIRI' or 'nameEmail'
    agent: '',
    givenName: '',
    email: ''
  });

  const fileInputRef = useRef(null);
  const narrativeInputRef = useRef(null);
  const titleInputRef = useRef(null);

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
    spatialResolution: '',
    temporalResolution: '',
    releaseDate: '',
    modificationDate: '',
    issued: ''
  });

  const [vocabulariesUsedInput, setVocabulariesUsedInput] = useState('');
  const [kgSchemaInput, setKgSchemaInput] = useState('');
  const [restAPIInput, setRestAPIInput] = useState('');
  
  // Single-value field inputs (for tag-style display)
  const [titleInput, setTitleInput] = useState('');
  const [descriptionInput, setDescriptionInput] = useState('');
  const [versionInput, setVersionInput] = useState('');
  const [accessStatementInput, setAccessStatementInput] = useState('');
  const [createdDateInput, setCreatedDateInput] = useState('');
  const [publishedDateInput, setPublishedDateInput] = useState('');
  const [licenseInput, setLicenseInput] = useState('');
  const [restAPIInputError, setRestAPIInputError] = useState('');
  const [exampleQueriesInput, setExampleQueriesInput] = useState('');

// SPARQL Endpoints Section State
const emptySparqlEndpoint = {
  endpointURL: '',
  identifier: '',
  title: '',
  endpointDescription: '',
  status: ''
};
const [currentSparqlEndpoint, setCurrentSparqlEndpoint] = useState(emptySparqlEndpoint);
const [sparqlEndpoints, setSparqlEndpoints] = useState([]);
const [editingSparqlEndpointIdx, setEditingSparqlEndpointIdx] = useState(null);
const [sparqlEndpointURLValid, setSparqlEndpointURLValid] = useState(false);
const [sparqlEndpointURLError, setSparqlEndpointURLError] = useState('');
const [sparqlIdentifierValid, setSparqlIdentifierValid] = useState(false);
const [sparqlTitleValid, setSparqlTitleValid] = useState(false);
const [sparqlEndpointDescriptionValid, setSparqlEndpointDescriptionValid] = useState(false);
const [sparqlStatusValid, setSparqlStatusValid] = useState(false);

// Example Resource Section State
const emptyExampleResource = {
  title: '',
  description: '',
  status: '',
  accessURL: ''
};
const [currentExampleResource, setCurrentExampleResource] = useState(emptyExampleResource);
const [exampleResources, setExampleResources] = useState([]);
const [editingExampleResourceIdx, setEditingExampleResourceIdx] = useState(null);
const [exampleResourceAccessURLValid, setExampleResourceAccessURLValid] = useState(false);
const [exampleResourceAccessURLError, setExampleResourceAccessURLError] = useState('');
const [exampleResourceTitleValid, setExampleResourceTitleValid] = useState(false);
const [exampleResourceDescriptionValid, setExampleResourceDescriptionValid] = useState(false);
const [exampleResourceStatusValid, setExampleResourceStatusValid] = useState(false);

const handleCurrentSparqlEndpointChange = (field, value) => {
  setCurrentSparqlEndpoint(prev => ({ ...prev, [field]: value }));
};

const handleCurrentExampleResourceChange = (field, value) => {
  setCurrentExampleResource(prev => ({ ...prev, [field]: value }));
};

// Handle Enter key press for tag inputs
const handleKeyPress = (e, tagType, inputValue, setInputFunction, setErrorFunction) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    
    // List of fields that require IRI validation
    const iriFields = [
      'homepageURL', 'otherPages', 'vocabulariesUsed', 'kgSchema',
      'primaryReferenceDocument', 'category', 'publicationReferences', 'source'
    ];
    
    // If this is an IRI field, validate before adding
    if (iriFields.includes(tagType) && setErrorFunction) {
      const iriError = isValidIriString(inputValue);
      if (iriError) {
        setErrorFunction(iriError);
        return; // Don't add the tag if validation fails
      }
    }
    
    handleAddTag(tagType, inputValue, setInputFunction, setErrorFunction);
  }
};

const resetSparqlEndpointForm = () => {
  setCurrentSparqlEndpoint(emptySparqlEndpoint);
  setEditingSparqlEndpointIdx(null);
  setSparqlEndpointURLValid(false);
  setSparqlEndpointURLError('');
  setSparqlIdentifierValid(false);
  setSparqlTitleValid(false);
  setSparqlEndpointDescriptionValid(false);
  setSparqlStatusValid(false);
};

const resetExampleResourceForm = () => {
  setCurrentExampleResource(emptyExampleResource);
  setEditingExampleResourceIdx(null);
  setExampleResourceAccessURLValid(false);
  setExampleResourceAccessURLError('');
  setExampleResourceTitleValid(false);
  setExampleResourceDescriptionValid(false);
  setExampleResourceStatusValid(false);
};

// Validate SPARQL endpoint before adding
const validateSparqlEndpoint = (endpoint, allowBypass = false) => {
  // Check if all fields are empty
  const hasAnyValue = Object.values(endpoint).some(value => value && value.trim && value.trim());
  if (!hasAnyValue) {
    return { isValid: false, error: 'Cannot add empty SPARQL endpoint. Please fill in at least one field.' };
  }

  // If bypass is disabled, check required field (endpointURL)
  if (!allowBypass && (!endpoint.endpointURL || !endpoint.endpointURL.trim())) {
    return { isValid: false, error: 'SPARQL Endpoint URL is required.' };
  }

  // Validate endpoint URL if provided
  if (endpoint.endpointURL && endpoint.endpointURL.trim()) {
    const urlError = isValidIriString(endpoint.endpointURL);
    if (urlError) {
      return { isValid: false, error: `Invalid Endpoint URL: ${urlError}` };
    }
  }

  return { isValid: true };
};

const handleAddSparqlEndpoint = () => {
  const validation = validateSparqlEndpoint(currentSparqlEndpoint, bypassValidation);
  if (!validation.isValid) {
    setMessage(validation.error);
    setTimeout(() => setMessage(''), 3000);
    return;
  }

  if (editingSparqlEndpointIdx !== null) {
    // Save edits directly
    const updated = [...sparqlEndpoints];
    updated[editingSparqlEndpointIdx] = currentSparqlEndpoint;
    setSparqlEndpoints(updated);
    resetSparqlEndpointForm();
    setMessage('SPARQL Endpoint updated successfully');
    setTimeout(() => setMessage(''), 2000);
  } else {
    // Add new SPARQL endpoint directly with success message
    setSparqlEndpoints(prev => [...prev, currentSparqlEndpoint]);
    resetSparqlEndpointForm();
    setMessage('SPARQL Endpoint added successfully');
    setTimeout(() => setMessage(''), 2000);
  }
};


const handleEditSparqlEndpoint = (idx) => {
  setCurrentSparqlEndpoint(sparqlEndpoints[idx]);
  setEditingSparqlEndpointIdx(idx);
  // Optionally set valid states for fields if desired
};

const handleRemoveSparqlEndpoint = (idx) => {
  setSparqlEndpoints(prev => prev.filter((_, i) => i !== idx));
  if (editingSparqlEndpointIdx === idx) {
    resetSparqlEndpointForm();
  }
};

const handleCancelEditSparqlEndpoint = () => {
  resetSparqlEndpointForm();
};

// Validate example resource before adding
const validateExampleResource = (resource, allowBypass = false) => {
  // Check if all fields are empty
  const hasAnyValue = Object.values(resource).some(value => value && value.trim && value.trim());
  if (!hasAnyValue) {
    return { isValid: false, error: 'Cannot add empty example resource. Please fill in at least one field.' };
  }

  // Validate accessURL if provided
  if (resource.accessURL && resource.accessURL.trim()) {
    const urlError = isValidIriString(resource.accessURL);
    if (urlError) {
      return { isValid: false, error: `Invalid Access URL: ${urlError}` };
    }
  }

  return { isValid: true };
};

const handleAddExampleResource = () => {
  const validation = validateExampleResource(currentExampleResource, bypassValidation);
  if (!validation.isValid) {
    setMessage(validation.error);
    setTimeout(() => setMessage(''), 3000);
    return;
  }

  if (editingExampleResourceIdx !== null) {
    // Save edits directly
    const updated = [...exampleResources];
    updated[editingExampleResourceIdx] = currentExampleResource;
    setExampleResources(updated);
    resetExampleResourceForm();
  } else {
    // Add new example resource directly
    setExampleResources([...exampleResources, currentExampleResource]);
    resetExampleResourceForm();
  }
};


// Linked Resource handlers
const handleCurrentLinkedResourceChange = (field, value) => {
  setCurrentLinkedResource(prev => ({ ...prev, [field]: value }));
};

// Validate linked resource before adding
const validateLinkedResource = (resource, allowBypass = false) => {
  // Check if all fields are empty
  const hasAnyValue = Object.values(resource).some(value => value && value.trim && value.trim());
  if (!hasAnyValue) {
    return { isValid: false, error: 'Cannot add empty linked resource. Please fill in at least one field.' };
  }

  return { isValid: true };
};

const handleAddLinkedResource = () => {
  const validation = validateLinkedResource(currentLinkedResource, bypassValidation);
  if (!validation.isValid) {
    setMessage(validation.error);
    setTimeout(() => setMessage(''), 3000);
    return;
  }

  if (editingLinkedResourceIdx !== null) {
    // Save edits directly
    const updated = [...linkedResources];
    updated[editingLinkedResourceIdx] = currentLinkedResource;
    setLinkedResources(updated);
    setCurrentLinkedResource(emptyLinkedResource);
    setEditingLinkedResourceIdx(null);
    setMessage('Linked Resource updated successfully');
    setTimeout(() => setMessage(''), 2000);
  } else {
    // Add new linked resource directly with success message
    setLinkedResources([...linkedResources, currentLinkedResource]);
    setCurrentLinkedResource(emptyLinkedResource);
    setEditingLinkedResourceIdx(null);
    setMessage('Linked Resource added successfully');
    setTimeout(() => setMessage(''), 2000);
  }
};


const handleEditLinkedResource = (idx) => {
  setCurrentLinkedResource(linkedResources[idx]);
  setEditingLinkedResourceIdx(idx);
};

const handleRemoveLinkedResource = (idx) => {
  const updated = linkedResources.filter((_, i) => i !== idx);
  setLinkedResources(updated);
  if (editingLinkedResourceIdx === idx) {
    setCurrentLinkedResource(emptyLinkedResource);
    setEditingLinkedResourceIdx(null);
  } else if (editingLinkedResourceIdx > idx) {
    setEditingLinkedResourceIdx(editingLinkedResourceIdx - 1);
  }
};

const handleEditExampleResource = (idx) => {
  setCurrentExampleResource(exampleResources[idx]);
  setEditingExampleResourceIdx(idx);
  // Optionally set valid states based on current values
};

const handleRemoveExampleResource = (idx) => {
  setExampleResources(prev => prev.filter((_, i) => i !== idx));
  if (editingExampleResourceIdx === idx) {
    resetExampleResourceForm();
  }
};

const handleCancelEditExampleResource = () => {
  resetExampleResourceForm();
};

  const [acronymInputValid, setAcronymInputValid] = useState(false);
  const [metaGraphInput, setMetaGraphInput] = useState('');

  const [homepageURLInputError, setHomepageURLInputError] = useState('');
  const [otherPagesInputError, setOtherPagesInputError] = useState('');
  const [primaryReferenceDocInputError, setPrimaryReferenceDocInputError] = useState('');
  const [metaGraphInputError, setMetaGraphInputError] = useState('');
  const [metaGraphInputValid, setMetaGraphInputValid] = useState(false);
  const [statisticsInputError, setStatisticsInputError] = useState('');
  const [categoryInputError, setCategoryInputError] = useState('');
  const [publicationReferencesInputError, setPublicationReferencesInputError] = useState('');
  const [sourceInputError, setSourceInputError] = useState('');
  const [languageInputError, setLanguageInputError] = useState('');

  // Valid states for date fields
  const [createdDateValid, setCreatedDateValid] = useState(false);
  const [publishedDateValid, setPublishedDateValid] = useState(false);
  const [modifiedDateValid, setModifiedDateValid] = useState(false);

  // Valid states for IRI fields (removed metaGraph)
  const [homepageURLInputValid, setHomepageURLInputValid] = useState(false);
  const [otherPagesInputValid, setOtherPagesInputValid] = useState(false);
  const [primaryReferenceDocInputValid, setPrimaryReferenceDocInputValid] = useState(false);
  const [statisticsInputValid, setStatisticsInputValid] = useState(false);
  const [categoryInputValid, setCategoryInputValid] = useState(false);
  const [publicationReferencesInputValid, setPublicationReferencesInputValid] = useState(false);
  const [sourceInputValid, setSourceInputValid] = useState(false);

  // Valid states for other fields
  const [titleValid, setTitleValid] = useState(false);
  const [descriptionValid, setDescriptionValid] = useState(false);
  const [typeValid, setTypeValid] = useState(true); // Valid by default since both types are pre-selected
  const [licenseValid, setLicenseValid] = useState(false);
  const [versionValid, setVersionValid] = useState(false); // Version validation state
  const [accessStatementValid, setAccessStatementValid] = useState(false);
  const [keywordsInputValid, setKeywordsInputValid] = useState(false);
  const [nameSpaceInputValid, setNameSpaceInputValid] = useState(false);
  const [languageInputValid, setLanguageInputValid] = useState(false);
  const [iriTemplateInputValid, setIriTemplateInputValid] = useState(false);
  const [restAPIInputValid, setRestAPIInputValid] = useState(false);
  const [exampleQueriesInputValid, setExampleQueriesInputValid] = useState(false);

  const [distReleaseDateValid, setDistReleaseDateValid] = useState(false);
  const [distModificationDateValid, setDistModificationDateValid] = useState(false);
  // No longer need identifierInputValid state since it's auto-generated
  const [alternativeTitleInputValid, setAlternativeTitleInputValid] = useState(false);
  const [distLicenseValid, setDistLicenseValid] = useState(false);
  const [distRightsValid, setDistRightsValid] = useState(false);
  const [distSpatialResolutionValid, setDistSpatialResolutionValid] = useState(false);
  const [distTemporalResolutionValid, setDistTemporalResolutionValid] = useState(false);
  const [distCompressionFormatValid, setDistCompressionFormatValid] = useState(false);
  const [distPackagingFormatValid, setDistPackagingFormatValid] = useState(false);
  const [distHasPolicyValid, setDistHasPolicyValid] = useState(false);

  // Disable body scrolling when modal is open
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
      
      // If we have instructions for this field, add the instruction tooltip
      if (fieldId && fieldInstructions[fieldId]) {
        label.setAttribute('data-tooltip', fieldInstructions[fieldId]);
        label.setAttribute('tabindex', '0'); // Make focusable for accessibility
      }

      // Handle AI suggestion tooltips (exclude Type checkbox labels)
      if (showAISuggestions && fieldId && !fieldId.startsWith('type')) {
        // Remove existing AI tooltip if any
        const existingAITooltip = label.querySelector('.ai-suggestion-tooltip');
        if (existingAITooltip) {
          existingAITooltip.remove();
        }

        // Create AI suggestion tooltip
        const aiTooltip = document.createElement('span');
        aiTooltip.className = 'ai-suggestion-tooltip';
        aiTooltip.innerHTML = '🤖';
        aiTooltip.title = aiSuggestions[fieldId] || 'Click to get AI suggestion';
        aiTooltip.style.cursor = 'pointer';
        aiTooltip.style.marginLeft = '8px';
        
        // Add click handler to show pre-fetched AI suggestion
        aiTooltip.addEventListener('click', () => {
          // If we have bulk suggestions ready, use them directly
          if (bulkSuggestionsReady) {
            setActiveField(fieldId);
          } else if (!narrativeFile) {
            // Show waiting message if no narrative file has been uploaded
            setActiveField('waiting-for-narrative');
          }
        });

        // Set AI suggestion tooltip attributes
        if (aiSuggestions[fieldId]) {
          aiTooltip.setAttribute('data-ai-tooltip', aiSuggestions[fieldId]);
        }

        label.appendChild(aiTooltip);
        
        // Add focus event listener to input field for auto-triggering AI suggestions
        const inputField = label.parentElement.querySelector('input, textarea, select');
        if (inputField) {
          inputField.addEventListener('focus', () => {
            // Auto-trigger AI suggestions when field is focused
            if (bulkSuggestionsReady) {
              setActiveField(fieldId);
            } else if (!narrativeFile) {
              setActiveField('waiting-for-narrative');
            }
          });
        }
      } else {
        // Remove AI tooltip if it exists
        const existingTooltip = label.querySelector('.ai-suggestion-tooltip');
        if (existingTooltip) {
          existingTooltip.remove();
        }
      }
    });
  }, [showAISuggestions, aiSuggestions, bulkSuggestionsReady]);


  useEffect(() => {
    let timeoutId;
    if (message) {
      timeoutId = setTimeout(() => {
        setMessage(null);
      }, 20000);
    }
    return () => timeoutId && clearTimeout(timeoutId);
  }, [message]);

  // Real-time timer for processing overlay
  useEffect(() => {
    let interval;
    if (loadingSuggestions && processingStartTime) {
      interval = setInterval(() => {
        setCurrentProcessingTime(Date.now() - processingStartTime);
      }, 100); // Update every 100ms for smooth timer
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [loadingSuggestions, processingStartTime]);

  // Handle loading drafts
  const [hasLoadedDraft, setHasLoadedDraft] = useState(false);
  
  useEffect(() => {
    if (initialFormData && !hasLoadedDraft) {
      console.log('=== LOADING DRAFT ===');
      console.log('initialFormData:', initialFormData);
      
      // Extract AI suggestions (stored separately)
      const loadedAiSuggestions = initialFormData.aiSuggestions || {};
      
      // Get the form type (use formType if available, fallback to submissionType for backward compatibility)
      const formType = initialFormData.formType || initialFormData.submissionType;
      console.log('Draft formType:', formType);
      console.log('turtleContent length:', initialFormData.turtleContent?.length || 0);
      
      // Check if this is a turtle draft
      if (formType === 'turtle') {
        console.log('Loading TURTLE draft...');
        setTurtleContent(initialFormData.turtleContent || '');
        setShowTurtleMode(true);
        // Don't load form data for turtle mode
      } else {
        console.log('Loading FORM draft (normal or LLM)...');
        
        // Build form data from the draft (all fields are at top level)
        const safeFormData = {
          ...initialFormState
        };
        
        // Copy all form fields from the draft
        Object.keys(initialFormState).forEach(key => {
          if (initialFormData[key] !== undefined) {
            safeFormData[key] = initialFormData[key];
          }
        });
        
        console.log('Loaded form data:', safeFormData);
        console.log('Title:', safeFormData.title);
        console.log('Description:', safeFormData.description);
        
        setFormData(safeFormData);
        
        // Handle loading custom license input from draft
        if (initialFormData.customLicenseInput) {
          setCustomLicenseInput(initialFormData.customLicenseInput);
        }
        
        // If license starts with "Other-", extract the custom part and set dropdown to "Other"
        if (safeFormData.license && safeFormData.license.startsWith('Other-')) {
          const customPart = safeFormData.license.substring(6); // Remove "Other-" prefix
          setCustomLicenseInput(customPart);
          setFormData(prev => ({
            ...prev,
            license: 'Other'
          }));
        }
        
        // Load collection data from draft
        if (initialFormData.sparqlEndpoint) {
          setSparqlEndpoints(initialFormData.sparqlEndpoint);
        }
        if (initialFormData.exampleResource) {
          setExampleResources(initialFormData.exampleResource);
        }
        if (initialFormData.linkedResources) {
          setLinkedResources(initialFormData.linkedResources);
        }
        
        // Set validation states for loaded fields
        if (safeFormData.title) setTitleValid(true);
        if (safeFormData.description) setDescriptionValid(true);
        if (safeFormData.license) setLicenseValid(true);
        if (safeFormData.version) setVersionValid(true);
      }
      
      // Restore AI suggestions if they exist (for LLM mode)
      if (Object.keys(loadedAiSuggestions).length > 0) {
        console.log('Restoring AI suggestions from draft:', Object.keys(loadedAiSuggestions));
        setAiSuggestions(loadedAiSuggestions);
        setBulkSuggestionsReady(true);
        setShowAISuggestions(true); // Show AI panel when loading draft with suggestions
        console.log('AI panel shown for loaded draft');
      }
      
      // Restore previous edit sessions if they exist
      if (initialFormData.editSessions && Array.isArray(initialFormData.editSessions)) {
        console.log('Restoring previous edit sessions:', initialFormData.editSessions.length, 'sessions');
        setEditSessions(initialFormData.editSessions);
        const totalPreviousTime = initialFormData.editSessions.reduce((sum, s) => sum + s.durationSeconds, 0);
        console.log('Total time from previous sessions:', totalPreviousTime, 'seconds');
      }
      
      console.log('=== DRAFT LOADED SUCCESSFULLY ===');
      setHasLoadedDraft(true);
    }
  }, [initialFormData, hasLoadedDraft]);

  // Helper function to safely get array from formData
  const safeArray = (fieldName) => {
    return Array.isArray(formData[fieldName]) ? formData[fieldName] : [];
  };

    const isValidIriString = (iriString) => {
      console.log('Validating IRI:', iriString);
      
      // Allow empty values for optional fields
      if (!iriString || !iriString.trim()) {
        console.log('IRI is empty - allowed for optional fields');
        return null;
      }
      
      const trimmed = iriString.trim();
      
      // Check for obviously invalid characters at the start
      if (/^[@#{}|\\^`<>"']/.test(trimmed)) {
        return 'IRI cannot start with invalid characters';
      }
      
      // Basic scheme check - IRI must have a scheme
      if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)) {
        return 'IRI must have a valid scheme (e.g., http:, https:, ftp:)';
      }
      
      // Check for invalid characters that should not appear in IRIs
      if (/[\s<>"{}|\\^`]/.test(trimmed)) {
        return 'IRI contains invalid characters (spaces, quotes, brackets, etc.)';
      }
      
      // Check for trailing invalid characters
      if (/[.,;:\s]$/.test(trimmed)) {
        return 'IRI cannot end with dots, commas, semicolons, or colons';
      }
      
      // Check for consecutive dots
      if (/\.\./.test(trimmed)) {
        return 'IRI cannot contain consecutive dots';
      }
      
      // Check for invalid dot patterns (e.g., /. or ./ or :.)
      if (/[/:]\.|\.\//.test(trimmed)) {
        return 'Invalid dot placement in IRI';
      }
      
      // Check for unmatched brackets
      const openBrackets = (trimmed.match(/\[/g) || []).length;
      const closeBrackets = (trimmed.match(/\]/g) || []).length;
      if (openBrackets !== closeBrackets) {
        return 'IRI has unmatched brackets';
      }
      
      // Check for hierarchical schemes that require :// format
      // Common schemes: http, https, ftp, ftps, sftp, file, ws, wss, etc.
      const hierarchicalSchemes = /^(https?|ftps?|sftp|file|wss?|git|ssh|telnet|ldap|ldaps|imap|imaps|pop|pops|smtp|smtps):/i;
      if (hierarchicalSchemes.test(trimmed) && !/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(trimmed)) {
        return 'Hierarchical URI schemes (http, https, ftp, etc.) must use :// format';
      }
      
      // For HTTP(S) URLs, validate domain structure
      if (/^https?:\/\//i.test(trimmed)) {
        // Extract the domain part (after :// and before next / or end)
        const domainMatch = trimmed.match(/^https?:\/\/([^\/\?#]+)/i);
        if (domainMatch) {
          const domain = domainMatch[1];
          
          // Check for invalid domain patterns
          if (/^\.|\.$/.test(domain)) {
            return 'Domain cannot start or end with a dot';
          }
          
          if (/\.\./.test(domain)) {
            return 'Domain cannot contain consecutive dots';
          }
          
          // Remove port if present for validation
          const domainWithoutPort = domain.replace(/:\d+$/, '');
          
          // Allow localhost or IP addresses
          if (/^localhost$/i.test(domainWithoutPort) || /^\d+\.\d+\.\d+\.\d+$/.test(domainWithoutPort)) {
            // Valid localhost or IP
          } else {
            // For regular domains, require proper structure: at least one dot with valid TLD
            // Domain must have format like: example.com, sub.example.org, etc.
            const domainParts = domainWithoutPort.split('.');
            
            if (domainParts.length < 2) {
              return 'Domain must have at least a second-level domain and TLD (e.g., example.com)';
            }
            
            // Check TLD (last part) - must be letters only, 2+ characters
            const tld = domainParts[domainParts.length - 1];
            if (!/^[a-zA-Z]{2,}$/.test(tld)) {
              return 'TLD must contain only letters and be at least 2 characters (e.g., .com, .org)';
            }
            
            // Check second-level domain (second to last part) - must not be empty
            const sld = domainParts[domainParts.length - 2];
            if (!sld || sld.length === 0) {
              return 'Second-level domain cannot be empty';
            }
            
            // Each part should only contain valid characters (alphanumeric and hyphens)
            for (const part of domainParts) {
              if (!/^[a-zA-Z0-9-]+$/.test(part)) {
                return 'Domain parts can only contain letters, numbers, and hyphens';
              }
              if (part.startsWith('-') || part.endsWith('-')) {
                return 'Domain parts cannot start or end with hyphens';
              }
            }
          }
          
          // Check for double slashes in path
          if (/\/\//.test(trimmed.substring(trimmed.indexOf('://') + 3))) {
            const afterDomain = trimmed.substring(trimmed.indexOf(domain) + domain.length);
            if (/\/\//.test(afterDomain)) {
              return 'IRI path cannot contain consecutive slashes';
            }
          }
        }
      }
      
      // Check for @ symbol in inappropriate places (not in userinfo or email schemes)
      if (/@/.test(trimmed) && !/^(mailto:|http:\/\/[^@]*@|https:\/\/[^@]*@)/.test(trimmed)) {
        return 'IRI contains @ symbol in invalid position';
      }
      
      // Check for fragment identifier issues (multiple # symbols)
      if ((trimmed.match(/#/g) || []).length > 1) {
        return 'IRI can only contain one fragment identifier (#)';
      }
      
      console.log('IRI is valid');
      return null;
    };


    const validateIriInput = (e) => {
      const { name, value } = e.target;
      
      // Map field names to their error setter functions - EXPANDED LIST
      const errorSetters = {
        'homepageURLInput': setHomepageURLInputError,
        'otherPagesInput': setOtherPagesInputError,
        'vocabulariesUsedInput': setVocabulariesUsedInputError,
        'kgSchemaInput': setKgSchemaInputError,
        'primaryReferenceDocInput': setPrimaryReferenceDocInputError,
        'license': setLicenseError,
        'categoryInput': setCategoryInputError,
        'publicationReferencesInput': setPublicationReferencesInputError,
        'accessStatement': setAccessStatementError,
        'sourceInput': setSourceInputError,
        'currentRoleAgent': setCurrentRoleAgentError,
        'distDownloadURL': setDistDownloadURLError,
        'distAccessURL': setDistAccessURLError,
        'sparqlEndpointURL': setSparqlEndpointURLError,
        'exampleResourceAccessURL': setExampleResourceAccessURLError
      };
      
      // Map field names to their valid setter functions - EXPANDED LIST
      const validSetters = {
        'homepageURLInput': setHomepageURLInputValid,
        'otherPagesInput': setOtherPagesInputValid,
        'vocabulariesUsedInput': setVocabulariesUsedInputValid,
        'kgSchemaInput': setKgSchemaInputValid,
        'primaryReferenceDocInput': setPrimaryReferenceDocInputValid,
        'license': setLicenseValid,
        
        'categoryInput': setCategoryInputValid,
        'publicationReferencesInput': setPublicationReferencesInputValid,
        'accessStatement': setAccessStatementValid,
        'sourceInput': setSourceInputValid,
        'currentRoleAgent': setCurrentRoleAgentValid,
        'distDownloadURL': setDistDownloadURLValid,
        'distAccessURL': setDistAccessURLValid,
        'sparqlEndpointURL': setSparqlEndpointURLValid,
        'exampleResourceAccessURL': setExampleResourceAccessURLValid
      };
      
      const setErrorFunc = errorSetters[name];
      const setValidFunc = validSetters[name];
      
      if (!setErrorFunc || !setValidFunc) return; // Field doesn't need IRI validation
      // DEBUG: Log which field is being validated
      // console.log('Validating IRI for field:', name, value);
      
      // Skip validation for empty optional fields
      if (!value || !value.trim()) {
        setErrorFunc('');
        setValidFunc(false);
        return;
      }
      
      const iriError = isValidIriString(value);
      if (iriError) {
        setErrorFunc(iriError);
        setValidFunc(false);
      } else {
        setErrorFunc('');
        setValidFunc(true);
      }
    };
    
    // 2. Add new state declarations for error and valid states (add these to your existing state declarations):
    
    // Error states for new IRI fields
    const [vocabulariesUsedInputError, setVocabulariesUsedInputError] = useState('');
    const [kgSchemaInputError, setKgSchemaInputError] = useState('');
    const [licenseError, setLicenseError] = useState('');
    
    // Single-value field rejection messages
    const [titleRejectionMessage, setTitleRejectionMessage] = useState('');
    const [descriptionRejectionMessage, setDescriptionRejectionMessage] = useState('');
    const [versionRejectionMessage, setVersionRejectionMessage] = useState('');
    const [accessStatementRejectionMessage, setAccessStatementRejectionMessage] = useState('');
    const [createdDateRejectionMessage, setCreatedDateRejectionMessage] = useState('');
    const [publishedDateRejectionMessage, setPublishedDateRejectionMessage] = useState('');
    const [licenseRejectionMessage, setLicenseRejectionMessage] = useState('');
    const [accessStatementError, setAccessStatementError] = useState('');
    const [currentRoleAgentError, setCurrentRoleAgentError] = useState('');
    const [currentRoleEmailError, setCurrentRoleEmailError] = useState('');
    const [distDownloadURLError, setDistDownloadURLError] = useState('');
    const [distAccessURLError, setDistAccessURLError] = useState('');
    const [distAccessServiceError, setDistAccessServiceError] = useState('');
    const [distHasPolicyError, setDistHasPolicyError] = useState('');
    
    // State for custom license input
    const [customLicenseInput, setCustomLicenseInput] = useState('');
    
    // Valid states for new IRI fields
    const [vocabulariesUsedInputValid, setVocabulariesUsedInputValid] = useState(false);
    const [kgSchemaInputValid, setKgSchemaInputValid] = useState(false);
    const [currentRoleAgentValid, setCurrentRoleAgentValid] = useState(false);
    const [currentRoleEmailValid, setCurrentRoleEmailValid] = useState(false);
    const [distDownloadURLValid, setDistDownloadURLValid] = useState(false);
    const [distAccessURLValid, setDistAccessURLValid] = useState(false);
    const [distAccessServiceValid, setDistAccessServiceValid] = useState(false);
    
    // 3. Update handleAddTag to include IRI validation for new fields:
    
    const handleAddTag = (fieldName, inputValue, setInputFunc, setErrorFunc) => {
      if (setErrorFunc) setErrorFunc(''); // Clear previous error
      // No need to handle identifier field validation anymore
      if (fieldName === 'alternativeTitle') setAlternativeTitleInputValid(false);
    
      if (!inputValue.trim()) return;
      
      const trimmedValue = inputValue.trim();
      let validationError = null;
      
      // Fields that require IRI validation - EXPANDED LIST
      const iriFields = [
        'homepageURL', 'otherPages', 'vocabulariesUsed', 'kgSchema',
        'primaryReferenceDocument', 'category', 
        'publicationReferences', 'source'
      ];
    
      if (iriFields.includes(fieldName)) {
        validationError = isValidIriString(trimmedValue);
      }

      // BCP-47 validation for language field
      if (fieldName === 'language') {
        validationError = isValidBCP47(trimmedValue);
        setLanguageInputValid(!validationError);
      }
      
      // Add the tag regardless of validation
      setFormData(prevFormData => ({
        ...prevFormData,
        [fieldName]: [...(prevFormData[fieldName] || []), trimmedValue]
      }));
      
      // Track invalid tags with their error messages
      if (validationError) {
        setInvalidTags(prev => ({
          ...prev,
          [fieldName]: {
            ...(prev[fieldName] || {}),
            [trimmedValue]: validationError
          }
        }));
      }
      
      setInputFunc('');
    };
    
    // Helper functions for single-value tag fields
    const handleAddSingleValueTag = (fieldName, inputValue, setInputFunc, setRejectionFunc) => {
      if (!inputValue.trim()) return;
      
      // Check if field already has a value
      if (formData[fieldName] && formData[fieldName].trim()) {
        setRejectionFunc('This field only allows one value. Remove the existing value first.');
        setTimeout(() => setRejectionFunc(''), 3000); // Clear message after 3 seconds
        return;
      }
      
      // Set the single value
      setFormData(prevFormData => ({
        ...prevFormData,
        [fieldName]: inputValue.trim()
      }));
      
      // Clear the input
      setInputFunc('');
      
      // Clear any rejection message
      setRejectionFunc('');
    };
    
    const handleRemoveSingleValueTag = (fieldName, setRejectionFunc) => {
      setFormData(prevFormData => ({
        ...prevFormData,
        [fieldName]: ''
      }));
      
      // Clear any rejection message
      setRejectionFunc('');
    };
    
    // Helper function for single-value date fields with validation
    const handleAddSingleValueDateTag = (fieldName, inputValue, setInputFunc, setRejectionFunc, setErrorFunc, setValidFunc) => {
      if (!inputValue.trim()) return;
      
      // Check if field already has a value
      if (formData[fieldName] && formData[fieldName].trim()) {
        setRejectionFunc('This field only allows one value. Remove the existing value first.');
        setTimeout(() => setRejectionFunc(''), 3000);
        return;
      }
      
      // Validate date format
      if (!isValidDate(inputValue)) {
        // Use the existing validateDateInput function to get proper error message
        const syntheticEvent = {
          target: {
            name: fieldName,
            value: inputValue
          }
        };
        validateDateInput(syntheticEvent);
        return;
      }
      
      // Set the single value
      setFormData(prevFormData => ({
        ...prevFormData,
        [fieldName]: inputValue.trim()
      }));
      
      // Clear the input and set as valid
      setInputFunc('');
      setErrorFunc('');
      setValidFunc(true);
      setRejectionFunc('');
    };
    
    // Helper function for single-value dropdown fields
    const handleAddSingleValueDropdownTag = (fieldName, inputValue, setInputFunc, setRejectionFunc, setValidFunc) => {
      if (!inputValue.trim()) return;
      
      // Check if field already has a value
      if (formData[fieldName] && formData[fieldName].trim()) {
        setRejectionFunc('This field only allows one value. Remove the existing value first.');
        setTimeout(() => setRejectionFunc(''), 3000);
        return;
      }
      
      // Set the single value
      setFormData(prevFormData => ({
        ...prevFormData,
        [fieldName]: inputValue.trim()
      }));
      
      // Clear the input and set as valid
      setInputFunc('');
      setValidFunc(true);
      setRejectionFunc('');
    };

    const handleChange = (e) => {
      const { name, value } = e.target;
      
      // Clear valid states when user starts typing in date fields
      if (name === 'createdDate') setCreatedDateValid(false);
      if (name === 'publishedDate') setPublishedDateValid(false);
      
      // Clear valid states for regular fields when typing
      if (name === 'title') setTitleValid(false);
      if (name === 'description') setDescriptionValid(false);
      if (name === 'license') setLicenseValid(false);
      if (name === 'version') setVersionValid(false); // Reset version validation
      if (name === 'accessStatement') setAccessStatementValid(false);
      if (name === 'keywords') setKeywordsInputValid(false);
      if (name === 'nameSpace') setNameSpaceInputValid(false);
      if (name === 'restAPI') setRestAPIInputValid(false);
      
      if (name === 'exampleQueries') setExampleQueriesInputValid(false);
      
      setFormData({
        ...formData,
        [name]: value
      });

      // Validate non-IRI and non-date fields
      validateRegularInput(e);
    };
  
    const handleTypeChange = (value) => {
      // Prevent unchecking dcat:Dataset - it's always required
      if (value === 'dcat:Dataset') {
        return;
      }
      
      setFormData(prevData => {
        const currentTypes = prevData.type || [];
        let newTypes;
        
        if (currentTypes.includes(value)) {
          // Remove the value if it's already selected
          newTypes = currentTypes.filter(type => type !== value);
        } else {
          // Add the value if it's not selected
          newTypes = [...currentTypes, value];
        }
        
        // Update validation state - valid if at least one type is selected
        setTypeValid(newTypes.length > 0);
        
        return {
          ...prevData,
          type: newTypes
        };
      });
    };


  // Handle current role field changes
  const handleCurrentRoleChange = (field, value) => {
    setCurrentRole(prevRole => ({
      ...prevRole,
      [field]: value
    }));
  };

  // Reset current role form
  const resetCurrentRoleForm = () => {
    setCurrentRole({
      roleType: '',
      inputMode: 'agentIRI',
      agent: '',
      givenName: '',
      email: ''
    });
    setCurrentRoleAgentError('');
    setCurrentRoleAgentValid(false);
    setCurrentRoleEmailValid(false);
    setCurrentRoleEmailError('');
  };

  // Helper function to validate email format
  const isValidEmailFormat = (email) => {
    if (!email || !email.trim()) {
      return { isValid: false, error: 'Email address is required.' };
    }
    
    const trimmedEmail = email.trim();
    
    // Check for disallowed characters
    if (trimmedEmail.includes(',')) {
      return { isValid: false, error: 'Email address cannot contain commas' };
    }
    
    if (trimmedEmail.includes(' ')) {
      return { isValid: false, error: 'Email address cannot contain spaces' };
    }
    
    if (trimmedEmail.includes('..')) {
      return { isValid: false, error: 'Email address cannot contain consecutive dots' };
    }
    
    if (trimmedEmail.startsWith('.') || trimmedEmail.includes('@.')) {
      return { isValid: false, error: 'Invalid dot placement in email address' };
    }
    
    if ((trimmedEmail.match(/@/g) || []).length !== 1) {
      return { isValid: false, error: 'Email address must contain exactly one @ symbol' };
    }
    
    // Comprehensive email regex
    const emailRegex = /^[a-zA-Z0-9._+%-]+@[a-zA-Z0-9][a-zA-Z0-9.-]*[a-zA-Z0-9]\.[a-zA-Z]{2,}$/;
    
    if (!emailRegex.test(trimmedEmail)) {
      return { isValid: false, error: 'Please enter a valid email address (e.g., user@example.com)' };
    }
    
    return { isValid: true };
  };

  // Validate a role before adding it
  const validateRole = (role, allowBypass = false) => {
    // Always require role type
    if (!role.roleType || role.roleType === '') {
      return { isValid: false, error: 'Please select a role type.' };
    }
    
    if (role.inputMode === 'agentIRI') {
      // Check if agent field has value
      if (!role.agent || !role.agent.trim()) {
        if (!allowBypass) {
          return { isValid: false, error: 'Agent IRI is required.' };
        }
      } else {
        // Validate IRI if provided
        const iriError = isValidIriString(role.agent);
        if (iriError) {
          return { isValid: false, error: `Invalid IRI: ${iriError}` };
        }
      }
      return { isValid: true };
    } else {
      // At least one of givenName or email must be provided
      const hasName = role.givenName && role.givenName.trim();
      const hasEmail = role.email && role.email.trim();
      
      if (!hasName && !hasEmail) {
        return { isValid: false, error: 'Please provide at least a name or an email.' };
      }
      
      // If email is provided, validate it
      if (hasEmail) {
        const emailValidation = isValidEmailFormat(role.email);
        if (!emailValidation.isValid) {
          return emailValidation;
        }
      }
      
      return { isValid: true };
    }
  };

  // Add a role
  const handleAddRole = () => {
    const validation = validateRole(currentRole, bypassValidation);
    if (!validation.isValid) {
      setMessage(validation.error);
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    // Create role object without inputMode, only store actual field values
    const newRole = {
      roleType: currentRole.roleType,
      agent: currentRole.agent || '',
      givenName: currentRole.givenName || '',
      email: currentRole.email || '',
      id: Date.now() // Simple ID for React keys
    };

    setFormData({
      ...formData,
      roles: [...formData.roles, newRole]
    });

    resetCurrentRoleForm();
    setMessage('Role added successfully');
    setTimeout(() => setMessage(''), 2000);
  };

  // Remove a role
  const handleRemoveRole = (index) => {
    const newRoles = formData.roles.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      roles: newRoles
    });
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
    
    const validSetters = {
      'createdDate': setCreatedDateValid,
      'publishedDate': setPublishedDateValid,
      'modifiedDate': setModifiedDateValid,
      'distReleaseDate': setDistReleaseDateValid,
      'distModificationDate': setDistModificationDateValid
    };
    
    const setValidFunc = validSetters[name];
    
    if (!value && name !== 'publishedDate') {
      e.target.setCustomValidity('');
      
      if (name === 'createdDate') setCreatedDateError('');
      else if (name === 'modifiedDate') setModifiedDateError('');
      else if (name === 'distReleaseDate') setDistReleaseDateError('');
      else if (name === 'distModificationDate') setDistModificationDateError('');
      
      if (setValidFunc) setValidFunc(false);
      return;
    }
    
    const datePattern = /^\d{4}\/\d{2}\/\d{2}$/;
    if (!datePattern.test(value)) {
      errorMessage = 'Please use YYYY/MM/DD format';
      e.target.setCustomValidity(errorMessage);
      
      if (name === 'createdDate') setCreatedDateError(errorMessage);
      else if (name === 'publishedDate') setPublishedDateError(errorMessage);
      else if (name === 'modifiedDate') setModifiedDateError(errorMessage);
      else if (name === 'distReleaseDate') setDistReleaseDateError(errorMessage);
      else if (name === 'distModificationDate') setDistModificationDateError(errorMessage);
      
      if (setValidFunc) setValidFunc(false);
      return;
    }
    
    const parts = value.split('/');
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const day = parseInt(parts[2], 10);
    
    if (year < 1900 || year > 2100) {
      errorMessage = 'Year should be between 1900 and 2100';
      e.target.setCustomValidity(errorMessage);
      
      if (name === 'createdDate') setCreatedDateError(errorMessage);
      else if (name === 'publishedDate') setPublishedDateError(errorMessage);
      else if (name === 'modifiedDate') setModifiedDateError(errorMessage);
      else if (name === 'distReleaseDate') setDistReleaseDateError(errorMessage);
      else if (name === 'distModificationDate') setDistModificationDateError(errorMessage);
      
      if (setValidFunc) setValidFunc(false);
      return;
    }
    
    if (month < 1 || month > 12) {
      errorMessage = 'Month should be between 1 and 12';
      e.target.setCustomValidity(errorMessage);
      
      if (name === 'createdDate') setCreatedDateError(errorMessage);
      else if (name === 'publishedDate') setPublishedDateError(errorMessage);
      else if (name === 'modifiedDate') setModifiedDateError(errorMessage);
      else if (name === 'distReleaseDate') setDistReleaseDateError(errorMessage);
      else if (name === 'distModificationDate') setDistModificationDateError(errorMessage);
      
      if (setValidFunc) setValidFunc(false);
      return;
    }
    
    const daysInMonth = [
      31, isLeapYear(year) ? 29 : 28, 31, 30, 31, 30,
      31, 31, 30, 31, 30, 31
    ];
    
    if (day < 1 || day > daysInMonth[month - 1]) {
      errorMessage = `Day should be between 1 and ${daysInMonth[month - 1]} for this month`;
      e.target.setCustomValidity(errorMessage);
      
      if (name === 'createdDate') setCreatedDateError(errorMessage);
      else if (name === 'publishedDate') setPublishedDateError(errorMessage);
      else if (name === 'modifiedDate') setModifiedDateError(errorMessage);
      else if (name === 'distReleaseDate') setDistReleaseDateError(errorMessage);
      else if (name === 'distModificationDate') setDistModificationDateError(errorMessage);
      
      if (setValidFunc) setValidFunc(false);
      return;
    }
    
    const date = new Date(year, month - 1, day);
    if (
      isNaN(date.getTime()) || 
      date.getFullYear() !== year || 
      date.getMonth() !== month - 1 || 
      date.getDate() !== day
    ) {
      errorMessage = 'Invalid date';
      e.target.setCustomValidity(errorMessage);
      
      if (name === 'createdDate') setCreatedDateError(errorMessage);
      else if (name === 'publishedDate') setPublishedDateError(errorMessage);
      else if (name === 'modifiedDate') setModifiedDateError(errorMessage);
      else if (name === 'distReleaseDate') setDistReleaseDateError(errorMessage);
      else if (name === 'distModificationDate') setDistModificationDateError(errorMessage);
      
      if (setValidFunc) setValidFunc(false);
      return;
    }
    
    e.target.setCustomValidity('');
    
    if (name === 'createdDate') setCreatedDateError('');
    else if (name === 'publishedDate') setPublishedDateError('');
    else if (name === 'modifiedDate') setModifiedDateError('');
    else if (name === 'distReleaseDate') setDistReleaseDateError('');
    else if (name === 'distModificationDate') setDistModificationDateError('');
    
    if (setValidFunc) setValidFunc(true);

    if (setValidFunc) {
      setValidFunc(true);
      console.log(`Setting ${name} to valid`); // Add this line
    }

    };
  

  const isLeapYear = (year) => {
    return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
  };
  
  
  const convertToISODate = (dateString) => {
    if (!dateString) return '';
    
    if (/^\d{4}\/\d{2}\/\d{2}$/.test(dateString)) {
      return dateString.replace(/\//g, '-');
    }
    
    return dateString;
  };


  const validateRegularInput = (e) => {
    const { name, value } = e.target;
    
    // Map field names to their valid setter functions
    const validSetters = {
      'title': setTitleValid,
      'description': setDescriptionValid,
      'type': setTypeValid,
      
      'version': setVersionValid, // Version validation
      'accessStatement': setAccessStatementValid,
      'keywords': setKeywordsInputValid,
      'language': setLanguageInputValid,
      'iriTemplate': setIriTemplateInputValid,
      'nameSpace': setNameSpaceInputValid,
      'vocabulariesUsed': setVocabulariesUsedInputValid,
      'kgSchema': setKgSchemaInputValid,
      'restAPI': setRestAPIInputValid,
      
      'exampleQueries': setExampleQueriesInputValid,
      'distLicense': setDistLicenseValid,
      'distRights': setDistRightsValid,
      'distSpatialResolution': setDistSpatialResolutionValid,
      'distTemporalResolution': setDistTemporalResolutionValid,
      'distCompressionFormat': setDistCompressionFormatValid,
      'distPackagingFormat': setDistPackagingFormatValid,
      'distHasPolicy': setDistHasPolicyValid,
    'sparqlIdentifier': setSparqlIdentifierValid,
    'sparqlTitle': setSparqlTitleValid,
    'sparqlEndpointDescription': setSparqlEndpointDescriptionValid,
    'sparqlStatus': setSparqlStatusValid,
    'exampleResourceTitle': setExampleResourceTitleValid,
    'exampleResourceDescription': setExampleResourceDescriptionValid,
    'exampleResourceStatus': setExampleResourceStatusValid,
    'linkedResourceTarget': setLinkedResourceTargetValid,
    'linkedResourceTriples': setLinkedResourceTriplesValid
    };
    
    const setValidFunc = validSetters[name];
    if (!setValidFunc) return;
    
    // Set valid if field has content
    setValidFunc(value && value.trim().length > 0);
};

  // Email validation function for email field
  const validateEmailInput = (e) => {
    const { value } = e.target;
    
    if (!value || value.trim() === '') {
      setCurrentRoleEmailError('');
      setCurrentRoleEmailValid(false);
      return;
    }
    
    // Use the reusable email validation function
    const validation = isValidEmailFormat(value);
    
    if (validation.isValid) {
      setCurrentRoleEmailError('');
      setCurrentRoleEmailValid(true);
    } else {
      setCurrentRoleEmailError(validation.error);
      setCurrentRoleEmailValid(false);
    }
  };

  // BCP-47 language tag validation function
  const isValidBCP47 = (langTag) => {
    if (!langTag || !langTag.trim()) {
      return null; // Empty is handled elsewhere
    }
    
    const tag = langTag.trim();
    
    // BCP-47 regex: language[-script][-region][-variant]
    // Language: 2-3 letters, Script: 4 letters, Region: 2 letters or 3 digits
    const bcp47Regex = /^[a-zA-Z]{2,3}(-[a-zA-Z]{4})?(-[a-zA-Z]{2}|-[0-9]{3})?(-[a-zA-Z0-9]{5,8})?$/;
    
    if (!bcp47Regex.test(tag)) {
      return 'Invalid language tag. Use BCP-47 format (e.g., "en", "en-US", "fr", "zh-Hans")';
    }
    
    return null; // Valid
  };
  
  const handleRemoveTag = (fieldName, index) => {
    const newTags = [...formData[fieldName]];
    const removedTag = newTags[index];
    newTags.splice(index, 1);
    setFormData({
      ...formData,
      [fieldName]: newTags
    });
    
    // Remove from invalid tags if it exists
    if (invalidTags[fieldName] && invalidTags[fieldName][removedTag]) {
      const newInvalidTags = { ...invalidTags };
      delete newInvalidTags[fieldName][removedTag];
      // Clean up empty field objects
      if (Object.keys(newInvalidTags[fieldName]).length === 0) {
        delete newInvalidTags[fieldName];
      }
      setInvalidTags(newInvalidTags);
    }
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

  const handleAddMetaGraphIRI = () => {
    if (metaGraphInput.trim()) {
      const iriError = isValidIriString(metaGraphInput);
      if (!iriError) {
        setFormData({
          ...formData,
          metaGraph: [...formData.metaGraph, metaGraphInput.trim()]
        });
        setMetaGraphInput('');
        setMetaGraphInputError('');
        setMetaGraphInputValid(false);
      } else {
        setMetaGraphInputError(iriError);
        setMetaGraphInputValid(false);
      }
    }
  };
  
  const addPendingTagInputs = () => {
    // Create a copy of the current form data that we'll update
    let updatedFormData = {...formData};
    
    // Handle single-value fields first
    if (titleInput.trim() && !updatedFormData.title) {
      updatedFormData.title = titleInput.trim();
    }
    
    if (descriptionInput.trim() && !updatedFormData.description) {
      updatedFormData.description = descriptionInput.trim();
    }
    
    if (versionInput.trim() && !updatedFormData.version) {
      updatedFormData.version = versionInput.trim();
    }
    
    if (accessStatementInput.trim() && !updatedFormData.accessStatement) {
      updatedFormData.accessStatement = accessStatementInput.trim();
    }
    
    if (createdDateInput.trim() && !updatedFormData.createdDate) {
      updatedFormData.createdDate = createdDateInput.trim();
    }
    
    if (publishedDateInput.trim() && !updatedFormData.publishedDate) {
      updatedFormData.publishedDate = publishedDateInput.trim();
    }
    
    // Handle all tag input fields (multi-value)
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
      const iriError = isValidIriString(homepageURLInput);
      if (!iriError) {
        updatedFormData = {
          ...updatedFormData,
          homepageURL: [...updatedFormData.homepageURL, homepageURLInput.trim()]
        };
      } else {
        setHomepageURLInputError(iriError);
      }
    }
    
    if (otherPagesInput.trim()) {
      const iriError = isValidIriString(otherPagesInput);
      if (!iriError) {
        updatedFormData = {
          ...updatedFormData,
          otherPages: [...updatedFormData.otherPages, otherPagesInput.trim()]
        };
      } else {
        setOtherPagesInputError(iriError);
      }
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
    
    if (metaGraphInput.trim()) {
      const iriError = isValidIriString(metaGraphInput);
      if (!iriError) {
        updatedFormData = {
          ...updatedFormData,
          metaGraph: [...updatedFormData.metaGraph, metaGraphInput.trim()]
        };
      } else {
        setMetaGraphInputError(iriError);
      }
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
    
    if (kgSchemaInput.trim()) {
      const iriError = isValidIriString(kgSchemaInput);
      if (!iriError) {
        updatedFormData = {
          ...updatedFormData,
          kgSchema: [...updatedFormData.kgSchema, kgSchemaInput.trim()]
        };
      } else {
        setKgSchemaInputError(iriError);
      }
    }
    
    if (restAPIInput.trim()) {
      // restAPI does not require IRI validation - can be endpoint descriptions
      updatedFormData = {
        ...updatedFormData,
        restAPI: [...updatedFormData.restAPI, restAPIInput.trim()]
      };
    }
    
    if (exampleQueriesInput.trim()) {
      updatedFormData = {
        ...updatedFormData,
        exampleQueries: [...updatedFormData.exampleQueries, exampleQueriesInput.trim()]
      };
    }
    
    if (statisticsInput.trim()) {
      // Number of Triples does not require IRI validation - can be text descriptions
      updatedFormData = {
        ...updatedFormData,
        statistics: [...updatedFormData.statistics, statisticsInput.trim()]
      };
    }
    
    if (primaryReferenceDocInput.trim()) {
      const iriError = isValidIriString(primaryReferenceDocInput);
      if (!iriError) {
        updatedFormData = {
          ...updatedFormData,
          primaryReferenceDocument: [...updatedFormData.primaryReferenceDocument, primaryReferenceDocInput.trim()]
        };
      } else {
        setPrimaryReferenceDocInputError(iriError);
      }
    }
    
    if (metaGraphInput.trim()) {
      const iriError = isValidIriString(metaGraphInput);
      if (!iriError) {
        updatedFormData = {
          ...updatedFormData,
          metaGraph: [...updatedFormData.metaGraph, metaGraphInput.trim()]
        };
      } else {
        setMetaGraphInputError(iriError);
      }
    }
    
    // Check if current distribution is partially filled and valid
    const currDist = currentDistribution;
    if (currDist.title || currDist.description || currDist.mediaType || 
        currDist.downloadURL || currDist.accessURL) {
      // Only add the distribution if it passes full validation
      const validation = validateDistribution(currDist);
      if (validation.isValid) {
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
  const validateDistribution = (dist, allowBypass = false) => {
    // Check if all fields are empty - never allow this
    const hasAnyValue = Object.values(dist).some(value => value && value.trim && value.trim());
    if (!hasAnyValue) {
      return { isValid: false, error: 'Cannot add empty distribution. Please fill in at least one field.' };
    }

    // If bypass is enabled, skip required field checks but still validate IRIs
    if (!allowBypass) {
      // Check required fields
      if (!dist.title || !dist.description || !dist.mediaType || 
          !dist.downloadURL || !dist.accessURL) {
        return { isValid: false, error: 'Please fill in all required fields for the distribution' };
      }
    }

    // Always validate IRI fields (even in bypass mode) if they have values
    if (dist.downloadURL && dist.downloadURL.trim()) {
      const downloadURLError = isValidIriString(dist.downloadURL);
      if (downloadURLError) {
        return { isValid: false, error: `Invalid Download URL: ${downloadURLError}` };
      }
    }

    if (dist.accessURL && dist.accessURL.trim()) {
      const accessURLError = isValidIriString(dist.accessURL);
      if (accessURLError) {
        return { isValid: false, error: `Invalid Access URL: ${accessURLError}` };
      }
    }

    // Validate optional IRI fields (only if they have values)
    if (dist.accessService && dist.accessService.trim()) {
      const accessServiceError = isValidIriString(dist.accessService);
      if (accessServiceError) {
        return { isValid: false, error: `Invalid Access Service: ${accessServiceError}` };
      }
    }

    if (dist.hasPolicy && dist.hasPolicy.trim()) {
      const hasPolicyError = isValidIriString(dist.hasPolicy);
      if (hasPolicyError) {
        return { isValid: false, error: `Invalid Has Policy: ${hasPolicyError}` };
      }
    }

    if (dist.license && dist.license.trim()) {
      const licenseError = isValidIriString(dist.license);
      if (licenseError) {
        return { isValid: false, error: `Invalid License: ${licenseError}` };
      }
    }

    return { isValid: true };
  };

  // Add a distribution
  const handleAddDistribution = () => {
    const validation = validateDistribution(currentDistribution, bypassValidation);
    if (!validation.isValid) {
      setMessage(validation.error);
      setTimeout(() => setMessage(''), 5000);
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
      spatialResolution: '',
      temporalResolution: '',
      releaseDate: '',
      modificationDate: '',
      issued: ''
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
      31, isLeapYear(year) ? 29 : 28, 31, 30, 31, 30,
      31, 31, 30, 31, 30, 31
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
  
  
  const handleSubmit = async (e, forceSubmit = false) => {
    e.preventDefault();
    
    const updatedForm = addPendingTagInputs();
    
    // Keep the user-specified version number as is
    // The full version (UUID+vNum) will be displayed in the UI but we store just the number
    
    // Separate arrays for different types of errors
    const missingFields = [];
    const invalidDates = [];
    
    // Check for missing required fields (including dates)
    if (!updatedForm.title) missingFields.push('Title');
    if (!updatedForm.description) missingFields.push('Description'); 
    if (!updatedForm.type || updatedForm.type.length === 0) missingFields.push('Type');
    if (!updatedForm.publishedDate) missingFields.push('Published Date');
    if (updatedForm.distributions.length === 0) missingFields.push('Distribution');
    if (updatedForm.primaryReferenceDocument.length === 0) missingFields.push('Primary Reference Document');
    if (updatedForm.keywords.length === 0) missingFields.push('Keywords');
    if (updatedForm.language.length === 0) missingFields.push('Language');
    if (!updatedForm.accessStatement) missingFields.push('Access Statement');
    if (updatedForm.vocabulariesUsed.length === 0) missingFields.push('Vocabularies Used');
    
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

    // Handle validation errors based on submission mode
    if (errorMessage && !forceSubmit) {
      setMessage(errorMessage);
      setIsSubmitting(false);
      return;
    }
    
    // For forced submission, collect validation errors to include in the data
    const validationErrors = {
      missingFields: missingFields,
      invalidDates: invalidDates,
      errorMessage: errorMessage,
      submissionMode: forceSubmit ? 'forced' : 'normal',
      submissionTimestamp: new Date().toISOString()
    };
    
    // Sync SPARQL endpoints, Example Resources, and Linked Resources before submission
    updatedForm.sparqlEndpoint = sparqlEndpoints;
    updatedForm.exampleResource = exampleResources;
    updatedForm.linkedResources = linkedResources;

    // Proceed with submission
    setIsSubmitting(true);
    setMessage('');
    
    // Handle custom license formatting
    let finalFormData = { ...updatedForm };
    if (updatedForm.license === 'Other' && customLicenseInput.trim()) {
      finalFormData.license = `Other-${customLicenseInput.trim()}`;
    }
  
  // Structure submission with validation errors outside form data
  const submissionData = {
    formData: finalFormData,
    validationErrors: validationErrors,
    aiSuggestions: aiSuggestions, // Store all OpenAI suggestions
    metadata: {
      submissionType: narrativeFile ? 'llm' : 'regular',
      hasValidationErrors: (missingFields.length > 0 || invalidDates.length > 0),
      submissionMode: forceSubmit ? 'FORCED_SUBMISSION' : 'NORMAL_SUBMISSION',
      timestamp: new Date().toISOString(),
      formOpenedAt: formOpenedAt,
      formSubmittedAt: new Date().toISOString(),
      autoSubmittedByTimer: autoSubmittedByTimer,
      timeSpentSeconds: Math.round((new Date() - new Date(formOpenedAt)) / 1000),
      // Session tracking
      editSessions: getAllSessions(),
      totalTimeSpentSeconds: getTotalTimeSpent(),
      numberOfEditSessions: getAllSessions().length
    }
  };
  
  if (forceSubmit) {
    console.log('FORCED SUBMISSION - Validation errors recorded:', validationErrors);
  }
  
  try {
    // Submit structured data to parent component
    const result = await onSubmit(submissionData);
    
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
    
    console.log('=== SAVING DRAFT ===');
    console.log('showTurtleMode:', showTurtleMode);
    console.log('isLlmMode:', isLlmMode);
    console.log('turtleContent length:', turtleContent?.length || 0);
    console.log('turtleContent preview:', turtleContent?.substring(0, 100));
    console.log('updatedForm:', updatedForm);
    console.log('formData:', formData);
    
    // Handle custom license formatting for drafts
    let finalFormData = { ...updatedForm };
    if (updatedForm.license === 'Other' && customLicenseInput.trim()) {
      finalFormData.license = `Other-${customLicenseInput.trim()}`;
    }
    
    // Sync collections before saving draft
    finalFormData.sparqlEndpoint = sparqlEndpoints;
    finalFormData.exampleResource = exampleResources;
    finalFormData.linkedResources = linkedResources;
    
    const existingDraftId = finalFormData.draftId || null;
    const draftId = existingDraftId || `draft-${Date.now()}`;
    
    // Determine the form type explicitly
    let formType = 'normal';
    if (showTurtleMode) {
      formType = 'turtle';
    } else if (isLlmMode) {
      formType = 'llm';
    }
    
    console.log('Saving draft with formType:', formType);
    
    // Save current session before closing
    const currentSession = {
      startTime: currentSessionStart,
      endTime: new Date().toISOString(),
      durationSeconds: getCurrentSessionDuration()
    };
    const allSessions = [...editSessions, currentSession];
    const totalTimeSpent = allSessions.reduce((sum, s) => sum + s.durationSeconds, 0);
    
    console.log('Saving draft with', allSessions.length, 'session(s), total time:', totalTimeSpent, 'seconds');
    
    // Build the draft object
    const draft = {
      id: draftId,
      name: finalFormData.title || (showTurtleMode ? 'Turtle Draft' : 'Untitled Draft'),
      date: new Date().toISOString(),
      formType: formType, // Explicit form type: 'normal', 'llm', or 'turtle'
      ...finalFormData, // Spread all form data directly at the top level
      draftId: draftId, // Store the draft ID
      customLicenseInput: customLicenseInput, // Also save the custom license input separately for editing
      aiSuggestions: aiSuggestions, // Store all OpenAI suggestions in draft (only relevant for LLM mode)
      editSessions: allSessions, // Store all edit sessions
      totalTimeSpentSeconds: totalTimeSpent // Store cumulative time spent
    };
    
    // If in turtle mode, save turtle-specific data
    if (showTurtleMode) {
      draft.submissionType = 'turtle'; // Keep for backward compatibility
      draft.turtleContent = turtleContent;
      console.log('Saving turtle draft with content length:', turtleContent.length);
    }
    
    console.log('Draft to be saved:', JSON.stringify(draft, null, 2));
    
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
    
    console.log('Draft saved to localStorage');
    console.log('Verifying saved draft:', JSON.parse(localStorage.getItem('kg-metadata-drafts')).find(d => d.id === draftId));
    
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
    <div 
      className={`modal-content ${showAISuggestions ? 'with-ai-panel' : ''} ${showTurtleMode ? 'turtle-mode-wide' : ''}`} 
      onClick={e => e.stopPropagation()}
      style={{
        width: `${modalSize.width}px`,
        height: `${modalSize.height}px`,
        maxWidth: '95vw',
        maxHeight: '95vh',
        position: 'relative'
      }}
    >
      {/* Resize handles */}
      <div 
        className="resize-handle resize-e"
        onMouseDown={(e) => handleResizeStart(e, 'e')}
        style={{
          position: 'absolute',
          right: 0,
          top: 0,
          bottom: 0,
          width: '8px',
          cursor: 'ew-resize',
          zIndex: 10
        }}
      />
      <div 
        className="resize-handle resize-s"
        onMouseDown={(e) => handleResizeStart(e, 's')}
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '8px',
          cursor: 'ns-resize',
          zIndex: 10
        }}
      />
      <div 
        className="resize-handle resize-se"
        onMouseDown={(e) => handleResizeStart(e, 'se')}
        style={{
          position: 'absolute',
          bottom: 0,
          right: 0,
          width: '16px',
          height: '16px',
          cursor: 'nwse-resize',
          zIndex: 11
        }}
      />
      
      {/* Countdown Timer */}
      <div className="countdown-timer" style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        backgroundColor: timeRemaining <= 60 ? '#f39c12' : '#27ae60',
        color: 'white',
        padding: '10px 15px',
        borderRadius: '8px',
        fontWeight: 'bold',
        fontSize: '16px',
        zIndex: 1000,
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
        transition: 'background-color 0.3s ease'
      }}>
        ⏱️ {Math.floor(timeRemaining / 60)}:{String(timeRemaining % 60).padStart(2, '0')}
      </div>
    
    {message && (
      <div className={`floating-message`}>
        <div className={message.includes('success') ? 'success-message' : 'error-message'}>
          <div className={`message-content`}>{message}</div>
          <button 
            type="button" 
            className={`message-close-button`} 
            onClick={() => setMessage(null)} 
            aria-label="Dismiss message"
          >
            Dismiss
          </button>
        </div>
      </div>
    )}

    {/* Turtle Form */}
    {showTurtleMode ? (
      <>
        <div className={`modal-header`}>
          <h2>Turtle Entry</h2>
        </div>
        
        <div className="modal-body turtle-mode" style={{ display: 'flex', flexDirection: 'column', height: 'calc(90vh - 180px)', padding: '20px 16px 20px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <label htmlFor="turtleContent" className="field-label" style={{ margin: 0 }}>
              Turtle Content <span className="field-indicator required-indicator">required</span>
            </label>
            <button
              type="button"
              onClick={() => {
                const validation = validateTurtleContent(turtleContent);
                setTurtleValidation(validation);
              }}
              className="revalidate-button"
              style={{
                padding: '4px 12px',
                fontSize: '12px',
                backgroundColor: '#4169e1',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              🔄 Re-validate
            </button>
          </div>
          
          {/* Side-by-side layout: 70% editor, 30% validation */}
          <div style={{ display: 'flex', gap: '12px', height: 'calc(100% - 40px)', minHeight: 0, overflow: 'hidden' }}>
            {/* Editor section - 70% */}
            <div style={{ 
              flex: '0 0 70%', 
              display: 'flex', 
              flexDirection: 'column',
              minWidth: 0,
              overflow: 'hidden'
            }}>
              <CodeMirror
                value={turtleContent}
                height="100%"
                extensions={[StreamLanguage.define(turtle)]}
                onChange={(value) => setTurtleContent(value)}
                theme="dark"
                basicSetup={{
                  lineNumbers: true,
                  highlightActiveLineGutter: true,
                  highlightSpecialChars: true,
                  foldGutter: true,
                  drawSelection: true,
                  dropCursor: true,
                  allowMultipleSelections: true,
                  indentOnInput: true,
                  syntaxHighlighting: true,
                  bracketMatching: true,
                  closeBrackets: true,
                  autocompletion: true,
                  rectangularSelection: true,
                  crosshairCursor: true,
                  highlightActiveLine: true,
                  highlightSelectionMatches: true,
                  closeBracketsKeymap: true,
                  searchKeymap: true,
                  foldKeymap: true,
                  completionKeymap: true,
                  lintKeymap: true,
                }}
                style={{
                  fontSize: '14px',
                  fontFamily: "'Courier New', Courier, monospace",
                  height: '100%',
                  overflow: 'auto',
                  maxWidth: '100%'
                }}
              />
            </div>
            
            {/* Validation Panel - Uses remaining space - Always visible */}
            <div style={{ 
              flex: '1', 
              display: 'flex', 
              flexDirection: 'column',
              minWidth: 0,
              maxWidth: '30%',
              overflow: 'hidden'
            }}>
              <h4 style={{ margin: '0 0 8px 0', color: 'var(--dark-text)', fontSize: '14px', fontWeight: '600' }}>
                Validation Results
              </h4>
              <div className={`turtle-validation-panel ${turtleValidation.isValid ? 'valid' : 'invalid'}`} style={{ 
                height: '100%',
                overflowY: 'auto',
                marginTop: 0,
                display: 'flex',
                flexDirection: 'column'
              }}>
                {!turtleContent.trim() ? (
                  <div style={{ color: 'var(--dark-text-secondary)', fontStyle: 'italic', padding: '20px', textAlign: 'center', fontSize: '13px' }}>
                    Enter Turtle content to see validation results
                  </div>
                ) : turtleValidation.isValid ? (
                  <div className="validation-success">
                    <span className="validation-icon">✅</span>
                    <span className="validation-message">Valid Turtle syntax</span>
                  </div>
                ) : (
                  <div className="validation-errors" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                    <div className="validation-header">
                      <span className="validation-icon">❌</span>
                      <span className="validation-message">Turtle Syntax Errors:</span>
                    </div>
                    <ul className="error-list" style={{ 
                      flex: 1, 
                      overflowY: 'auto', 
                      overflowX: 'hidden',
                      margin: '8px 0', 
                      paddingLeft: '20px',
                      wordWrap: 'break-word',
                      overflowWrap: 'break-word'
                    }}>
                      {turtleValidation.errors.map((error, index) => (
                        <li key={index} className="error-item" style={{
                          wordWrap: 'break-word',
                          overflowWrap: 'break-word',
                          marginBottom: '8px'
                        }}>
                          <span className="error-location" style={{ display: 'block', fontWeight: 'bold' }}>
                            Line {error.line}, Column {error.column}:
                          </span>
                          <span className="error-message" style={{ 
                            display: 'block',
                            wordWrap: 'break-word',
                            overflowWrap: 'break-word',
                            whiteSpace: 'pre-wrap'
                          }}>{error.message}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
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
            onClick={handleTurtleSaveDraft}
            disabled={!turtleContent.trim()}
          >
            Save Draft
          </button>
          
          <button 
            className="submit-button"
            onClick={handleTurtleSubmit}
            disabled={isSubmitting || !turtleContent.trim()}
          >
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      </>
    ) : (
      <>
        {/* Regular Form */}
        <div className={`modal-header`}>
          <h2>Knowledge Graph Metadata</h2>
          
          {/* Prompt Preview - Only visible in LLM mode */}
          {isLlmMode && (
            <div className="prompt-preview-section">
              <button 
                className="prompt-preview-toggle"
                onClick={() => {
                  const newState = !showPromptPreview;
                  setShowPromptPreview(newState);
                  // Generate and store original prompt when opening
                  if (newState && !originalPrompt) {
                    const prompt = generatePromptPreview();
                    setOriginalPrompt(prompt);
                    setEditedPrompt(prompt);
                  }
                }}
                type="button"
              >
                {showPromptPreview ? '▼' : '▶'} View/Edit OpenAI Prompt
              </button>
              {showPromptPreview && (
                <div className="prompt-preview-content" style={{
                  border: '1px solid var(--dark-border)',
                  borderRadius: '6px',
                  overflow: 'hidden'
                }}>
                  {/* Sticky button bar */}
                  <div className="prompt-actions" style={{ 
                    display: 'flex', 
                    gap: '8px', 
                    padding: '12px',
                    flexWrap: 'wrap',
                    backgroundColor: 'var(--dark-surface)',
                    borderBottom: '1px solid var(--dark-border)',
                    position: 'sticky',
                    top: 0,
                    zIndex: 10
                  }}>
                    <button
                      type="button"
                      onClick={() => {
                        if (!isEditingPrompt) {
                          // Start editing
                          const prompt = generatePromptPreview();
                          setEditedPrompt(prompt);
                          if (!originalPrompt) {
                            setOriginalPrompt(prompt);
                          }
                        }
                        setIsEditingPrompt(!isEditingPrompt);
                      }}
                      style={{
                        padding: '6px 12px',
                        fontSize: '13px',
                        backgroundColor: isEditingPrompt ? '#6c757d' : '#4169e1',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      {isEditingPrompt ? '✓ Done Editing' : '✏️ Edit Prompt'}
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => {
                        if (editedPrompt) {
                          // Re-fetch suggestions with the edited prompt
                          processBulkSuggestionsWithCustomPrompt(editedPrompt);
                        }
                      }}
                      style={{
                        padding: '6px 12px',
                        fontSize: '13px',
                        backgroundColor: promptHasBeenEdited ? '#28a745' : '#5a8a5f',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        opacity: promptHasBeenEdited ? 1 : 0.7
                      }}
                      title={promptHasBeenEdited ? 'Re-fetch with your edited prompt' : 'Re-fetch with current prompt'}
                    >
                      🔄 Re-fetch {promptHasBeenEdited ? 'with Updated Prompt' : 'Suggestions'}
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => {
                        setEditedPrompt(originalPrompt);
                        setPromptHasBeenEdited(false);
                        setIsEditingPrompt(false);
                      }}
                      disabled={!promptHasBeenEdited}
                      style={{
                        padding: '6px 12px',
                        fontSize: '13px',
                        backgroundColor: promptHasBeenEdited ? '#dc3545' : '#cccccc',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: promptHasBeenEdited ? 'pointer' : 'not-allowed',
                        opacity: promptHasBeenEdited ? 1 : 0.6
                      }}
                    >
                      ↺ Reset Prompt
                    </button>
                  </div>
                  
                  {/* Scrollable content area */}
                  <div style={{
                    maxHeight: '400px',
                    overflow: 'auto',
                    backgroundColor: 'var(--dark-surface)'
                  }}>
                    {isEditingPrompt ? (
                      <textarea
                        value={editedPrompt}
                        onChange={(e) => {
                          setEditedPrompt(e.target.value);
                          setPromptHasBeenEdited(e.target.value !== originalPrompt);
                        }}
                        style={{
                          width: '100%',
                          minHeight: '400px',
                          fontFamily: 'monospace',
                          fontSize: '12px',
                          padding: '12px',
                          backgroundColor: 'var(--dark-surface)',
                          color: 'var(--dark-text)',
                          border: 'none',
                          resize: 'none',
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      />
                    ) : (
                      <pre style={{
                        backgroundColor: 'var(--dark-surface)',
                        padding: '12px',
                        margin: 0,
                        whiteSpace: 'pre-wrap',
                        wordWrap: 'break-word',
                        fontFamily: 'monospace',
                        fontSize: '12px'
                      }}>
                        {editedPrompt || generatePromptPreview()}
                      </pre>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
          
        <div className="modal-header-controls">
          {/* Upload section only visible in LLM mode */}
          {isLlmMode && (
            <div className="upload-section">
            <div className="upload-controls">
              <button 
                className="upload-button"
                onClick={handleUploadClick}
                title="Upload the KG document (.txt or .docx) to help AI generate better suggestions"
              >
                📄 Upload the KG Document
              </button>
              {narrativeFile && (
                <span className="file-indicator">
                  ✅ {narrativeFile.name}
                </span>
              )}
            </div>
            <div className="upload-status">
              {processingNarrative && (
                <div className="processing-indicator">
                  🔄 Processing KG document...
                </div>
              )}
              {bulkSuggestionsReady && (
                <div className="suggestions-ready-indicator">
                  AI suggestions ready! Click suggestions in the AI panel to populate fields.
                </div>
              )}
            </div>
            <input
              ref={narrativeInputRef}
              type="file"
              accept=".txt,.docx"
              onChange={handleNarrativeUpload}
              style={{ display: 'none' }}
            />
            </div>
          )}
          <button className={`modal-close-button`} onClick={onClose}>×</button>
        </div>
      </div>
      
      <div className={`modal-body ${showAISuggestions ? 'with-ai-panel' : ''}`} onClick={(e) => e.stopPropagation()}>
        
        <div className="modal-content-wrapper">
          <div className="form-panel">
            <form onSubmit={handleSubmit}>
          
          {/* Hidden for now - Identifier (auto-generated UUID) */}
          {/* <div className="form-group">
            <label htmlFor="identifier">
              Identifier <span className="field-indicator">auto-generated UUID</span>
            </label>
            <div>
              {safeArray('identifier').map((id, index) => (
                <div key={`identifier-${index}`} className="uuid-display">
                  {id}
                </div>
              ))}
              <div className="field-hint">This identifier is automatically generated and cannot be edited</div>
            </div>
          </div> */}
          
          {/* Title */}
          <div className="form-group">
            <label htmlFor="title">
              Title <span className="field-indicator required-indicator">required, 1 value only</span>
            </label>
            <div className="tag-input-container">
              <div className="tag-input-row">
                <input
                  ref={titleInputRef}
                  type="text"
                  id="title"
                  name="titleInput"
                  value={titleInput}
                  onChange={(e) => {
                    setTitleInput(e.target.value);
                    setTitleRejectionMessage(''); // Clear rejection message when typing
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSingleValueTag('title', titleInput, setTitleInput, setTitleRejectionMessage);
                    }
                  }}
                  className={`tag-input ${titleInput.trim().length > 0 ? 'form-input-valid' : ''}`}
                  placeholder="Enter title and press Enter or +"
                />
                <button 
                  type="button" 
                  className="tag-add-button"
                  onClick={() => handleAddSingleValueTag('title', titleInput, setTitleInput, setTitleRejectionMessage)}
                >
                  +
                </button>
              </div>
              
              {/* Display current title as a tag */}
              {formData.title && (
                <div className="tag-list">
                  <div className="tag-item">
                    <span className="tag-text">{formData.title}</span>
                    <button 
                      type="button"
                      className="tag-remove"
                      onClick={() => handleRemoveSingleValueTag('title', setTitleRejectionMessage)}
                    >
                      ×
                    </button>
                  </div>
                </div>
              )}
              
              {/* Rejection message */}
              {titleRejectionMessage && (
                <div className="rejection-message" style={{color: '#e74c3c', fontSize: '0.9em', marginTop: '5px'}}>
                  {titleRejectionMessage}
                </div>
              )}
              
              <div className="field-hint">Press Enter or click + to add title</div>
            </div>
          </div>
          
          {/* Alternative Title */}
          <div className="form-group">
            <label htmlFor="alternativeTitle">
              Alternative Title <span className="field-indicator optional-indicator">optional, multiple values allowed</span>
            </label>
            <div className="tag-input-container">
              <div className="tag-input-row">
                <input
                  type="text"
                  id="alternativeTitle"
                  name="alternativeTitleInput"
                  value={alternativeTitleInput}
                  onChange={(e) => {
                    setAlternativeTitleInput(e.target.value);
                    setAlternativeTitleInputValid(e.target.value.trim().length > 0);
                  }}
                  onKeyPress={(e) => handleKeyPress(e, 'alternativeTitle', alternativeTitleInput, setAlternativeTitleInput)}
                  className={`tag-input ${alternativeTitleInputValid ? 'form-input-valid' : ''}`}
                  placeholder="Enter alternative title and press Enter or +"
                />
                <button 
                  type="button" 
                  className="tag-add-button"
                  onClick={() => {
                    handleAddTag('alternativeTitle', alternativeTitleInput, setAlternativeTitleInput);
                    setAlternativeTitleInputValid(false);
                  }}
                >
                  +
                </button>
              </div>
              <div className="tag-list">
                {safeArray('alternativeTitle').map((title, index) => (
                  <div key={`alt-title-${index}`} className="tag-item tag-item-valid">
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
              <div className="field-hint">Press Enter or click + to add alternative title</div>
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
                  name="acronymInput"
                  value={acronymInput}
                  onChange={(e) => {
                    setAcronymInput(e.target.value);
                    setAcronymInputValid(e.target.value.trim().length > 0);
                  }}
                  onKeyPress={(e) => handleKeyPress(e, 'acronym', acronymInput, setAcronymInput)}
                  className={`tag-input ${acronymInputValid ? 'form-input-valid' : ''}`}
                  placeholder="Enter acronym and press Enter or +"
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
              <div className="field-hint">Press Enter or click + to add acronym</div>
            </div>
          </div>

          {/* Description */}
          <div className="form-group">
            <label htmlFor="description">
              Description <span className="field-indicator required-indicator">required, 1 value only</span>
            </label>
            <div className="tag-input-container">
              <div className="tag-input-row">
                <textarea
                  id="description"
                  name="descriptionInput"
                  value={descriptionInput}
                  onChange={(e) => {
                    setDescriptionInput(e.target.value);
                    setDescriptionRejectionMessage(''); // Clear rejection message when typing
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && e.ctrlKey) {
                      e.preventDefault();
                      handleAddSingleValueTag('description', descriptionInput, setDescriptionInput, setDescriptionRejectionMessage);
                    }
                  }}
                  className={`tag-input ${descriptionInput.trim().length > 0 ? 'form-input-valid' : ''}`}
                  rows="4"
                  placeholder="Enter description and press Ctrl+Enter or +"
                />
                <button 
                  type="button" 
                  className="tag-add-button"
                  onClick={() => handleAddSingleValueTag('description', descriptionInput, setDescriptionInput, setDescriptionRejectionMessage)}
                  style={{alignSelf: 'flex-start', marginTop: '5px'}}
                >
                  +
                </button>
              </div>
              
              {/* Display current description as a tag */}
              {formData.description && (
                <div className="tag-list">
                  <div className="tag-item" style={{maxWidth: '100%', whiteSpace: 'normal'}}>
                    <span className="tag-text">{formData.description}</span>
                    <button 
                      type="button"
                      className="tag-remove"
                      onClick={() => handleRemoveSingleValueTag('description', setDescriptionRejectionMessage)}
                    >
                      ×
                    </button>
                  </div>
                </div>
              )}
              
              {/* Rejection message */}
              {descriptionRejectionMessage && (
                <div className="rejection-message" style={{color: '#e74c3c', fontSize: '0.9em', marginTop: '5px'}}>
                  {descriptionRejectionMessage}
                </div>
              )}
              
              <div className="field-hint">Press Ctrl+Enter or click + to add description</div>
            </div>
          </div>

          {/* Language [1,∞] - Required, multiple values, BCP-47 format */}
          <div className="form-group">
            <label htmlFor="language">
              Language <span className="field-indicator required-indicator">required, multiple values allowed, BCP-47 format</span>
            </label>
            <div className="tag-input-container">
              <div className="tag-input-row">
                <input
                  type="text"
                  id="language"
                  name="languageInput"
                  value={languageInput}
                  onChange={(e) => {
                    setLanguageInput(e.target.value);
                    
                    // Real-time BCP-47 validation
                    const value = e.target.value;
                    if (!value || !value.trim()) {
                      setLanguageInputError('');
                      setLanguageInputValid(false);
                    } else {
                      const langError = isValidBCP47(value);
                      if (langError) {
                        setLanguageInputError(langError);
                        setLanguageInputValid(false);
                      } else {
                        setLanguageInputError('');
                        setLanguageInputValid(true);
                      }
                    }
                  }}
                  onKeyPress={(e) => handleKeyPress(e, 'language', languageInput, setLanguageInput)}
                  className={`tag-input ${languageInputError ? 'form-input-error' : ''} ${languageInputValid ? 'form-input-valid' : ''}`}
                  placeholder="e.g., en, fr, de, en-US, zh-Hans"
                />
                <button 
                  type="button" 
                  className="tag-add-button"
                  onClick={() => handleAddTag('language', languageInput, setLanguageInput)}
                >
                  +
                </button>
              </div>
              {languageInputError && <div className="iri-error-message">{languageInputError}</div>}
              <div className="tag-list">
                {formData.language.map((lang, index) => {
                  // Check if in invalidTags state OR validate on render
                  let isInvalid = invalidTags.language && invalidTags.language[lang];
                  let errorMessage = isInvalid ? invalidTags.language[lang] : null;
                  
                  // If not tracked as invalid, validate it now
                  if (!isInvalid) {
                    const validationError = isValidBCP47(lang);
                    if (validationError) {
                      isInvalid = true;
                      errorMessage = validationError;
                    }
                  }
                  
                  return (
                    <div key={`language-${index}`}>
                      <div className={`tag-item ${isInvalid ? 'tag-item-invalid' : ''}`}>
                        <span className="tag-text">{lang}</span>
                        <button 
                          type="button"
                          className="tag-remove"
                          onClick={() => handleRemoveTag('language', index)}
                        >
                          ×
                        </button>
                      </div>
                      {isInvalid && <div className="tag-validation-error">{errorMessage}</div>}
                    </div>
                  );
                })}
              </div>
              <div className="field-hint">Press Enter or click + to add language</div>
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
                  name="keywords"
                  value={keywordsInput}
                  onChange={(e) => {
                    setKeywordsInput(e.target.value);
                    setKeywordsInputValid(e.target.value.trim().length > 0);
                  }}
                  onKeyPress={(e) => handleKeyPress(e, 'keywords', keywordsInput, setKeywordsInput)}
                  className={`tag-input ${keywordsInputValid ? 'form-input-valid' : ''}`}
                  placeholder="Enter keyword and press Enter or +"
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
              <div className="field-hint">Press Enter or click + to add keyword</div>
            </div>
          </div>

          {/* Type */}
          <div className="form-group">
            <label htmlFor="type">
              Type <span className="field-indicator required-indicator">required</span>
            </label>
            <div className={`checkbox-group ${typeValid ? 'form-input-valid' : ''}`}>
              <div className="checkbox-item">
                <input
                  type="checkbox"
                  name="type"
                  id="typeDataset"
                  checked={formData.type.includes('dcat:Dataset')}
                  onChange={() => handleTypeChange('dcat:Dataset')}
                  disabled
                />
                <label htmlFor="typeDataset">dcat:Dataset <span className="required-indicator">(required)</span></label>
              </div>
              <div>
                <input
                  type="checkbox"
                  name="type"
                  id="typeVoidDataset"
                  checked={formData.type.includes('void:Dataset')}
                  onChange={() => handleTypeChange('void:Dataset')}
                />
                <label htmlFor="typeVoidDataset">RDF Dataset (void:Dataset)</label>
              </div>
            </div>
          </div>

          {/* Homepage URL (optional, multiple values allowed, IRIs) */}
          <div className="form-group">
            <label htmlFor="homepageURL">
              Homepage URL <span className="field-indicator optional-indicator">optional (IRI), multiple values allowed, IRIs</span>
            </label>
            <div className="tag-input-container">
              <div className="tag-input-row">
              <input
                type="text"
                id="homepageURL"
                name="homepageURLInput"
                value={homepageURLInput}
                onChange={(e) => {
                  setHomepageURLInput(e.target.value);
                  
                  // Real-time IRI validation
                  const value = e.target.value;
                  if (!value || !value.trim()) {
                    setHomepageURLInputError('');
                    setHomepageURLInputValid(false);
                  } else {
                    const iriError = isValidIriString(value);
                    if (iriError) {
                      setHomepageURLInputError(iriError);
                      setHomepageURLInputValid(false);
                    } else {
                      setHomepageURLInputError('');
                      setHomepageURLInputValid(true);
                    }
                  }
                }}
                onBlur={validateIriInput}
                onKeyPress={(e) => handleKeyPress(e, 'homepageURL', homepageURLInput, setHomepageURLInput, setHomepageURLInputError)}
                placeholder="Enter IRI and press Enter or +"
                className={`${homepageURLInputError ? 'form-input-error' : ''} ${homepageURLInputValid ? 'form-input-valid' : ''}`}
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
                {formData.homepageURL.map((url, index) => {
                  // Check if in invalidTags state OR validate on render
                  let isInvalid = invalidTags.homepageURL && invalidTags.homepageURL[url];
                  let errorMessage = isInvalid ? invalidTags.homepageURL[url] : null;
                  
                  // If not tracked as invalid, validate it now
                  if (!isInvalid) {
                    const validationError = isValidIriString(url);
                    if (validationError) {
                      isInvalid = true;
                      errorMessage = validationError;
                    }
                  }
                  
                  return (
                    <div key={`homepage-url-${index}`}>
                      <div className={`tag-item ${isInvalid ? 'tag-item-invalid' : ''}`}>
                        <span className="tag-text">{url}</span>
                        <button
                          type="button"
                          className="tag-remove"
                          onClick={() => handleRemoveTag('homepageURL', index)}
                        >
                          ×
                        </button>
                      </div>
                      {isInvalid && <div className="tag-validation-error">{errorMessage}</div>}
                    </div>
                  );
                })}
              </div>
              {homepageURLInputError && <div className="iri-error-message">{homepageURLInputError}</div>}
              <div className="field-hint">Press Enter or click + to add IRI</div>
            </div>
          </div>
          
         {/* Other Pages (optional, multiple values allowed, IRIs) */}
          <div className="form-group">
            <label htmlFor="otherPages">
              Other Pages <span className="field-indicator optional-indicator">optional (IRI), multiple values allowed, IRIs</span>
            </label>
            <div className="tag-input-container">
              <div className="tag-input-row">
              <input
                type="text"
                id="otherPages"
                name="otherPagesInput"
                value={otherPagesInput}
                onChange={(e) => {
                  setOtherPagesInput(e.target.value);
                  
                  // Real-time IRI validation
                  const value = e.target.value;
                  if (!value || !value.trim()) {
                    setOtherPagesInputError('');
                    setOtherPagesInputValid(false);
                  } else {
                    const iriError = isValidIriString(value);
                    if (iriError) {
                      setOtherPagesInputError(iriError);
                      setOtherPagesInputValid(false);
                    } else {
                      setOtherPagesInputError('');
                      setOtherPagesInputValid(true);
                    }
                  }
                }}
                onBlur={validateIriInput}
                onKeyPress={(e) => handleKeyPress(e, 'otherPages', otherPagesInput, setOtherPagesInput, setOtherPagesInputError)}
                placeholder="Enter IRI and press Enter or +"
                className={`tag-input ${otherPagesInputError ? 'form-input-error' : ''} ${otherPagesInputValid ? 'form-input-valid' : ''}`}
              />
                <button
                  type="button"
                  className="tag-add-button"
                  onClick={() => handleAddTag('otherPages', otherPagesInput, setOtherPagesInput)}
                >
                  +
                </button>
              </div>
              {otherPagesInputError && <div className="iri-error-message">{otherPagesInputError}</div>}
              <div className="tag-list">
                {formData.otherPages.map((page, index) => {
                  // Check if in invalidTags state OR validate on render
                  let isInvalid = invalidTags.otherPages && invalidTags.otherPages[page];
                  let errorMessage = isInvalid ? invalidTags.otherPages[page] : null;
                  
                  // If not tracked as invalid, validate it now
                  if (!isInvalid) {
                    const validationError = isValidIriString(page);
                    if (validationError) {
                      isInvalid = true;
                      errorMessage = validationError;
                    }
                  }
                  
                  return (
                    <div key={`other-page-${index}`}>
                      <div className={`tag-item ${isInvalid ? 'tag-item-invalid' : ''}`}>
                        <span className="tag-text">{page}</span>
                        <button
                          type="button"
                          className="tag-remove"
                          onClick={() => handleRemoveTag('otherPages', index)}
                        >
                          ×
                        </button>
                      </div>
                      {isInvalid && <div className="tag-validation-error">{errorMessage}</div>}
                    </div>
                  );
                })}
              </div>
              <div className="field-hint">Press Enter or click + to add IRI</div>
            </div>
          </div>

          {/* Roles Section */}
          <div className="form-section">
            <h3 className="section-title">
              Roles
              {showAISuggestions && bulkSuggestionsReady && (
                <span 
                  className="ai-suggestion-tooltip"
                  onClick={() => setActiveField('roles')}
                  style={{ cursor: 'pointer', marginLeft: '8px', fontSize: '1.2em' }}
                  title="Click to view AI suggestions for roles"
                >
                  🤖
                </span>
              )}
            </h3>
            <div className="field-indicator required-indicator">required, at least 1 role must be added</div>
          </div>

          {/* Display existing roles */}
          <div className="roles-list">
            {safeArray('roles').map((role, index) => (
              <div key={`role-${role.id || index}`} className="distribution-item">
                <div className="distribution-header">
                  <div className="distribution-title">{role.roleType}</div>
                  <div className="distribution-actions">
                    <button 
                      type="button"
                      className="edit-button"
                      onClick={() => {
                        setCurrentRole({...role});
                        handleRemoveRole(index);
                        document.querySelector('.role-form').scrollIntoView({ behavior: 'smooth' });
                      }}
                    >
                      Edit
                    </button>
                    <button 
                      type="button"
                      className="tag-remove"
                      onClick={() => handleRemoveRole(index)}
                    >
                      ×
                    </button>
                  </div>
                </div>
                <div className="distribution-preview">
                  {role.agent ? (
                    <div className="distribution-field">
                      <span className="field-label">Agent:</span>
                      <span className="field-value">{role.agent}</span>
                    </div>
                  ) : (
                    <>
                      <div className="distribution-field">
                        <span className="field-label">Given Name:</span>
                        <span className="field-value">{role.givenName}</span>
                      </div>
                      <div className="distribution-field">
                        <span className="field-label">Email:</span>
                        <span className="field-value">{role.email}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Role Form */}
          <div className="role-form">
            {/* Role Type Dropdown */}
            <div className="form-group">
              <label htmlFor="roleType">
                Role Type <span className="field-indicator required-indicator">required</span>
              </label>
              <select
                id="roleType"
                value={currentRole.roleType}
                onChange={(e) => handleCurrentRoleChange('roleType', e.target.value)}
                onClick={() => showAISuggestions && bulkSuggestionsReady && setActiveField('roles')}
                className={`subfield-input ${currentRole.roleType === '' ? '' : 'form-input-valid'}`}
              >
                <option value="">Select a role type...</option>
                <option value="creator">creator</option>
                <option value="author">author</option>
                <option value="publisher">publisher</option>
                <option value="contributor">contributor</option>
                <option value="editor">editor</option>
                <option value="funder">funder</option>
                <option value="resourceProvider">resourceProvider</option>
                <option value="custodian">custodian</option>
                <option value="owner">owner</option>
                <option value="user">user</option>
                <option value="distributor">distributor</option>
                <option value="originator">originator</option>
                <option value="pointOfContact">pointOfContact</option>
                <option value="principalInvestigator">principalInvestigator</option>
                <option value="processor">processor</option>
                <option value="sponsor">sponsor</option>
                <option value="coAuthor">coAuthor</option>
                <option value="collaborator">collaborator</option>
                <option value="mediator">mediator</option>
                <option value="rightsHolder">rightsHolder</option>
                <option value="stakeholder">stakeholder</option>
              </select>
            </div>

            {/* Radio buttons for Agent input mode selection */}
            <div className="agent-input-mode-container" style={{ 
              marginTop: '12px', 
              marginBottom: '16px',
              padding: '12px',
              backgroundColor: 'rgba(255, 255, 255, 0.02)',
              borderRadius: '6px',
              border: '1px solid var(--dark-border)'
            }}>
              <div style={{ 
                marginBottom: '10px', 
                color: 'var(--dark-text-secondary)', 
                fontSize: '0.9rem',
                fontWeight: '500'
              }}>
                Please select one:
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label className="radio-option" style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  cursor: 'pointer',
                  padding: '8px',
                  borderRadius: '4px',
                  backgroundColor: currentRole.inputMode === 'nameEmail' ? 'rgba(65, 105, 225, 0.1)' : 'transparent',
                  transition: 'background-color 0.2s'
                }}>
                  <input
                    type="radio"
                    name="agentInputMode"
                    value="nameEmail"
                    checked={currentRole.inputMode === 'nameEmail'}
                    onChange={(e) => {
                      handleCurrentRoleChange('inputMode', 'nameEmail');
                      // Clear Agent IRI field
                      handleCurrentRoleChange('agent', '');
                      setCurrentRoleAgentError('');
                      setCurrentRoleAgentValid(false);
                    }}
                    style={{ 
                      marginRight: '8px', 
                      width: '16px', 
                      height: '16px',
                      cursor: 'pointer',
                      accentColor: 'var(--primary-blue)'
                    }}
                  />
                  <span style={{ color: 'var(--dark-text)' }}>Add agent via name + email</span>
                </label>
                <label className="radio-option" style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  cursor: 'pointer',
                  padding: '8px',
                  borderRadius: '4px',
                  backgroundColor: currentRole.inputMode === 'agentIRI' ? 'rgba(65, 105, 225, 0.1)' : 'transparent',
                  transition: 'background-color 0.2s'
                }}>
                  <input
                    type="radio"
                    name="agentInputMode"
                    value="agentIRI"
                    checked={currentRole.inputMode === 'agentIRI'}
                    onChange={(e) => {
                      handleCurrentRoleChange('inputMode', 'agentIRI');
                      // Clear Name + Email fields
                      handleCurrentRoleChange('givenName', '');
                      handleCurrentRoleChange('email', '');
                      setCurrentRoleEmailError('');
                      setCurrentRoleEmailValid(false);
                    }}
                    style={{ 
                      marginRight: '8px', 
                      width: '16px', 
                      height: '16px',
                      cursor: 'pointer',
                      accentColor: 'var(--primary-blue)'
                    }}
                  />
                  <span style={{ color: 'var(--dark-text)' }}>Add agent via IRI</span>
                </label>
              </div>
            </div>
            
            {/* Role Fields */}
            <div className="role-fields">
              {currentRole.inputMode === 'agentIRI' ? (
                <div className="form-group">
                  <label htmlFor="roleAgent" className="subfield-label">
                    Agent <span className={`field-indicator ${currentRoleAgentValid ? 'valid-indicator' : 'optional-indicator'}`}>{currentRoleAgentValid ? 'valid (IRI)' : 'optional (IRI)'}</span>
                  </label>
                  <input
                    onBlur={validateIriInput}
                    type="text"
                    id="roleAgent"
                    name="currentRoleAgent"
                    value={currentRole.agent}
                    onClick={() => showAISuggestions && bulkSuggestionsReady && setActiveField('roles')}
                    onChange={(e) => {
                      handleCurrentRoleChange('agent', e.target.value);
                      
                      // Real-time IRI validation
                      const value = e.target.value;
                      if (!value || !value.trim()) {
                        setCurrentRoleAgentError('');
                        setCurrentRoleAgentValid(false);
                      } else {
                        const iriError = isValidIriString(value);
                        if (iriError) {
                          setCurrentRoleAgentError(iriError);
                          setCurrentRoleAgentValid(false);
                        } else {
                          setCurrentRoleAgentError('');
                          setCurrentRoleAgentValid(true);
                        }
                      }
                    }}
                    className={`subfield-input ${currentRoleAgentError ? 'form-input-error' : ''} ${currentRoleAgentValid ? 'form-input-valid' : ''}`}
                  />
                  {currentRoleAgentError && <div className="iri-error-message">{currentRoleAgentError}</div>}
                </div> 
              ) : (
                <>
                  <div className="form-group">
                    <label htmlFor="roleGivenName" className="subfield-label">
                      Given Name <span className={`field-indicator ${currentRole.givenName.trim().length > 0 ? 'valid-indicator' : 'optional-indicator'}`}>{currentRole.givenName.trim().length > 0 ? 'valid' : 'optional'}</span>
                    </label>
                    <input
                      type="text"
                      id="roleGivenName"
                      value={currentRole.givenName}
                      onClick={() => showAISuggestions && bulkSuggestionsReady && setActiveField('roles')}
                      onChange={(e) => handleCurrentRoleChange('givenName', e.target.value)}
                      className={`subfield-input ${currentRole.givenName.trim().length > 0 ? 'form-input-valid' : ''}`}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="roleEmail" className="subfield-label">
                      Email <span className={`field-indicator ${currentRoleEmailValid ? 'valid-indicator' : 'optional-indicator'}`}>{currentRoleEmailValid ? 'valid' : 'optional'}</span>
                    </label>
                    <input
                      onBlur={validateEmailInput}
                      type="email"
                      id="roleEmail"
                      value={currentRole.email}
                      onClick={() => showAISuggestions && bulkSuggestionsReady && setActiveField('roles')}
                      onChange={(e) => {
                        handleCurrentRoleChange('email', e.target.value);
                        
                        // Real-time validation
                        const value = e.target.value;
                        if (!value || !value.trim()) {
                          setCurrentRoleEmailError('');
                          setCurrentRoleEmailValid(false);
                        } else {
                          const validation = isValidEmailFormat(value);
                          if (validation.isValid) {
                            setCurrentRoleEmailError('');
                            setCurrentRoleEmailValid(true);
                          } else {
                            setCurrentRoleEmailError(validation.error);
                            setCurrentRoleEmailValid(false);
                          }
                        }
                      }}
                      className={`subfield-input ${currentRoleEmailError ? 'form-input-error' : ''} ${currentRoleEmailValid ? 'form-input-valid' : ''}`}
                    />
                    {currentRoleEmailError && <div className="iri-error-message">{currentRoleEmailError}</div>}
                  </div>
                  <div className="field-hint" style={{ marginTop: '8px', fontStyle: 'italic' }}>
                    At least one field (Name or Email) is required
                  </div>
                </>
              )}
            </div>

            {/* Add Role Button */}
            <div className="form-group">
              <button 
                type="button" 
                className="add-button"
                onClick={handleAddRole}
              >
                Add Role
              </button>
            </div>
            <div style={{borderTop: '1px solid #333', margin: '24px 0'}}></div>
          </div>

          {/* Date fields */}
          <div className="form-group">
            <label htmlFor="createdDate">
              Created Date <span className="field-indicator optional-indicator">optional, 1 value only</span>
            </label>
            <div className="tag-input-container">
              <div className="tag-input-row">
                <div className="date-input-container" style={{flex: 1}}>
                  <input
                    type="text"
                    id="createdDate"
                    name="createdDateInput"
                    value={createdDateInput}
                    onChange={(e) => {
                      setCreatedDateInput(e.target.value);
                      setCreatedDateRejectionMessage('');
                      setCreatedDateError('');
                    }}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSingleValueDateTag('createdDate', createdDateInput, setCreatedDateInput, setCreatedDateRejectionMessage, setCreatedDateError, setCreatedDateValid);
                      }
                    }}
                    placeholder="YYYY/MM/DD"
                    className={`date-input ${createdDateError ? 'date-input-error' : ''} ${createdDateValid ? 'date-input-valid' : ''}`}
                  />
                  <input
                    type="date"
                    className="date-picker-control"
                    onChange={(e) => {
                      setCreatedDateInput(e.target.value);
                      setCreatedDateRejectionMessage('');
                      setCreatedDateError('');
                    }}
                    aria-label="Date picker for Created Date"
                  />
                </div>
                <button 
                  type="button" 
                  className="tag-add-button"
                  onClick={() => handleAddSingleValueDateTag('createdDate', createdDateInput, setCreatedDateInput, setCreatedDateRejectionMessage, setCreatedDateError, setCreatedDateValid)}
                >
                  +
                </button>
              </div>
              
              {/* Display current created date as a tag */}
              {formData.createdDate && (
                <div className="tag-list">
                  <div className="tag-item">
                    <span className="tag-text">{formData.createdDate}</span>
                    <button 
                      type="button"
                      className="tag-remove"
                      onClick={() => {
                        handleRemoveSingleValueTag('createdDate', setCreatedDateRejectionMessage);
                        setCreatedDateValid(false);
                        setCreatedDateError('');
                      }}
                    >
                      ×
                    </button>
                  </div>
                </div>
              )}
              
              {/* Date validation error */}
              {createdDateError && <div className="date-error-message">{createdDateError}</div>}
              
              {/* Rejection message */}
              {createdDateRejectionMessage && (
                <div className="rejection-message" style={{color: '#e74c3c', fontSize: '0.9em', marginTop: '5px'}}>
                  {createdDateRejectionMessage}
                </div>
              )}
              
              <div className="field-hint">Press Enter or click + to add date (YYYY/MM/DD format)</div>
            </div>
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
                  className={`date-input ${modifiedDateError ? 'date-input-error' : ''} ${modifiedDateValid ? 'date-input-valid' : ''}`}
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
            </div>
          </div>

                      
          <div className="form-group">
            <label htmlFor="publishedDate">
              Published Date <span className="field-indicator required-indicator">required, 1 value only</span>
            </label>
            <div className="tag-input-container">
              <div className="tag-input-row">
                <div className="date-input-container" style={{flex: 1}}>
                  <input
                    type="text"
                    id="publishedDate"
                    name="publishedDateInput"
                    value={publishedDateInput}
                    onChange={(e) => {
                      setPublishedDateInput(e.target.value);
                      setPublishedDateRejectionMessage('');
                      setPublishedDateError('');
                    }}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSingleValueDateTag('publishedDate', publishedDateInput, setPublishedDateInput, setPublishedDateRejectionMessage, setPublishedDateError, setPublishedDateValid);
                      }
                    }}
                    placeholder="YYYY/MM/DD"
                    required
                    className={`date-input ${publishedDateError ? 'date-input-error' : ''} ${publishedDateValid ? 'date-input-valid' : ''}`}
                  />
                  <input
                    type="date"
                    className="date-picker-control"
                    onChange={(e) => {
                      setPublishedDateInput(e.target.value);
                      setPublishedDateRejectionMessage('');
                      setPublishedDateError('');
                    }}
                    aria-label="Date picker for Published Date"
                  />
                </div>
                <button 
                  type="button" 
                  className="tag-add-button"
                  onClick={() => handleAddSingleValueDateTag('publishedDate', publishedDateInput, setPublishedDateInput, setPublishedDateRejectionMessage, setPublishedDateError, setPublishedDateValid)}
                >
                  +
                </button>
              </div>
              
              {/* Display current published date as a tag */}
              {formData.publishedDate && (
                <div className="tag-list">
                  <div className="tag-item">
                    <span className="tag-text">{formData.publishedDate}</span>
                    <button 
                      type="button"
                      className="tag-remove"
                      onClick={() => {
                        handleRemoveSingleValueTag('publishedDate', setPublishedDateRejectionMessage);
                        setPublishedDateValid(false);
                        setPublishedDateError('');
                      }}
                    >
                      ×
                    </button>
                  </div>
                </div>
              )}
              
              {/* Date validation error */}
              {publishedDateError && <div className="date-error-message">{publishedDateError}</div>}
              
              {/* Rejection message */}
              {publishedDateRejectionMessage && (
                <div className="rejection-message" style={{color: '#e74c3c', fontSize: '0.9em', marginTop: '5px'}}>
                  {publishedDateRejectionMessage}
                </div>
              )}
              
              <div className="field-hint">Press Enter or click + to add date (YYYY/MM/DD format)</div>
            </div>
          </div>
    
    
          <div className="form-group">
          <label htmlFor="vocabulariesUsed">
              Vocabularies Used <span className="field-indicator required-indicator">required (IRI), multiple values allowed</span>
          </label>
          <div className="tag-input-container">
              <div className="tag-input-row">
              <input
                  type="text"
                  id="vocabulariesUsed"
                  name="vocabulariesUsedInput"
                  value={vocabulariesUsedInput}
                  onChange={(e) => {
                    setVocabulariesUsedInput(e.target.value);
                    
                    // Real-time IRI validation
                    const value = e.target.value;
                    if (!value || !value.trim()) {
                      setVocabulariesUsedInputError('');
                      setVocabulariesUsedInputValid(false);
                    } else {
                      const iriError = isValidIriString(value);
                      if (iriError) {
                        setVocabulariesUsedInputError(iriError);
                        setVocabulariesUsedInputValid(false);
                      } else {
                        setVocabulariesUsedInputError('');
                        setVocabulariesUsedInputValid(true);
                      }
                    }
                  }}
                  onBlur={validateIriInput}
                  onKeyUp= {(e) => handleKeyPress(e, 'vocabulariesUsed', vocabulariesUsedInput, setVocabulariesUsedInput, setVocabulariesUsedInputError)}
                  className={`tag-input ${vocabulariesUsedInputError ? 'form-input-error' : ''} ${vocabulariesUsedInputValid ? 'form-input-valid' : ''}`}
                  placeholder="Enter IRI and press Enter or +"
              />
              {vocabulariesUsedInputError && <div className="iri-error-message">{vocabulariesUsedInputError}</div>}

              <button 
                  type="button" 
                  className="tag-add-button"
                  onClick={() => handleAddTag('vocabulariesUsed', vocabulariesUsedInput, setVocabulariesUsedInput)}
              >
                  +
              </button>
              </div>
              <div className="tag-list">
              {formData.vocabulariesUsed.map((item, index) => {
                // Check if in invalidTags state OR validate on render
                let isInvalid = invalidTags.vocabulariesUsed && invalidTags.vocabulariesUsed[item];
                let errorMessage = isInvalid ? invalidTags.vocabulariesUsed[item] : null;
                
                // If not tracked as invalid, validate it now
                if (!isInvalid) {
                  const validationError = isValidIriString(item);
                  if (validationError) {
                    isInvalid = true;
                    errorMessage = validationError;
                  }
                }
                
                return (
                  <div key={`vocabulary-${index}`}>
                    <div className={`tag-item ${isInvalid ? 'tag-item-invalid' : ''}`}>
                      <span className="tag-text">{item}</span>
                      <button 
                        type="button"
                        className="tag-remove"
                        onClick={() => handleRemoveTag('vocabulariesUsed', index)}
                      >
                        ×
                      </button>
                    </div>
                    {isInvalid && <div className="tag-validation-error">{errorMessage}</div>}
                  </div>
                );
              })}
              </div>
              <div className="field-hint">Press Enter or click + to add vocabulary</div>
          </div>
          </div>
    
          {/* Primary Reference Document */}
          <div className="form-group">
            <label htmlFor="primaryReferenceDocument">
              Primary Reference Document <span className="field-indicator required-indicator">required (IRI), multiple values allowed</span>
            </label>
            <div className="tag-input-container">
              <div className="tag-input-row">
              <input
                type="text"
                id="primaryReferenceDocument"
                name="primaryReferenceDocInput"
                value={primaryReferenceDocInput}
                onChange={(e) => {
                  setPrimaryReferenceDocInput(e.target.value);
                  setPrimaryReferenceDocInputError('');
                  setPrimaryReferenceDocInputValid(false);
                }}
                onBlur={validateIriInput}
                onKeyUp={(e) => handleKeyPress(e, 'primaryReferenceDocument', primaryReferenceDocInput, setPrimaryReferenceDocInput, setPrimaryReferenceDocInputError)}
                className={`${primaryReferenceDocInputError ? 'tag-input-error' : ''} ${primaryReferenceDocInputValid ? 'tag-input-valid' : ''}`}
                placeholder="Enter IRI and press Enter or +"
              />
              {primaryReferenceDocInputError && <div className="iri-error-message">{primaryReferenceDocInputError}</div>}

                <button 
                  type="button" 
                  className="tag-add-button"
                  onClick={() => handleAddTag('primaryReferenceDocument', primaryReferenceDocInput, setPrimaryReferenceDocInput)}
                >
                  +
                </button>
              </div>
              <div className="tag-list">
                {formData.primaryReferenceDocument.map((doc, index) => {
                  // Check if in invalidTags state OR validate on render
                  let isInvalid = invalidTags.primaryReferenceDocument && invalidTags.primaryReferenceDocument[doc];
                  let errorMessage = isInvalid ? invalidTags.primaryReferenceDocument[doc] : null;
                  
                  // If not tracked as invalid, validate it now
                  if (!isInvalid) {
                    const validationError = isValidIriString(doc);
                    if (validationError) {
                      isInvalid = true;
                      errorMessage = validationError;
                    }
                  }
                  
                  return (
                    <div key={`ref-doc-${index}`}>
                      <div className={`tag-item ${isInvalid ? 'tag-item-invalid' : ''}`}>
                        <span className="tag-text">{doc}</span>
                        <button 
                          type="button"
                          className="tag-remove"
                          onClick={() => handleRemoveTag('primaryReferenceDocument', index)}
                        >
                          ×
                        </button>
                      </div>
                      {isInvalid && <div className="tag-validation-error">{errorMessage}</div>}
                    </div>
                  );
                })}
              </div>
              <div className="field-hint">Press Enter or click + to add reference document (IRI)</div>
            </div>
          </div>
          
          {/* Meta Graph */}
          <div className="form-group">
            <label htmlFor="metaGraph">
              Meta Graph <span className="field-indicator optional-indicator">optional, multiple values allowed</span>
            </label>
            
            {/* Unified Input Field */}
            <div className="unified-input-container">
              <div 
                className={`unified-input-field ${metaGraphInputError ? 'error' : metaGraphInputValid ? 'valid' : ''}`}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.add('drag-over');
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.remove('drag-over');
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.remove('drag-over');
                  const files = Array.from(e.dataTransfer.files);
                  if (files.length > 0) {
                    const file = files[0];
                    if (file.type.startsWith('image/')) {
                      setImageFileName(file.name);
                      setFormData({
                        ...formData,
                        metaGraph: [...formData.metaGraph, file.name]
                      });
                    } else {
                      alert('Please drop an image file.');
                    }
                  }
                }}
              >
                <input
                  type="text"
                  id="metaGraphInput"
                  value={metaGraphInput}
                  onChange={(e) => {
                    setMetaGraphInput(e.target.value);
                    if (e.target.value.trim()) {
                      const iriError = isValidIriString(e.target.value);
                      if (iriError) {
                        setMetaGraphInputError(iriError);
                        setMetaGraphInputValid(false);
                      } else {
                        setMetaGraphInputError('');
                        setMetaGraphInputValid(true);
                      }
                    } else {
                      setMetaGraphInputError('');
                      setMetaGraphInputValid(false);
                    }
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddMetaGraphIRI();
                    }
                  }}
                  placeholder="Enter IRI or drag & drop image files here..."
                  className="unified-text-input"
                />
                <div className="unified-input-actions">
                  <button
                    type="button"
                    onClick={handleAddMetaGraphIRI}
                    className="tag-add-button"
                    disabled={!metaGraphInputValid}
                    title="Add IRI"
                  >
                    +
                  </button>
                  <button 
                    type="button" 
                    className="browse-button"
                    onClick={() => fileInputRef.current.click()}
                    title="Browse for files"
                  >
                    📁
                  </button>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  className="file-upload-input"
                  style={{ display: "none" }}
                />
              </div>
              {metaGraphInputError && (
                <div className="error-message">{metaGraphInputError}</div>
              )}
              <div className="field-hint">
                Enter a valid IRI, drag & drop image files, or click 📁 to browse files
              </div>
            </div>

            {/* Display added meta graph items */}
            <div className="tag-list">
              {formData.metaGraph.map((graph, index) => {
                // Check if in invalidTags state OR validate on render
                let isInvalid = invalidTags.metaGraph && invalidTags.metaGraph[graph];
                let errorMessage = isInvalid ? invalidTags.metaGraph[graph] : null;
                
                // If not tracked as invalid, validate it now
                if (!isInvalid) {
                  const validationError = isValidIriString(graph);
                  if (validationError) {
                    isInvalid = true;
                    errorMessage = validationError;
                  }
                }
                
                return (
                  <div key={`meta-graph-${index}`}>
                    <div className={`tag-item ${isInvalid ? 'tag-item-invalid' : ''}`}>
                      <span className="tag-text">{graph}</span>
                      <button 
                        type="button"
                        className="tag-remove"
                        onClick={() => handleRemoveTag('metaGraph', index)}
                      >
                        ×
                      </button>
                    </div>
                    {isInvalid && <div className="tag-validation-error">{errorMessage}</div>}
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* KG Schema */}
          <div className="form-group">
            <label htmlFor="kgSchema">
              KG Schema <span className="field-indicator optional-indicator">optional (IRI), multiple values allowed</span>
            </label>
            <div className="tag-input-container">
              <div className="tag-input-row">
              <input
                type="text"
                id="kgSchema"
                name="kgSchemaInput"
                value={kgSchemaInput}
                onChange={(e) => {
                  setKgSchemaInput(e.target.value);
                  setKgSchemaInputError('');
                  setKgSchemaInputValid(false);
                }}
                onBlur={validateIriInput}
                onKeyUp={(e) => handleKeyPress(e, 'kgSchema', kgSchemaInput, setKgSchemaInput, setKgSchemaInputError)}
                className={`${kgSchemaInputError ? 'tag-input-error' : ''} ${kgSchemaInputValid ? 'tag-input-valid' : ''}`}
                placeholder="Enter IRI and press Enter or +"
              />
              {kgSchemaInputError && <div className="iri-error-message">{kgSchemaInputError}</div>}

                <button 
                  type="button" 
                  className="tag-add-button"
                  onClick={() => handleAddTag('kgSchema', kgSchemaInput, setKgSchemaInput)}
                >
                  +
                </button>
              </div>
              <div className="tag-list">
                {formData.kgSchema.map((schema, index) => {
                  // Check if in invalidTags state OR validate on render
                  let isInvalid = invalidTags.kgSchema && invalidTags.kgSchema[schema];
                  let errorMessage = isInvalid ? invalidTags.kgSchema[schema] : null;
                  
                  // If not tracked as invalid, validate it now
                  if (!isInvalid) {
                    const validationError = isValidIriString(schema);
                    if (validationError) {
                      isInvalid = true;
                      errorMessage = validationError;
                    }
                  }
                  
                  return (
                    <div key={`kg-schema-${index}`}>
                      <div className={`tag-item ${isInvalid ? 'tag-item-invalid' : ''}`}>
                        <span className="tag-text">{schema}</span>
                        <button 
                          type="button"
                          className="tag-remove"
                          onClick={() => handleRemoveTag('kgSchema', index)}
                        >
                          ×
                        </button>
                      </div>
                      {isInvalid && <div className="tag-validation-error">{errorMessage}</div>}
                    </div>
                  );
                })}
              </div>
              <div className="field-hint">Press Enter or click + to add KG schema (IRI)</div>
            </div>
          </div>
          
          {/* Number of Triples */}
          <div className="form-group">
            <label htmlFor="statistics">
              Number of Triples <span className="field-indicator optional-indicator">optional, multiple values allowed</span>
            </label>
            <div className="tag-input-container">
              <div className="tag-input-row">
              <input
                type="text"
                id="statistics"
                value={statisticsInput}
                onChange={(e) => {
                  setStatisticsInput(e.target.value);
                  setStatisticsInputValid(false);
                }}
                onBlur={() => setStatisticsInputValid(!!statisticsInput.trim())}
                onKeyPress={(e) => handleKeyPress(e, 'statistics', statisticsInput, setStatisticsInput)}
                className={`tag-input ${statisticsInputValid ? 'tag-input-valid' : ''}`}
                placeholder="Enter number of triples and press Enter or +"
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
                {formData.statistics.map((stat, index) => {
                  // Number of Triples entries do not require IRI validation - they can be text descriptions
                  let isInvalid = invalidTags.statistics && invalidTags.statistics[stat];
                  let errorMessage = isInvalid ? invalidTags.statistics[stat] : null;
                  
                  return (
                    <div key={`stat-${index}`}>
                      <div className={`tag-item ${isInvalid ? 'tag-item-invalid' : ''}`}>
                        <span className="tag-text">{stat}</span>
                        <button 
                          type="button"
                          className="tag-remove"
                          onClick={() => handleRemoveTag('statistics', index)}
                        >
                          ×
                        </button>
                      </div>
                      {isInvalid && <div className="tag-validation-error">{errorMessage}</div>}
                    </div>
                  );
                })}
              </div>
              <div className="field-hint">Press Enter or click + to add number of triples entry</div>
            </div>
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
                 {dist.spatialResolution && (
                   <div className="distribution-field">
                     <span className="field-label">Spatial Resolution In Meters:</span>
                     <span className="field-value">{dist.spatialResolution}</span>
                   </div>
                 )}
                 {dist.temporalResolution && (
                   <div className="distribution-field">
                     <span className="field-label">Temporal Resolution:</span>
                     <span className="field-value">{dist.temporalResolution}</span>
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
                 {dist.issued && (
                   <div className="distribution-field">
                     <span className="field-label">Issued:</span>
                     <span className="field-value">{dist.issued}</span>
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
              onClick={() => showAISuggestions && bulkSuggestionsReady && setActiveField('distributions')}
              onChange={(e) => handleDistributionChange('title', e.target.value)}
              className={`subfield-input ${currentDistribution.title.trim().length > 0 ? 'form-input-valid' : ''}`}
             />
           </div>
           
           <div className="form-group">
             <label htmlFor="distDescription">
               Description <span className="field-indicator required-indicator">required</span>
             </label>
             <textarea
              id="distDescription"
               value={currentDistribution.description}
               onClick={() => showAISuggestions && bulkSuggestionsReady && setActiveField('distributions')}
               onChange={(e) => handleDistributionChange('description', e.target.value)}
               rows="2"
               className={`subfield-input ${currentDistribution.description.trim().length > 0 ? 'form-input-valid' : ''}`}
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
              onClick={() => showAISuggestions && bulkSuggestionsReady && setActiveField('distributions')}
              onChange={(e) => handleDistributionChange('mediaType', e.target.value)}
              className={`subfield-input ${currentDistribution.mediaType.trim().length > 0 ? 'form-input-valid' : ''}`}
             />
           </div>
           
           <div className="form-group">
             <label htmlFor="distDownloadURL">
               Download URL (dcat:downloadURL) <span className="field-indicator required-indicator">required (IRI)</span>
             </label>
             <input
                type="url"
                id="distDownloadURL"
                name="distDownloadURL"
                value={currentDistribution.downloadURL}
                onClick={() => showAISuggestions && bulkSuggestionsReady && setActiveField('distributions')}
                onChange={(e) => {
                  handleDistributionChange('downloadURL', e.target.value);
                  
                  // Real-time IRI validation
                  const value = e.target.value;
                  if (!value || !value.trim()) {
                    setDistDownloadURLError('');
                    setDistDownloadURLValid(false);
                  } else {
                    const iriError = isValidIriString(value);
                    if (iriError) {
                      setDistDownloadURLError(iriError);
                      setDistDownloadURLValid(false);
                    } else {
                      setDistDownloadURLError('');
                      setDistDownloadURLValid(true);
                    }
                  }
                }}
                className={`subfield-input ${distDownloadURLError ? 'form-input-error' : ''} ${distDownloadURLValid ? 'form-input-valid' : ''}`}
              />
              {distDownloadURLError && <div className="iri-error-message">{distDownloadURLError}</div>}

           </div>
           
           <div className="form-group">
             <label htmlFor="distAccessURL">
               Access URL <span className="field-indicator required-indicator">required (IRI)</span>
             </label>
             <input
                type="url"
                id="distAccessURL"
                name="distAccessURL"
                value={currentDistribution.accessURL}
                onClick={() => showAISuggestions && bulkSuggestionsReady && setActiveField('distributions')}
                onChange={(e) => {
                  handleDistributionChange('accessURL', e.target.value);
                  
                  // Real-time IRI validation
                  const value = e.target.value;
                  if (!value || !value.trim()) {
                    setDistAccessURLError('');
                    setDistAccessURLValid(false);
                  } else {
                    const iriError = isValidIriString(value);
                    if (iriError) {
                      setDistAccessURLError(iriError);
                      setDistAccessURLValid(false);
                    } else {
                      setDistAccessURLError('');
                      setDistAccessURLValid(true);
                    }
                  }
                }}
                className={`subfield-input ${distAccessURLError ? 'form-input-error' : ''} ${distAccessURLValid ? 'form-input-valid' : ''}`}
              />
              {distAccessURLError && <div className="iri-error-message">{distAccessURLError}</div>}
          </div>    
           {/* Optional distribution fields */}
           <div className="form-group">
             <label htmlFor="distAccessService">
               Access Service <span className="field-indicator optional-indicator">optional (IRI)</span>
             </label>
             <input
              type="text"
              id="distAccessService"
              value={currentDistribution.accessService}
              onClick={() => showAISuggestions && bulkSuggestionsReady && setActiveField('distributions')}
              onChange={(e) => {
                handleDistributionChange('accessService', e.target.value);
                
                // Real-time IRI validation
                const value = e.target.value;
                if (!value || !value.trim()) {
                  setDistAccessServiceError('');
                  setDistAccessServiceValid(false);
                } else {
                  const iriError = isValidIriString(value);
                  if (iriError) {
                    setDistAccessServiceError(iriError);
                    setDistAccessServiceValid(false);
                  } else {
                    setDistAccessServiceError('');
                    setDistAccessServiceValid(true);
                  }
                }
              }}
              className={`subfield-input ${distAccessServiceError ? 'form-input-error' : ''} ${distAccessServiceValid ? 'form-input-valid' : ''}`}
             />
             {distAccessServiceError && <div className="iri-error-message">{distAccessServiceError}</div>}
           </div>
           
           <div className="form-group">
             <label htmlFor="distByteSize">
               Byte Size <span className="field-indicator optional-indicator">optional</span>
             </label>
             <input
              type="text"
              id="distByteSize"
              value={currentDistribution.byteSize}
              onClick={() => showAISuggestions && bulkSuggestionsReady && setActiveField('distributions')}
              onChange={(e) => handleDistributionChange('byteSize', e.target.value)}
              className={`subfield-input ${currentDistribution.byteSize.trim().length > 0 ? 'form-input-valid' : ''}`}
             />
           </div>
           
           <div className="form-group">
             <label htmlFor="distCompressionFormat">
               Compression Format <span className="field-indicator optional-indicator">optional</span>
             </label>
             <input
               type="text"
               id="distCompressionFormat"
               name="distCompressionFormat"
               value={currentDistribution.compressionFormat}
               onClick={() => showAISuggestions && bulkSuggestionsReady && setActiveField('distributions')}
               onChange={(e) => handleDistributionChange('compressionFormat', e.target.value)}
               className={`subfield-input ${currentDistribution.compressionFormat.trim().length > 0 ? 'form-input-valid' : ''}`}
             />
           </div>
           
           <div className="form-group">
             <label htmlFor="distPackagingFormat">
               Packaging Format <span className="field-indicator optional-indicator">optional</span>
             </label>
             <input
               type="text"
               id="distPackagingFormat"
               name="distPackagingFormat"
               value={currentDistribution.packagingFormat}
               onClick={() => showAISuggestions && bulkSuggestionsReady && setActiveField('distributions')}
               onChange={(e) => handleDistributionChange('packagingFormat', e.target.value)}
               className={`subfield-input ${currentDistribution.packagingFormat.trim().length > 0 ? 'form-input-valid' : ''}`}
             />
           </div>
           <div className="form-group">
             <label htmlFor="distHasPolicy">
               Has Policy <span className="field-indicator optional-indicator">optional (IRI)</span>
             </label>
             <input
               type="text"
               id="distHasPolicy"
               name="distHasPolicy"
               value={currentDistribution.hasPolicy}
               onClick={() => showAISuggestions && bulkSuggestionsReady && setActiveField('distributions')}
               onChange={(e) => {
                 handleDistributionChange('hasPolicy', e.target.value);
                 
                 // Real-time IRI validation
                 const value = e.target.value;
                 if (!value || !value.trim()) {
                   setDistHasPolicyError('');
                   setDistHasPolicyValid(false);
                 } else {
                   const iriError = isValidIriString(value);
                   if (iriError) {
                     setDistHasPolicyError(iriError);
                     setDistHasPolicyValid(false);
                   } else {
                     setDistHasPolicyError('');
                     setDistHasPolicyValid(true);
                   }
                 }
               }}
               className={`subfield-input ${distHasPolicyError ? 'form-input-error' : ''} ${distHasPolicyValid ? 'form-input-valid' : ''}`}
             />
             {distHasPolicyError && <div className="iri-error-message">{distHasPolicyError}</div>}
           </div>
           
           <div className="form-group">
             <label htmlFor="distLicense">
               License <span className="field-indicator optional-indicator">optional</span>
             </label>
             <input
               type="text"
               id="distLicense"
               name="distLicense"
               value={currentDistribution.license}
               onClick={() => showAISuggestions && bulkSuggestionsReady && setActiveField('distributions')}
               onChange={(e) => handleDistributionChange('license', e.target.value)}
               className={`subfield-input ${currentDistribution.license.trim().length > 0 ? 'form-input-valid' : ''}`}
             />
           </div>
           
           <div className="form-group">
             <label htmlFor="distRights">
               Rights <span className="field-indicator optional-indicator">optional</span>
             </label>
             <input
               type="text"
               id="distRights"
               name="distRights"
               value={currentDistribution.rights}
               onClick={() => showAISuggestions && bulkSuggestionsReady && setActiveField('distributions')}
               onChange={(e) => handleDistributionChange('rights', e.target.value)}
               className={`subfield-input ${currentDistribution.rights.trim().length > 0 ? 'form-input-valid' : ''}`}
             />
           </div>
           <div className="form-group">
             <label htmlFor="distSpatialResolution">
               Spatial Resolution In Meters <span className="field-indicator optional-indicator">optional</span>
             </label>
             <input
               type="text"
               id="distSpatialResolution"
               name="distSpatialResolution"
               value={currentDistribution.spatialResolution}
               onClick={() => showAISuggestions && bulkSuggestionsReady && setActiveField('distributions')}
               onChange={(e) => handleDistributionChange('spatialResolution', e.target.value)}
               className={`subfield-input ${currentDistribution.spatialResolution.trim().length > 0 ? 'form-input-valid' : ''}`}
             />
           </div>
           <div className="form-group">
             <label htmlFor="distTemporalResolution">
               Temporal Resolution <span className="field-indicator optional-indicator">optional</span>
             </label>
             <input
               type="text"
               id="distTemporalResolution"
               name="distTemporalResolution"
               value={currentDistribution.temporalResolution}
               onClick={() => showAISuggestions && bulkSuggestionsReady && setActiveField('distributions')}
               onChange={(e) => handleDistributionChange('temporalResolution', e.target.value)}
               className={`subfield-input ${currentDistribution.temporalResolution.trim().length > 0 ? 'form-input-valid' : ''}`}
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
                onClick={() => showAISuggestions && bulkSuggestionsReady && setActiveField('distributions')}
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
                onClick={() => showAISuggestions && bulkSuggestionsReady && setActiveField('distributions')}
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
          
          <div className="form-group">
            <label htmlFor="distIssued">
              Issued <span className="field-indicator optional-indicator">optional</span>
            </label>
            <input
              type="text"
              id="distIssued"
              name="distIssued"
              value={currentDistribution.issued}
              onClick={() => showAISuggestions && bulkSuggestionsReady && setActiveField('distributions')}
              onChange={(e) => handleDistributionChange('issued', e.target.value)}
              className="subfield-input"
            />
          </div>
    
           
          
           <div className="distribution-actions">
             <button 
               type="button" 
               className={`add-button`}
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
                  className="tag-input"
                  placeholder="Enter REST API identifier and press Enter or +"
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
              {formData.restAPI.map((item, index) => {
                // restAPI does not require IRI validation - can be endpoints or descriptions
                let isInvalid = invalidTags.restAPI && invalidTags.restAPI[item];
                let errorMessage = isInvalid ? invalidTags.restAPI[item] : null;
                
                return (
                  <div key={`rest-api-${index}`}>
                    <div className={`tag-item ${isInvalid ? 'tag-item-invalid' : ''}`}>
                      <span className="tag-text">{item}</span>
                      <button 
                        type="button"
                        className="tag-remove"
                        onClick={() => handleRemoveTag('restAPI', index)}
                      >
                        ×
                      </button>
                    </div>
                    {isInvalid && <div className="tag-validation-error">{errorMessage}</div>}
                  </div>
                );
              })}
              </div>
              <div className="field-hint">Press Enter or click + to add REST API</div>
          </div>
          </div>
    
          {/* SPARQL Endpoints Section */}
<div className="form-section">
  <h3 className="section-title">SPARQL Endpoints</h3>
  <div className="field-indicator optional-indicator">optional, multiple submissions allowed</div>
  {/* Display existing SPARQL endpoints */}
  <div className="distributions-list">
    {sparqlEndpoints.map((endpoint, idx) => (
      <div key={`sparql-endpoint-${idx}`} className="distribution-item">
        <div className="distribution-header">
          <div className="distribution-title">{endpoint.title || '(no title)'}</div>
          <div className="distribution-actions">
            <button
              type="button"
              className="edit-button"
              onClick={() => handleEditSparqlEndpoint(idx)}
              aria-label="Edit SPARQL endpoint"
            >
              Edit
            </button>
            <button
              type="button"
              className="tag-remove"
              onClick={() => handleRemoveSparqlEndpoint(idx)}
              aria-label="Remove SPARQL endpoint"
            >
              ×
            </button>
          </div>
        </div>
        <div className="distribution-preview">
          <div className="distribution-field">
            <span className="field-label">Endpoint URL:</span>
            <span className="field-value">{endpoint.endpointURL}</span>
          </div>
          <div className="distribution-field">
            <span className="field-label">Identifier:</span>
            <span className="field-value">{endpoint.identifier}</span>
          </div>
          <div className="distribution-field">
            <span className="field-label">Title:</span>
            <span className="field-value">{endpoint.title}</span>
          </div>
          <div className="distribution-field">
            <span className="field-label">Endpoint Description:</span>
            <span className="field-value">{endpoint.endpointDescription}</span>
          </div>
          <div className="distribution-field">
            <span className="field-label">Status:</span>
            <span className="field-value">{endpoint.status}</span>
          </div>
        </div>
      </div>
    ))}
  </div>
  {/* SPARQL Endpoint Form */}
  <div className="distribution-form sparql-endpoint-form">
    <div className="distribution-form-header">
      <h4>Add New SPARQL Endpoint</h4>
    </div>
    <div className="form-group">
      <label htmlFor="sparqlEndpointURL">
        Endpoint URL <span className="field-indicator optional-indicator">optional (IRI)</span>
      </label>
      <input
        type="text"
        id="sparqlEndpointURL"
        name="sparqlEndpointURL"
        value={currentSparqlEndpoint.endpointURL}
        onClick={() => showAISuggestions && bulkSuggestionsReady && setActiveField('sparqlEndpoint')}
        onChange={e => {
          handleCurrentSparqlEndpointChange('endpointURL', e.target.value);
          
          // Real-time IRI validation
          const value = e.target.value;
          if (!value || !value.trim()) {
            setSparqlEndpointURLError('');
            setSparqlEndpointURLValid(false);
          } else {
            const iriError = isValidIriString(value);
            if (iriError) {
              setSparqlEndpointURLError(iriError);
              setSparqlEndpointURLValid(false);
            } else {
              setSparqlEndpointURLError('');
              setSparqlEndpointURLValid(true);
            }
          }
        }}
        className={`subfield-input ${sparqlEndpointURLError ? 'form-input-error' : ''} ${sparqlEndpointURLValid ? 'form-input-valid' : ''}`}
      />
      {sparqlEndpointURLError && <div className="iri-error-message">{sparqlEndpointURLError}</div>}
    </div>
    <div className="form-group">
      <label htmlFor="sparqlIdentifier">
        Identifier <span className="field-indicator optional-indicator">optional</span>
      </label>
      <input
        type="text"
        id="sparqlIdentifier"
        name="sparqlIdentifier"
        value={currentSparqlEndpoint.identifier}
        onClick={() => showAISuggestions && bulkSuggestionsReady && setActiveField('sparqlEndpoint')}
        onChange={e => handleCurrentSparqlEndpointChange('identifier', e.target.value)}
        className={`subfield-input ${currentSparqlEndpoint.identifier.trim().length > 0 ? 'form-input-valid' : ''}`}
      />
    </div>
    <div className="form-group">
      <label htmlFor="sparqlTitle">
        Title <span className="field-indicator optional-indicator">optional</span>
      </label>
      <input
        type="text"
        id="sparqlTitle"
        name="sparqlTitle"
        value={currentSparqlEndpoint.title}
        onClick={() => showAISuggestions && bulkSuggestionsReady && setActiveField('sparqlEndpoint')}
        onChange={e => handleCurrentSparqlEndpointChange('title', e.target.value)}
        className={`subfield-input ${currentSparqlEndpoint.title.trim().length > 0 ? 'form-input-valid' : ''}`}
      />
    </div>
    <div className="form-group">
      <label htmlFor="sparqlEndpointDescription">
        Endpoint Description <span className="field-indicator optional-indicator">optional</span>
      </label>
      <input
        type="text"
        id="sparqlEndpointDescription"
        name="sparqlEndpointDescription"
        value={currentSparqlEndpoint.endpointDescription}
        onClick={() => showAISuggestions && bulkSuggestionsReady && setActiveField('sparqlEndpoint')}
        onChange={e => handleCurrentSparqlEndpointChange('endpointDescription', e.target.value)}
        className={`subfield-input ${currentSparqlEndpoint.endpointDescription.trim().length > 0 ? 'form-input-valid' : ''}`}
      />
    </div>
    <div className="form-group">
      <label htmlFor="sparqlStatus">
        Status <span className="field-indicator optional-indicator">optional</span>
      </label>
      <input
        type="text"
        id="sparqlStatus"
        name="sparqlStatus"
        value={currentSparqlEndpoint.status}
        onClick={() => showAISuggestions && bulkSuggestionsReady && setActiveField('sparqlEndpoint')}
        onChange={e => handleCurrentSparqlEndpointChange('status', e.target.value)}
        className={`subfield-input ${currentSparqlEndpoint.status.trim().length > 0 ? 'form-input-valid' : ''}`}
      />
    </div>
    <div className="distribution-actions">
      <button
        type="button"
        className="add-button"
        onClick={handleAddSparqlEndpoint}
      >
        {editingSparqlEndpointIdx !== null ? 'Save SPARQL Endpoint' : 'Add SPARQL Endpoint'}
      </button>
      {editingSparqlEndpointIdx !== null && (
        <button
          type="button"
          className="cancel-button"
          onClick={handleCancelEditSparqlEndpoint}
        >
          Cancel
        </button>
      )}
    </div>
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
                  name="exampleQueries"
                  value={exampleQueriesInput}
                  onChange={(e) => setExampleQueriesInput(e.target.value)}
                  onBlur={validateRegularInput}
                  onKeyPress={(e) => handleKeyPress(e, 'exampleQueries', exampleQueriesInput, setExampleQueriesInput)}
                  className={`tag-input ${exampleQueriesInputValid ? 'form-input-valid' : ''}`}
                  placeholder="Enter example query and press Enter or +"
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
              <div className="field-hint">Press Enter or click + to add example query</div>
          </div>
      </div>

          {/* Version - User input with subtle version ID display */}
          <div className="form-group">
            <label htmlFor="version">
              Version <span className="field-indicator required-indicator">required, 1 value only</span>
            </label>
            <div className="tag-input-container">
              <div className="tag-input-row">
                <input
                  type="text"
                  id="version"
                  name="versionInput"
                  value={versionInput}
                  onChange={(e) => {
                    setVersionInput(e.target.value);
                    setVersionRejectionMessage(''); // Clear rejection message when typing
                    setVersionValid(e.target.value.trim().length > 0);
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSingleValueTag('version', versionInput, setVersionInput, setVersionRejectionMessage);
                    }
                  }}
                  className={`tag-input ${versionInput.trim().length > 0 ? 'form-input-valid' : ''}`}
                  placeholder="e.g. 1.0, 2.5 - press Enter or +"
                />
                <button 
                  type="button" 
                  className="tag-add-button"
                  onClick={() => handleAddSingleValueTag('version', versionInput, setVersionInput, setVersionRejectionMessage)}
                >
                  +
                </button>
              </div>
              
              {/* Display current version as a tag */}
              {formData.version && (
                <div className="tag-list">
                  <div className="tag-item">
                    <span className="tag-text">{formData.version}</span>
                    <button 
                      type="button"
                      className="tag-remove"
                      onClick={() => {
                        handleRemoveSingleValueTag('version', setVersionRejectionMessage);
                        setVersionValid(false);
                      }}
                    >
                      ×
                    </button>
                  </div>
                </div>
              )}
              
              {/* Rejection message */}
              {versionRejectionMessage && (
                <div className="rejection-message" style={{color: '#e74c3c', fontSize: '0.9em', marginTop: '5px'}}>
                  {versionRejectionMessage}
                </div>
              )}
              
              <div className="field-hint">Press Enter or click + to add version</div>
            </div>
            {/* Hidden for now - Full ID display */}
            {/* <span className="version-id-display">
              Full ID: {formData.identifier[0] ? `${formData.identifier[0]}-v${formData.version}` : 'Will be generated from identifier'}
            </span> */}
          </div>
    
         {/* Category [0,∞] - Optional, multiple values */}
         <div className="form-group">
           <label htmlFor="category">
             Category <span className="field-indicator optional-indicator">optional (IRI), multiple values allowed</span>
           </label>
           <div className="tag-input-container">
             <div className="tag-input-row">
             <input
                    type="text"
                    id="category"
                    name="categoryInput"
                    value={categoryInput}
                    onChange={(e) => {
                      setCategoryInput(e.target.value);
                      setCategoryInputError('');
                      setCategoryInputValid(false);
                    }}
                    onBlur={validateIriInput}
                    onKeyUp={(e) => handleKeyPress(e, 'category', categoryInput, setCategoryInput, setCategoryInputError)}
                    className={`${categoryInputError ? 'tag-input-error' : ''} ${categoryInputValid ? 'tag-input-valid' : ''}`}
                    placeholder="Enter IRI and press Enter or +"
                  />
                  {categoryInputError && <div className="iri-error-message">{categoryInputError}</div>}

               <button 
                 type="button" 
                 className="tag-add-button"
                 onClick={() => handleAddTag('category', categoryInput, setCategoryInput)}
               >
                 +
               </button>
             </div>
             <div className="tag-list">
               {formData.category.map((cat, index) => {
                 // Check if in invalidTags state OR validate on render
                 let isInvalid = invalidTags.category && invalidTags.category[cat];
                 let errorMessage = isInvalid ? invalidTags.category[cat] : null;
                 
                 // If not tracked as invalid, validate it now
                 if (!isInvalid) {
                   const validationError = isValidIriString(cat);
                   if (validationError) {
                     isInvalid = true;
                     errorMessage = validationError;
                   }
                 }
                 
                 return (
                   <div key={`category-${index}`}>
                     <div className={`tag-item ${isInvalid ? 'tag-item-invalid' : ''}`}>
                       <span className="tag-text">{cat}</span>
                       <button 
                         type="button"
                         className="tag-remove"
                         onClick={() => handleRemoveTag('category', index)}
                       >
                         ×
                       </button>
                     </div>
                     {isInvalid && <div className="tag-validation-error">{errorMessage}</div>}
                   </div>
                 );
               })}
             </div>
             <div className="field-hint">Press Enter or click + to add category (IRI)</div>
           </div>
         </div>
    
         {/* Publication/References [0,∞] - Optional, multiple values */}
         <div className="form-group">
           <label htmlFor="publicationReferences">
             Publication/References <span className="field-indicator optional-indicator">optional (IRI), multiple values allowed</span>
           </label>
           <div className="tag-input-container">
             <div className="tag-input-row">
             <input
                type="text"
                id="publicationReferences"
                name="publicationReferencesInput"
                value={publicationReferencesInput}
                onChange={(e) => {
                  setPublicationReferencesInput(e.target.value);
                  setPublicationReferencesInputError('');
                  setPublicationReferencesInputValid(false);
                }}
                onBlur={validateIriInput}
                onKeyPress={(e) => handleKeyPress(e, 'publicationReferences', publicationReferencesInput, setPublicationReferencesInput, setPublicationReferencesInputError)}
                className={`${publicationReferencesInputError ? 'tag-input-error' : ''} ${publicationReferencesInputValid ? 'tag-input-valid' : ''}`}
                placeholder="Enter IRI and press Enter or +"
              />
              {publicationReferencesInputError && <div className="iri-error-message">{publicationReferencesInputError}</div>}

               <button 
                 type="button" 
                 className="tag-add-button"
                 onClick={() => handleAddTag('publicationReferences', publicationReferencesInput, setPublicationReferencesInput)}
               >
                 +
               </button>
             </div>
             <div className="tag-list">
               {formData.publicationReferences.map((ref, index) => {
                 // Check if in invalidTags state OR validate on render
                 let isInvalid = invalidTags.publicationReferences && invalidTags.publicationReferences[ref];
                 let errorMessage = isInvalid ? invalidTags.publicationReferences[ref] : null;
                 
                 // If not tracked as invalid, validate it now
                 if (!isInvalid) {
                   const validationError = isValidIriString(ref);
                   if (validationError) {
                     isInvalid = true;
                     errorMessage = validationError;
                   }
                 }
                 
                 return (
                   <div key={`pub-ref-${index}`}>
                     <div className={`tag-item ${isInvalid ? 'tag-item-invalid' : ''}`}>
                       <span className="tag-text">{ref}</span>
                       <button 
                         type="button"
                         className="tag-remove"
                         onClick={() => handleRemoveTag('publicationReferences', index)}
                       >
                         ×
                       </button>
                     </div>
                     {isInvalid && <div className="tag-validation-error">{errorMessage}</div>}
                   </div>
                 );
               })}
             </div>
             <div className="field-hint">Press Enter or click + to add publication reference (IRI)</div>
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
                  name="iriTemplate"
                  value={iriTemplateInput}
                  onChange={(e) => setIriTemplateInput(e.target.value)}
                  onBlur={validateRegularInput}
                  onKeyPress={(e) => handleKeyPress(e, 'iriTemplate', iriTemplateInput, setIriTemplateInput)}
                  className={`tag-input ${iriTemplateInputValid ? 'form-input-valid' : ''}`}
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
               {formData.iriTemplate.map((iri, index) => {
                 // iriTemplate does not require IRI validation - contains patterns/variables
                 let isInvalid = invalidTags.iriTemplate && invalidTags.iriTemplate[iri];
                 let errorMessage = isInvalid ? invalidTags.iriTemplate[iri] : null;
                 
                 return (
                   <div key={`iri-${index}`}>
                     <div className={`tag-item ${isInvalid ? 'tag-item-invalid' : ''}`}>
                       <span className="tag-text">{iri}</span>
                       <button 
                         type="button"
                         className="tag-remove"
                         onClick={() => handleRemoveTag('iriTemplate', index)}
                       >
                         ×
                       </button>
                     </div>
                     {isInvalid && <div className="tag-validation-error">{errorMessage}</div>}
                   </div>
                 );
               })}
             </div>
             <div className="field-hint">Press Enter or click + to add IRI template</div>
           </div>
         </div>
    
         {/* Linked Resources [0,∞] - Optional, collection with target and triples */}
         <div className="form-group">
           <label>
             Linked Resources <span className="field-indicator optional-indicator">optional, multiple values allowed</span>
           </label>
           
           {/* Display existing Linked Resources */}
           <div className="distributions-list">
             {linkedResources.map((resource, idx) => (
               <div key={`linked-resource-${idx}`} className="distribution-item">
                 <div className="distribution-header">
                   <div className="distribution-title">{resource.target || '(no target)'}</div>
                   <div className="distribution-actions">
                     <button
                       type="button"
                       className="edit-button"
                       onClick={() => handleEditLinkedResource(idx)}
                       aria-label="Edit Linked Resource"
                     >
                       Edit
                     </button>
                     <button
                       type="button"
                       className="tag-remove"
                       onClick={() => handleRemoveLinkedResource(idx)}
                       aria-label="Remove Linked Resource"
                     >
                       ×
                     </button>
                   </div>
                 </div>
                 <div className="distribution-details">
                   <div><strong>Target:</strong> {resource.target}</div>
                   <div><strong>Triples:</strong> {resource.triples}</div>
                 </div>
               </div>
             ))}
           </div>
           
           {/* Linked Resource Form */}
           <div className="distribution-form">
             <div className="form-group">
               <label htmlFor="linkedResourceTarget">
                 Target <span className="field-indicator optional-indicator">optional</span>
               </label>
               <input
                 type="text"
                 id="linkedResourceTarget"
                 name="linkedResourceTarget"
                 value={currentLinkedResource.target}
                 onClick={() => showAISuggestions && bulkSuggestionsReady && setActiveField('linkedResources')}
                 onChange={e => handleCurrentLinkedResourceChange('target', e.target.value)}
                 className={`subfield-input ${currentLinkedResource.target.trim().length > 0 ? 'form-input-valid' : ''}`}
               />
             </div>
             <div className="form-group">
               <label htmlFor="linkedResourceTriples">
                 Triples <span className="field-indicator optional-indicator">optional</span>
               </label>
               <input
                 type="text"
                 id="linkedResourceTriples"
                 name="linkedResourceTriples"
                 value={currentLinkedResource.triples}
                 onClick={() => showAISuggestions && bulkSuggestionsReady && setActiveField('linkedResources')}
                 onChange={e => handleCurrentLinkedResourceChange('triples', e.target.value)}
                 className={`subfield-input ${currentLinkedResource.triples.trim().length > 0 ? 'form-input-valid' : ''}`}
               />
             </div>
             <div className="button-row">
               <button 
                 type="button" 
                 className="add-button"
                 onClick={handleAddLinkedResource}
               >
                 {editingLinkedResourceIdx !== null ? 'Save Changes' : 'Add LinkSet'}
               </button>
               {editingLinkedResourceIdx !== null && (
                 <button 
                   type="button" 
                   className="cancel-button"
                   onClick={() => {
                     setCurrentLinkedResource(emptyLinkedResource);
                     setEditingLinkedResourceIdx(null);
                   }}
                 >
                   Cancel
                 </button>
               )}
             </div>
           </div>
         </div>


          {/* Example Resource Section */}
<div className="form-section">
  <h3 className="section-title">Example Resources</h3>
  <div className="field-indicator optional-indicator">optional, multiple submissions allowed</div>
  
  {/* Display existing Example Resources */}
  <div className="distributions-list">
    {exampleResources.map((resource, idx) => (
      <div key={`example-resource-${idx}`} className="distribution-item">
        <div className="distribution-header">
          <div className="distribution-title">{resource.title || '(no title)'}</div>
          <div className="distribution-actions">
            <button
              type="button"
              className="edit-button"
              onClick={() => handleEditExampleResource(idx)}
              aria-label="Edit Example Resource"
            >
              Edit
            </button>
            <button
              type="button"
              className="tag-remove"
              onClick={() => handleRemoveExampleResource(idx)}
              aria-label="Remove Example Resource"
            >
              ×
            </button>
          </div>
        </div>
        <div className="distribution-preview">
          <div className="distribution-field">
            <span className="field-label">Title:</span>
            <span className="field-value">{resource.title}</span>
          </div>
          <div className="distribution-field">
            <span className="field-label">Description:</span>
            <span className="field-value">{resource.description}</span>
          </div>
          <div className="distribution-field">
            <span className="field-label">Status:</span>
            <span className="field-value">{resource.status}</span>
          </div>
          <div className="distribution-field">
            <span className="field-label">Access URL:</span>
            <span className="field-value">{resource.accessURL}</span>
          </div>
        </div>
      </div>
    ))}
  </div>

  {/* Example Resource Form */}
  <div className="distribution-form">
    <div className="form-group">
      <label htmlFor="exampleResourceTitle">
        Title <span className="field-indicator optional-indicator">optional</span>
      </label>
      <input
        type="text"
        id="exampleResourceTitle"
        name="exampleResourceTitle"
        value={currentExampleResource.title}
        onClick={() => showAISuggestions && bulkSuggestionsReady && setActiveField('exampleResource')}
        onChange={e => handleCurrentExampleResourceChange('title', e.target.value)}
        className={`subfield-input ${currentExampleResource.title.trim().length > 0 ? 'form-input-valid' : ''}`}
      />
    </div>
    <div className="form-group">
      <label htmlFor="exampleResourceDescription">
        Description <span className="field-indicator optional-indicator">optional</span>
      </label>
      <input
        type="text"
        id="exampleResourceDescription"
        name="exampleResourceDescription"
        value={currentExampleResource.description}
        onClick={() => showAISuggestions && bulkSuggestionsReady && setActiveField('exampleResource')}
        onChange={e => handleCurrentExampleResourceChange('description', e.target.value)}
        className={`subfield-input ${currentExampleResource.description.trim().length > 0 ? 'form-input-valid' : ''}`}
      />
    </div>
    <div className="form-group">
      <label htmlFor="exampleResourceStatus">
        Status <span className="field-indicator optional-indicator">optional</span>
      </label>
      <input
        type="text"
        id="exampleResourceStatus"
        name="exampleResourceStatus"
        value={currentExampleResource.status}
        onClick={() => showAISuggestions && bulkSuggestionsReady && setActiveField('exampleResource')}
        onChange={e => handleCurrentExampleResourceChange('status', e.target.value)}
        className={`subfield-input ${currentExampleResource.status.trim().length > 0 ? 'form-input-valid' : ''}`}
      />
    </div>
    <div className="form-group">
      <label htmlFor="exampleResourceAccessURL">
        Access URL <span className="field-indicator optional-indicator">optional (IRI)</span>
      </label>
      <input
        type="text"
        id="exampleResourceAccessURL"
        name="exampleResourceAccessURL"
        value={currentExampleResource.accessURL}
        onClick={() => showAISuggestions && bulkSuggestionsReady && setActiveField('exampleResource')}
        onChange={e => {
          handleCurrentExampleResourceChange('accessURL', e.target.value);
          
          // Real-time IRI validation
          const value = e.target.value;
          if (!value || !value.trim()) {
            setExampleResourceAccessURLError('');
            setExampleResourceAccessURLValid(false);
          } else {
            const iriError = isValidIriString(value);
            if (iriError) {
              setExampleResourceAccessURLError(iriError);
              setExampleResourceAccessURLValid(false);
            } else {
              setExampleResourceAccessURLError('');
              setExampleResourceAccessURLValid(true);
            }
          }
        }}
        className={`subfield-input ${exampleResourceAccessURLError ? 'form-input-error' : ''} ${exampleResourceAccessURLValid ? 'form-input-valid' : ''}`}
      />
      {exampleResourceAccessURLError && <div className="iri-error-message">{exampleResourceAccessURLError}</div>}
    </div>
    <div className="button-row">
      <button
        type="button"
        className="add-button"
        onClick={handleAddExampleResource}
      >
        {editingExampleResourceIdx !== null ? 'Save Changes' : 'Add Example Resource'}
      </button>
      {editingExampleResourceIdx !== null && (
        <button
          type="button"
          className="cancel-button"
          onClick={handleCancelEditExampleResource}
        >
          Cancel
        </button>
      )}
    </div>
  </div>
</div>

    
         {/* Access Statement [1] - Required, single value */}
         <div className="form-group">
           <label htmlFor="accessStatement">
             Access Statement <span className="field-indicator required-indicator">required (IRI), 1 value only</span>
           </label>
           <div className="tag-input-container">
             <div className="tag-input-row">
               <input
                 type="text"
                 id="accessStatement"
                 name="accessStatementInput"
                 value={accessStatementInput}
                 onChange={(e) => {
                   setAccessStatementInput(e.target.value);
                   setAccessStatementRejectionMessage(''); // Clear rejection message when typing
                   
                   // Real-time IRI validation
                   const value = e.target.value;
                   if (!value || !value.trim()) {
                     setAccessStatementError('');
                     setAccessStatementValid(false);
                   } else {
                     const iriError = isValidIriString(value);
                     if (iriError) {
                       setAccessStatementError(iriError);
                       setAccessStatementValid(false);
                     } else {
                       setAccessStatementError('');
                       setAccessStatementValid(true);
                     }
                   }
                 }}
                 onKeyPress={(e) => {
                   if (e.key === 'Enter') {
                     e.preventDefault();
                     // Validate IRI before adding
                     const iriError = isValidIriString(accessStatementInput);
                     if (iriError) {
                       setAccessStatementError(iriError);
                       return;
                     }
                     handleAddSingleValueTag('accessStatement', accessStatementInput, setAccessStatementInput, setAccessStatementRejectionMessage);
                   }
                 }}
                 className={`tag-input ${accessStatementValid ? 'form-input-valid' : ''} ${accessStatementError ? 'form-input-error' : ''}`}
                 placeholder="Enter IRI and press Enter or +"
               />
               <button 
                 type="button" 
                 className="tag-add-button"
                 onClick={() => {
                   // Validate IRI before adding
                   const iriError = isValidIriString(accessStatementInput);
                   if (iriError) {
                     setAccessStatementError(iriError);
                     return;
                   }
                   handleAddSingleValueTag('accessStatement', accessStatementInput, setAccessStatementInput, setAccessStatementRejectionMessage);
                 }}
               >
                 +
               </button>
             </div>
             
             {/* Display current access statement as a tag */}
             {formData.accessStatement && (
               <div className="tag-list">
                 <div className="tag-item">
                   <span className="tag-text">{formData.accessStatement}</span>
                   <button 
                     type="button"
                     className="tag-remove"
                     onClick={() => handleRemoveSingleValueTag('accessStatement', setAccessStatementRejectionMessage)}
                   >
                     ×
                   </button>
                 </div>
               </div>
             )}
             
             {/* Validation error */}
             {accessStatementError && <div className="iri-error-message">{accessStatementError}</div>}
             
             {/* Rejection message */}
             {accessStatementRejectionMessage && (
               <div className="rejection-message" style={{color: '#e74c3c', fontSize: '0.9em', marginTop: '5px'}}>
                 {accessStatementRejectionMessage}
               </div>
             )}
             
             <div className="field-hint">Press Enter or click + to add access statement (must be valid IRI)</div>
           </div>
         </div>
    
         {/* Source [0,∞] - Optional, multiple values */}
         <div className="form-group">
           <label htmlFor="source">
             Source <span className="field-indicator optional-indicator">optional (IRI), multiple values allowed</span>
           </label>
           <div className="tag-input-container">
             <div className="tag-input-row">
             <input
                  type="text"
                  id="source"
                  name="sourceInput"
                  value={sourceInput}
                  onChange={(e) => {
                    setSourceInput(e.target.value);
                    setSourceInputError('');
                    setSourceInputValid(false);
                  }}
                  onBlur={validateIriInput}
                  onKeyPress={(e) => handleKeyPress(e, 'source', sourceInput, setSourceInput, setSourceInputError)}
                  className={`${sourceInputError ? 'tag-input-error' : ''} ${sourceInputValid ? 'tag-input-valid' : ''}`}
                  placeholder="Enter IRI and press Enter or +"
            />
            {sourceInputError && <div className="iri-error-message">{sourceInputError}</div>}

                              <button 
                 type="button" 
                 className="tag-add-button"
                 onClick={() => handleAddTag('source', sourceInput, setSourceInput)}
               >
                 +
               </button>
             </div>
             <div className="tag-list">
               {formData.source.map((src, index) => {
                 // Check if in invalidTags state OR validate on render
                 let isInvalid = invalidTags.source && invalidTags.source[src];
                 let errorMessage = isInvalid ? invalidTags.source[src] : null;
                 
                 // If not tracked as invalid, validate it now
                 if (!isInvalid) {
                   const validationError = isValidIriString(src);
                   if (validationError) {
                     isInvalid = true;
                     errorMessage = validationError;
                   }
                 }
                 
                 return (
                   <div key={`source-${index}`}>
                     <div className={`tag-item ${isInvalid ? 'tag-item-invalid' : ''}`}>
                       <span className="tag-text">{src}</span>
                       <button 
                         type="button"
                         className="tag-remove"
                         onClick={() => handleRemoveTag('source', index)}
                       >
                         ×
                       </button>
                     </div>
                     {isInvalid && <div className="tag-validation-error">{errorMessage}</div>}
                   </div>
                 );
               })}
             </div>
             <div className="field-hint">Press Enter or click + to add source (IRI)</div>
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
                  name="nameSpace"
                  value={nameSpaceInput}
                  onChange={(e) => setNameSpaceInput(e.target.value)}
                  onBlur={validateRegularInput}
                  onKeyPress={(e) => handleKeyPress(e, 'nameSpace', nameSpaceInput, setNameSpaceInput)}
                  className={`tag-input ${nameSpaceInputValid ? 'form-input-valid' : ''}`}
                  placeholder="Enter namespace and press Enter or +"
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
               {formData.nameSpace.map((ns, index) => {
                 // Check if in invalidTags state OR validate on render
                 let isInvalid = invalidTags.nameSpace && invalidTags.nameSpace[ns];
                 let errorMessage = isInvalid ? invalidTags.nameSpace[ns] : null;
                 
                 // If not tracked as invalid, validate it now
                 if (!isInvalid) {
                   const validationError = isValidIriString(ns);
                   if (validationError) {
                     isInvalid = true;
                     errorMessage = validationError;
                   }
                 }
                 
                 return (
                   <div key={`namespace-${index}`}>
                     <div className={`tag-item ${isInvalid ? 'tag-item-invalid' : ''}`}>
                       <span className="tag-text">{ns}</span>
                       <button 
                         type="button"
                         className="tag-remove"
                         onClick={() => handleRemoveTag('nameSpace', index)}
                       >
                         ×
                       </button>
                     </div>
                     {isInvalid && <div className="tag-validation-error">{errorMessage}</div>}
                   </div>
                 );
               })}
             </div>
             <div className="field-hint">Press Enter or click + to add namespace</div>
           </div>
         </div>

          {/* License for Metadata */}
          <div className="form-group">
            <label htmlFor="license">
              KG License <span className="field-indicator required-indicator">required, 1 value only</span>
            </label>
            <div className="tag-input-container">
              <div className="tag-input-row">
                <select
                   id="license"
                   name="licenseInput"
                   value={licenseInput}
                   onChange={(e) => {
                     setLicenseInput(e.target.value);
                     setLicenseRejectionMessage('');
                     setLicenseError('');
                     // Set valid only if a real license is selected (not the placeholder)
                     setLicenseValid(e.target.value !== '');
                   }}
                   className={`form-control ${licenseInput !== '' && licenseInput !== undefined ? 'form-input-valid' : ''} ${licenseError ? 'form-input-error' : ''}`}
                   style={{flex: 1}}
                 >
                   <option value="">Select a license...</option>
                   <option value="https://opensource.org/licenses/MIT">https://opensource.org/licenses/MIT</option>
                   <option value="https://opensource.org/licenses/Apache-2.0">https://opensource.org/licenses/Apache-2.0</option>
                   <option value="https://opensource.org/licenses/GPL-3.0">https://opensource.org/licenses/GPL-3.0</option>
                   <option value="https://opensource.org/licenses/GPL-2.0">https://opensource.org/licenses/GPL-2.0</option>
                   <option value="https://opensource.org/licenses/LGPL-3.0">https://opensource.org/licenses/LGPL-3.0</option>
                   <option value="https://opensource.org/licenses/BSD-3-Clause">https://opensource.org/licenses/BSD-3-Clause</option>
                   <option value="https://opensource.org/licenses/BSD-2-Clause">https://opensource.org/licenses/BSD-2-Clause</option>
                   <option value="https://opensource.org/licenses/ISC">https://opensource.org/licenses/ISC</option>
                   <option value="https://www.boost.org/LICENSE_1_0.txt">https://www.boost.org/LICENSE_1_0.txt</option>
                   <option value="https://opensource.org/licenses/Zlib">https://opensource.org/licenses/Zlib</option>
                   <option value="http://www.wtfpl.net/">http://www.wtfpl.net/</option>
                   <option value="https://opensource.org/licenses/AGPL-3.0">https://opensource.org/licenses/AGPL-3.0</option>
                   <option value="https://opensource.org/licenses/MPL-2.0">https://opensource.org/licenses/MPL-2.0</option>
                   <option value="https://opensource.org/licenses/EPL-1.0">https://opensource.org/licenses/EPL-1.0</option>
                   <option value="https://opensource.org/licenses/EUPL-1.1">https://opensource.org/licenses/EUPL-1.1</option>
                   <option value="https://opensource.org/licenses/MS-PL">https://opensource.org/licenses/MS-PL</option>
                   <option value="https://opensource.org/licenses/MS-RL">https://opensource.org/licenses/MS-RL</option>
                   <option value="https://opensource.org/licenses/CDDL-1.0">https://opensource.org/licenses/CDDL-1.0</option>
                   <option value="https://opensource.org/licenses/Artistic-2.0">https://opensource.org/licenses/Artistic-2.0</option>
                   <option value="https://opensource.org/licenses/AFL-3.0">https://opensource.org/licenses/AFL-3.0</option>
                   <option value="https://creativecommons.org/licenses/by/4.0/">https://creativecommons.org/licenses/by/4.0/</option>
                   <option value="https://creativecommons.org/licenses/by-sa/4.0/">https://creativecommons.org/licenses/by-sa/4.0/</option>
                   <option value="https://creativecommons.org/licenses/by-nc/4.0/">https://creativecommons.org/licenses/by-nc/4.0/</option>
                   <option value="https://creativecommons.org/licenses/by-nc-sa/4.0/">https://creativecommons.org/licenses/by-nc-sa/4.0/</option>
                   <option value="https://creativecommons.org/publicdomain/zero/1.0/">https://creativecommons.org/publicdomain/zero/1.0/</option>
                   <option value="https://unlicense.org/">https://unlicense.org/</option>
                   <option value="Other">Other (specify below)</option>
                 </select>
                 <button 
                   type="button" 
                   className="tag-add-button"
                   onClick={() => {
                     if (licenseInput === 'Other' && customLicenseInput.trim()) {
                       handleAddSingleValueDropdownTag('license', `Other-${customLicenseInput.trim()}`, setLicenseInput, setLicenseRejectionMessage, setLicenseValid);
                       setCustomLicenseInput(''); // Clear custom input
                     } else if (licenseInput && licenseInput !== 'Other') {
                       handleAddSingleValueDropdownTag('license', licenseInput, setLicenseInput, setLicenseRejectionMessage, setLicenseValid);
                     }
                   }}
                 >
                   +
                 </button>
              </div>
              
              {/* Conditional input field for "Other" license */}
              {licenseInput === 'Other' && (
                <div className="custom-license-input" style={{marginTop: '10px'}}>
                  <input
                    type="text"
                    id="customLicense"
                    name="customLicense"
                    placeholder="Enter custom license name or URL..."
                    value={customLicenseInput}
                    onChange={(e) => setCustomLicenseInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && customLicenseInput.trim()) {
                        e.preventDefault();
                        handleAddSingleValueDropdownTag('license', `Other-${customLicenseInput.trim()}`, setLicenseInput, setLicenseRejectionMessage, setLicenseValid);
                        setCustomLicenseInput('');
                      }
                    }}
                    className="form-control"
                    style={{fontSize: '14px'}}
                  />
                </div>
              )}
              
              {/* Display current license as a tag */}
              {formData.license && (
                <div className="tag-list">
                  <div className="tag-item">
                    <span className="tag-text">
                      {formData.license.startsWith('Other-') 
                        ? `Custom: ${formData.license.substring(6)}` 
                        : formData.license}
                    </span>
                    <button 
                      type="button"
                      className="tag-remove"
                      onClick={() => {
                        handleRemoveSingleValueTag('license', setLicenseRejectionMessage);
                        setLicenseValid(false);
                        setLicenseError('');
                      }}
                    >
                      ×
                    </button>
                  </div>
                </div>
              )}
              
              {/* License validation error */}
              {licenseError && <div className="iri-error-message">{licenseError}</div>}
              
              {/* Rejection message */}
              {licenseRejectionMessage && (
                <div className="rejection-message" style={{color: '#e74c3c', fontSize: '0.9em', marginTop: '5px'}}>
                  {licenseRejectionMessage}
                </div>
              )}
              
              <div className="field-hint">Select license and click + to add. This license applies to the metadata record itself, not the dataset content</div>
            </div>
          </div>
            </form>
          </div>
          
          {showAISuggestions && (
            <div className={`ai-suggestions-panel ${aiPanelExpanded ? 'expanded' : ''}`}>
              <div className="ai-panel-header">
                <div className="ai-panel-header-left">
                  <h3>AI Suggestions</h3>
                  {activeField && (
                    <div className="active-field-indicator">
                      Field: <strong>{activeField}</strong>
                    </div>
                  )}
                </div>
                <button 
                  className="ai-panel-expand-button"
                  onClick={() => setAiPanelExpanded(!aiPanelExpanded)}
                  type="button"
                  title={aiPanelExpanded ? "Collapse panel" : "Expand panel"}
                >
                  {aiPanelExpanded ? '◀ Collapse' : '▶ Expand'}
                </button>
              </div>
              
              <div className="ai-panel-content" ref={aiPanelContentRef}>
                {activeField && activeField !== 'waiting-for-narrative' && bulkSuggestionsReady && (
                  <div className="ai-suggestions-list">
                    {(() => {
                      const suggestionText = aiSuggestions[activeField];
                      
                      // Handle case where no suggestions exist for this field
                      if (!suggestionText) {
                        return (
                          <div className="no-answers-found">
                            <div className="no-answers-title">No answers found for this field</div>
                            <div className="no-answers-explanation">No suggestions were generated for this field from the KG document.</div>
                          </div>
                        );
                      }
                      
                      // Handle "no suggestions" case
                      if (!suggestionText.includes('•')) {
                        return (
                          <div className="no-answers-found">
                            <div className="no-answers-title">No answers found for this field</div>
                            <div className="no-answers-explanation">{suggestionText}</div>
                          </div>
                        );
                      }
                      
                      // Parse suggestions - simple list format now (no explanations)
                      const suggestions = suggestionText
                        .split('\n')
                        .filter(line => line.trim().startsWith('•'))
                        .map(line => ({
                          value: line.replace('•', '').trim()
                        }));
                      
                      // Check if this is a multi-value field (simple arrays, not complex objects)
                      const multiValueFields = [
                        'vocabulariesUsed', 'keywords', 'category', 'language', 'otherPages', 
                        'statistics', 'source', 'alternativeTitle', 'acronym', 'homepageURL',
                        'modifiedDate', 'primaryReferenceDocument', 'metaGraph', 'kgSchema',
                        'restAPI', 'exampleQueries', 'publicationReferences', 'iriTemplate',
                        'nameSpace', 'identifier'
                      ];
                      const isMultiValueField = multiValueFields.includes(activeField);
                      
                      // For multi-value fields, show "Add All" button
                      return (
                        <>
                          {(isMultiValueField || activeField === 'roles') && suggestions.length > 1 && (
                            <div className="add-all-container">
                              <button
                                className="add-all-button"
                                onClick={() => {
                                  if (activeField === 'roles') {
                                    // For roles, pass the raw data to add all roles
                                    populateFieldWithSuggestion(activeField, suggestions.map(s => s.value));
                                  } else {
                                    const allValues = suggestions.map(s => s.value);
                                    populateFieldWithSuggestion(activeField, allValues);
                                  }
                                }}
                                type="button"
                              >
                                ➕ Add All {suggestions.length} Suggestions
                              </button>
                            </div>
                          )}
                          
                          {suggestions.map((suggestion, index) => {
                            // Special rendering for roles to highlight role type
                            if (activeField === 'roles') {
                              const roleMatch = suggestion.value.match(/^([^:]+):\s*(.+)$/);
                              if (roleMatch) {
                                const [, roleType, details] = roleMatch;
                                return (
                                  <div key={index} className="suggestion-card">
                                    <button
                                      className="suggestion-value"
                                      onClick={() => populateFieldWithSuggestion(activeField, suggestion.value, index)}
                                      type="button"
                                      style={{ textAlign: 'left' }}
                                    >
                                      <div style={{ 
                                        display: 'flex', 
                                        flexDirection: 'column', 
                                        gap: '4px'
                                      }}>
                                        <div style={{ 
                                          fontSize: '0.85rem', 
                                          fontWeight: '700',
                                          color: 'var(--primary-blue)',
                                          textTransform: 'uppercase',
                                          letterSpacing: '0.5px'
                                        }}>
                                          {roleType.trim()}
                                        </div>
                                        <div style={{ 
                                          fontSize: '1rem',
                                          color: 'var(--dark-text)'
                                        }}>
                                          {details.trim()}
                                        </div>
                                      </div>
                                    </button>
                                  </div>
                                );
                              }
                            }
                            
                            // Special rendering for complex JSON fields
                            const complexFields = ['distributions', 'sparqlEndpoint', 'exampleResource', 'linkedResources'];
                            if (complexFields.includes(activeField)) {
                              try {
                                const parsed = JSON.parse(suggestion.value);
                                const cardContent = renderComplexFieldCard(activeField, parsed);
                                if (cardContent) {
                                  return (
                                    <div key={index} className="suggestion-card">
                                      <button
                                        className="suggestion-value"
                                        onClick={() => populateFieldWithSuggestion(activeField, suggestion.value, index)}
                                        type="button"
                                        style={{ textAlign: 'left', width: '100%' }}
                                      >
                                        {cardContent}
                                      </button>
                                    </div>
                                  );
                                }
                              } catch (e) {
                                // Fall through to default rendering if parsing fails
                              }
                            }
                            
                            // Default rendering for other fields
                            return (
                              <div key={index} className="suggestion-card">
                                <button
                                  className="suggestion-value"
                                  onClick={() => populateFieldWithSuggestion(activeField, suggestion.value, index)}
                                  type="button"
                                >
                                  {renderJsonValue(suggestion.value)}
                                </button>
                              </div>
                            );
                          })}
                        </>
                      );
                    })()}
                  </div>
                )}
                
                {(!bulkSuggestionsReady || activeField === 'waiting-for-narrative') && (
                  <div className="waiting-for-narrative-message">
                    <div className="waiting-icon">📋</div>
                    <div className="waiting-text">
                      <strong>Waiting for KG document</strong>
                      <p>Please upload a KG document file (.txt or .docx) to get AI suggestions for your fields.</p>
                    </div>
                  </div>
                )}
                
                {bulkSuggestionsReady && !activeField && (
                  <div className="ai-panel-placeholder">
                    Click the 🤖 icon next to any field to get AI explanations
                  </div>
                )}
              </div>
              
              {/* Scroll indicator */}
              {showScrollIndicator && (
                <div className="ai-scroll-indicator">
                  <div className="ai-scroll-indicator-icon">↓</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
     
      <div className="modal-footer">
       {/* AI panel now automatically shows with LLM form (narrative file upload) */}
       {/* Toggle removed - panel visibility is automatic based on narrative file */}
       
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
         onClick={(e) => handleSubmit(e, bypassValidation)}
         disabled={isSubmitting}
       >
         {isSubmitting ? 'Submitting...' : 'Submit'}
       </button>
       
       <div className="bypass-validation-container">
         <label className="checkbox-wrapper">
           <input 
             type="checkbox"
             checked={bypassValidation}
             onChange={(e) => setBypassValidation(e.target.checked)}
             disabled={isSubmitting}
           />
           <span className="checkbox-label">Allow submission to bypass validation rules</span>
         </label>
       </div>
      </div>
      </>
    )}
      
      {/* Expanded AI Panel Overlay */}
      {aiPanelExpanded && showAISuggestions && (
        <div className="ai-panel-overlay" onClick={() => setAiPanelExpanded(false)}>
          <div className="ai-panel-expanded-container" onClick={(e) => e.stopPropagation()}>
            <div className="ai-panel-header">
              <div className="ai-panel-header-left">
                <h3>AI Suggestions (Expanded View)</h3>
                {activeField && (
                  <div className="active-field-indicator">
                    Field: <strong>{activeField}</strong>
                  </div>
                )}
              </div>
              <button 
                className="ai-panel-close-button"
                onClick={() => setAiPanelExpanded(false)}
                type="button"
                title="Close expanded view"
              >
                ✕ Close
              </button>
            </div>
            
            <div className="ai-panel-content" ref={aiPanelContentRef}>
              {activeField && activeField !== 'waiting-for-narrative' && bulkSuggestionsReady && (
                <div className="ai-suggestions-list">
                  {(() => {
                    const suggestionText = aiSuggestions[activeField];
                    
                    if (!suggestionText) {
                      return (
                        <div className="no-answers-found">
                          <div className="no-answers-title">No answers found for this field</div>
                          <div className="no-answers-explanation">No suggestions were generated for this field from the KG document.</div>
                        </div>
                      );
                    }
                    
                    if (!suggestionText.includes('•')) {
                      return (
                        <div className="no-answers-found">
                          <div className="no-answers-title">No answers found for this field</div>
                          <div className="no-answers-explanation">{suggestionText}</div>
                        </div>
                      );
                    }
                    
                    const suggestions = suggestionText
                      .split('\n')
                      .filter(line => line.trim().startsWith('•'))
                      .map(line => ({
                        value: line.replace('•', '').trim()
                      }));
                    
                    const multiValueFields = [
                      'vocabulariesUsed', 'keywords', 'category', 'language', 'otherPages', 
                      'statistics', 'source', 'alternativeTitle', 'acronym', 'homepageURL',
                      'modifiedDate', 'primaryReferenceDocument', 'metaGraph', 'kgSchema',
                      'restAPI', 'exampleQueries', 'publicationReferences', 'iriTemplate',
                      'nameSpace', 'identifier'
                    ];
                    const isMultiValueField = multiValueFields.includes(activeField);
                    
                    return (
                      <>
                        {(isMultiValueField || activeField === 'roles') && suggestions.length > 1 && (
                          <div className="add-all-container">
                            <button
                              className="add-all-button"
                              onClick={() => {
                                if (activeField === 'roles') {
                                  populateFieldWithSuggestion(activeField, suggestions.map(s => s.value));
                                } else {
                                  const allValues = suggestions.map(s => s.value);
                                  populateFieldWithSuggestion(activeField, allValues);
                                }
                                setAiPanelExpanded(false); // Close after adding
                              }}
                              type="button"
                            >
                              ➕ Add All {suggestions.length} Suggestions
                            </button>
                          </div>
                        )}
                        
                        {suggestions.map((suggestion, index) => {
                          // Special rendering for roles to highlight role type
                          if (activeField === 'roles') {
                            const roleMatch = suggestion.value.match(/^([^:]+):\s*(.+)$/);
                            if (roleMatch) {
                              const [, roleType, details] = roleMatch;
                              return (
                                <div key={index} className="suggestion-card">
                                  <button
                                    className="suggestion-value"
                                    onClick={() => {
                                      populateFieldWithSuggestion(activeField, suggestion.value, index);
                                      setAiPanelExpanded(false); // Close after adding
                                    }}
                                    type="button"
                                    style={{ textAlign: 'left' }}
                                  >
                                    <div style={{ 
                                      display: 'flex', 
                                      flexDirection: 'column', 
                                      gap: '4px'
                                    }}>
                                      <div style={{ 
                                        fontSize: '0.85rem', 
                                        fontWeight: '700',
                                        color: 'var(--primary-blue)',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px'
                                      }}>
                                        {roleType.trim()}
                                      </div>
                                      <div style={{ 
                                        fontSize: '1rem',
                                        color: 'var(--dark-text)'
                                      }}>
                                        {details.trim()}
                                      </div>
                                    </div>
                                  </button>
                                </div>
                              );
                            }
                          }
                          
                          // Special rendering for complex JSON fields
                          const complexFields = ['distributions', 'sparqlEndpoint', 'exampleResource', 'linkedResources'];
                          if (complexFields.includes(activeField)) {
                            try {
                              const parsed = JSON.parse(suggestion.value);
                              const cardContent = renderComplexFieldCard(activeField, parsed);
                              if (cardContent) {
                                return (
                                  <div key={index} className="suggestion-card">
                                    <button
                                      className="suggestion-value"
                                      onClick={() => {
                                        populateFieldWithSuggestion(activeField, suggestion.value, index);
                                        setAiPanelExpanded(false); // Close after adding
                                      }}
                                      type="button"
                                      style={{ textAlign: 'left', width: '100%' }}
                                    >
                                      {cardContent}
                                    </button>
                                  </div>
                                );
                              }
                            } catch (e) {
                              // Fall through to default rendering if parsing fails
                            }
                          }
                          
                          // Default rendering for other fields
                          return (
                            <div key={index} className="suggestion-card">
                              <button
                                className="suggestion-value"
                                onClick={() => {
                                  populateFieldWithSuggestion(activeField, suggestion.value, index);
                                  setAiPanelExpanded(false); // Close after adding
                                }}
                                type="button"
                              >
                                {renderJsonValue(suggestion.value)}
                              </button>
                            </div>
                          );
                        })}
                      </>
                    );
                  })()}
                </div>
              )}
              
              {(!bulkSuggestionsReady || activeField === 'waiting-for-narrative') && (
                <div className="waiting-for-narrative-message">
                  <div className="waiting-icon">📋</div>
                  <div className="waiting-text">
                    <strong>Waiting for KG document</strong>
                    <p>Please upload a KG document file (.txt or .docx) to get AI suggestions for your fields.</p>
                  </div>
                </div>
              )}
              
              {bulkSuggestionsReady && !activeField && (
                <div className="ai-panel-placeholder">
                  Click the 🤖 icon next to any field to get AI explanations
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Processing Overlay */}
      {loadingSuggestions && (
        <div className="processing-overlay">
          <div className="processing-content">
            <div className="processing-spinner"></div>
            <h3>processing knowledge graph document</h3>
            <p>openAI's API is analyzing your description file and generating suggestions...</p>
            <div className="processing-timer">
              {processingStartTime && (
                <span>Processing time: {Math.floor(currentProcessingTime / 1000)}s</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  );
}
    

export default ModalForm;
