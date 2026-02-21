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

suite("Nested Structure Tests", () => {
  suite("Two-level nesting", () => {
    test("container nested in softwareSystem", async () => {
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

      // Should have 2 elements total
      assert.strictEqual(result.elements.length, 2);

      // Find the system and container
      const system = result.elements.find((e) => e.identifier === "sys");
      const container = result.elements.find((e) => e.identifier === "web");

      assert.ok(system, "System element not found");
      assert.ok(container, "Container element not found");

      // Verify types
      assert.strictEqual(system.type, "softwareSystem");
      assert.strictEqual(container.type, "container");

      // Verify both elements are parsed correctly
      assert.strictEqual(system.name, "System");
      assert.strictEqual(container.name, "Web App");
    });

    test("component nested in container", async () => {
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

      // Should have 3 elements total
      assert.strictEqual(result.elements.length, 3);

      // Find the container and component
      const container = result.elements.find((e) => e.identifier === "web");
      const component = result.elements.find((e) => e.identifier === "ctrl");

      assert.ok(container, "Container element not found");
      assert.ok(component, "Component element not found");

      // Verify types
      assert.strictEqual(container.type, "container");
      assert.strictEqual(component.type, "component");

      // Verify both elements are parsed correctly
      assert.strictEqual(container.name, "Web");
      assert.strictEqual(component.name, "Controller");
    });

    test("multiple containers in one system", async () => {
      const content = [
        'workspace "Test" {',
        "  model {",
        '    sys = softwareSystem "System" {',
        '      web = container "Web App"',
        '      api = container "API"',
        '      db = container "Database"',
        "    }",
        "  }",
        "}",
      ].join("\n");
      const doc = await openDslContent(content);
      const result = parseDocument(doc);

      // Should have 4 elements total (1 system + 3 containers)
      assert.strictEqual(result.elements.length, 4);

      // Find the system
      const system = result.elements.find((e) => e.identifier === "sys");
      assert.ok(system, "System element not found");

      // Verify all containers are parsed
      const containers = result.elements.filter((e) => e.type === "container");
      assert.strictEqual(containers.length, 3);

      const containerIds = containers.map((c) => c.identifier);
      assert.ok(containerIds.includes("web"));
      assert.ok(containerIds.includes("api"));
      assert.ok(containerIds.includes("db"));
    });

    test("multiple components in one container", async () => {
      const content = [
        'workspace "Test" {',
        "  model {",
        '    sys = softwareSystem "System" {',
        '      web = container "Web" {',
        '        ctrl = component "Controller"',
        '        svc = component "Service"',
        '        repo = component "Repository"',
        "      }",
        "    }",
        "  }",
        "}",
      ].join("\n");
      const doc = await openDslContent(content);
      const result = parseDocument(doc);

      // Should have 5 elements total (1 system + 1 container + 3 components)
      assert.strictEqual(result.elements.length, 5);

      // Find the container
      const container = result.elements.find((e) => e.identifier === "web");
      assert.ok(container, "Container element not found");

      // Verify all components are parsed
      const components = result.elements.filter((e) => e.type === "component");
      assert.strictEqual(components.length, 3);

      const componentIds = components.map((c) => c.identifier);
      assert.ok(componentIds.includes("ctrl"));
      assert.ok(componentIds.includes("svc"));
      assert.ok(componentIds.includes("repo"));
    });
  });

  suite("Three-level nesting", () => {
    test("system → container → component hierarchy", async () => {
      const content = [
        'workspace "Test" {',
        "  model {",
        '    sys = softwareSystem "System" {',
        '      web = container "Web" {',
        '        ctrl = component "Controller"',
        '        svc = component "Service"',
        "      }",
        '      db = container "Database"',
        "    }",
        "  }",
        "}",
      ].join("\n");
      const doc = await openDslContent(content);
      const result = parseDocument(doc);

      // Should have 5 elements total (1 system + 2 containers + 2 components)
      assert.strictEqual(result.elements.length, 5);

      // Find all elements
      const system = result.elements.find((e) => e.identifier === "sys");
      const webContainer = result.elements.find((e) => e.identifier === "web");
      const dbContainer = result.elements.find((e) => e.identifier === "db");
      const controller = result.elements.find((e) => e.identifier === "ctrl");
      const service = result.elements.find((e) => e.identifier === "svc");

      assert.ok(system, "System element not found");
      assert.ok(webContainer, "Web container not found");
      assert.ok(dbContainer, "Database container not found");
      assert.ok(controller, "Controller component not found");
      assert.ok(service, "Service component not found");

      // Verify types at each level
      assert.strictEqual(system.type, "softwareSystem");
      assert.strictEqual(webContainer.type, "container");
      assert.strictEqual(dbContainer.type, "container");
      assert.strictEqual(controller.type, "component");
      assert.strictEqual(service.type, "component");

      // Verify all elements are parsed with correct names
      assert.strictEqual(system.name, "System");
      assert.strictEqual(webContainer.name, "Web");
      assert.strictEqual(dbContainer.name, "Database");
      assert.strictEqual(controller.name, "Controller");
      assert.strictEqual(service.name, "Service");
    });
  });

  suite("Deployment and group nesting", () => {
    test("deploymentNode containing infrastructureNode", async () => {
      const content = [
        'workspace "Test" {',
        "  model {",
        '    node = deploymentNode "Server" {',
        '      lb = infrastructureNode "Load Balancer"',
        "    }",
        "  }",
        "}",
      ].join("\n");
      const doc = await openDslContent(content);
      const result = parseDocument(doc);

      // Should have 2 elements total
      assert.strictEqual(result.elements.length, 2);

      // Find the deployment node and infrastructure node
      const deploymentNode = result.elements.find(
        (e) => e.identifier === "node",
      );
      const infraNode = result.elements.find((e) => e.identifier === "lb");

      assert.ok(deploymentNode, "Deployment node not found");
      assert.ok(infraNode, "Infrastructure node not found");

      // Verify types
      assert.strictEqual(deploymentNode.type, "deploymentNode");
      assert.strictEqual(infraNode.type, "infrastructureNode");

      // Verify both elements are parsed correctly
      assert.strictEqual(deploymentNode.name, "Server");
      assert.strictEqual(infraNode.name, "Load Balancer");
    });

    test("group containing multiple elements", async () => {
      const content = [
        'workspace "Test" {',
        "  model {",
        '    group "Backend Services" {',
        '      api = softwareSystem "API"',
        '      db = softwareSystem "Database"',
        '      cache = softwareSystem "Cache"',
        "    }",
        "  }",
        "}",
      ].join("\n");
      const doc = await openDslContent(content);
      const result = parseDocument(doc);

      // Should have 4 elements total (1 group + 3 systems)
      assert.strictEqual(result.elements.length, 4);

      // Find the group
      const group = result.elements.find((e) => e.type === "group");
      assert.ok(group, "Group element not found");
      assert.strictEqual(group.name, "Backend Services");

      // Verify all systems are parsed
      const systems = result.elements.filter(
        (e) => e.type === "softwareSystem",
      );
      assert.strictEqual(systems.length, 3);

      const systemIds = systems.map((s) => s.identifier);
      assert.ok(systemIds.includes("api"));
      assert.ok(systemIds.includes("db"));
      assert.ok(systemIds.includes("cache"));
    });
  });

  suite("Line number tracking in nested structures", () => {
    test("line numbers correct at all nesting levels", async () => {
      const content = [
        'workspace "Test" {', // line 0
        "  model {", // line 1
        '    sys = softwareSystem "System" {', // line 2
        '      web = container "Web" {', // line 3
        '        ctrl = component "Controller"', // line 4
        '        svc = component "Service"', // line 5
        "      }", // line 6
        '      db = container "Database"', // line 7
        "    }", // line 8
        "  }", // line 9
        "}", // line 10
      ].join("\n");
      const doc = await openDslContent(content);
      const result = parseDocument(doc);

      // Find all elements
      const system = result.elements.find((e) => e.identifier === "sys");
      const webContainer = result.elements.find((e) => e.identifier === "web");
      const dbContainer = result.elements.find((e) => e.identifier === "db");
      const controller = result.elements.find((e) => e.identifier === "ctrl");
      const service = result.elements.find((e) => e.identifier === "svc");

      assert.ok(system, "System element not found");
      assert.ok(webContainer, "Web container not found");
      assert.ok(dbContainer, "Database container not found");
      assert.ok(controller, "Controller component not found");
      assert.ok(service, "Service component not found");

      // Verify line numbers match declaration lines
      assert.strictEqual(system.line, 2, "System line number incorrect");
      assert.strictEqual(
        webContainer.line,
        3,
        "Web container line number incorrect",
      );
      assert.strictEqual(
        controller.line,
        4,
        "Controller line number incorrect",
      );
      assert.strictEqual(service.line, 5, "Service line number incorrect");
      assert.strictEqual(
        dbContainer.line,
        7,
        "Database container line number incorrect",
      );
    });

    test("line numbers correct in deployment node nesting", async () => {
      const content = [
        'workspace "Test" {', // line 0
        "  model {", // line 1
        '    node = deploymentNode "Server" {', // line 2
        '      lb = infrastructureNode "Load Balancer"', // line 3
        "    }", // line 4
        "  }", // line 5
        "}", // line 6
      ].join("\n");
      const doc = await openDslContent(content);
      const result = parseDocument(doc);

      const deploymentNode = result.elements.find(
        (e) => e.identifier === "node",
      );
      const infraNode = result.elements.find((e) => e.identifier === "lb");

      assert.ok(deploymentNode, "Deployment node not found");
      assert.ok(infraNode, "Infrastructure node not found");

      assert.strictEqual(
        deploymentNode.line,
        2,
        "Deployment node line number incorrect",
      );
      assert.strictEqual(
        infraNode.line,
        3,
        "Infrastructure node line number incorrect",
      );
    });

    test("line numbers correct in group nesting", async () => {
      const content = [
        'workspace "Test" {', // line 0
        "  model {", // line 1
        '    group "Backend" {', // line 2
        '      api = softwareSystem "API"', // line 3
        '      db = softwareSystem "Database"', // line 4
        "    }", // line 5
        "  }", // line 6
        "}", // line 7
      ].join("\n");
      const doc = await openDslContent(content);
      const result = parseDocument(doc);

      const group = result.elements.find((e) => e.type === "group");
      const api = result.elements.find((e) => e.identifier === "api");
      const db = result.elements.find((e) => e.identifier === "db");

      assert.ok(group, "Group not found");
      assert.ok(api, "API system not found");
      assert.ok(db, "Database system not found");

      assert.strictEqual(group.line, 2, "Group line number incorrect");
      assert.strictEqual(api.line, 3, "API line number incorrect");
      assert.strictEqual(db.line, 4, "Database line number incorrect");
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
