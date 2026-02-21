# Design Document: Comprehensive Parser Tests

## Overview

This design extends the existing Structurizr DSL parser test suite to provide systematic, comprehensive coverage of all parser rules. The current test suite validates parsing against complete example files but lacks granular testing of individual parser rules and progressive complexity validation.

The enhanced test suite will follow a bottom-up testing strategy:
1. Test each parser rule in isolation (individual element types, relationships, views)
2. Test nested structures (containers within systems, components within containers)
3. Test context-aware parsing (keywords with different meanings in different blocks)
4. Test progressive complexity (minimal → simple → nested → complex scenarios)
5. Test edge cases and error handling

This approach ensures that when a test fails, developers can immediately identify which specific parser rule is broken, rather than debugging a complex integration failure.

## Architecture

### Test Organization Structure

The test suite will be organized into logical suites that mirror the parser's functionality:

```
Parser Test Suite
├── Individual Parser Rules
│   ├── Element Parsing (person, softwareSystem, container, component, etc.)
│   ├── Relationship Parsing
│   ├── View Parsing (all view types)
│   └── Directive Parsing (autoLayout)
├── Nested Structure Tests
│   ├── Two-level nesting (container in system)
│   ├── Three-level nesting (component in container in system)
│   └── Group nesting
├── Context-Aware Parsing
│   ├── Model block context
│   ├── Views block context
│   └── Keyword disambiguation
├── Progressive Complexity
│   ├── Minimal (single element)
│   ├── Simple (multiple elements + relationships)
│   ├── Nested (two-level hierarchy)
│   └── Complex (three-level + views + directives)
└── Edge Cases
    ├── Missing identifiers
    ├── Malformed input
    ├── Empty workspace
    └── Multi-line declarations
```

### Testing Strategy

The design employs a dual testing approach:

1. **Unit Tests**: Test specific parser rules and scenarios
   - Individual element type parsing
   - Specific edge cases (missing identifiers, malformed input)
   - Context-aware keyword interpretation
   - Each test validates a single parser behavior

2. **Property-Based Tests**: Validate universal properties across all inputs
   - Round-trip properties (parse → inspect → verify structure)
   - Invariant properties (line numbers, identifier consistency)
   - Metamorphic properties (element counts, nesting relationships)

### Test Data Strategy

Tests will use two approaches for input data:

1. **Inline DSL strings**: For unit tests of individual rules
   - Small, focused DSL snippets
   - Easy to read and understand in test code
   - Quick to modify for specific scenarios

2. **Test sample files**: For progressive complexity tests
   - Reusable across multiple test cases
   - Represent realistic DSL structures
   - New files to be created: minimal.strz, simple.strz, nested.strz, complex.strz

## Components and Interfaces

### Test Suites

#### 1. Individual Element Parser Tests
Tests each element type in isolation with minimal DSL.

**Input**: Inline DSL strings with single element declarations
**Output**: Assertions on ParsedElement properties

Example test structure:

```typescript
test('parses person element', async () => {
  const content = 'workspace "Test" { model { u = person "User" "Description" } }';
  const doc = await openDslContent(content);
  const result = parseDocument(doc);
  
  assert.strictEqual(result.elements.length, 1);
  assert.strictEqual(result.elements[0].type, 'person');
  assert.strictEqual(result.elements[0].identifier, 'u');
  assert.strictEqual(result.elements[0].name, 'User');
  assert.strictEqual(result.elements[0].description, 'Description');
});
```

#### 2. Relationship Parser Tests
Tests relationship parsing with various configurations.

**Input**: Inline DSL with relationship declarations
**Output**: Assertions on ParsedRelationship properties

#### 3. View Parser Tests
Tests each view type with and without optional parameters.

**Input**: Inline DSL with view declarations
**Output**: Assertions on ParsedView properties

#### 4. Nested Structure Tests
Tests hierarchical element relationships.

**Input**: Inline DSL with nested element blocks
**Output**: Assertions on parent-child relationships and element counts at each level

#### 5. Context-Aware Parsing Tests
Tests that keywords are interpreted correctly based on block context.

**Input**: DSL with ambiguous keywords in different contexts
**Output**: Assertions that elements vs views are parsed correctly

#### 6. Progressive Complexity Tests
Tests parsing of increasingly complex DSL files.

**Input**: Test sample files (minimal.strz, simple.strz, nested.strz, complex.strz)
**Output**: Assertions on element counts, relationship counts, view counts, and structure

#### 7. Edge Case Tests
Tests parser behavior with unusual or malformed input.

**Input**: DSL with missing fields, malformed syntax, edge cases
**Output**: Assertions that parser handles gracefully without crashing

