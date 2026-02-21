# Implementation Plan: Comprehensive Diagnostic Tests

## Overview

This implementation plan creates a comprehensive test suite for the Structurizr DSL diagnostic system. The approach follows a systematic, grammar-driven methodology to ensure complete coverage of all error conditions. The implementation will enhance the existing diagnostics.ts with additional validation functions and create an extensive test suite using both unit tests and property-based tests with fast-check.

The implementation is organized into phases: test infrastructure setup, diagnostic function enhancements, unit test creation by error category, property-based test implementation, and integration testing. Each phase builds incrementally, with checkpoints to ensure quality and completeness.

## Tasks

- [x] 1. Set up test infrastructure and helper functions
  - [x] 1.1 Create test helper module with diagnostic verification functions
    - Implement `expectDiagnostic()` for verifying diagnostic messages and severity
    - Implement `expectNoDiagnostics()` for verifying valid DSL produces no errors
    - Implement `expectDiagnosticAt()` for verifying diagnostic range accuracy
    - Implement `expectMultipleDiagnostics()` for verifying multiple error detection
    - Implement document creation and cleanup utilities
    - _Requirements: 9.8, 8.6_

  - [ ]* 1.2 Create DSL mutation functions for chaos testing
    - Implement mutation types: RemoveBrace, UnclosedString, DuplicateIdentifier, InvalidIdentifier
    - Implement mutation types: MissingName, WrongContext, UndefinedReference, MisspellKeyword
    - Implement mutation types: WrongElementType, ExcessiveNesting, MissingRequiredBlock, DuplicateBlock
    - Implement `mutateDsl()` function that applies mutations to valid DSL
    - _Requirements: 12.1, 12.5_

  - [ ]* 1.3 Set up fast-check arbitraries for property-based testing
    - Create `validDslArbitrary()` for generating valid DSL structures
    - Create arbitraries for element types, view types, identifiers
    - Configure fast-check with minimum 100 iterations per property test
    - _Requirements: 9.9, 12.5_

  - [x] 1.4 Create error case catalog data structures
    - Define `ErrorCategory` enum (Lexical, Structural, Semantic, Contextual)
    - Define `ErrorCase` interface with category, description, invalidDsl, expectedMessage, severity, grammarRule
    - Create arrays for organizing test data: LEXICAL_ERRORS, STRUCTURAL_ERRORS, SEMANTIC_ERRORS, CONTEXTUAL_ERRORS
    - _Requirements: 10.2, 10.7_

- [x] 2. Checkpoint - Verify test infrastructure
  - Ensure all helper functions are working correctly
  - Ensure test infrastructure can create documents and verify diagnostics
  - Ask the user if questions arise

- [x] 3. Enhance diagnostic provider with new validation functions
  - [x] 3.1 Implement workspace structure validation
    - Add `checkWorkspaceStructure()` function to detect missing/duplicate workspace blocks
    - Add detection for missing/duplicate model blocks
    - Add warning for missing views block
    - _Requirements: 1.4, 1.5, 1.6, 1.7, 1.8_

  - [x] 3.2 Implement element placement validation
    - Add `checkElementPlacement()` function to validate element context
    - Detect containers declared outside softwareSystem blocks
    - Detect components declared outside container blocks
    - Detect elements declared in views block
    - _Requirements: 2.4, 2.5, 5.1_

  - [x] 3.3 Implement relationship reference validation
    - Add `checkRelationshipReferences()` function to validate source/target identifiers
    - Build identifier map during parsing to track declared identifiers
    - Detect undefined source identifiers
    - Detect undefined target identifiers
    - Detect self-references (warning level)
    - _Requirements: 3.1, 3.2, 3.7, 6.1_

  - [x] 3.4 Implement view scope validation
    - Add `checkViewScopes()` function to validate view scope identifiers
    - Detect undefined scope identifiers
    - Detect scope type mismatches (e.g., container view with person scope)
    - Detect missing scopes for views that require them
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 6.2, 6.3, 6.4_

  - [x] 3.5 Implement context-aware placement validation
    - Add `checkContextAwarePlacement()` function to validate construct placement
    - Track current block context during parsing
    - Detect relationships in views block
    - Detect views in model block
    - Detect style rules outside styles block
    - Detect include directives outside view blocks
    - _Requirements: 3.3, 4.5, 5.1, 5.2, 5.3, 5.4, 5.5_

  - [x] 3.6 Implement keyword and syntax validation
    - Add `checkKeywordSpelling()` function to suggest corrections for misspelled keywords
    - Add `checkReservedKeywords()` function to detect reserved keyword usage as identifiers
    - Add detection for unknown keywords
    - Add detection for deprecated syntax (warning level)
    - _Requirements: 2.7, 4.8, 7.1, 7.2, 7.5, 7.6_

  - [x] 3.7 Implement additional syntax validations
    - Add `checkNestingDepth()` function to detect excessive nesting
    - Enhance quote mismatch detection for elements and relationships
    - Add detection for missing braces in element declarations
    - Add detection for invalid relationship arrow syntax
    - Add detection for incomplete relationships (missing target)
    - Add detection for invalid autoLayout directions
    - Add detection for duplicate view keys
    - _Requirements: 2.6, 2.8, 3.4, 3.5, 3.6, 4.6, 4.7, 5.6_

