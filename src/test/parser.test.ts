import * as assert from "assert";
import * as vscode from "vscode";
import * as path from "path";
import { parseDocument } from "../parser";

const sampleDir = path.resolve(__dirname, "..", "..", "test-samples");

async function openDslDocument(filePath: string): Promise<vscode.TextDocument> {
  const uri = vscode.Uri.file(filePath);
  const doc = await vscode.workspace.openTextDocument(uri);
  await vscode.window.showTextDocument(doc);
  return doc;
}

async function openDslContent(content: string): Promise<vscode.TextDocument> {
  const doc = await vscode.workspace.openTextDocument({
    language: "structurizr",
    content,
  });
  await vscode.window.showTextDocument(doc);
  return doc;
}

teardown(async () => {
  await vscode.commands.executeCommand("workbench.action.closeAllEditors");
});

suite("Parser", () => {
  suite("example.strz", () => {
    test("parses workspace name", async () => {
      const doc = await openDslDocument(path.join(sampleDir, "example.strz"));
      const result = parseDocument(doc);
      assert.strictEqual(result.name, "Big Bank plc");
    });

    test("parses all 9 elements", async () => {
      const doc = await openDslDocument(path.join(sampleDir, "example.strz"));
      const result = parseDocument(doc);
      assert.strictEqual(result.elements.length, 9);

      const ids = result.elements.map((e) => e.identifier);
      assert.ok(ids.includes("customer"));
      assert.ok(ids.includes("supportStaff"));
      assert.ok(ids.includes("internetBankingSystem"));
      assert.ok(ids.includes("webApp"));
      assert.ok(ids.includes("signinController"));
      assert.ok(ids.includes("accountsController"));
      assert.ok(ids.includes("spa"));
      assert.ok(ids.includes("database"));
      assert.ok(ids.includes("mainframe"));
    });

    test("does not produce elements with empty identifiers", async () => {
      const doc = await openDslDocument(path.join(sampleDir, "example.strz"));
      const result = parseDocument(doc);
      const emptyIds = result.elements.filter((e) => e.identifier === "");
      assert.strictEqual(
        emptyIds.length,
        0,
        `Found elements with empty identifiers on lines: ${emptyIds.map((e) => e.line + 1).join(", ")}`,
      );
    });

    test("parses all 5 relationships", async () => {
      const doc = await openDslDocument(path.join(sampleDir, "example.strz"));
      const result = parseDocument(doc);
      assert.strictEqual(result.relationships.length, 5);
    });

    test("parses all 4 views", async () => {
      const doc = await openDslDocument(path.join(sampleDir, "example.strz"));
      const result = parseDocument(doc);
      assert.strictEqual(result.views.length, 4);

      const viewTypes = result.views.map((v) => v.type);
      assert.ok(viewTypes.includes("systemLandscape"));
      assert.ok(viewTypes.includes("systemContext"));
      assert.ok(viewTypes.includes("container"));
      assert.ok(viewTypes.includes("component"));
    });
  });

  suite("system-context.strz", () => {
    test("parses workspace name", async () => {
      const doc = await openDslDocument(
        path.join(sampleDir, "system-context.strz"),
      );
      const result = parseDocument(doc);
      assert.strictEqual(result.name, "Name");
    });

    test("parses 2 elements", async () => {
      const doc = await openDslDocument(
        path.join(sampleDir, "system-context.strz"),
      );
      const result = parseDocument(doc);
      assert.strictEqual(result.elements.length, 2);

      const ids = result.elements.map((e) => e.identifier);
      assert.ok(ids.includes("u"));
      assert.ok(ids.includes("ss"));

      const user = result.elements.find((e) => e.identifier === "u")!;
      assert.strictEqual(user.type, "person");
      assert.strictEqual(user.name, "User");

      const sys = result.elements.find((e) => e.identifier === "ss")!;
      assert.strictEqual(sys.type, "softwareSystem");
      assert.strictEqual(sys.name, "Software System");
    });

    test("parses 1 relationship", async () => {
      const doc = await openDslDocument(
        path.join(sampleDir, "system-context.strz"),
      );
      const result = parseDocument(doc);
      assert.strictEqual(result.relationships.length, 1);
      assert.strictEqual(result.relationships[0].source, "u");
      assert.strictEqual(result.relationships[0].target, "ss");
      assert.strictEqual(result.relationships[0].description, "Uses");
    });

    test("parses 1 systemContext view", async () => {
      const doc = await openDslDocument(
        path.join(sampleDir, "system-context.strz"),
      );
      const result = parseDocument(doc);
      assert.strictEqual(result.views.length, 1);
      assert.strictEqual(result.views[0].type, "systemContext");
      assert.strictEqual(result.views[0].scope, "ss");
      assert.strictEqual(result.views[0].key, "Diagram1");
    });
  });

  suite("autoLayout parsing", () => {
    test("parses autoLayout lr from system-context.strz", async () => {
      const doc = await openDslDocument(
        path.join(sampleDir, "system-context.strz"),
      );
      const result = parseDocument(doc);
      assert.strictEqual(result.views[0].autoLayout, "lr");
    });

    test("parses autoLayout tb", async () => {
      const content = [
        'workspace "Test" {',
        "  model {",
        '    u = person "User"',
        "  }",
        "  views {",
        '    systemLandscape "Key" {',
        "      include *",
        "      autoLayout tb",
        "    }",
        "  }",
        "}",
      ].join("\n");
      const doc = await openDslContent(content);
      const result = parseDocument(doc);
      assert.strictEqual(result.views[0].autoLayout, "tb");
    });

    test("autoLayout is undefined when not specified", async () => {
      const content = [
        'workspace "Test" {',
        "  model {",
        '    u = person "User"',
        "  }",
        "  views {",
        '    systemLandscape "Key" {',
        "      include *",
        "    }",
        "  }",
        "}",
      ].join("\n");
      const doc = await openDslContent(content);
      const result = parseDocument(doc);
      assert.strictEqual(result.views[0].autoLayout, undefined);
    });
  });

  suite("context-aware parsing", () => {
    test("container in views is a view, not an element", async () => {
      const content = [
        'workspace "Test" {',
        "  model {",
        '    sys = softwareSystem "Sys" {',
        '      web = container "Web" "desc" "tech"',
        "    }",
        "  }",
        "  views {",
        '    container sys "Containers" {',
        "      include *",
        "    }",
        "  }",
        "}",
      ].join("\n");
      const doc = await openDslContent(content);
      const result = parseDocument(doc);

      assert.strictEqual(
        result.elements.length,
        2,
        "Expected 2 elements (sys + web)",
      );
      assert.strictEqual(result.views.length, 1, "Expected 1 view");
      assert.strictEqual(result.views[0].type, "container");
      assert.strictEqual(result.views[0].scope, "sys");
    });

    test("component in views is a view, not an element", async () => {
      const content = [
        'workspace "Test" {',
        "  model {",
        '    sys = softwareSystem "Sys" {',
        '      web = container "Web" {',
        '        ctrl = component "Controller" "desc"',
        "      }",
        "    }",
        "  }",
        "  views {",
        '    component web "Components" {',
        "      include *",
        "    }",
        "  }",
        "}",
      ].join("\n");
      const doc = await openDslContent(content);
      const result = parseDocument(doc);

      assert.strictEqual(
        result.elements.length,
        3,
        "Expected 3 elements (sys + web + ctrl)",
      );
      assert.strictEqual(result.views.length, 1, "Expected 1 view");
      assert.strictEqual(result.views[0].type, "component");
      assert.strictEqual(result.views[0].scope, "web");
    });

    test("relationships are only parsed inside model", async () => {
      const content = [
        'workspace "Test" {',
        "  model {",
        '    a = softwareSystem "A"',
        '    b = softwareSystem "B"',
        '    a -> b "Uses"',
        "  }",
        "}",
      ].join("\n");
      const doc = await openDslContent(content);
      const result = parseDocument(doc);

      assert.strictEqual(result.relationships.length, 1);
      assert.strictEqual(result.relationships[0].source, "a");
      assert.strictEqual(result.relationships[0].target, "b");
    });
  });
});