### Test Helper Functions

The existing helper functions will be reused:
- `openDslDocument(filePath)`: Opens a DSL file from disk
- `openDslContent(content)`: Creates an in-memory document from a string

### Test Sample Files

Four new test sample files will be created in the `test-samples/` directory:

1. **minimal.strz**: Single element, no relationships, no views
2. **simple.strz**: Multiple elements (2-3), basic relationships (1-2), one view
3. **nested.strz**: Two-level nesting (system with containers), relationships, views
4. **complex.strz**: Three-level nesting (system → container → component), multiple views, autoLayout directives, groups

## Data Models

The design works with the existing parser data models defined in `src/parser.ts`:

### ParsedElement

```typescript
interface ParsedElement {
    identifier: string;        // Element identifier (or name if no identifier)
    type: 'person' | 'softwareSystem' | 'container' | 'component' | 
          'deploymentNode' | 'infrastructureNode' | 'group';
    name: string;              // Element name
    description?: string;      // Optional description
    technology?: string;       // Optional technology (for containers/components)
    line: number;              // Line number where element is declared
    children: ParsedElement[]; // Nested child elements
}
```

### ParsedRelationship

```typescript
interface ParsedRelationship {
    source: string;      // Source element identifier
    target: string;      // Target element identifier
    description?: string; // Optional relationship description
    technology?: string;  // Optional technology
    line: number;        // Line number where relationship is declared
}
```

### ParsedView

```typescript
interface ParsedView {
    type: 'systemLandscape' | 'systemContext' | 'container' | 'component' | 
          'deployment' | 'dynamic' | 'filtered' | 'custom';
    scope?: string;      // Optional scope (element identifier)
    key?: string;        // Optional view key
    autoLayout?: 'tb' | 'bt' | 'lr' | 'rl'; // Optional layout direction
    line: number;        // Line number where view is declared
}
```

### ParsedWorkspace

```typescript
interface ParsedWorkspace {
    name?: string;                    // Workspace name
    elements: ParsedElement[];        // All parsed elements (flat list)
    relationships: ParsedRelationship[]; // All parsed relationships
    views: ParsedView[];              // All parsed views
}
```

### Test Data Structures

Tests will validate these structures by:
- Checking array lengths (element count, relationship count, view count)
- Verifying specific properties (identifier, type, name, description, technology)
- Validating line numbers match expected declaration lines
- Ensuring no empty identifiers exist
- Confirming parent-child relationships in nested structures


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all acceptance criteria, several properties can be consolidated to eliminate redundancy:

- Properties 1.2-1.8 (individual element parsing) all test the same behavior: extracting fields from element declarations. These can be combined into a single property that covers all element types.
- Properties 1.10-1.17 (individual view parsing) all test the same behavior: extracting fields from view declarations. These can be combined into a single property that covers all view types.
- Properties 2.1-2.2 (container in system, component in container) are specific cases of the more general property 2.6 (three-level nesting maintains relationships).
- Properties 3.1-3.4 (context-aware parsing for container/component) are specific cases of property 3.8 (all context-dependent keywords).
- Properties 7.1-7.3 (parsing element/view/relationship types) are subsumed by property 7.4 (preserving all attributes).

The consolidated properties below provide comprehensive coverage without redundancy.

### Property 1: Workspace name extraction

*For any* workspace declaration with a name, parsing SHALL extract the workspace name correctly and store it in the ParsedWorkspace.

**Validates: Requirements 1.1**

### Property 2: Element field extraction

*For any* element type (person, softwareSystem, container, component, deploymentNode, infrastructureNode, group) with valid declaration syntax, parsing SHALL extract the identifier, name, description (if present), technology (if applicable), and line number into a ParsedElement with the correct type.

**Validates: Requirements 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 7.1**

### Property 3: Relationship field extraction

*For any* relationship declaration, parsing SHALL extract the source identifier, target identifier, description (if present), technology (if present), and line number into a ParsedRelationship.

**Validates: Requirements 1.9, 7.3**

### Property 4: View field extraction

*For any* view type (systemLandscape, systemContext, container, component, deployment, dynamic, filtered, custom) with valid declaration syntax, parsing SHALL extract the type, scope (if applicable), key (if present), and line number into a ParsedView.

**Validates: Requirements 1.10, 1.11, 1.12, 1.13, 1.14, 1.15, 1.16, 1.17, 7.2**

### Property 5: AutoLayout direction extraction

*For any* autoLayout directive with an explicit direction (tb, bt, lr, rl), parsing SHALL extract the direction and associate it with the containing view.

**Validates: Requirements 1.18**

### Property 6: Missing identifier fallback

