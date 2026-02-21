# Design Document: Comprehensive Diagnostic Tests

## Overview

This design introduces comprehensive diagnostic tests for the Structurizr DSL parser in the VS Code extension. The current diagnostics system (src/diagnostics.ts) provides basic error detection for brace balance, unclosed strings, and duplicate identifiers. However, many error conditions that can cause the parser to fail or produce incorrect results lack diagnostic feedback.

The goal is to systematically identify all possible error cases from the Structurizr DSL grammar and ensure each error condition produces a helpful diagnostic message. This will improve the developer experience by providing immediate, actionable feedback when DSL syntax is incorrect.

The design follows a grammar-driven approach:
1. Analyze the Structurizr DSL grammar to identify all error cases
2. Categorize errors by type (structural, semantic, contextual)
3. Design diagnostic detection for each error category
4. Create comprehensive tests using both unit and property-based testing
5. Implement chaos testing to discover edge cases through random mutations

This approach ensures complete coverage of error conditions and validates that the diagnostic system catches all invalid DSL constructs.

## Architecture

### Diagnostic System Architecture

The diagnostic system follows a multi-pass analysis architecture:

```
DSL Text Input
     ↓
[Lexical Analysis Pass]
  - Brace balance
  - String termination
  - Comment termination
     ↓
[Structural Analysis Pass]
  - Workspace/model/views blocks
  - Element declarations
  - Relationship declarations
  - View declarations
     ↓
[Semantic Analysis Pass]
  - Identifier references
  - Type checking
  - Scope validation
     ↓
[Context Analysis Pass]
  - Block context validation
  - Placement rules
  - Nesting depth
     ↓
Diagnostic Collection
```


### Test Architecture

The test suite will be organized into logical categories that mirror the diagnostic system:

```
Diagnostic Test Suite
├── Lexical Error Tests
│   ├── Brace balance tests
│   ├── String termination tests
│   └── Comment termination tests
├── Structural Error Tests
│   ├── Workspace/model/views block tests
│   ├── Element declaration tests
│   ├── Relationship declaration tests
│   └── View declaration tests
├── Semantic Error Tests
│   ├── Identifier reference tests
│   ├── Type mismatch tests
│   └── Duplicate identifier tests
├── Context Error Tests
│   ├── Block placement tests
│   ├── Nesting depth tests
│   └── Context-aware keyword tests
├── Property-Based Tests
│   ├── Mutation testing
│   ├── Invariant validation
│   └── Coverage verification
└── Integration Tests
    ├── Multiple error detection
    ├── Valid DSL verification
    └── Real-world scenario tests
```

### Grammar-Based Error Identification

The Structurizr DSL grammar defines the following major constructs:

**Top-level constructs:**
- `workspace` block (required, singular)
- `model` block (required within workspace, singular)
- `views` block (optional within workspace, singular)
- `styles` block (optional within workspace)

**Element types:**
- `person` (model scope)
- `softwareSystem` (model scope)
- `container` (must be within softwareSystem)
- `component` (must be within container)
- `deploymentNode` (model scope)
- `infrastructureNode` (model scope)
- `group` (model scope)

**Relationship syntax:**
- `identifier -> identifier [description] [technology]` (model scope only)

**View types:**
- `systemLandscape` (views scope, no required scope)
- `systemContext` (views scope, requires softwareSystem scope)
- `container` (views scope, requires softwareSystem scope)
- `component` (views scope, requires container scope)
- `deployment`, `dynamic`, `filtered`, `custom` (views scope)

**View directives:**
- `include *` or `include identifier`
- `autoLayout [tb|bt|lr|rl]`

For each grammar rule, error cases are identified by:
1. Missing required elements
2. Invalid element placement
3. Type mismatches
4. Duplicate declarations
5. Invalid syntax variations


## Components and Interfaces

### Enhanced Diagnostic Provider

The diagnostic provider will be enhanced with additional validation functions:

**Current functions (existing in diagnostics.ts):**
- `checkBraceBalance()`: Validates brace matching
- `checkUnclosedStrings()`: Validates string termination
- `checkDuplicateIdentifiers()`: Validates identifier uniqueness

