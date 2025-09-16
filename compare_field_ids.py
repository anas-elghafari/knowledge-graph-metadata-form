import re
import os
import json

# Paths to the files (adjust if needed)
MODAL_FORM_PATH = os.path.join(os.path.dirname(__file__), 'src/components/ModalForm.js')
FIELD_INSTRUCTIONS_PATH = os.path.join(os.path.dirname(__file__), 'src/fieldInstructions.js')

def extract_field_ids_from_modal_form(filepath):
    """
    Extract all input/select/textarea field IDs from a React form file.
    """
    ids = set()
    id_pattern = re.compile(r'id\s*=\s*["\']([\w:-]+)["\']')
    name_pattern = re.compile(r'name\s*=\s*["\']([\w:-]+)["\']')
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
        # Find all id attributes
        ids.update(id_pattern.findall(content))
        # Sometimes name is used instead of id
        ids.update(name_pattern.findall(content))
    return ids

def extract_keys_from_field_instructions(filepath):
    """
    Extract all top-level keys from the fieldInstructions.js object.
    """
    keys = set()
    inside_object = False
    with open(filepath, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            # Start of object
            if line.startswith('const fieldInstructions') and '{' in line:
                inside_object = True
                continue
            if inside_object:
                if line.startswith('}'):  # End of object
                    break
                # Match key: "value",
                m = re.match(r'["\']([^"\']+)["\']\s*:', line)
                if m:
                    keys.add(m.group(1))
    return keys

def main():
    modal_form_ids = extract_field_ids_from_modal_form(MODAL_FORM_PATH)
    field_instruction_keys = extract_keys_from_field_instructions(FIELD_INSTRUCTIONS_PATH)

    missing_instructions = sorted(modal_form_ids - field_instruction_keys)

    print("IDs in ModalForm.js but missing in fieldInstructions.js:")
    for mid in missing_instructions:
        print(mid)
    print(f"\nTotal missing: {len(missing_instructions)}")

if __name__ == "__main__":
    main()
