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
}

module.exports = Module;