**New functions to be added:**
- `checkWorkspaceStructure()`: Validates workspace/model/views block structure
- `checkElementPlacement()`: Validates element declarations are in correct contexts
- `checkRelationshipReferences()`: Validates relationship source/target identifiers exist
- `checkViewScopes()`: Validates view scope identifiers exist and have correct types
- `checkContextAwarePlacement()`: Validates constructs are in appropriate block contexts
- `checkKeywordSpelling()`: Suggests corrections for misspelled keywords
- `checkNestingDepth()`: Validates nesting doesn't exceed reasonable limits
- `checkReservedKeywords()`: Validates identifiers don't use reserved keywords

### Diagnostic Data Structures

The existing VSCode Diagnostic structure will be used:

```typescript
interface vscode.Diagnostic {
    range: vscode.Range;           // Location of the error
    message: string;                // Error message
    severity: vscode.DiagnosticSeverity; // Error, Warning, Information
    source?: string;                // "structurizr"
    code?: string | number;         // Error code for categorization
    relatedInformation?: vscode.DiagnosticRelatedInformation[];
}
```

Diagnostic severity levels:
- **Error**: Syntax errors, missing required elements, invalid references
- **Warning**: Deprecated syntax, self-references, missing optional blocks
- **Information**: Suggestions, best practices

### Test Helper Functions

New test helper functions will be created:

```typescript
// Create a document with invalid DSL and verify diagnostics
async function expectDiagnostic(
    content: string,
    expectedMessage: string | RegExp,
    expectedSeverity: vscode.DiagnosticSeverity
): Promise<void>

// Verify that valid DSL produces no diagnostics
async function expectNoDiagnostics(content: string): Promise<void>

// Verify diagnostic range matches expected location
async function expectDiagnosticAt(
    content: string,
    line: number,
    startChar: number,
    endChar: number
): Promise<void>

// Generate random DSL mutations for chaos testing
function mutateDsl(validDsl: string, mutationType: MutationType): string

// Verify multiple diagnostics are produced
async function expectMultipleDiagnostics(
    content: string,
    expectedCount: number
): Promise<void>
```

### Mutation Types for Chaos Testing

Chaos testing will use systematic mutations:

```typescript
enum MutationType {
    RemoveBrace,           // Remove opening or closing brace
    UnclosedString,        // Remove closing quote
    DuplicateIdentifier,   // Duplicate an identifier
    InvalidIdentifier,     // Use invalid characters in identifier
    MissingName,           // Remove element name
    WrongContext,          // Move construct to wrong block
    UndefinedReference,    // Reference non-existent identifier
    MisspellKeyword,       // Misspell a keyword
    WrongElementType,      // Use wrong element type for context
    ExcessiveNesting,      // Create deeply nested structure
    MissingRequiredBlock,  // Remove required block
    DuplicateBlock,        // Duplicate a block
}
```


## Data Models

The design works with existing data models from the parser and diagnostics system:

### Diagnostic Context

A new context structure will track parsing state for diagnostic generation:

```typescript
interface DiagnosticContext {
    // Identifier tracking
    declaredIdentifiers: Map<string, {
        line: number;
        type: ElementType;
    }>;
    
    // Block context tracking
    currentBlock: BlockContext;
    blockStack: BlockContext[];
    nestingDepth: number;
    
    // View key tracking
    viewKeys: Set<string>;
    
    // Workspace structure tracking
    hasWorkspace: boolean;
    hasModel: boolean;
    hasViews: boolean;
    workspaceCount: number;
    modelCount: number;
}
```

### Error Categories

Errors will be categorized for systematic testing:

```typescript
enum ErrorCategory {
    Lexical,      // Braces, strings, comments
    Structural,   // Blocks, declarations
    Semantic,     // References, types
    Contextual,   // Placement, scope
}

interface ErrorCase {
    category: ErrorCategory;
    description: string;
    invalidDsl: string;
    expectedMessage: string | RegExp;
    expectedSeverity: vscode.DiagnosticSeverity;
    grammarRule: string;
}
```

### Test Data Organization

Test data will be organized by error category:

