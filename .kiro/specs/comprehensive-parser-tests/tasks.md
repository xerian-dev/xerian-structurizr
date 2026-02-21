# Implementation Plan: Comprehensive Parser Tests

## Overview

This plan implements a comprehensive test suite for the Structurizr DSL parser using a bottom-up testing strategy. The implementation will create test sample files, organize tests into logical suites, implement unit tests for individual parser rules, and add property-based tests using fast-check to validate universal correctness properties.

## Tasks

- [x] 1. Set up test infrastructure and sample files
  - [x] 1.1 Create test sample files in test-samples/ directory
    - Create minimal.strz (single element, no relationships)
    - Create simple.strz (multiple elements, basic relationships, one view)
    - Create nested.strz (two-level nesting with containers in system)
    - Create complex.strz (three-level nesting with components, multiple views, autoLayout)
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  
  - [x] 1.2 Install and configure fast-check for property-based testing
    - Add fast-check as dev dependency
    - Verify fast-check works with existing test framework
    - _Requirements: 7.1, 7.2, 7.3_

- [x] 2. Implement Individual Parser Rule Tests suite
  - [x] 2.1 Create test suite structure for individual parser rules
    - Add suite block for "Individual Parser Rules"
    - Add sub-suites for elements, relationships, views, and directives
    - _Requirements: 6.1, 6.6_
  
  - [x] 2.2 Implement element parsing tests
    - Test workspace name extraction (inline DSL)
    - Test person element parsing (identifier, name, description, line number)
    - Test softwareSystem element parsing
    - Test container element parsing (including technology field)
    - Test component element parsing (including technology field)
    - Test deploymentNode element parsing
    - Test infrastructureNode element parsing
    - Test group element parsing
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8_
  
  - [x] 2.3 Implement relationship parsing tests
    - Test basic relationship parsing (source, target, description, technology, line number)
    - Test relationship with optional fields omitted
    - _Requirements: 1.9_
  
  - [x] 2.4 Implement view parsing tests
    - Test systemLandscape view parsing
    - Test systemContext view parsing (with scope)
    - Test container view parsing (with scope)
    - Test component view parsing (with scope)
    - Test deployment view parsing
    - Test dynamic view parsing
    - Test filtered view parsing
    - Test custom view parsing
    - _Requirements: 1.10, 1.11, 1.12, 1.13, 1.14, 1.15, 1.16, 1.17_
  
  - [x] 2.5 Implement autoLayout directive tests
    - Test autoLayout with explicit direction (tb, bt, lr, rl)
    - Test autoLayout without direction (defaults to tb)
    - _Requirements: 1.18, 1.19_

- [x] 3. Implement Nested Structure Tests suite
  - [x] 3.1 Create test suite structure for nested structures
    - Add suite block for "Nested Structure Tests"
    - _Requirements: 6.1_
  
  - [x] 3.2 Implement two-level nesting tests
    - Test container nested in softwareSystem (parent-child association)
    - Test component nested in container (parent-child association)
    - Test multiple containers in one system
    - Test multiple components in one container
    - _Requirements: 2.1, 2.2, 2.3, 2.4_
  
  - [x] 3.3 Implement three-level nesting tests
    - Test system → container → component hierarchy
    - Verify parent-child relationships maintained throughout
    - _Requirements: 2.6_
  
  - [x] 3.4 Implement deployment and group nesting tests
    - Test deploymentNode containing infrastructureNode
    - Test group containing multiple elements
    - _Requirements: 2.5, 2.7_
  
  - [x] 3.5 Implement line number tracking tests for nested structures
    - Verify line numbers correct at all nesting levels
    - _Requirements: 2.8_

- [x] 4. Implement Context-Aware Parsing Tests suite
  - [x] 4.1 Create test suite structure for context-aware parsing
    - Add suite block for "Context-Aware Parsing Tests"
    - _Requirements: 6.1_
  
  - [x] 4.2 Implement keyword disambiguation tests
    - Test "container" in model block (parsed as element)
    - Test "container" in views block (parsed as view)
    - Test "component" in model block (parsed as element)
    - Test "component" in views block (parsed as view)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.8_
  
  - [x] 4.3 Implement relationship scope tests
    - Test relationships in model block (parsed as relationships)
    - Test relationship-like syntax outside model block (ignored)
    - _Requirements: 3.5, 3.6_
  
  - [x] 4.4 Implement element scope tests
    - Test elements in views block not parsed as model elements
    - _Requirements: 3.7_

