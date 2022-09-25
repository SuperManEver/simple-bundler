const fs = require("fs");
const babel = require("@babel/core");

class Module {
  constructor(filePath) {
    this.filePath = filePath;
    this.content = fs.readFileSync(filePath, "utf-8");
    this.ast = babel.parseSync(this.content);
    // this.dependencies = [];

    console.log(this.ast);
  }
}

module.exports = Module;