```typescript
const LEXICAL_ERRORS: ErrorCase[] = [
    {
        category: ErrorCategory.Lexical,
        description: "Unclosed opening brace",
        invalidDsl: 'workspace "Test" { model {',
        expectedMessage: /unclosed brace/i,
        expectedSeverity: vscode.DiagnosticSeverity.Error,
        grammarRule: "block-structure"
    },
    // ... more lexical errors
];

const STRUCTURAL_ERRORS: ErrorCase[] = [
    {
        category: ErrorCategory.Structural,
        description: "Missing workspace block",
        invalidDsl: 'model { u = person "User" }',
        expectedMessage: /workspace.*required/i,
        expectedSeverity: vscode.DiagnosticSeverity.Error,
        grammarRule: "workspace-declaration"
    },
    // ... more structural errors
];

// Similar for SEMANTIC_ERRORS and CONTEXTUAL_ERRORS
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Unbalanced braces detection

*For any* DSL text with unbalanced braces (more opening than closing, or more closing than opening), the diagnostic provider SHALL produce an error diagnostic indicating the brace imbalance.

**Validates: Requirements 1.1**

### Property 2: Unterminated string detection

*For any* DSL text containing a string literal without a closing quote, the diagnostic provider SHALL produce an error diagnostic indicating the unterminated string.

**Validates: Requirements 1.2**

### Property 3: Unterminated comment detection

*For any* DSL text containing a block comment without a closing `*/`, the diagnostic provider SHALL produce an error diagnostic indicating the unterminated comment.

**Validates: Requirements 1.3**

### Property 4: Missing element name detection

*For any* element declaration without a name string, the diagnostic provider SHALL produce an error diagnostic indicating that the element name is required.

**Validates: Requirements 2.1**

### Property 5: Invalid identifier character detection

*For any* identifier containing characters outside the valid set (alphanumeric and underscore), the diagnostic provider SHALL produce an error diagnostic indicating invalid identifier syntax.

**Validates: Requirements 2.2**

### Property 6: Duplicate identifier detection

*For any* DSL text containing two or more elements with the same identifier, the diagnostic provider SHALL produce a warning diagnostic for each duplicate, referencing the line of the first declaration.

**Validates: Requirements 2.3**

### Property 7: Container placement validation

*For any* container element declared outside a softwareSystem block, the diagnostic provider SHALL produce an error diagnostic indicating invalid container placement.

**Validates: Requirements 2.4**

### Property 8: Component placement validation

*For any* component element declared outside a container block, the diagnostic provider SHALL produce an error diagnostic indicating invalid component placement.

**Validates: Requirements 2.5**

### Property 9: Quote mismatch detection

*For any* element or relationship declaration with mismatched quotes (opening quote without closing, or vice versa), the diagnostic provider SHALL produce an error diagnostic indicating the quote mismatch.

**Validates: Requirements 2.6, 3.6**

### Property 10: Keyword spelling suggestions

*For any* misspelled element type, view type, or other keyword, the diagnostic provider SHALL produce an error diagnostic suggesting the correct spelling.

**Validates: Requirements 2.7, 4.8, 7.6**

### Property 11: Missing brace detection

*For any* element declaration that should have a block but is missing the opening brace, the diagnostic provider SHALL produce an error diagnostic indicating the missing brace.

**Validates: Requirements 2.8**

### Property 12: Undefined relationship source detection

*For any* relationship declaration with a source identifier that doesn't exist in the model, the diagnostic provider SHALL produce an error diagnostic indicating the undefined source.

**Validates: Requirements 3.1**

### Property 13: Undefined relationship target detection

*For any* relationship declaration with a target identifier that doesn't exist in the model, the diagnostic provider SHALL produce an error diagnostic indicating the undefined target.

**Validates: Requirements 3.2**


### Property 14: Context-aware placement validation

*For any* construct (element, relationship, view, style, include directive) declared in an inappropriate block context, the diagnostic provider SHALL produce an error diagnostic indicating the correct block context for that construct.

**Validates: Requirements 3.3, 4.5, 5.1, 5.2, 5.3, 5.4, 5.5**

### Property 15: Invalid relationship syntax detection

*For any* relationship declaration with invalid arrow syntax (missing arrow, wrong arrow direction, malformed arrow), the diagnostic provider SHALL produce an error diagnostic indicating invalid relationship syntax.

**Validates: Requirements 3.4**

### Property 16: Incomplete relationship detection

*For any* relationship declaration missing the target identifier, the diagnostic provider SHALL produce an error diagnostic indicating the incomplete relationship.

**Validates: Requirements 3.5**

### Property 17: Self-reference warning

*For any* relationship where the source and target identifiers are the same, the diagnostic provider SHALL produce a warning diagnostic about self-referencing.

**Validates: Requirements 3.7**

### Property 18: Undefined view scope detection

*For any* view declaration with a scope identifier that doesn't exist in the model, the diagnostic provider SHALL produce an error diagnostic indicating the undefined scope.

**Validates: Requirements 4.1**

### Property 19: Duplicate view key detection

*For any* DSL text containing two or more views with the same key, the diagnostic provider SHALL produce a warning diagnostic for each duplicate.

**Validates: Requirements 4.6**

### Property 20: Invalid autoLayout direction detection

*For any* autoLayout directive with a direction value other than tb, bt, lr, or rl, the diagnostic provider SHALL produce an error diagnostic indicating the invalid direction and suggesting valid options.

**Validates: Requirements 4.7**

### Property 21: View scope type validation

*For any* view declaration with a scope identifier that exists but has the wrong type (e.g., container view with a person scope), the diagnostic provider SHALL produce an error diagnostic indicating the type mismatch.

**Validates: Requirements 6.2**

### Property 22: Forward reference detection

*For any* identifier reference that appears before its declaration in the DSL text, the diagnostic provider SHALL produce an error diagnostic indicating the forward reference.

**Validates: Requirements 6.5**

### Property 23: Reserved keyword detection

*For any* identifier that uses a reserved keyword (workspace, model, views, styles, person, softwareSystem, container, component, etc.), the diagnostic provider SHALL produce an error diagnostic indicating reserved keyword usage.

**Validates: Requirements 7.1**

### Property 24: Unknown keyword detection

*For any* keyword that is not recognized as part of the Structurizr DSL grammar, the diagnostic provider SHALL produce an error diagnostic indicating the unrecognized keyword.

**Validates: Requirements 7.2**

### Property 25: Deprecated syntax warning

*For any* deprecated syntax construct (e.g., old keyword spellings, deprecated directives), the diagnostic provider SHALL produce a warning diagnostic indicating the deprecation.

**Validates: Requirements 7.5**

### Property 26: Excessive nesting detection

*For any* nested block structure exceeding a reasonable depth limit (e.g., more than 5 levels), the diagnostic provider SHALL produce a warning diagnostic indicating excessive nesting.

**Validates: Requirements 5.6**


### Property 27: Multiple error reporting

*For any* DSL text containing multiple distinct errors, the diagnostic provider SHALL produce diagnostics for all errors, not just the first one encountered.

**Validates: Requirements 8.3**

### Property 28: Diagnostic range accuracy

*For any* diagnostic produced, the range SHALL precisely highlight the problematic text (the specific token, identifier, or construct causing the error).

**Validates: Requirements 8.6**

### Property 29: Diagnostic severity prioritization

*For any* set of diagnostics produced, error-level diagnostics SHALL be distinguished from warning-level and information-level diagnostics through the severity field.

**Validates: Requirements 8.7**

### Property 30: Valid DSL produces no diagnostics

*For any* valid DSL text that conforms to the Structurizr grammar, the diagnostic provider SHALL produce zero diagnostics.

**Validates: Requirements 9.10**

### Property 31: Ordering constraint validation

*For any* DSL text where constructs appear in an invalid order (e.g., views block before model block), the diagnostic provider SHALL produce an error diagnostic indicating the ordering violation.

**Validates: Requirements 10.6**

### Property 32: Empty identifier detection

*For any* element declaration that results in an empty identifier (neither explicit identifier nor name provided), the diagnostic provider SHALL produce an error diagnostic indicating the parsing failure.

**Validates: Requirements 11.5**

### Property 33: Mutation diagnostic coverage

*For any* systematic mutation of valid DSL that produces invalid syntax, the diagnostic provider SHALL produce at least one diagnostic indicating the error.

**Validates: Requirements 12.2**


## Error Handling

The diagnostic system is designed to be robust and non-blocking:

### Diagnostic Generation Strategy

1. **Non-blocking**: Diagnostic generation never throws exceptions or blocks the editor
2. **Incremental**: Diagnostics are updated on document change, not on save
3. **Complete**: All errors are reported, not just the first one
4. **Precise**: Error ranges highlight the exact problematic text
5. **Helpful**: Error messages include suggestions and examples where applicable

### Error Recovery

When the diagnostic provider encounters issues:

**Malformed input**: Continue analyzing subsequent lines rather than stopping at the first error

**Ambiguous syntax**: Report the ambiguity and suggest possible interpretations

**Missing context**: Use heuristics to infer context (e.g., if model block is missing, assume elements are intended for model)

**Parser failures**: If the parser can't extract structure, fall back to regex-based pattern matching for diagnostic generation

### Diagnostic Prioritization

When multiple diagnostics apply to the same location:

1. **Errors** take precedence over warnings and information
2. **Structural errors** (missing blocks, invalid syntax) take precedence over semantic errors (undefined references)
3. **Earlier errors** in the document are reported first

### Performance Considerations

To ensure diagnostics don't slow down the editor:

1. **Debouncing**: Diagnostic updates are debounced to avoid excessive computation during rapid typing
2. **Incremental analysis**: Only re-analyze changed portions of the document when possible
3. **Timeout limits**: Diagnostic generation has a time limit (e.g., 500ms) to prevent blocking
4. **Caching**: Cache parsed structure and identifier maps to avoid redundant work

### Edge Cases

The diagnostic system handles these edge cases:

**Empty files**: No diagnostics (empty file is valid, just not useful)

**Comment-only files**: No diagnostics (comments are valid)

**Partial constructs during typing**: Avoid spurious errors while user is mid-typing (e.g., don't report "missing closing brace" until user has finished the line)

**Very large files**: Limit analysis to first N lines (e.g., 10,000) to prevent performance issues

**Binary or non-text content**: Detect and skip diagnostic analysis


## Testing Strategy

### Dual Testing Approach

The test suite employs both unit testing and property-based testing for comprehensive coverage:

**Unit Tests**:
- Test specific error cases with concrete examples
- Test each diagnostic function in isolation
- Test edge cases (empty files, comment-only files, partial constructs)
- Test integration scenarios (multiple errors, complex nesting)
- Focus on readable, maintainable test cases that document expected behavior
- Verify diagnostic message content, severity, and range

**Property-Based Tests**:
- Validate universal properties across randomly generated inputs
- Test invariants (all invalid DSL produces diagnostics, all valid DSL produces none)
- Test mutation coverage (systematic mutations of valid DSL produce diagnostics)
- Test diagnostic accuracy (ranges match error locations)
- Provide comprehensive input coverage through randomization
- Discover edge cases not anticipated in unit tests

### Property-Based Testing Configuration

**Library**: The test suite will use **fast-check** for property-based testing in TypeScript.

**Configuration**:
- Each property test will run a minimum of 100 iterations
- Each test will be tagged with a comment referencing the design property
- Tag format: `// Feature: comprehensive-diagnostic-tests, Property N: [property description]`

