# Field Validation Audit

## Fields Requiring IRI Validation - AUDIT RESULTS

### ✅ CORRECT - Has validation-on-render:
- vocabulariesUsed (line 4437)
- primaryReferenceDocument (line 4505)
- metaGraph (line 4643)
- kgSchema (line 4709)
- category (line 5676)
- publicationReferences (line 5744)
- source (line 6197)

### ✅ FIXED - Added validation-on-render:
- **homepageURL** (line 3854) - ✅ NOW VALIDATES
- **otherPages** (line 3936) - ✅ NOW VALIDATES
- **nameSpace** (line 6295) - ✅ NOW VALIDATES
- **language** (line 3698) - ✅ NOW VALIDATES with BCP-47

## Fields Requiring Date Validation (YYYY-MM-DD)
✅ **Should** have validation:
- createdDate
- modifiedDate (array)
- publishedDate
- Distribution: releaseDate, modificationDate, issued

## Fields Requiring Language Code Validation (BCP-47)
✅ **Should** have validation:
- language (array)

## Fields Requiring Email Validation
✅ **Should** have validation:
- Role: email field (when using Name + Email mode)

## Fields with NO Validation Requirements
✅ **VERIFIED - Correctly have NO validation:**
- title (text)
- description (text)
- alternativeTitle (text array) - line 3525, no validation ✅
- acronym (text array) - line 3567, no validation ✅
- version (text)
- license (dropdown)
- keywords (text array) - line 3744, no validation ✅
- exampleQueries (text array) - line 5553, no validation ✅
- accessStatement (text)
- **statistics** (text array) - line 4775, NO VALIDATION ✅ (FIXED - was incorrectly validated)
- **restAPI** (text array) - line 5340, NO VALIDATION ✅ (FIXED - was incorrectly validated)
- **iriTemplate** (text array) - line 5810, NO VALIDATION ✅ (FIXED - was incorrectly validated)

## Complex Subsections
- **Distributions**: downloadURL, accessURL (required IRIs), accessService, hasPolicy, license (optional IRIs)
- **Roles**: agent (IRI if Agent mode), email (email if Name+Email mode)
- **SPARQL Endpoints**: endpointURL (required IRI)
- **Example Resources**: accessURL (optional IRI)
- **Linked Resources**: target, triples (text, NO validation)
