import * as assert from "assert";
import * as vscode from "vscode";
import * as path from "path";
import { parseDocument, ParsedWorkspace } from "../parser";

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

      const user = result.elements.find((e) => e.identifier === "u");
      assert.ok(user, "User element should exist");
      assert.strictEqual(user.type, "person");
      assert.strictEqual(user.name, "User");

      const sys = result.elements.find((e) => e.identifier === "ss");
      assert.ok(sys, "System element should exist");
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

suite("Context-Aware Parsing Tests", () => {
  // Tests that verify keywords with multiple meanings are interpreted correctly
  // based on their location in the DSL (model block vs views block)

  suite("Keyword disambiguation", () => {
    test('"container" in model block is parsed as element', async () => {
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

      // Should have 2 elements: system and container
      assert.strictEqual(result.elements.length, 2);

      // Find the container element
      const container = result.elements.find((e) => e.identifier === "web");
      assert.ok(container, "Container element not found");
      assert.strictEqual(container.type, "container");
      assert.strictEqual(container.identifier, "web");
      assert.strictEqual(container.name, "Web App");
    });

    test('"container" in views block is parsed as view', async () => {
      const content = [
        'workspace "Test" {',
        "  model {",
        '    sys = softwareSystem "System" {',
        '      web = container "Web App"',
        "    }",
        "  }",
        "  views {",
        '    container sys "ContainerView" {',
        "      include *",
        "    }",
        "  }",
        "}",
      ].join("\n");
      const doc = await openDslContent(content);
      const result = parseDocument(doc);

      // Should have 1 view
      assert.strictEqual(result.views.length, 1);

      // Verify the view is a container view
      assert.strictEqual(result.views[0].type, "container");
      assert.strictEqual(result.views[0].scope, "sys");
      assert.strictEqual(result.views[0].key, "ContainerView");

      // Should still have 2 elements (system and container from model block)
      assert.strictEqual(result.elements.length, 2);
    });

    test('"component" in model block is parsed as element', async () => {
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

      // Should have 3 elements: system, container, and component
      assert.strictEqual(result.elements.length, 3);

      // Find the component element
      const component = result.elements.find((e) => e.identifier === "ctrl");
      assert.ok(component, "Component element not found");
      assert.strictEqual(component.type, "component");
      assert.strictEqual(component.identifier, "ctrl");
      assert.strictEqual(component.name, "Controller");
    });

    test('"component" in views block is parsed as view', async () => {
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
        '    component web "ComponentView" {',
        "      include *",
        "    }",
        "  }",
        "}",
      ].join("\n");
      const doc = await openDslContent(content);
      const result = parseDocument(doc);

      // Should have 1 view
      assert.strictEqual(result.views.length, 1);

      // Verify the view is a component view
      assert.strictEqual(result.views[0].type, "component");
      assert.strictEqual(result.views[0].scope, "web");
      assert.strictEqual(result.views[0].key, "ComponentView");

      // Should still have 3 elements (system, container, component from model block)
      assert.strictEqual(result.elements.length, 3);
    });
  });

  suite("Relationship scope", () => {
    test("relationships in model block are parsed", async () => {
      const content = [
        'workspace "Test" {',
        "  model {",
        '    a = softwareSystem "System A"',
        '    b = softwareSystem "System B"',
        '    c = softwareSystem "System C"',
        '    a -> b "Uses" "HTTPS"',
        '    b -> c "Sends data to"',
        "  }",
        "}",
      ].join("\n");
      const doc = await openDslContent(content);
      const result = parseDocument(doc);

      // Should have 2 relationships
      assert.strictEqual(result.relationships.length, 2);

      // Verify first relationship
      assert.strictEqual(result.relationships[0].source, "a");
      assert.strictEqual(result.relationships[0].target, "b");
      assert.strictEqual(result.relationships[0].description, "Uses");
      assert.strictEqual(result.relationships[0].technology, "HTTPS");

      // Verify second relationship
      assert.strictEqual(result.relationships[1].source, "b");
      assert.strictEqual(result.relationships[1].target, "c");
      assert.strictEqual(result.relationships[1].description, "Sends data to");
    });

    test("relationship-like syntax outside model block is ignored", async () => {
      const content = [
        'workspace "Test" {',
        "  model {",
        '    a = softwareSystem "System A"',
        '    b = softwareSystem "System B"',
        '    a -> b "Valid relationship"',
        "  }",
        "  views {",
        '    systemLandscape "Landscape" {',
        "      include *",
        "      // This arrow syntax in views should not be parsed as a relationship",
        "      // a -> b",
        "    }",
        "  }",
        "}",
      ].join("\n");
      const doc = await openDslContent(content);
      const result = parseDocument(doc);

      // Should only have 1 relationship (from model block)
      assert.strictEqual(result.relationships.length, 1);
      assert.strictEqual(result.relationships[0].source, "a");
      assert.strictEqual(result.relationships[0].target, "b");
      assert.strictEqual(
        result.relationships[0].description,
        "Valid relationship",
      );
    });

    test("relationships in nested model elements are parsed", async () => {
      const content = [
        'workspace "Test" {',
        "  model {",
        '    sys = softwareSystem "System" {',
        '      web = container "Web"',
        '      api = container "API"',
        '      db = container "Database"',
        '      web -> api "Calls"',
        '      api -> db "Reads from"',
        "    }",
        "  }",
        "}",
      ].join("\n");
      const doc = await openDslContent(content);
      const result = parseDocument(doc);

      // Should have 2 relationships
      assert.strictEqual(result.relationships.length, 2);

      // Verify relationships
      const webToApi = result.relationships.find(
        (r) => r.source === "web" && r.target === "api",
      );
      const apiToDb = result.relationships.find(
        (r) => r.source === "api" && r.target === "db",
      );

      assert.ok(webToApi, "web -> api relationship not found");
      assert.strictEqual(webToApi.description, "Calls");

      assert.ok(apiToDb, "api -> db relationship not found");
      assert.strictEqual(apiToDb.description, "Reads from");
    });
  });

  suite("Element scope", () => {
    test("elements in views block are not parsed as model elements", async () => {
      const content = [
        'workspace "Test" {',
        "  model {",
        '    sys = softwareSystem "System" {',
        '      web = container "Web"',
        "    }",
        '    user = person "User"',
        "  }",
        "  views {",
        '    container sys "ContainerView" {',
        "      include *",
        "      // View-specific directives should not create elements",
        "    }",
        "  }",
        "}",
      ].join("\n");
      const doc = await openDslContent(content);
      const result = parseDocument(doc);

      // Should only have 3 elements from model block (sys, web, user)
      assert.strictEqual(result.elements.length, 3);

      // Verify element identifiers
      const elementIds = result.elements.map((e) => e.identifier);
      assert.ok(elementIds.includes("sys"));
      assert.ok(elementIds.includes("web"));
      assert.ok(elementIds.includes("user"));

      // Should have 1 view
      assert.strictEqual(result.views.length, 1);
    });

    test("only model block elements are included in elements array", async () => {
      const content = [
        'workspace "Test" {',
        "  model {",
        '    a = softwareSystem "System A"',
        '    b = softwareSystem "System B"',
        "  }",
        "  views {",
        '    systemLandscape "Landscape" {',
        "      include *",
        "    }",
        '    systemContext a "Context" {',
        "      include *",
        "    }",
        "  }",
        "}",
      ].join("\n");
      const doc = await openDslContent(content);
      const result = parseDocument(doc);

      // Should only have 2 elements from model block
      assert.strictEqual(result.elements.length, 2);
      assert.strictEqual(result.elements[0].identifier, "a");
      assert.strictEqual(result.elements[1].identifier, "b");

      // Should have 2 views
      assert.strictEqual(result.views.length, 2);
    });

    test("views block with include directives does not create elements", async () => {
      const content = [
        'workspace "Test" {',
        "  model {",
        '    sys = softwareSystem "System"',
        "  }",
        "  views {",
        '    systemContext sys "Context" {',
        "      include *",
        "      include sys",
        "      autoLayout lr",
        "    }",
        "  }",
        "}",
      ].join("\n");
      const doc = await openDslContent(content);
      const result = parseDocument(doc);

      // Should only have 1 element from model block
      assert.strictEqual(result.elements.length, 1);
      assert.strictEqual(result.elements[0].identifier, "sys");

      // Should have 1 view
      assert.strictEqual(result.views.length, 1);
      assert.strictEqual(result.views[0].type, "systemContext");
    });
  });
});