suite("Individual Parser Rules", () => {
  suite("Element Parsing", () => {
    test("parses workspace name", async () => {
      const content = 'workspace "My Workspace" { model { } }';
      const doc = await openDslContent(content);
      const result = parseDocument(doc);
      assert.strictEqual(result.name, "My Workspace");
    });

    test("parses person element", async () => {
      const content = [
        'workspace "Test" {',
        "  model {",
        '    u = person "User"',
        "  }",
        "}",
      ].join("\n");
      const doc = await openDslContent(content);
      const result = parseDocument(doc);

      assert.strictEqual(result.elements.length, 1);
      assert.strictEqual(result.elements[0].type, "person");
      assert.strictEqual(result.elements[0].identifier, "u");
      assert.strictEqual(result.elements[0].name, "User");
      assert.strictEqual(result.elements[0].line, 2);
    });

    test("parses softwareSystem element", async () => {
      const content = [
        'workspace "Test" {',
        "  model {",
        '    sys = softwareSystem "System"',
        "  }",
        "}",
      ].join("\n");
      const doc = await openDslContent(content);
      const result = parseDocument(doc);

      assert.strictEqual(result.elements.length, 1);
      assert.strictEqual(result.elements[0].type, "softwareSystem");
      assert.strictEqual(result.elements[0].identifier, "sys");
      assert.strictEqual(result.elements[0].name, "System");
      assert.strictEqual(result.elements[0].line, 2);
    });

    test("parses container element", async () => {
      const content = [
        'workspace "Test" {',
        "  model {",
        '    sys = softwareSystem "System" {',
        '      web = container "Web App"',
        "    }",
        "  }",
        "}",
      ].join("\n");
      const doc = await openDslContent(content);
      const result = parseDocument(doc);

      const container = result.elements.find((e) => e.identifier === "web");
      assert.ok(container, "Container element not found");
      assert.strictEqual(container.type, "container");
      assert.strictEqual(container.identifier, "web");
      assert.strictEqual(container.name, "Web App");
      assert.strictEqual(container.line, 3);
    });

    test("parses component element", async () => {
      const content = [
        'workspace "Test" {',
        "  model {",
        '    sys = softwareSystem "System" {',
        '      web = container "Web" {',
        '        ctrl = component "Controller"',
        "      }",
        "    }",
        "  }",
        "}",
      ].join("\n");
      const doc = await openDslContent(content);
      const result = parseDocument(doc);

      const component = result.elements.find((e) => e.identifier === "ctrl");
      assert.ok(component, "Component element not found");
      assert.strictEqual(component.type, "component");
      assert.strictEqual(component.identifier, "ctrl");
      assert.strictEqual(component.name, "Controller");
      assert.strictEqual(component.line, 4);
    });

    test("parses deploymentNode element", async () => {
      const content = [
        'workspace "Test" {',
        "  model {",
        '    node = deploymentNode "Server"',
        "  }",
        "}",
      ].join("\n");
      const doc = await openDslContent(content);
      const result = parseDocument(doc);

      assert.strictEqual(result.elements.length, 1);
      assert.strictEqual(result.elements[0].type, "deploymentNode");
      assert.strictEqual(result.elements[0].identifier, "node");
      assert.strictEqual(result.elements[0].name, "Server");
      assert.strictEqual(result.elements[0].line, 2);
    });

    test("parses infrastructureNode element", async () => {
      const content = [
        'workspace "Test" {',
        "  model {",
        '    infra = infrastructureNode "Load Balancer"',
        "  }",
        "}",
      ].join("\n");
      const doc = await openDslContent(content);
      const result = parseDocument(doc);

      assert.strictEqual(result.elements.length, 1);
      assert.strictEqual(result.elements[0].type, "infrastructureNode");
      assert.strictEqual(result.elements[0].identifier, "infra");
      assert.strictEqual(result.elements[0].name, "Load Balancer");
      assert.strictEqual(result.elements[0].line, 2);
    });

    test("parses group element", async () => {
      const content = [
        'workspace "Test" {',
        "  model {",
        '    group "Backend Services" {',
        '      api = softwareSystem "API"',
        "    }",
        "  }",
        "}",
      ].join("\n");
      const doc = await openDslContent(content);
      const result = parseDocument(doc);

      const group = result.elements.find((e) => e.type === "group");
      assert.ok(group, "Group element not found");
      assert.strictEqual(group.type, "group");
      assert.strictEqual(group.name, "Backend Services");
      assert.strictEqual(group.line, 2);
    });
  });

  suite("Relationship Parsing", () => {
    test("parses basic relationship with all fields", async () => {
      const content = [
        'workspace "Test" {',
        "  model {",
        '    a = softwareSystem "A"',
        '    b = softwareSystem "B"',
        '    a -> b "Sends data" "HTTPS"',
        "  }",
        "}",
      ].join("\n");
      const doc = await openDslContent(content);
      const result = parseDocument(doc);

      assert.strictEqual(result.relationships.length, 1);
      assert.strictEqual(result.relationships[0].source, "a");
      assert.strictEqual(result.relationships[0].target, "b");
      assert.strictEqual(result.relationships[0].description, "Sends data");
      assert.strictEqual(result.relationships[0].technology, "HTTPS");
      assert.strictEqual(result.relationships[0].line, 4);
    });

    test("parses relationship with optional fields omitted", async () => {
      const content = [
        'workspace "Test" {',
        "  model {",
        '    a = softwareSystem "A"',
        '    b = softwareSystem "B"',
        "    a -> b",
        "  }",
        "}",
      ].join("\n");
      const doc = await openDslContent(content);
      const result = parseDocument(doc);

      assert.strictEqual(result.relationships.length, 1);
      assert.strictEqual(result.relationships[0].source, "a");
      assert.strictEqual(result.relationships[0].target, "b");
      assert.strictEqual(result.relationships[0].description, undefined);
      assert.strictEqual(result.relationships[0].technology, undefined);
      assert.strictEqual(result.relationships[0].line, 4);
    });
  });

  suite("View Parsing", () => {
    test("parses systemLandscape view", async () => {
      const content = [
        'workspace "Test" {',
        "  model {",
        '    u = person "User"',
        "  }",
        "  views {",
        '    systemLandscape "LandscapeKey" {',
        "      include *",
        "    }",
        "  }",
        "}",
      ].join("\n");
      const doc = await openDslContent(content);
      const result = parseDocument(doc);

      assert.strictEqual(result.views.length, 1);
      assert.strictEqual(result.views[0].type, "systemLandscape");
      assert.strictEqual(result.views[0].key, "LandscapeKey");
      assert.strictEqual(result.views[0].line, 5);
    });

    test("parses systemContext view with scope", async () => {
      const content = [
        'workspace "Test" {',
        "  model {",
        '    sys = softwareSystem "System"',
        "  }",
        "  views {",
        '    systemContext sys "ContextKey" {',
        "      include *",
        "    }",
        "  }",
        "}",
      ].join("\n");
      const doc = await openDslContent(content);
      const result = parseDocument(doc);

      assert.strictEqual(result.views.length, 1);
      assert.strictEqual(result.views[0].type, "systemContext");
      assert.strictEqual(result.views[0].scope, "sys");
      assert.strictEqual(result.views[0].key, "ContextKey");
      assert.strictEqual(result.views[0].line, 5);
    });

    test("parses container view with scope", async () => {
      const content = [
        'workspace "Test" {',
        "  model {",
        '    sys = softwareSystem "System" {',
        '      web = container "Web"',
        "    }",
        "  }",
        "  views {",
        '    container sys "ContainerKey" {',
        "      include *",
        "    }",
        "  }",
        "}",
      ].join("\n");
      const doc = await openDslContent(content);
      const result = parseDocument(doc);

      assert.strictEqual(result.views.length, 1);
      assert.strictEqual(result.views[0].type, "container");
      assert.strictEqual(result.views[0].scope, "sys");
      assert.strictEqual(result.views[0].key, "ContainerKey");
      assert.strictEqual(result.views[0].line, 7);
    });

    test("parses component view with scope", async () => {
      const content = [
        'workspace "Test" {',
        "  model {",
        '    sys = softwareSystem "System" {',
        '      web = container "Web" {',
        '        ctrl = component "Controller"',
        "      }",
        "    }",
        "  }",
        "  views {",
        '    component web "ComponentKey" {',
        "      include *",
        "    }",
        "  }",
        "}",
      ].join("\n");
      const doc = await openDslContent(content);
      const result = parseDocument(doc);

      assert.strictEqual(result.views.length, 1);
      assert.strictEqual(result.views[0].type, "component");
      assert.strictEqual(result.views[0].scope, "web");
      assert.strictEqual(result.views[0].key, "ComponentKey");
      assert.strictEqual(result.views[0].line, 9);
    });

    test("parses deployment view", async () => {
      const content = [
        'workspace "Test" {',
        "  model {",
        '    sys = softwareSystem "System"',
        "  }",
        "  views {",
        "    deployment sys {",
        "      include *",
        "    }",
        "  }",
        "}",
      ].join("\n");
      const doc = await openDslContent(content);
      const result = parseDocument(doc);

      assert.strictEqual(result.views.length, 1);
      assert.strictEqual(result.views[0].type, "deployment");
      assert.strictEqual(result.views[0].scope, "sys");
      assert.strictEqual(result.views[0].line, 5);
    });

    test("parses dynamic view", async () => {
      const content = [
        'workspace "Test" {',
        "  model {",
        '    sys = softwareSystem "System"',
        "  }",
        "  views {",
        '    dynamic sys "DynamicKey" {',
        "    }",
        "  }",
        "}",
      ].join("\n");
      const doc = await openDslContent(content);
      const result = parseDocument(doc);

      assert.strictEqual(result.views.length, 1);
      assert.strictEqual(result.views[0].type, "dynamic");
      assert.strictEqual(result.views[0].scope, "sys");
      assert.strictEqual(result.views[0].key, "DynamicKey");
      assert.strictEqual(result.views[0].line, 5);
    });

    test("parses filtered view", async () => {
      const content = [
        'workspace "Test" {',
        "  model {",
        '    sys = softwareSystem "System"',
        "  }",
        "  views {",
        '    filtered "FilteredKey" {',
        "    }",
        "  }",
        "}",
      ].join("\n");
      const doc = await openDslContent(content);
      const result = parseDocument(doc);

      assert.strictEqual(result.views.length, 1);
      assert.strictEqual(result.views[0].type, "filtered");
      assert.strictEqual(result.views[0].key, "FilteredKey");
      assert.strictEqual(result.views[0].line, 5);
    });

    test("parses custom view", async () => {
      const content = [
        'workspace "Test" {',
        "  model {",
        '    sys = softwareSystem "System"',
        "  }",
        "  views {",
        '    custom "CustomKey" {',
        "    }",
        "  }",
        "}",
      ].join("\n");
      const doc = await openDslContent(content);
      const result = parseDocument(doc);

      assert.strictEqual(result.views.length, 1);
      assert.strictEqual(result.views[0].type, "custom");
      assert.strictEqual(result.views[0].key, "CustomKey");
      assert.strictEqual(result.views[0].line, 5);
    });
  });

  suite("Directive Parsing", () => {
    test("parses autoLayout with tb direction", async () => {
      const content = [
        'workspace "Test" {',
        "  model {",
        '    u = person "User"',
        "  }",
        "  views {",
        '    systemLandscape "Key" {',
        "      include *",
        "      autoLayout tb",
        "    }",
        "  }",
        "}",
      ].join("\n");
      const doc = await openDslContent(content);
      const result = parseDocument(doc);

      assert.strictEqual(result.views[0].autoLayout, "tb");
    });

    test("parses autoLayout with bt direction", async () => {
      const content = [
        'workspace "Test" {',
        "  model {",
        '    u = person "User"',
        "  }",
        "  views {",
        '    systemLandscape "Key" {',
        "      include *",
        "      autoLayout bt",
        "    }",
        "  }",
        "}",
      ].join("\n");
      const doc = await openDslContent(content);
      const result = parseDocument(doc);

      assert.strictEqual(result.views[0].autoLayout, "bt");
    });

    test("parses autoLayout with lr direction", async () => {
      const content = [
        'workspace "Test" {',
        "  model {",
        '    u = person "User"',
        "  }",
        "  views {",
        '    systemLandscape "Key" {',
        "      include *",
        "      autoLayout lr",
        "    }",
        "  }",
        "}",
      ].join("\n");
      const doc = await openDslContent(content);
      const result = parseDocument(doc);

      assert.strictEqual(result.views[0].autoLayout, "lr");
    });

    test("parses autoLayout with rl direction", async () => {
      const content = [
        'workspace "Test" {',
        "  model {",
        '    u = person "User"',
        "  }",
        "  views {",
        '    systemLandscape "Key" {',
        "      include *",
        "      autoLayout rl",
        "    }",
        "  }",
        "}",
      ].join("\n");
      const doc = await openDslContent(content);
      const result = parseDocument(doc);

      assert.strictEqual(result.views[0].autoLayout, "rl");
    });

    test("autoLayout defaults to tb when direction not specified", async () => {
      const content = [
        'workspace "Test" {',
        "  model {",
        '    u = person "User"',
        "  }",
        "  views {",
        '    systemLandscape "Key" {',
        "      include *",
        "      autoLayout",
        "    }",
        "  }",
        "}",
      ].join("\n");
      const doc = await openDslContent(content);
      const result = parseDocument(doc);

      assert.strictEqual(result.views[0].autoLayout, "tb");
    });
  });
});

suite("fast-check verification", () => {
  test("fast-check integration works", async () => {
    const fc = await import("fast-check");

    // Simple property test to verify fast-check works with the test framework
    await fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }),
        fc.integer({ min: 1, max: 100 }),
        (a, b) => {
          // Simple mathematical property: addition is commutative
          return a + b === b + a;
        },
      ),
      { numRuns: 10 }, // Small number for verification
    );
  });
});
