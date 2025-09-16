import sys
import re

with open(sys.argv[1], encoding='utf-8') as f:
    lines = f.readlines()

output = []
inside_identifier = False
inside_alttitle = False
inside_radio_group = False
inside_title = False
inside_description = False
inside_license = False
inside_version = False
inside_access = False
inside_dist_release = False
inside_dist_mod = False

for i, line in enumerate(lines):
    # Identifier input
    if 'id="identifier"' in line and 'input' in line:
        inside_identifier = True
        output.append(re.sub(r'className=.*', 'className={identifierInputValid ? \'tag-input-valid\' : \'\'}', line))
        continue
    if inside_identifier and 'onChange=' in line:
        output.append('        onChange={(e) => { setIdentifierInput(e.target.value); setIdentifierInputValid(false); }}')
        continue
    if inside_identifier and 'onBlur=' not in line and '/>' in line:
        output.append('        onBlur={() => { if (identifierInput.trim()) setIdentifierInputValid(true); }}')
        inside_identifier = False
        continue
    if inside_identifier and 'onKeyPress=' in line:
        output.append(line)
        continue
    if inside_identifier:
        output.append(line)
        continue
    if 'className="tag-item"' in line and 'identifier' in lines[i-1]:
        output.append(line.replace('className="tag-item"', 'className="tag-item tag-item-valid"'))
        continue

    # Alternative Title input
    if 'id="alternativeTitle"' in line and 'input' in line:
        inside_alttitle = True
        output.append(re.sub(r'className=.*', 'className={alternativeTitleInputValid ? \'tag-input-valid\' : \'\'}', line))
        continue
    if inside_alttitle and 'onChange=' in line:
        output.append('        onChange={(e) => { setAlternativeTitleInput(e.target.value); setAlternativeTitleInputValid(false); }}')
        continue
    if inside_alttitle and 'onBlur=' not in line and '/>' in line:
        output.append('        onBlur={() => { if (alternativeTitleInput.trim()) setAlternativeTitleInputValid(true); }}')
        inside_alttitle = False
        continue
    if inside_alttitle and 'onKeyPress=' in line:
        output.append(line)
        continue
    if inside_alttitle:
        output.append(line)
        continue
    if 'className="tag-item"' in line and 'alt-title' in lines[i-1]:
        output.append(line.replace('className="tag-item"', 'className="tag-item tag-item-valid"'))
        continue

    # Radio group for type
    if 'className="radio-group"' in line:
        output.append(line.replace('className="radio-group"', 'className={`radio-group ${typeValid ? \'form-input-valid\' : \'\'}` }'))
        continue

    # Title input
    if 'id="title"' in line and 'input' in line:
        inside_title = True
        output.append(re.sub(r'className=.*', 'className={`${titleValid ? \'form-input-valid\' : \'\'}`}', line))
        continue
    if inside_title and 'onChange=' in line:
        output.append(line)
        continue
    if inside_title and 'onBlur=' not in line and '/>' in line:
        output.append('        onBlur={validateRegularInput}')
        inside_title = False
        continue
    if inside_title:
        output.append(line)
        continue

    # Description textarea
    if 'id="description"' in line and 'textarea' in line:
        inside_description = True
        output.append(re.sub(r'className=.*', 'className={`${descriptionValid ? \'form-input-valid\' : \'\'}`}', line))
        continue
    if inside_description and 'onChange=' in line:
        output.append(line)
        continue
    if inside_description and 'onBlur=' not in line and '>' in line:
        output.append('        onBlur={validateRegularInput}')
        inside_description = False
        continue
    if inside_description:
        output.append(line)
        continue

    # License input
    if 'id="license"' in line and 'input' in line:
        inside_license = True
        output.append(re.sub(r'className=.*', 'className={`${licenseValid ? \'form-input-valid\' : \'\'}`}', line))
        continue
    if inside_license and 'onChange=' in line:
        output.append(line)
        continue
    if inside_license and 'onBlur=' not in line and '/>' in line:
        output.append('        onBlur={validateRegularInput}')
        inside_license = False
        continue
    if inside_license:
        output.append(line)
        continue

    # Version input
    if 'id="version"' in line and 'input' in line:
        inside_version = True
        output.append(re.sub(r'className=.*', 'className={`${versionValid ? \'form-input-valid\' : \'\'}`}', line))
        continue
    if inside_version and 'onChange=' in line:
        output.append(line)
        continue
    if inside_version and 'onBlur=' not in line and '/>' in line:
        output.append('        onBlur={validateRegularInput}')
        inside_version = False
        continue
    if inside_version:
        output.append(line)
        continue

    # Access Statement textarea
    if 'id="accessStatement"' in line and 'textarea' in line:
        inside_access = True
        output.append(re.sub(r'className=.*', 'className={`${accessStatementValid ? \'form-input-valid\' : \'\'}`}', line))
        continue
    if inside_access and 'onChange=' in line:
        output.append(line)
        continue
    if inside_access and 'onBlur=' not in line and '>' in line:
        output.append('        onBlur={validateRegularInput}')
        inside_access = False
        continue
    if inside_access:
        output.append(line)
        continue

    # Distribution Release Date
    if 'id="distReleaseDate"' in line and 'input' in line:
        inside_dist_release = True
        output.append(re.sub(r'className=.*', 'className={`date-input subfield-input ${distReleaseDateError ? \'date-input-error\' : \'\'} ${distReleaseDateValid ? \'date-input-valid\' : \'\'} `}', line))
        continue
    if inside_dist_release and '/>' in line:
        inside_dist_release = False
        continue
    if inside_dist_release:
        output.append(line)
        continue

    # Distribution Modification Date
    if 'id="distModificationDate"' in line and 'input' in line:
        inside_dist_mod = True
        output.append(re.sub(r'className=.*', 'className={`date-input subfield-input ${distModificationDateError ? \'date-input-error\' : \'\'} ${distModificationDateValid ? \'date-input-valid\' : \'\'} `}', line))
        continue
    if inside_dist_mod and '/>' in line:
        inside_dist_mod = False
        continue
    if inside_dist_mod:
        output.append(line)
        continue

    # Default: just copy the line
    output.append(line)

print(''.join(output))