**Example property test structure**:

```typescript
// Feature: comprehensive-diagnostic-tests, Property 1: Unbalanced braces detection
test('property: unbalanced braces produce diagnostics', async () => {
  await fc.assert(
    fc.asyncProperty(
      validDslArbitrary(),
      fc.constantFrom('remove-open-brace', 'remove-close-brace', 'add-extra-open', 'add-extra-close'),
      async (validDsl, mutationType) => {
        const invalidDsl = mutateBraces(validDsl, mutationType);
        const doc = await openDslContent(invalidDsl);
        
        // Trigger diagnostic update
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const diagnostics = vscode.languages.getDiagnostics(doc.uri);
        const braceErrors = diagnostics.filter(d => 
          d.message.match(/brace/i) && 
          d.severity === vscode.DiagnosticSeverity.Error
        );
        
        assert.ok(braceErrors.length > 0, 
          `Expected brace error for mutation ${mutationType}`);
      }
    ),
    { numRuns: 100 }
  );
});
```

### Test Organization

Tests will be organized into suites matching the architecture:

**1. Lexical Error Tests**
- Brace balance tests (unmatched opening, unmatched closing, multiple unmatched)
- String termination tests (unclosed strings, escaped quotes)
- Comment termination tests (unclosed block comments)

**2. Structural Error Tests**
- Workspace structure tests (missing workspace, duplicate workspace, missing model, duplicate model)
- Element declaration tests (missing name, invalid identifier, duplicate identifier, missing brace)
- Relationship declaration tests (invalid syntax, missing target, incomplete declaration)
- View declaration tests (missing scope, duplicate key, invalid directive)

