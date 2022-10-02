const fs = require("fs");
const path = require("path");
const Module = require("./module");
const { trim } = require("./utils");

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
  const moduleCode = addRuntime(moduleMap, modules[0].filePath);

  return [{ name: "bundle.js", content: moduleCode }];
}

function addRuntime(moduleMap, entryPoint) {
  const runtimeAsString = `
  const modules = ${moduleMap};
  const entry = "${entryPoint}";
  
  function webpackStart({ modules, entry }) {
    const moduleCache = {};
    const require = moduleName => {
      // if in cache, return the cached version
      if (moduleCache[moduleName]) {
        return moduleCache[moduleName];
      }
      const exports = {};
      // this will prevent infinite "require" loop
      // from circular dependencies
      moduleCache[moduleName] = exports;
  
      // "require"-ing the module,
      // exported stuff will assigned to "exports"
      modules[moduleName](exports, require);
      return moduleCache[moduleName];
    };
  
    // start the program
    require(entry);
  }

  webpackStart({ modules, entry });`;

  return trim(runtimeAsString);
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
    moduleMap += `"${module.filePath}": function(exports, require) { ${module.content} },`;
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