- [x] 5. Implement Progressive Complexity Tests suite
  - [x] 5.1 Create test suite structure for progressive complexity
    - Add suite block for "Progressive Complexity Tests"
    - _Requirements: 6.1, 6.6_
  
  - [x] 5.2 Implement minimal complexity test
    - Parse minimal.strz
    - Assert exactly one element, no relationships, no views
    - _Requirements: 4.1, 4.5_
  
  - [x] 5.3 Implement simple complexity test
    - Parse simple.strz
    - Assert multiple elements, basic relationships, one view
    - _Requirements: 4.2, 4.6_
  
  - [x] 5.4 Implement nested complexity test
    - Parse nested.strz
    - Assert two-level nesting with correct parent-child associations
    - _Requirements: 4.3, 4.7_
  
  - [x] 5.5 Implement complex complexity test
    - Parse complex.strz
    - Assert three-level nesting, multiple views, autoLayout directives
    - Verify all elements, relationships, and views present with correct structure
    - _Requirements: 4.4, 4.8_

- [x] 6. Implement Edge Cases and Error Handling Tests suite
  - [x] 6.1 Create test suite structure for edge cases
    - Add suite block for "Edge Cases and Error Handling Tests"
    - _Requirements: 6.1_
  
  - [x] 6.2 Implement missing identifier tests
    - Test element without identifier (uses name as identifier)
    - Test element without identifier or name (graceful handling)
    - Verify no empty identifiers in parsed results
    - _Requirements: 1.20, 4.9, 5.1_
  
  - [x] 6.3 Implement malformed input tests
    - Test DSL with only comments (returns empty workspace)
    - Test DSL with unmatched braces (no crash)
    - Test autoLayout with invalid direction (graceful handling)
    - Verify no unhandled exceptions for all malformed input
    - _Requirements: 5.4, 5.5, 5.8, 5.9_
  
  - [x] 6.4 Implement undefined reference tests
    - Test relationship with undefined source/target (still parses structure)
    - Test view with undefined scope (still parses structure)
    - _Requirements: 5.2, 5.3_
  
  - [x] 6.5 Implement multi-line and escaped quote tests
    - Test element declaration spanning multiple lines
    - Test string literals with escaped quotes
    - _Requirements: 5.6, 5.7_

