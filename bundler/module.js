const fs = require("fs");
const babel = require("@babel/core");

const resolveRequest = require("./resolver");

class Module {
  constructor(filePath) {
    this.filePath = filePath;
    this.content = fs.readFileSync(filePath, "utf-8");
    this.ast = babel.parseSync(this.content);
    this.dependencies = this.findDependencies();
  }

  static createModule(filePath) {
    return new Module(filePath);
  }

  findDependencies() {
    return this.ast.program.body
      .filter((node) => node.type === "ImportDeclaration")
      .map((node) => node.source.value)
      .map((relativePath) => resolveRequest(this.filePath, relativePath))
      .map((absolutePath) => Module.createModule(absolutePath));
  }

  transformModuleInterface() {
    const { types: t } = babel;
    const { filePath } = this;
    const { ast, code } = babel.transformFromAstSync(this.ast, this.content, {
      ast: true,
      plugins: [
        function () {
          return {
            visitor: {
              ImportDeclaration(path) {
                const properties = path.get("specifiers").map((specifier) => {
                  const imported = specifier.isImportDefaultSpecifier()
                    ? t.identifier("default")
                    : specifier.get("imported").node;
                  const local = specifier.get("local").node;

                  return t.objectProperty(imported, local, false, false);
                });
                path.replaceWith(
                  t.variableDeclaration("const", [
                    t.variableDeclarator(
                      t.objectPattern(properties),
                      t.callExpression(t.identifier("require"), [
                        t.stringLiteral(
                          resolveRequest(
                            filePath,
                            path.get("source.value").node
                          )
                        ),
                      ])
                    ),
                  ])
                );
              },
              ExportDefaultDeclaration(path) {
                path.replaceWith(
                  t.expressionStatement(
                    t.assignmentExpression(
                      "=",
                      t.memberExpression(
                        t.identifier("exports"),
                        t.identifier("default"),
                        false
                      ),
                      t.toExpression(path.get("declaration").node)
                    )
                  )
                );
              },
              ExportNamedDeclaration(path) {
                const declarations = [];
                if (path.has("declaration")) {
                  if (path.get("declaration").isFunctionDeclaration()) {
                    declarations.push({
                      name: path.get("declaration.id").node,
                      value: t.toExpression(path.get("declaration").node),
                    });
                  } else {
                    path
                      .get("declaration.declarations")
                      .forEach((declaration) => {
                        declarations.push({
                          name: declaration.get("id").node,
                          value: declaration.get("init").node,
                        });
                      });
                  }
                } else {
                  path.get("specifiers").forEach((specifier) => {
                    declarations.push({
                      name: specifier.get("exported").node,
                      value: specifier.get("local").node,
                    });
                  });
                }
                path.replaceWithMultiple(
                  declarations.map((decl) =>
                    t.expressionStatement(
                      t.assignmentExpression(
                        "=",
                        t.memberExpression(
                          t.identifier("exports"),
                          decl.name,
                          false
                        ),
                        decl.value
                      )
                    )
                  )
                );
              },
            },
          };
        },
      ],
    });
    this.ast = ast;
    this.content = code;
  }
}

module.exports = Module;