*For any* element declaration without an explicit identifier, parsing SHALL use the element name as the identifier.

**Validates: Requirements 1.20**

### Property 7: Two-level nesting association

*For any* container nested within a softwareSystem, or component nested within a container, parsing SHALL correctly associate the child element with its parent through the element hierarchy.

**Validates: Requirements 2.1, 2.2**

### Property 8: Multiple children parsing

*For any* parent element (softwareSystem, container, deploymentNode, group) containing multiple child elements, parsing SHALL extract all child elements at the correct nesting level.

**Validates: Requirements 2.3, 2.4, 2.5, 2.7**

### Property 9: Three-level nesting preservation

*For any* element hierarchy nested three levels deep (e.g., system → container → component), parsing SHALL maintain correct parent-child relationships throughout the hierarchy.

**Validates: Requirements 2.6**

### Property 10: Line number tracking in nested structures

*For any* nested element structure, parsing SHALL track the correct line number for each element regardless of nesting depth.

**Validates: Requirements 2.8**

### Property 11: Context-aware keyword interpretation

*For any* context-dependent keyword (container, component) appearing in different block contexts (model vs views), parsing SHALL interpret the keyword correctly based on its containing block, producing elements in model blocks and views in views blocks.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.8**

### Property 12: Model-scoped relationship parsing

*For any* relationship declaration appearing in a model block, parsing SHALL extract it as a ParsedRelationship; for any relationship-like syntax outside model blocks, parsing SHALL ignore it.

**Validates: Requirements 3.5**

### Property 13: No empty identifiers

*For any* parsed workspace, all elements SHALL have non-empty identifiers (either explicit or derived from name).

**Validates: Requirements 4.9**

### Property 14: Multi-line element parsing

*For any* element declaration spanning multiple lines, parsing SHALL correctly extract the element with all its attributes.

**Validates: Requirements 5.6**

### Property 15: Escaped quote handling

*For any* string literal containing escaped quotes, parsing SHALL handle the escapes correctly and extract the full string value.

**Validates: Requirements 5.7**

### Property 16: Graceful error handling

*For any* malformed input (unmatched braces, invalid syntax, missing required fields), parsing SHALL not throw unhandled exceptions and SHALL return a ParsedWorkspace structure (potentially empty or partial).

**Validates: Requirements 5.9**

### Property 17: Attribute preservation

*For any* element, relationship, or view declaration with specified attributes, parsing then inspecting the result SHALL preserve all specified attributes in the corresponding ParsedElement, ParsedRelationship, or ParsedView.

**Validates: Requirements 7.4**

### Property 18: Element count accuracy

*For any* complete workspace with N element declarations, M relationship declarations, and V view declarations, parsing SHALL produce a ParsedWorkspace with exactly N elements, M relationships, and V views.

**Validates: Requirements 7.5**

### Property 19: Line number accuracy

*For any* parsed element, relationship, or view, the line number field SHALL match the line number where that construct was declared in the source DSL.

**Validates: Requirements 7.6**

### Property 20: Optional field handling

*For any* element, relationship, or view with optional fields omitted, parsing SHALL set those fields to undefined (for description, technology, scope, key, autoLayout) rather than empty strings or null.

**Validates: Requirements 7.7**

## Error Handling

The parser currently has minimal error handling, focusing on graceful degradation rather than strict validation:

### Current Error Handling Behavior

1. **Malformed syntax**: The parser uses regex patterns to match DSL constructs. If a line doesn't match any pattern, it's silently skipped.

2. **Unmatched braces**: The context stack tracks block nesting. Unmatched closing braces pop from the stack; if the stack is empty, the pop is ignored.

3. **Missing required fields**: Elements without identifiers fall back to using the name. Elements without names may produce empty strings.

4. **Invalid references**: The parser doesn't validate that relationship source/target or view scope identifiers exist. It extracts whatever identifiers are present.

5. **Comments and whitespace**: Lines starting with `//` or `/*` are skipped. Empty lines are skipped.

### Error Handling Strategy for Tests

Tests will verify that the parser:
- Does not crash on malformed input
- Returns valid ParsedWorkspace structures (even if empty)
- Handles edge cases gracefully (missing fields, invalid syntax)
- Skips unparseable lines without affecting subsequent parsing

Tests will NOT expect:
- Validation errors or warnings
- Detailed error messages
- Recovery suggestions
- Semantic validation (e.g., checking if referenced identifiers exist)

The parser is designed as a permissive extractor, not a validator. Validation is handled by other components (diagnostics, language server features).

## Testing Strategy

### Dual Testing Approach

The test suite will employ both unit testing and property-based testing to achieve comprehensive coverage:

