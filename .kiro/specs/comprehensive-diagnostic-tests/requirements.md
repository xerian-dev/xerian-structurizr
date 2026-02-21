# Requirements Document

## Introduction

This feature introduces comprehensive diagnostic tests for the Structurizr DSL parser in the VS Code extension. Currently, the diagnostics system (src/diagnostics.ts) provides basic error detection for brace balance, unclosed strings, and duplicate identifiers. However, there are many additional error conditions that can cause the parser to fail or produce incorrect results without any diagnostic feedback to the user.

The goal is to systematically identify all possible error cases from the Structurizr DSL grammar and ensure that each error condition produces a helpful diagnostic message. This will improve the developer experience by providing immediate, actionable feedback when DSL syntax is incorrect.

## Glossary

- **Diagnostic**: An error, warning, or information message displayed in the VS Code editor to indicate issues in the DSL
- **Parser**: The component (src/parser.ts) that transforms Structurizr DSL text into structured data
- **Diagnostic_Provider**: The component (src/diagnostics.ts) that analyzes DSL text and generates diagnostics
- **Error_Case**: A specific syntax error or invalid construct in the DSL that should produce a diagnostic
- **Grammar_Rule**: A syntactic pattern from the Structurizr DSL specification that defines valid constructs
- **Element_Type**: One of: person, softwareSystem, container, component, deploymentNode, infrastructureNode, group
- **View_Type**: One of: systemLandscape, systemContext, container, component, deployment, dynamic, filtered, custom
- **Block_Context**: The current parsing context (root, workspace, model, views, styles, element, view)

## Requirements

### Requirement 1: Structural Syntax Diagnostics

**User Story:** As a developer, I want diagnostics for structural syntax errors, so that I can quickly identify and fix basic DSL formatting issues.

#### Acceptance Criteria

1. WHEN braces are unbalanced, THE Diagnostic_Provider SHALL report the location of unclosed or unexpected braces
2. WHEN a string literal is not closed, THE Diagnostic_Provider SHALL report the location of the unterminated string
3. WHEN a block comment is not terminated, THE Diagnostic_Provider SHALL report the unterminated comment
4. WHEN a workspace block is missing, THE Diagnostic_Provider SHALL report that a workspace declaration is required
5. WHEN multiple workspace blocks are declared, THE Diagnostic_Provider SHALL report duplicate workspace declarations
6. WHEN a model block is missing within workspace, THE Diagnostic_Provider SHALL report that a model block is required
7. WHEN multiple model blocks are declared, THE Diagnostic_Provider SHALL report duplicate model declarations
8. WHEN a views block is missing within workspace, THE Diagnostic_Provider SHALL report a warning that views are recommended

### Requirement 2: Element Declaration Diagnostics

**User Story:** As a developer, I want diagnostics for invalid element declarations, so that I can ensure all model elements are correctly defined.

#### Acceptance Criteria

1. WHEN an element declaration is missing a name, THE Diagnostic_Provider SHALL report that element name is required
2. WHEN an element identifier contains invalid characters, THE Diagnostic_Provider SHALL report invalid identifier syntax
3. WHEN an element identifier is duplicated, THE Diagnostic_Provider SHALL report the duplicate identifier with line reference
4. WHEN a container is declared outside a softwareSystem, THE Diagnostic_Provider SHALL report invalid container placement
5. WHEN a component is declared outside a container, THE Diagnostic_Provider SHALL report invalid component placement
6. WHEN an element declaration has mismatched quotes, THE Diagnostic_Provider SHALL report the quote mismatch
7. WHEN an element type keyword is misspelled, THE Diagnostic_Provider SHALL suggest the correct spelling
8. WHEN an element declaration is missing the opening brace, THE Diagnostic_Provider SHALL report missing brace

### Requirement 3: Relationship Declaration Diagnostics

**User Story:** As a developer, I want diagnostics for invalid relationship declarations, so that I can ensure all relationships are correctly defined.

#### Acceptance Criteria