- [x] 7. Checkpoint - Ensure all unit tests pass
  - Run all unit tests and verify they pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Implement Property-Based Tests suite
  - [ ] 8.1 Create test suite structure and arbitraries for property-based tests
    - Add suite block for "Property-Based Tests"
    - Create arbitraries for element types, identifiers, names, descriptions
    - Create arbitraries for view types, relationship declarations
    - Configure fast-check with numRuns: 100
    - _Requirements: 6.1_
  
  - [ ]* 8.2 Implement Property 1: Workspace name extraction
    - Generate random workspace names
    - Verify workspace name correctly extracted
    - Tag: "Feature: comprehensive-parser-tests, Property 1: Workspace name extraction"
    - _Requirements: 1.1_
  
  - [ ]* 8.3 Implement Property 2: Element field extraction
    - Generate random element types with identifiers, names, descriptions
    - Verify all fields extracted correctly for all element types
    - Tag: "Feature: comprehensive-parser-tests, Property 2: Element field extraction"
    - _Requirements: 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 7.1_
  
  - [ ]* 8.4 Implement Property 3: Relationship field extraction
    - Generate random relationships with source, target, description, technology
    - Verify all fields extracted correctly
    - Tag: "Feature: comprehensive-parser-tests, Property 3: Relationship field extraction"
    - _Requirements: 1.9, 7.3_
  
  - [ ]* 8.5 Implement Property 4: View field extraction
    - Generate random view types with scopes, keys
    - Verify all fields extracted correctly for all view types
    - Tag: "Feature: comprehensive-parser-tests, Property 4: View field extraction"
    - _Requirements: 1.10, 1.11, 1.12, 1.13, 1.14, 1.15, 1.16, 1.17, 7.2_
  
  - [ ]* 8.6 Implement Property 5: AutoLayout direction extraction
    - Generate random autoLayout directives with directions
    - Verify direction correctly associated with view
    - Tag: "Feature: comprehensive-parser-tests, Property 5: AutoLayout direction extraction"
    - _Requirements: 1.18_
  
  - [ ]* 8.7 Implement Property 6: Missing identifier fallback
    - Generate element declarations without identifiers
    - Verify name used as identifier
    - Tag: "Feature: comprehensive-parser-tests, Property 6: Missing identifier fallback"
    - _Requirements: 1.20_
  
  - [ ]* 8.8 Implement Property 7: Two-level nesting association
    - Generate nested structures (container in system, component in container)
    - Verify correct parent-child associations
    - Tag: "Feature: comprehensive-parser-tests, Property 7: Two-level nesting association"
    - _Requirements: 2.1, 2.2_
  
  - [ ]* 8.9 Implement Property 8: Multiple children parsing
    - Generate parent elements with multiple children
    - Verify all children extracted at correct nesting level
    - Tag: "Feature: comprehensive-parser-tests, Property 8: Multiple children parsing"
    - _Requirements: 2.3, 2.4, 2.5, 2.7_
  
  - [ ]* 8.10 Implement Property 9: Three-level nesting preservation
    - Generate three-level hierarchies (system → container → component)
    - Verify parent-child relationships maintained throughout
    - Tag: "Feature: comprehensive-parser-tests, Property 9: Three-level nesting preservation"
    - _Requirements: 2.6_
  
  - [ ]* 8.11 Implement Property 10: Line number tracking in nested structures
    - Generate nested structures with known line numbers
    - Verify line numbers correct at all nesting depths
    - Tag: "Feature: comprehensive-parser-tests, Property 10: Line number tracking in nested structures"
    - _Requirements: 2.8_
  
  - [ ]* 8.12 Implement Property 11: Context-aware keyword interpretation
    - Generate DSL with context-dependent keywords in different blocks
    - Verify keywords interpreted correctly based on block context
    - Tag: "Feature: comprehensive-parser-tests, Property 11: Context-aware keyword interpretation"
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.8_
  
  - [ ]* 8.13 Implement Property 12: Model-scoped relationship parsing
    - Generate relationships in model blocks and outside model blocks
    - Verify only model block relationships parsed
    - Tag: "Feature: comprehensive-parser-tests, Property 12: Model-scoped relationship parsing"
    - _Requirements: 3.5_
  
  - [ ]* 8.14 Implement Property 13: No empty identifiers
    - Generate various element declarations
    - Verify all parsed elements have non-empty identifiers
    - Tag: "Feature: comprehensive-parser-tests, Property 13: No empty identifiers"
    - _Requirements: 4.9_
  
  - [ ]* 8.15 Implement Property 14: Multi-line element parsing
    - Generate element declarations spanning multiple lines
    - Verify elements extracted correctly with all attributes
    - Tag: "Feature: comprehensive-parser-tests, Property 14: Multi-line element parsing"
    - _Requirements: 5.6_
  
  - [ ]* 8.16 Implement Property 15: Escaped quote handling
    - Generate string literals with escaped quotes
    - Verify escapes handled correctly
    - Tag: "Feature: comprehensive-parser-tests, Property 15: Escaped quote handling"
    - _Requirements: 5.7_
  
  - [ ]* 8.17 Implement Property 16: Graceful error handling
    - Generate malformed input (unmatched braces, invalid syntax)
    - Verify no unhandled exceptions, returns valid ParsedWorkspace
    - Tag: "Feature: comprehensive-parser-tests, Property 16: Graceful error handling"
    - _Requirements: 5.9_
  
  - [ ]* 8.18 Implement Property 17: Attribute preservation
    - Generate elements/relationships/views with all attributes
    - Parse and verify all attributes preserved
    - Tag: "Feature: comprehensive-parser-tests, Property 17: Attribute preservation"
    - _Requirements: 7.4_
  
  - [ ]* 8.19 Implement Property 18: Element count accuracy
    - Generate workspaces with known counts of elements/relationships/views
    - Verify parsed counts match declarations
    - Tag: "Feature: comprehensive-parser-tests, Property 18: Element count accuracy"
    - _Requirements: 7.5_
  
  - [ ]* 8.20 Implement Property 19: Line number accuracy
    - Generate DSL with elements at known line numbers
    - Verify line number fields match declaration lines
    - Tag: "Feature: comprehensive-parser-tests, Property 19: Line number accuracy"
    - _Requirements: 7.6_
  
  - [ ]* 8.21 Implement Property 20: Optional field handling
    - Generate elements/relationships/views with optional fields omitted
    - Verify optional fields set to undefined (not empty strings or null)
    - Tag: "Feature: comprehensive-parser-tests, Property 20: Optional field handling"
    - _Requirements: 7.7_

- [ ] 9. Final checkpoint - Run complete test suite
  - Run all unit tests and property-based tests
  - Verify test execution time under 30 seconds
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional property-based tests and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Unit tests (tasks 2-6) provide concrete validation of parser behavior
- Property-based tests (task 8) provide comprehensive input coverage through randomization
- Test sample files created in task 1.1 are reused throughout progressive complexity tests
- All tests use existing helper functions (openDslDocument, openDslContent, parseDocument)
- Property-based tests use fast-check with minimum 100 iterations per property