**Unit Tests**:
- Test specific parser rules in isolation (individual element types, view types, relationships)
- Test specific edge cases (missing identifiers, empty workspace, malformed input)
- Test context-aware parsing scenarios (container in model vs views)
- Test with concrete example files (minimal.strz, simple.strz, nested.strz, complex.strz)
- Focus on readable, maintainable test cases that document expected behavior

**Property-Based Tests**:
- Validate universal properties across randomly generated inputs
- Test invariants (line numbers, identifier consistency, no empty identifiers)
- Test metamorphic properties (element counts match declarations)
- Test round-trip properties (parse → inspect → verify structure)
- Provide comprehensive input coverage through randomization

### Property-Based Testing Configuration

**Library**: The test suite will use **fast-check** for property-based testing in TypeScript.

**Configuration**:
- Each property test will run a minimum of 100 iterations
- Each test will be tagged with a comment referencing the design property
- Tag format: `// Feature: comprehensive-parser-tests, Property N: [property description]`

**Example property test structure**:

```typescript
// Feature: comprehensive-parser-tests, Property 2: Element field extraction
test('property: element field extraction', async () => {
  await fc.assert(
    fc.asyncProperty(
      elementTypeArbitrary(),
      identifierArbitrary(),
      nameArbitrary(),
      async (type, identifier, name) => {
        const content = `workspace "Test" { model { ${identifier} = ${type} "${name}" } }`;
        const doc = await openDslContent(content);
        const result = parseDocument(doc);
        
        assert.strictEqual(result.elements.length, 1);
        assert.strictEqual(result.elements[0].type, type);
        assert.strictEqual(result.elements[0].identifier, identifier);
        assert.strictEqual(result.elements[0].name, name);
      }
    ),
    { numRuns: 100 }
  );
});
```

### Test Organization

Tests will be organized into suites matching the architecture:

1. **Individual Parser Rules Suite**
   - Element parsing tests (one test per element type)
   - Relationship parsing tests
   - View parsing tests (one test per view type)
   - AutoLayout parsing tests

2. **Nested Structure Suite**
   - Two-level nesting tests
   - Three-level nesting tests
   - Multiple children tests
   - Group nesting tests

3. **Context-Aware Parsing Suite**
   - Container keyword disambiguation
   - Component keyword disambiguation
   - Relationship scope tests

4. **Progressive Complexity Suite**
   - Minimal complexity test (minimal.strz)
   - Simple complexity test (simple.strz)
   - Nested complexity test (nested.strz)
   - Complex complexity test (complex.strz)

5. **Edge Cases Suite**
   - Missing identifier tests
   - Malformed input tests
   - Empty workspace tests
   - Multi-line declaration tests
   - Escaped quote tests

6. **Property-Based Tests Suite**
   - Round-trip properties
   - Invariant properties
   - Count accuracy properties
   - Error handling properties

### Test Data Files

Four new test sample files will be created:

**minimal.strz**: Single element, validates basic parsing

```
workspace "Minimal" {
  model {
    user = person "User"
  }
}
```

**simple.strz**: Multiple elements and relationships, validates basic integration

```
workspace "Simple" {
  model {
    user = person "User"
    system = softwareSystem "System"
    user -> system "Uses"
  }
  views {
    systemLandscape "Landscape" {
      include *
    }
  }
}
```

**nested.strz**: Two-level nesting, validates hierarchy parsing

```
workspace "Nested" {
  model {
    system = softwareSystem "System" {
      web = container "Web App"
      db = container "Database"
    }
  }
  views {
    container system "Containers" {
      include *
    }
  }
}
```

**complex.strz**: Three-level nesting with multiple views, validates complex scenarios

```
workspace "Complex" {
  model {
    system = softwareSystem "System" {
      web = container "Web App" {
        controller = component "Controller"
        service = component "Service"
      }
      db = container "Database"
    }
    user = person "User"
    user -> system "Uses"
  }
  views {
    systemContext system "Context" {
      include *
      autoLayout lr
    }
    container system "Containers" {
      include *
      autoLayout tb
    }
    component web "Components" {
      include *
    }
  }
}
```

### Test Execution

Tests will be executed using the existing VS Code extension test framework:
- Tests run in a VS Code extension host environment
- Each test opens a document (from file or inline content)
- The parser is invoked on the document
- Assertions verify the parsed structure

### Success Criteria

The test suite will be considered successful when:
- All individual parser rule tests pass
- All nested structure tests pass
- All context-aware parsing tests pass
- All progressive complexity tests pass
- All edge case tests pass
- All property-based tests pass with 100+ iterations
- Code coverage of parser.ts exceeds 90%
- Test execution time remains under 30 seconds