- [x] 4. Checkpoint - Verify diagnostic enhancements
  - Ensure all new diagnostic functions are implemented
  - Ensure diagnostic provider integrates new functions correctly
  - Ask the user if questions arise

- [x] 5. Create unit tests for lexical error detection
  - [x] 5.1 Write tests for brace balance errors
    - Test unclosed opening brace detection
    - Test unexpected closing brace detection
    - Test multiple unmatched braces
    - Test nested brace imbalance
    - _Requirements: 1.1, 9.1_

  - [ ]* 5.2 Write property test for unbalanced braces
    - **Property 1: Unbalanced braces detection**
    - **Validates: Requirements 1.1**

  - [x] 5.3 Write tests for string termination errors
    - Test unclosed string literal detection
    - Test escaped quotes handling
    - Test multi-line string errors
    - _Requirements: 1.2, 9.1_

  - [ ]* 5.4 Write property test for unterminated strings
    - **Property 2: Unterminated string detection**
    - **Validates: Requirements 1.2**

  - [x] 5.5 Write tests for comment termination errors
    - Test unclosed block comment detection
    - Test nested block comments
    - _Requirements: 1.3, 9.1_

  - [ ]* 5.6 Write property test for unterminated comments
    - **Property 3: Unterminated comment detection**
    - **Validates: Requirements 1.3**

- [x] 6. Create unit tests for structural error detection
  - [x] 6.1 Write tests for workspace structure errors
    - Test missing workspace block detection
    - Test duplicate workspace block detection
    - Test missing model block detection
    - Test duplicate model block detection
    - Test missing views block warning
    - _Requirements: 1.4, 1.5, 1.6, 1.7, 1.8, 9.1_

  - [x] 6.2 Write tests for element declaration errors
    - Test missing element name detection
    - Test invalid identifier character detection
    - Test duplicate identifier detection with line reference
    - Test missing opening brace detection
    - Test quote mismatch detection
    - Test misspelled element type keyword detection
    - _Requirements: 2.1, 2.2, 2.3, 2.6, 2.7, 2.8, 9.2_

  - [ ]* 6.3 Write property tests for element declaration errors
    - **Property 4: Missing element name detection**
    - **Property 5: Invalid identifier character detection**
    - **Property 6: Duplicate identifier detection**
    - **Property 9: Quote mismatch detection**
    - **Property 10: Keyword spelling suggestions**
    - **Property 11: Missing brace detection**
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.6, 2.7, 2.8**

  - [x] 6.4 Write tests for element placement errors
    - Test container outside softwareSystem detection
    - Test component outside container detection
    - Test element in views block detection
    - _Requirements: 2.4, 2.5, 5.1, 9.2_

  - [ ]* 6.5 Write property tests for element placement errors
    - **Property 7: Container placement validation**
    - **Property 8: Component placement validation**
    - **Property 14: Context-aware placement validation**
    - **Validates: Requirements 2.4, 2.5, 5.1**