**3. Semantic Error Tests**
- Identifier reference tests (undefined source, undefined target, undefined scope)
- Type mismatch tests (wrong scope type for view, wrong element type for context)
- Duplicate detection tests (duplicate identifiers, duplicate view keys)

**4. Context Error Tests**
- Block placement tests (element in views, view in model, relationship in views)
- Nesting validation tests (container outside system, component outside container, excessive nesting)
- Context-aware keyword tests (container as element vs view, component as element vs view)

**5. Property-Based Tests**
- Mutation testing (systematic mutations of valid DSL)
- Invariant validation (valid DSL produces no diagnostics)
- Coverage verification (all error types are detected)
- Range accuracy (diagnostic ranges match error locations)

**6. Integration Tests**
- Multiple error detection (DSL with multiple distinct errors)
- Real-world scenario tests (using example.strz, system-context.strz)
- Performance tests (large files, rapid typing simulation)


### Test Data Strategy

Tests will use multiple approaches for input data:

**1. Inline DSL strings**: For unit tests of specific error cases
- Small, focused DSL snippets
- Easy to read and understand in test code
- Quick to modify for specific scenarios
- Example: `'workspace "Test" { model { u = person } }'` (missing name)

**2. Mutation functions**: For property-based tests
- Start with valid DSL
- Apply systematic mutations to introduce errors
- Verify diagnostics are produced
- Example: `mutateDsl(validDsl, MutationType.RemoveBrace)`

