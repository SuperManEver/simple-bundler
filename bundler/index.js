const fs = require("fs");
const path = require("path");
const Module = require("./module");

function build({ entryFile, outputFolder }) {
  // build dependency graph
  const graph = createDependencyGraph(entryFile);

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

function bundle(graph) {
  const modules = collectModules(graph);
  const moduleMap = toModuleMap(modules);
  console.log(moduleMap);

  return [];
}

function collectModules(graph) {
  const modules = [];
  collect(graph, modules);
  return modules;

  function collect(module, modules) {
    modules.push(module);
    module.dependencies.forEach((dependency) => collect(dependency, modules));
  }
}

function toModuleMap(modules) {
  let moduleMap = "";
  moduleMap += "{";

  for (const module of modules) {
    module.transformModuleInterface();
    moduleMap += `function(exports, require) { ${module.content} },`;
  }

  moduleMap += "}";
  return moduleMap;
}

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