- [x] 7. Create unit tests for relationship error detection
  - [x] 7.1 Write tests for relationship reference errors
    - Test undefined source identifier detection
    - Test undefined target identifier detection
    - Test self-reference warning
    - _Requirements: 3.1, 3.2, 3.7, 9.3_

  - [ ]* 7.2 Write property tests for relationship reference errors
    - **Property 12: Undefined relationship source detection**
    - **Property 13: Undefined relationship target detection**
    - **Property 17: Self-reference warning**
    - **Validates: Requirements 3.1, 3.2, 3.7**

  - [x] 7.3 Write tests for relationship syntax errors
    - Test invalid arrow syntax detection
    - Test missing target identifier detection
    - Test incomplete relationship detection
    - Test quote mismatch in description detection
    - _Requirements: 3.4, 3.5, 3.6, 9.3_

  - [ ]* 7.4 Write property tests for relationship syntax errors
    - **Property 15: Invalid relationship syntax detection**
    - **Property 16: Incomplete relationship detection**
    - **Validates: Requirements 3.4, 3.5**

  - [x] 7.5 Write tests for relationship placement errors
    - Test relationship in views block detection
    - Test relationship in styles block detection
    - _Requirements: 3.3, 5.3, 9.3_

- [x] 8. Create unit tests for view error detection
  - [x] 8.1 Write tests for view scope errors
    - Test undefined scope identifier detection
    - Test missing scope for systemContext view
    - Test missing scope for container view
    - Test missing scope for component view
    - Test scope type mismatch detection
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 6.2, 6.3, 6.4, 9.4_

  - [ ]* 8.2 Write property tests for view scope errors
    - **Property 18: Undefined view scope detection**
    - **Property 21: View scope type validation**
    - **Validates: Requirements 4.1, 6.2**

  - [x] 8.3 Write tests for view declaration errors
    - Test duplicate view key detection
    - Test invalid autoLayout direction detection
    - Test misspelled view type keyword detection
    - _Requirements: 4.6, 4.7, 4.8, 9.4_

  - [ ]* 8.4 Write property tests for view declaration errors
    - **Property 19: Duplicate view key detection**
    - **Property 20: Invalid autoLayout direction detection**
    - **Validates: Requirements 4.6, 4.7**

  - [x] 8.5 Write tests for view placement errors
    - Test view in model block detection
    - Test include directive outside view block detection
    - _Requirements: 4.5, 5.2, 5.5, 9.4_

- [x] 9. Checkpoint - Verify unit test coverage
  - Ensure all error categories have unit tests
  - Ensure all tests pass
  - Ask the user if questions arise

- [x] 10. Create unit tests for context-aware diagnostics
  - [x] 10.1 Write tests for block context validation
    - Test element in views block detection
    - Test view in model block detection
    - Test relationship in views block detection
    - Test style rule outside styles block detection
    - Test include directive outside view block detection
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 9.5_

  - [ ]* 10.2 Write property test for context-aware placement
    - **Property 14: Context-aware placement validation**
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5**

  - [x] 10.3 Write tests for nesting depth validation
    - Test excessive nesting detection
    - Test valid nesting depth acceptance
    - _Requirements: 5.6, 9.5_

  - [ ]* 10.4 Write property test for nesting depth
    - **Property 26: Excessive nesting detection**
    - **Validates: Requirements 5.6**

- [x] 11. Create unit tests for identifier reference validation
  - [x] 11.1 Write tests for identifier existence validation
    - Test relationship source identifier validation
    - Test relationship target identifier validation
    - Test view scope identifier validation
    - _Requirements: 6.1, 6.2, 9.6_

  - [x] 11.2 Write tests for identifier type validation
    - Test container view scope type validation
    - Test component view scope type validation
    - _Requirements: 6.3, 6.4, 9.6_

  - [x] 11.3 Write tests for forward reference detection
    - Test identifier referenced before declaration
    - Test valid forward declaration patterns
    - _Requirements: 6.5, 9.6_

  - [ ]* 11.4 Write property test for forward references
    - **Property 22: Forward reference detection**
    - **Validates: Requirements 6.5**