suite("Progressive Complexity Tests", () => {
  // Tests that validate parser behavior from simple to complex scenarios
  // using test files with increasing complexity levels

  const fixturesDir = path.resolve(
    __dirname,
    "..",
    "..",
    "src",
    "test",
    "fixtures",
  );

  test("minimal complexity: single element, no relationships, no views", async () => {
    const doc = await openDslDocument(path.join(fixturesDir, "minimal.strz"));
    const result = parseDocument(doc);

    // Verify workspace name
    assert.strictEqual(result.name, "Minimal");

    // Should have exactly one element
    assert.strictEqual(result.elements.length, 1);
    assert.strictEqual(result.elements[0].type, "person");
    assert.strictEqual(result.elements[0].identifier, "user");
    assert.strictEqual(result.elements[0].name, "User");

    // Should have no relationships
    assert.strictEqual(result.relationships.length, 0);

    // Should have no views
    assert.strictEqual(result.views.length, 0);
  });

  test("simple complexity: multiple elements, basic relationships, one view", async () => {
    const doc = await openDslDocument(path.join(fixturesDir, "simple.strz"));
    const result = parseDocument(doc);

    // Verify workspace name
    assert.strictEqual(result.name, "Simple");

    // Should have 2 elements
    assert.strictEqual(result.elements.length, 2);

    // Verify elements
    const user = result.elements.find((e) => e.identifier === "user");
    const system = result.elements.find((e) => e.identifier === "system");

    assert.ok(user, "User element not found");
    assert.strictEqual(user.type, "person");
    assert.strictEqual(user.name, "User");

    assert.ok(system, "System element not found");
    assert.strictEqual(system.type, "softwareSystem");
    assert.strictEqual(system.name, "System");

    // Should have 1 relationship
    assert.strictEqual(result.relationships.length, 1);
    assert.strictEqual(result.relationships[0].source, "user");
    assert.strictEqual(result.relationships[0].target, "system");
    assert.strictEqual(result.relationships[0].description, "Uses");

    // Should have 1 view
    assert.strictEqual(result.views.length, 1);
    assert.strictEqual(result.views[0].type, "systemLandscape");
    assert.strictEqual(result.views[0].key, "Landscape");
  });

  test("nested complexity: two-level nesting with correct parent-child associations", async () => {
    const doc = await openDslDocument(path.join(fixturesDir, "nested.strz"));
    const result = parseDocument(doc);

    // Verify workspace name
    assert.strictEqual(result.name, "Nested");

    // Should have 3 elements (1 system + 2 containers)
    assert.strictEqual(result.elements.length, 3);

    // Verify system element
    const system = result.elements.find((e) => e.identifier === "system");
    assert.ok(system, "System element not found");
    assert.strictEqual(system.type, "softwareSystem");
    assert.strictEqual(system.name, "System");

    // Verify container elements
    const web = result.elements.find((e) => e.identifier === "web");
    const db = result.elements.find((e) => e.identifier === "db");

    assert.ok(web, "Web container not found");
    assert.strictEqual(web.type, "container");
    assert.strictEqual(web.name, "Web App");

    assert.ok(db, "Database container not found");
    assert.strictEqual(db.type, "container");
    assert.strictEqual(db.name, "Database");

    // Should have 1 view
    assert.strictEqual(result.views.length, 1);
    assert.strictEqual(result.views[0].type, "container");
    assert.strictEqual(result.views[0].scope, "system");
    assert.strictEqual(result.views[0].key, "Containers");
  });

  test("complex complexity: three-level nesting, multiple views, autoLayout directives", async () => {
    const doc = await openDslDocument(path.join(fixturesDir, "complex.strz"));
    const result = parseDocument(doc);

    // Verify workspace name
    assert.strictEqual(result.name, "Complex");

    // Should have 6 elements (1 system + 2 containers + 2 components + 1 person)
    assert.strictEqual(result.elements.length, 6);

    // Verify system element
    const system = result.elements.find((e) => e.identifier === "system");
    assert.ok(system, "System element not found");
    assert.strictEqual(system.type, "softwareSystem");
    assert.strictEqual(system.name, "System");

    // Verify container elements
    const web = result.elements.find((e) => e.identifier === "web");
    const db = result.elements.find((e) => e.identifier === "db");

    assert.ok(web, "Web container not found");
    assert.strictEqual(web.type, "container");
    assert.strictEqual(web.name, "Web App");

    assert.ok(db, "Database container not found");
    assert.strictEqual(db.type, "container");
    assert.strictEqual(db.name, "Database");

    // Verify component elements (three-level nesting)
    const controller = result.elements.find(
      (e) => e.identifier === "controller",
    );
    const service = result.elements.find((e) => e.identifier === "service");

    assert.ok(controller, "Controller component not found");
    assert.strictEqual(controller.type, "component");
    assert.strictEqual(controller.name, "Controller");

    assert.ok(service, "Service component not found");
    assert.strictEqual(service.type, "component");
    assert.strictEqual(service.name, "Service");

    // Verify person element
    const user = result.elements.find((e) => e.identifier === "user");
    assert.ok(user, "User element not found");
    assert.strictEqual(user.type, "person");
    assert.strictEqual(user.name, "User");

    // Should have 1 relationship
    assert.strictEqual(result.relationships.length, 1);
    assert.strictEqual(result.relationships[0].source, "user");
    assert.strictEqual(result.relationships[0].target, "system");
    assert.strictEqual(result.relationships[0].description, "Uses");

    // Should have 3 views
    assert.strictEqual(result.views.length, 3);

    // Verify systemContext view with autoLayout lr
    const contextView = result.views.find((v) => v.type === "systemContext");
    assert.ok(contextView, "SystemContext view not found");
    assert.strictEqual(contextView.scope, "system");
    assert.strictEqual(contextView.key, "Context");
    assert.strictEqual(contextView.autoLayout, "lr");

    // Verify container view with autoLayout tb
    const containerView = result.views.find((v) => v.type === "container");
    assert.ok(containerView, "Container view not found");
    assert.strictEqual(containerView.scope, "system");
    assert.strictEqual(containerView.key, "Containers");
    assert.strictEqual(containerView.autoLayout, "tb");

    // Verify component view
    const componentView = result.views.find((v) => v.type === "component");
    assert.ok(componentView, "Component view not found");
    assert.strictEqual(componentView.scope, "web");
    assert.strictEqual(componentView.key, "Components");
    assert.strictEqual(componentView.autoLayout, undefined);
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

suite("Edge Cases and Error Handling Tests", () => {
  // Tests that verify the parser handles edge cases and malformed input gracefully
  // The parser is designed as a permissive extractor, not a validator
  // It should handle malformed input without crashing and return valid structures

  suite("Missing identifier tests", () => {
    // Tests for elements without identifiers or names

    test("element without identifier uses name as identifier", async () => {
      const content = [
        'workspace "Test" {',
        "  model {",
        '    person "User"',
        '    softwareSystem "System"',
        "  }",
        "}",
      ].join("\n");
      const doc = await openDslContent(content);
      const result = parseDocument(doc);

      // Should have 2 elements
      assert.strictEqual(result.elements.length, 2);

      // Find the person element
      const person = result.elements.find((e) => e.type === "person");
      assert.ok(person, "Person element not found");
      assert.strictEqual(person.name, "User");
      // Identifier should be the name with spaces removed
      assert.strictEqual(person.identifier, "User");

      // Find the system element
      const system = result.elements.find((e) => e.type === "softwareSystem");
      assert.ok(system, "System element not found");
      assert.strictEqual(system.name, "System");
      assert.strictEqual(system.identifier, "System");
    });

    test("element without identifier or name graceful handling", async () => {
      const content = [
        'workspace "Test" {',
        "  model {",
        '    u = person "User"',
        "    softwareSystem",
        "  }",
        "}",
      ].join("\n");
      const doc = await openDslContent(content);
      const result = parseDocument(doc);

      // Parser should not crash and should parse the valid element
      assert.ok(result, "Parser should return a result");

      // Should have at least the valid person element
      const person = result.elements.find((e) => e.identifier === "u");
      assert.ok(person, "Valid person element should be parsed");
      assert.strictEqual(person.name, "User");
    });

    test("verify no empty identifiers in parsed results", async () => {
      const content = [
        'workspace "Test" {',
        "  model {",
        '    u = person "User"',
        '    sys = softwareSystem "System" {',
        '      web = container "Web App"',
        "    }",
        '    person "Another User"',
        "  }",
        "}",
      ].join("\n");
      const doc = await openDslContent(content);
      const result = parseDocument(doc);

      // Verify no elements have empty identifiers
      const emptyIds = result.elements.filter((e) => e.identifier === "");
      assert.strictEqual(
        emptyIds.length,
        0,
        `Found elements with empty identifiers on lines: ${emptyIds.map((e) => e.line + 1).join(", ")}`,
      );

      // All elements should have identifiers
      result.elements.forEach((e) => {
        assert.ok(
          e.identifier && e.identifier.length > 0,
          `Element on line ${e.line + 1} has empty identifier`,
        );
      });
    });
  });

  suite("Malformed input tests", () => {
    // Tests for DSL with syntax errors or invalid constructs

    test("DSL with only comments returns empty workspace", async () => {
      const content = [
        "// This is a comment",
        "// Another comment",
        "/* Block comment */",
        "// workspace would go here",
      ].join("\n");
      const doc = await openDslContent(content);
      const result = parseDocument(doc);

      // Parser should not crash
      assert.ok(result, "Parser should return a result");

      // Should return empty workspace
      assert.strictEqual(result.elements.length, 0);
      assert.strictEqual(result.relationships.length, 0);
      assert.strictEqual(result.views.length, 0);
    });

    test("DSL with unmatched braces no crash", async () => {
      const content = [
        'workspace "Test" {',
        "  model {",
        '    u = person "User"',
        "    // Missing closing brace for model",
        "  // Missing closing brace for workspace",
      ].join("\n");
      const doc = await openDslContent(content);

      // Parser should not crash with unmatched braces
      let result: ParsedWorkspace | undefined;
      assert.doesNotThrow(() => {
        result = parseDocument(doc);
      }, "Parser should not throw on unmatched braces");

      // Should still parse the valid element
      assert.ok(result, "Parser should return a result");
      const person = result.elements.find((e) => e.identifier === "u");
      assert.ok(person, "Valid element should still be parsed");
    });

    test("autoLayout with invalid direction graceful handling", async () => {
      const content = [
        'workspace "Test" {',
        "  model {",
        '    u = person "User"',
        "  }",
        "  views {",
        '    systemLandscape "Key" {',
        "      include *",
        "      autoLayout invalid",
        "    }",
        "  }",
        "}",
      ].join("\n");
      const doc = await openDslContent(content);

      // Parser should not crash with invalid autoLayout direction
      let result: ParsedWorkspace | undefined;
      assert.doesNotThrow(() => {
        result = parseDocument(doc);
      }, "Parser should not throw on invalid autoLayout direction");

      // Should still parse the view
      assert.ok(result, "Parser should return a result");
      assert.strictEqual(result.views.length, 1);

      // Invalid direction defaults to tb (the parser regex matches 'autoLayout'
      // and uses the default when no valid direction is captured)
      assert.strictEqual(result.views[0].autoLayout, "tb");
    });

    test("verify no unhandled exceptions for all malformed input", async () => {
      const malformedInputs = [
        // Missing quotes
        'workspace Test { model { u = person "User" } }',
        // Incomplete element declaration
        'workspace "Test" { model { person } }',
        // Invalid relationship syntax
        'workspace "Test" { model { a = person "A" b = person "B" a > b } }',
        // Nested braces without proper structure
        'workspace "Test" { { { model { } } } }',
        // Mixed valid and invalid content
        'workspace "Test" { model { u = person "User" invalid syntax here sys = softwareSystem "Sys" } }',
      ];

      for (const content of malformedInputs) {
        const doc = await openDslContent(content);

        // Parser should not throw exceptions for any malformed input
        assert.doesNotThrow(
          () => {
            const result = parseDocument(doc);
            assert.ok(result, "Parser should return a result");
          },
          `Parser should not throw on malformed input: ${content.substring(0, 50)}...`,
        );
      }
    });
  });

  suite("Undefined reference tests", () => {
    // Tests for relationships and views referencing non-existent identifiers

    test("relationship with undefined source/target still parses structure", async () => {
      const content = [
        'workspace "Test" {',
        "  model {",
        '    a = softwareSystem "System A"',
        "    // b is not defined",
        '    a -> b "Uses undefined target"',
        '    c -> a "Undefined source uses defined target"',
        '    x -> y "Both undefined"',
        "  }",
        "}",
      ].join("\n");
      const doc = await openDslContent(content);
      const result = parseDocument(doc);

      // Parser should not crash and should parse all relationships
      assert.ok(result, "Parser should return a result");

      // Should have 1 element (only 'a' is defined)
      assert.strictEqual(result.elements.length, 1);
      assert.strictEqual(result.elements[0].identifier, "a");

      // Should have 3 relationships (parser doesn't validate references)
      assert.strictEqual(result.relationships.length, 3);

      // Verify first relationship (a -> b)
      const rel1 = result.relationships.find(
        (r) => r.source === "a" && r.target === "b",
      );
      assert.ok(rel1, "Relationship with undefined target should be parsed");
      assert.strictEqual(rel1.description, "Uses undefined target");

      // Verify second relationship (c -> a)
      const rel2 = result.relationships.find(
        (r) => r.source === "c" && r.target === "a",
      );
      assert.ok(rel2, "Relationship with undefined source should be parsed");
      assert.strictEqual(
        rel2.description,
        "Undefined source uses defined target",
      );

      // Verify third relationship (x -> y)
      const rel3 = result.relationships.find(
        (r) => r.source === "x" && r.target === "y",
      );
      assert.ok(rel3, "Relationship with both undefined should be parsed");
      assert.strictEqual(rel3.description, "Both undefined");
    });

    test("view with undefined scope still parses structure", async () => {
      const content = [
        'workspace "Test" {',
        "  model {",
        '    sys = softwareSystem "System"',
        "  }",
        "  views {",
        '    systemContext sys "ValidScope" {',
        "      include *",
        "    }",
        '    systemContext undefinedSystem "InvalidScope" {',
        "      include *",
        "    }",
        '    container nonExistent "UndefinedContainer" {',
        "      include *",
        "    }",
        "  }",
        "}",
      ].join("\n");
      const doc = await openDslContent(content);
      const result = parseDocument(doc);

      // Parser should not crash
      assert.ok(result, "Parser should return a result");

      // Should have 1 element
      assert.strictEqual(result.elements.length, 1);

      // Should have 3 views (parser doesn't validate scope references)
      assert.strictEqual(result.views.length, 3);

      // Verify first view (valid scope)
      const view1 = result.views.find(
        (v) => v.type === "systemContext" && v.scope === "sys",
      );
      assert.ok(view1, "View with valid scope should be parsed");
      assert.strictEqual(view1.key, "ValidScope");

      // Verify second view (undefined scope)
      const view2 = result.views.find(
        (v) => v.type === "systemContext" && v.scope === "undefinedSystem",
      );
      assert.ok(view2, "View with undefined scope should be parsed");
      assert.strictEqual(view2.key, "InvalidScope");

      // Verify third view (undefined container scope)
      const view3 = result.views.find(
        (v) => v.type === "container" && v.scope === "nonExistent",
      );
      assert.ok(view3, "Container view with undefined scope should be parsed");
      assert.strictEqual(view3.key, "UndefinedContainer");
    });
  });

  suite("Multi-line and escaped quote tests", () => {
    // Tests for element declarations spanning multiple lines and escaped quotes

    test("element declaration spanning multiple lines", async () => {
      const content = [
        'workspace "Test" {',
        "  model {",
        '    u = person "User" "A user',
        "      who spans multiple",
        '      lines"',
        '    sys = softwareSystem "System"',
        "  }",
        "}",
      ].join("\n");
      const doc = await openDslContent(content);
      const result = parseDocument(doc);

      // Parser should handle multi-line declarations
      // Note: The current parser implementation uses line-by-line regex matching,
      // so multi-line strings may not be fully supported. This test documents
      // the current behavior.
      assert.ok(result, "Parser should return a result");

      // Should parse at least the single-line element
      const system = result.elements.find((e) => e.identifier === "sys");
      assert.ok(system, "Single-line element should be parsed");
      assert.strictEqual(system.name, "System");
    });

    test("string literals with escaped quotes", async () => {
      const content = [
        'workspace "Test" {',
        "  model {",
        '    u = person "User" "Description with \\\\"escaped\\\\" quotes"',
        '    sys = softwareSystem "System" "It\'s a system"',
        "  }",
        "}",
      ].join("\n");
      const doc = await openDslContent(content);
      const result = parseDocument(doc);

      // Parser should handle escaped quotes
      // Note: The current parser uses simple regex patterns that may not
      // fully handle escaped quotes. This test documents the current behavior.
      assert.ok(result, "Parser should return a result");

      // Should parse elements even if escaped quotes aren't fully handled
      assert.ok(
        result.elements.length > 0,
        "Should parse at least some elements",
      );

      // Verify elements are parsed
      const user = result.elements.find((e) => e.identifier === "u");
      const system = result.elements.find((e) => e.identifier === "sys");

      // At minimum, the parser should not crash
      assert.ok(user || system, "At least one element should be parsed");
    });

    test("element with description containing special characters", async () => {
      const content = [
        'workspace "Test" {',
        "  model {",
        '    u = person "User" "Description with: colons, commas, and (parentheses)"',
        '    sys = softwareSystem "System" "Uses HTTP/HTTPS protocols"',
        '    api = softwareSystem "API" "Handles JSON & XML data"',
        "  }",
        "}",
      ].join("\n");
      const doc = await openDslContent(content);
      const result = parseDocument(doc);

      // Parser should handle special characters in descriptions
      assert.ok(result, "Parser should return a result");
      assert.strictEqual(result.elements.length, 3);

      // Verify elements are parsed correctly
      const user = result.elements.find((e) => e.identifier === "u");
      const system = result.elements.find((e) => e.identifier === "sys");
      const api = result.elements.find((e) => e.identifier === "api");

      assert.ok(user, "User element should be parsed");
      assert.strictEqual(user.name, "User");

      assert.ok(system, "System element should be parsed");
      assert.strictEqual(system.name, "System");

      assert.ok(api, "API element should be parsed");
      assert.strictEqual(api.name, "API");
    });
  });
});
