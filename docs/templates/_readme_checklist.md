# README.md Checklist

This checklist ensures that each package's README.md file maintains a consistent structure and content.

## Required Sections

- [ ] Title (Package Name)
- [ ] Concise Description
- [ ] Feature List (at least 3)
- [ ] Installation Instructions
- [ ] Basic Usage
- [ ] Options List
- [ ] Examples (both S3 and GCS)
- [ ] Authentication Information
- [ ] Links to Related Commands

## Additional Sections by Package Type

### Backup Commands

- [ ] Streaming Mode Example
- [ ] Cron Mode Example
- [ ] Migration Information (if applicable)

### Restore Commands

- [ ] Restore Target Specification
- [ ] Migration Information (if applicable)

### List Commands

- [ ] Output Format Description

### Prune Commands

- [ ] Deletion Policy Explanation
- [ ] Detailed Explanation of delete-divide and delete-target-days-left Options

### awesome-*-backup Packages

- [ ] Docker Usage
- [ ] Environment Variables Description
- [ ] Docker Compose Example
- [ ] Timezone Settings Explanation
- [ ] Migration Information (if applicable)
- [ ] Links to Related Projects

## Cross-linking Requirements

- [ ] Links to All Related Commands
- [ ] Accurate Link Paths (relative paths)
- [ ] Appropriate Link Text

## Style Guidelines

- [ ] Appropriate Heading Levels (H1 for title only, H2 for main sections, H3 for subsections)
- [ ] Proper Language Specification for Code Blocks (bash, json, etc.)
- [ ] Environment Variables Displayed in `code style`
- [ ] Option Names Consistently Formatted as `--option-name`
- [ ] Tables with Appropriate Headers and Alignment

## Update Process

1. **Select Template**:
   - Choose the appropriate template for the package type
   - Copy the relevant template from the `docs/templates/` directory

2. **Insert Package-Specific Information**:
   - Replace placeholders like `[PACKAGE_NAME]`, `[PACKAGE_DESCRIPTION]` with actual values
   - Add feature list
   - Add usage examples
   - Update options list

3. **Update Cross-links**:
   - Update links to related commands
   - Ensure link paths are accurate

4. **Verify with Checklist**:
   - Use this checklist to verify the README.md content
   - Ensure all required sections are included
   - Ensure additional sections for the package type are included

5. **Review**:
   - Check consistency with other README.md files
   - Verify consistency of terminology and expressions
   - Check English grammar and phrasing

## How to Use Templates

1. Select the template based on package type:
   - Backup Command: `docs/templates/backup-readme-template.md`
   - Restore Command: `docs/templates/restore-readme-template.md`
   - List Command: `docs/templates/list-readme-template.md`
   - Prune Command: `docs/templates/prune-readme-template.md`
   - awesome-*-backup Package: `docs/templates/awesome-package-readme-template.md`

2. Copy and edit the template:
   ```bash
   cp docs/templates/[template-name].md apps/[package-name]/README.md
   ```

3. Replace placeholders:
   - Use editor's search/replace functionality
   - Replace each placeholder with actual values

4. Verify content using this checklist

5. Commit changes