- [x] 12. Create unit tests for keyword and syntax validation
  - [x] 12.1 Write tests for reserved keyword detection
    - Test reserved keyword used as identifier
    - Test valid identifier patterns
    - _Requirements: 7.1, 9.7_

  - [ ]* 12.2 Write property test for reserved keywords
    - **Property 23: Reserved keyword detection**
    - **Validates: Requirements 7.1**

  - [x] 12.3 Write tests for unknown keyword detection
    - Test unrecognized keyword detection
    - Test keyword spelling suggestions
    - _Requirements: 7.2, 7.6, 9.7_

  - [ ]* 12.4 Write property test for unknown keywords
    - **Property 24: Unknown keyword detection**
    - **Validates: Requirements 7.2**

  - [x] 12.5 Write tests for deprecated syntax detection
    - Test deprecated syntax warning
    - Test suggested modern alternatives
    - _Requirements: 7.5, 9.7_

  - [ ]* 12.6 Write property test for deprecated syntax
    - **Property 25: Deprecated syntax warning**
    - **Validates: Requirements 7.5**

- [x] 13. Create unit tests for comprehensive error coverage
  - [x] 13.1 Write tests for multiple error detection
    - Test DSL with multiple distinct errors produces all diagnostics
    - Test error prioritization (errors before warnings)
    - _Requirements: 8.3, 8.7, 9.8_

  - [ ]* 13.2 Write property test for multiple error reporting
    - **Property 27: Multiple error reporting**
    - **Validates: Requirements 8.3**

  - [x] 13.3 Write tests for diagnostic range accuracy
    - Test diagnostic ranges highlight exact problematic text
    - Test diagnostic ranges for various error types
    - _Requirements: 8.6, 9.8_

  - [ ]* 13.4 Write property test for diagnostic range accuracy
    - **Property 28: Diagnostic range accuracy**
    - **Validates: Requirements 8.6**

  - [x] 13.5 Write tests for diagnostic severity
    - Test error severity for syntax errors
    - Test warning severity for deprecations and self-references
    - Test information severity for suggestions
    - _Requirements: 8.7, 9.8_

  - [ ]* 13.6 Write property test for diagnostic severity
    - **Property 29: Diagnostic severity prioritization**
    - **Validates: Requirements 8.7**

  - [x] 13.6 Write tests for valid DSL produces no diagnostics
    - Test example.strz produces no diagnostics
    - Test system-context.strz produces no diagnostics
    - Test various valid DSL patterns produce no diagnostics
    - _Requirements: 9.10_

  - [ ]* 13.7 Write property test for valid DSL
    - **Property 30: Valid DSL produces no diagnostics**
    - **Validates: Requirements 9.10**

- [x] 14. Checkpoint - Verify comprehensive test coverage
  - Ensure all 33 correctness properties are tested
  - Ensure all requirements have corresponding tests
  - Ask the user if questions arise

- [ ] 15. Create property-based tests for grammar coverage
  - [ ]* 15.1 Write property test for ordering constraints
    - **Property 31: Ordering constraint validation**
    - **Validates: Requirements 10.6**

  - [ ]* 15.2 Write property test for empty identifier detection
    - **Property 32: Empty identifier detection**
    - **Validates: Requirements 11.5**

  - [ ]* 15.3 Write property test for mutation diagnostic coverage
    - **Property 33: Mutation diagnostic coverage**
    - **Validates: Requirements 12.2**

- [ ] 16. Create integration tests for real-world scenarios
  - [ ]* 16.1 Write integration tests for complex DSL files
    - Test complex nested structures with multiple error types
    - Test large files with many elements and relationships
    - Test edge cases discovered during development
    - _Requirements: 8.1, 8.2, 8.3_

  - [ ]* 16.2 Write integration tests for parser round-trip validation
    - Test parsed elements have correct fields
    - Test parsed relationships have valid source/target
    - Test parsed views have valid scope and key
    - Test nested structures have correct parent-child relationships
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

  - [ ]* 16.3 Write chaos testing suite with systematic mutations
    - Test all mutation types produce appropriate diagnostics
    - Test mutation coverage tracking
    - Test edge case discovery through random mutations
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7_

- [x] 17. Final checkpoint - Verify complete test suite
  - Ensure all tests pass
  - Ensure test suite completes in under 60 seconds
  - Ensure code coverage exceeds 90%
  - Ask the user if questions arise

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property-based tests use fast-check with minimum 100 iterations
- Each property test is tagged with feature name and property number
- Test suite is organized by error category for maintainability
- Checkpoints ensure incremental validation and quality
- All diagnostic enhancements build on existing diagnostics.ts
- Test helpers provide reusable utilities for diagnostic verification
- Mutation testing discovers edge cases not covered by unit tests