1. WHEN a relationship references an undefined source identifier, THE Diagnostic_Provider SHALL report undefined source
2. WHEN a relationship references an undefined target identifier, THE Diagnostic_Provider SHALL report undefined target
3. WHEN a relationship is declared outside the model block, THE Diagnostic_Provider SHALL report invalid relationship placement
4. WHEN a relationship uses invalid arrow syntax, THE Diagnostic_Provider SHALL report invalid relationship syntax
5. WHEN a relationship is missing the target identifier, THE Diagnostic_Provider SHALL report incomplete relationship
6. WHEN a relationship has mismatched quotes in description, THE Diagnostic_Provider SHALL report quote mismatch
7. WHEN a relationship creates a self-reference, THE Diagnostic_Provider SHALL report a warning about self-referencing

### Requirement 4: View Declaration Diagnostics

**User Story:** As a developer, I want diagnostics for invalid view declarations, so that I can ensure all views are correctly configured.

#### Acceptance Criteria

1. WHEN a view references an undefined scope identifier, THE Diagnostic_Provider SHALL report undefined scope
2. WHEN a systemContext view is missing a scope, THE Diagnostic_Provider SHALL report that scope is required
3. WHEN a container view is missing a scope, THE Diagnostic_Provider SHALL report that scope is required
4. WHEN a component view is missing a scope, THE Diagnostic_Provider SHALL report that scope is required
5. WHEN a view is declared outside the views block, THE Diagnostic_Provider SHALL report invalid view placement
6. WHEN a view key is duplicated, THE Diagnostic_Provider SHALL report duplicate view key
7. WHEN an autoLayout directive has an invalid direction, THE Diagnostic_Provider SHALL report invalid direction and suggest valid options
8. WHEN a view type keyword is misspelled, THE Diagnostic_Provider SHALL suggest the correct spelling

### Requirement 5: Context-Aware Diagnostics

**User Story:** As a developer, I want context-aware diagnostics that understand block scope, so that I receive accurate error messages based on where constructs appear.

#### Acceptance Criteria

1. WHEN an element is declared in the views block, THE Diagnostic_Provider SHALL report that elements belong in the model block
2. WHEN a view is declared in the model block, THE Diagnostic_Provider SHALL report that views belong in the views block
3. WHEN a relationship is declared in the views block, THE Diagnostic_Provider SHALL report that relationships belong in the model block
4. WHEN a style rule is declared outside the styles block, THE Diagnostic_Provider SHALL report invalid style placement
5. WHEN an include directive is used outside a view block, THE Diagnostic_Provider SHALL report invalid include placement
6. WHEN nested blocks exceed valid nesting depth, THE Diagnostic_Provider SHALL report excessive nesting
7. FOR ALL block-scoped constructs, diagnostics SHALL reference the correct block context in error messages

### Requirement 6: Identifier Reference Validation

**User Story:** As a developer, I want diagnostics that validate identifier references, so that I can catch typos and undefined references early.

#### Acceptance Criteria

1. WHEN a relationship references an identifier, THE Diagnostic_Provider SHALL verify the identifier exists in the model
2. WHEN a view scope references an identifier, THE Diagnostic_Provider SHALL verify the identifier exists and has the correct type
3. WHEN a container view references a non-container identifier, THE Diagnostic_Provider SHALL report type mismatch
4. WHEN a component view references a non-container identifier, THE Diagnostic_Provider SHALL report type mismatch
5. WHEN an identifier is referenced before declaration, THE Diagnostic_Provider SHALL report forward reference
6. WHEN an identifier contains a typo similar to an existing identifier, THE Diagnostic_Provider SHALL suggest the correct identifier
7. FOR ALL identifier references, diagnostics SHALL provide quick fixes to navigate to the declaration

### Requirement 7: Keyword and Syntax Validation

**User Story:** As a developer, I want diagnostics for keyword and syntax errors, so that I can learn the correct DSL syntax.

#### Acceptance Criteria

1. WHEN a reserved keyword is used as an identifier, THE Diagnostic_Provider SHALL report reserved keyword usage
2. WHEN an unknown keyword is encountered, THE Diagnostic_Provider SHALL report unrecognized keyword
3. WHEN required syntax elements are missing, THE Diagnostic_Provider SHALL report what is missing
4. WHEN optional syntax elements are malformed, THE Diagnostic_Provider SHALL report the malformation
5. WHEN deprecated syntax is used, THE Diagnostic_Provider SHALL report deprecation warning
6. WHEN case-sensitive keywords are misspelled, THE Diagnostic_Provider SHALL suggest correct casing
7. FOR ALL syntax errors, diagnostics SHALL include examples of correct syntax

