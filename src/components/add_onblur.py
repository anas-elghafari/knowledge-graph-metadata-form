import sys
import re

# List of IRI field names (add more if needed)
iri_fields = [
    'homepageURL', 'homepageURLInput',
    'otherPages', 'otherPagesInput',
    'primaryReferenceDocument', 'primaryReferenceDocInput',
    'statistics', 'statisticsInput',
    'category', 'categoryInput',
    'publicationReferences', 'publicationReferencesInput',
    'source', 'sourceInput'
]

# List of date field names
date_fields = [
    'createdDate', 'publishedDate', 'modifiedDate',
    'distReleaseDate', 'distModificationDate'
]

def is_iri_field(line):
    return any(f'id="{f}"' in line or f'name="{f}"' in line for f in iri_fields)

def is_date_field(line):
    return any(f'id="{f}"' in line or f'name="{f}"' in line for f in date_fields)

def is_tag_input(line):
    # Heuristic: tag inputs are inside .tag-input-row and not a date field
    return 'tag-input-row' in line or 'tag-input-container' in line

with open(sys.argv[1], encoding='utf-8') as f:
    lines = f.readlines()

output = []
inside_input = False
input_line = ''
for i, line in enumerate(lines):
    stripped = line.strip()
    # Only process input or textarea lines
    if (('<input' in stripped or '<textarea' in stripped) and 'onBlur=' not in stripped):
        input_line = line
        # IRI fields
        if is_iri_field(line):
            # Add onBlur={validateIriInput}
            if '/>' in line:
                output.append(line.replace('/>', 'onBlur={validateIriInput} />'))
            else:
                output.append(line)
                output.append('      onBlur={validateIriInput}')
        # Date fields: skip (already handled)
        elif is_date_field(line):
            output.append(line)
        # Tag input: skip (handled elsewhere)
        elif is_tag_input(line):
            output.append(line)
        # All other single-value fields
        else:
            # Add onBlur={validateRegularInput}
            if '/>' in line:
                output.append(line.replace('/>', 'onBlur={validateRegularInput} />'))
            else:
                output.append(line)
                output.append('      onBlur={validateRegularInput}')
    else:
        output.append(line)

print(''.join(output))