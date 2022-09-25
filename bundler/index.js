const fs = require("fs");
const path = require("path");
const Module = require("./module");

function build({ entryFile, outputFolder }) {
  // build dependency graph
  const graph = createDependencyGraph(entryFile);

  return;

  // bundle the asset
  const outputFiles = bundle(graph);
  // write to output folder
  for (const outputFile of outputFiles) {
    fs.writeFileSync(
      path.join(outputFolder, outputFile.name),
      outputFile.content,
      "utf-8"
    );
  }
}

function createDependencyGraph(entryFile) {
  const rootModule = Module.createModule(entryFile);
  return rootModule;
}

// function createModule(filePath) {
//   return new Module(filePath);
// }

const entryPath = path.resolve(__dirname, "..", "src", "index.js");
const outDir = path.resolve(__dirname, "..", "build");

/**
 * probably temporary
 */
function run() {
  console.log("---------------- RUN BUNDLER ------------------");

  build({ entryFile: entryPath, outputFolder: outDir });
}

run();