### Requirement 8: Comprehensive Error Coverage

**User Story:** As a developer, I want comprehensive error detection, so that all parser failures produce helpful diagnostics.

#### Acceptance Criteria

1. FOR ALL grammar rules in the Structurizr DSL, THE Diagnostic_Provider SHALL detect violations
2. WHEN the parser fails to parse a construct, THE Diagnostic_Provider SHALL report why parsing failed
3. WHEN multiple errors exist, THE Diagnostic_Provider SHALL report all errors, not just the first
4. WHEN an error has multiple possible causes, THE Diagnostic_Provider SHALL suggest all possibilities
5. FOR ALL diagnostics, the error message SHALL be clear, specific, and actionable
6. FOR ALL diagnostics, the error range SHALL precisely highlight the problematic text
7. THE Diagnostic_Provider SHALL prioritize errors over warnings over information messages

### Requirement 9: Diagnostic Test Suite

**User Story:** As a developer, I want a comprehensive test suite for diagnostics, so that I can verify all error cases are detected.

#### Acceptance Criteria

1. THE Test_Suite SHALL include tests for each structural syntax error case
2. THE Test_Suite SHALL include tests for each element declaration error case
3. THE Test_Suite SHALL include tests for each relationship declaration error case
4. THE Test_Suite SHALL include tests for each view declaration error case
5. THE Test_Suite SHALL include tests for context-aware diagnostic scenarios
6. THE Test_Suite SHALL include tests for identifier reference validation
7. THE Test_Suite SHALL include tests for keyword and syntax validation
8. FOR ALL error cases, tests SHALL verify the diagnostic message, severity, and range
9. THE Test_Suite SHALL use property-based testing to generate invalid DSL variations
10. THE Test_Suite SHALL verify that valid DSL produces no diagnostics

### Requirement 10: Grammar-Based Error Generation

**User Story:** As a developer, I want a systematic approach to identifying error cases, so that no error conditions are missed.

#### Acceptance Criteria

1. THE Diagnostic_Provider SHALL be designed based on the complete Structurizr DSL grammar
2. FOR ALL grammar production rules, error cases SHALL be identified and tested
3. WHEN a grammar rule has required elements, THE Diagnostic_Provider SHALL detect missing elements
4. WHEN a grammar rule has optional elements, THE Diagnostic_Provider SHALL validate present elements
5. WHEN a grammar rule has alternatives, THE Diagnostic_Provider SHALL detect invalid alternatives
6. WHEN a grammar rule has ordering constraints, THE Diagnostic_Provider SHALL detect ordering violations
7. THE Test_Suite SHALL document which grammar rules each diagnostic validates

### Requirement 11: Parser Round-Trip Validation

**User Story:** As a developer, I want diagnostics that ensure parser correctness, so that parsed structures accurately represent the DSL.

#### Acceptance Criteria

1. WHEN an element is parsed, THE Diagnostic_Provider SHALL verify all fields are extracted correctly
2. WHEN a relationship is parsed, THE Diagnostic_Provider SHALL verify source and target are valid
3. WHEN a view is parsed, THE Diagnostic_Provider SHALL verify scope and key are valid
4. WHEN nested structures are parsed, THE Diagnostic_Provider SHALL verify parent-child relationships
5. WHEN the parser produces an empty identifier, THE Diagnostic_Provider SHALL report the parsing failure
6. WHEN the parser skips a construct, THE Diagnostic_Provider SHALL report why it was skipped
7. FOR ALL parsed constructs, diagnostics SHALL verify the line number is correct

### Requirement 12: Chaos Testing Support

**User Story:** As a developer, I want chaos testing capabilities, so that I can discover edge cases through random mutations.

#### Acceptance Criteria

1. THE Test_Suite SHALL support generating random DSL mutations from valid files
2. WHEN a mutation causes parser failure, THE Test_Suite SHALL verify a diagnostic is produced
3. WHEN a mutation produces invalid DSL, THE Test_Suite SHALL verify appropriate diagnostics
4. THE Test_Suite SHALL track which mutations produce diagnostics and which are silently accepted
5. THE Test_Suite SHALL use property-based testing to generate systematic mutations
6. FOR ALL mutations that should be invalid, THE Diagnostic_Provider SHALL produce a diagnostic
7. THE Test_Suite SHALL report coverage of error cases discovered through chaos testing

