# Structurizr DSL for VS Code

A Visual Studio Code extension providing language support for the [Structurizr DSL](https://docs.structurizr.com/dsl) — the text-based language for defining C4 architecture models.

## Features

### Syntax Highlighting

Full TextMate grammar covering keywords, strings, comments, operators, shapes, colors, and directives.

### Code Snippets

20+ snippets for quickly scaffolding common constructs:

| Prefix | Description |
| --- | --- |
| `workspace` | Full workspace with model and views |
| `person` | Person element |
| `softwareSystem` | Software system with block |
| `container` | Container with technology |
| `component` | Component element |
| `rel` | Relationship (`->`) |
| `systemContext` | System context view |
| `systemLandscape` | System landscape view |
| `containerView` | Container view |
| `componentView` | Component view |
| `deploymentView` | Deployment view |
| `dynamicView` | Dynamic view |
| `styles` | Styles block |
| `elementStyle` | Element style rule |
| `relationshipStyle` | Relationship style rule |
| `group` | Element group |
| `tags` | Tag assignment |

### IntelliSense

- **Context-aware completions** — suggests element types in `model`, view types in `views`, and style properties in `styles`
- **Hover documentation** — hover over any keyword for syntax help and examples
- **Document outline** — see all model elements and views in the Explorer sidebar

### Diagnostics

Real-time validation for:

- Unbalanced braces
- Unterminated strings
- Duplicate element identifiers

### Live Diagram Preview

Renders C4 diagrams using Mermaid.js in a side panel. Open from the editor title bar icon or the command palette (`Structurizr: Show Diagram Preview`). The preview updates automatically as you edit.

## Getting Started

1. Open any `.dsl` file — the extension activates automatically
2. Start typing or use snippets (e.g., type `workspace` and press Tab)
3. Click the preview icon in the editor title bar to see the diagram

## Development

### Prerequisites

- Node.js 18+
- VS Code 1.85+

### Setup

```bash
npm install
npm run compile
```

### Running

Press **F5** in VS Code to launch the Extension Development Host with the `test-samples/` folder open.

### Building

```bash
npm run compile    # One-time build
npm run watch      # Watch mode
```

## Structurizr DSL Resources

- [Language Reference](https://docs.structurizr.com/dsl/language)
- [Tutorial](https://docs.structurizr.com/dsl/tutorial)
- [Examples](https://docs.structurizr.com/dsl/example)
- [Structurizr DSL GitHub](https://github.com/structurizr/dsl)

## License

ISC