**3. Error case catalog**: Organized collection of known error cases
- Categorized by error type
- Includes expected diagnostic message and severity
- Used for systematic coverage testing
- Example: `STRUCTURAL_ERRORS` array with ErrorCase objects

**4. Real-world samples**: Existing test files
- example.strz (complex, valid)
- system-context.strz (simple, valid)
- Used to verify valid DSL produces no diagnostics
- Used as base for mutation testing

### Mutation Strategy

Mutations will be systematic and cover all error categories:

**Lexical mutations**:
- Remove random opening brace
- Remove random closing brace
- Add extra opening brace
- Add extra closing brace
- Remove closing quote from random string
- Remove `*/` from random block comment

**Structural mutations**:
- Remove workspace block
- Duplicate workspace block
- Remove model block
- Duplicate model block
- Remove element name
- Remove relationship target
- Remove view scope (for views that require it)

**Semantic mutations**:
- Change identifier to undefined value
- Change relationship source to undefined identifier
- Change relationship target to undefined identifier
- Change view scope to undefined identifier
- Change view scope to wrong type

**Contextual mutations**:
- Move element from model to views
- Move view from views to model
- Move relationship from model to views
- Move container outside softwareSystem
- Move component outside container

### Test Execution Strategy

Tests will be executed in the VS Code extension test environment:

1. **Setup**: Open or create document with test DSL
2. **Trigger**: Wait for diagnostic update (debounced)
3. **Verify**: Check diagnostics collection for expected diagnostics
4. **Cleanup**: Close document and clear diagnostics

**Timing considerations**:
- Wait for diagnostic debounce (typically 100-300ms)
- Use async/await for all document operations
- Clean up between tests to avoid interference

**Assertion patterns**:

```typescript
// Verify diagnostic exists
const diagnostics = vscode.languages.getDiagnostics(doc.uri);
assert.ok(diagnostics.length > 0, "Expected diagnostics");

// Verify specific message
const errorDiag = diagnostics.find(d => d.message.match(/expected pattern/i));
assert.ok(errorDiag, "Expected specific error message");

// Verify severity
assert.strictEqual(errorDiag.severity, vscode.DiagnosticSeverity.Error);

// Verify range
assert.strictEqual(errorDiag.range.start.line, expectedLine);
assert.strictEqual(errorDiag.range.start.character, expectedStartChar);
```

### Success Criteria

The test suite will be considered successful when:

1. **Coverage**: All 33 correctness properties have passing tests
2. **Unit tests**: All specific error cases have passing unit tests
3. **Property tests**: All property-based tests pass with 100+ iterations
4. **Integration**: Multiple error detection works correctly
5. **Valid DSL**: All existing valid test files produce zero diagnostics
6. **Mutation coverage**: All mutation types produce appropriate diagnostics
7. **Performance**: Test suite completes in under 60 seconds
8. **Code coverage**: Diagnostic provider code coverage exceeds 90%

### Test Maintenance

To keep tests maintainable:

1. **Organize by category**: Group related tests in suites
2. **Use descriptive names**: Test names clearly indicate what is being tested
3. **Document expected behavior**: Comments explain why each test exists
4. **Reuse helpers**: Common patterns extracted to helper functions
5. **Keep tests focused**: Each test validates one specific behavior
6. **Update with grammar changes**: When DSL grammar changes, update tests accordingly
