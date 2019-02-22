"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Processing of custom types from `definitions` section
 * in the schema
 */
var _ = require("lodash");
var path = require("path");
var common_1 = require("./common");
var conf = require("./conf");
var utils_1 = require("./utils");
/**
 * Entry point, processes all definitions and exports them
 * to individual files
 * @param defs definitions from the schema
 * @param config global configuration
 */
function processDefinitions(defs, config) {
    utils_1.emptyDir(path.join(config.dest, conf.defsDir));
    var definitions = [];
    var files = {};
    _.forOwn(defs, function (v, source) {
        var file = processDefinition(v, source, config);
        if (file && file.name) {
            var previous = files[file.name];
            if (previous === undefined)
                files[file.name] = [source];
            else
                previous.push(source);
            definitions.push(file);
        }
    });
    var allExports = '';
    _.forOwn(files, function (sources, def) {
        allExports += createExport(def) + createExportComments(def, sources) + '\n';
    });
    writeToBaseModelFile(config, allExports);
    return definitions;
}
exports.processDefinitions = processDefinitions;
function writeToBaseModelFile(config, allExports) {
    var filename = path.join(config.dest, conf.modelFile + ".ts");
    utils_1.writeFile(filename, allExports, config.header);
}
exports.writeToBaseModelFile = writeToBaseModelFile;
/**
 * Creates the file of the type definition
 * @param def type definition
 * @param name name of the type definition and after normalization of the resulting interface + file
 */
function processDefinition(def, name, config) {
    name = common_1.normalizeDef(name);
    var output = '';
    if (def.type === 'array') {
        var property = common_1.processProperty(def)[0];
        if (!property.native) {
            output += "import * as __" + conf.modelFile + " from '../" + conf.modelFile + "';\n\n";
        }
        if (def.description)
            output += "/** " + def.description + " */\n";
        output += "export type " + name + " = " + property.property + ";\n";
    }
    else if (def.properties || def.additionalProperties) {
        var properties = common_1.processProperty(def, undefined, name);
        // conditional import of global types
        if (properties.some(function (p) { return !p.native; })) {
            output += "import * as __" + conf.modelFile + " from '../" + conf.modelFile + "';\n\n";
        }
        if (def.description)
            output += "/** " + def.description + " */\n";
        output += "export interface " + name + " {\n";
        output += utils_1.indent(_.map(properties, 'property').join('\n'));
        output += "\n}\n";
        // concat non-empty enum lines
        var enumLines = _.map(properties, 'enumDeclaration').filter(Boolean).join('\n\n');
        if (enumLines)
            output += "\n" + enumLines + "\n";
    }
    else if (def.type === 'string' && def.enum) {
        output += "export type " + name + " = " + def.enum.map(function (enumValue) { return "'" + enumValue + "'"; }).join(' | ') + ";";
        output += "\n";
        output += "\n";
        output += "export const " + name + " = {\n";
        output += def.enum.map(function (enumValue) {
            return utils_1.indent(enumValue.charAt(0).toUpperCase() + enumValue.slice(1) + ": '" + enumValue + "' as " + name + ",");
        }).join('\n');
        output += "\n};\n";
    }
    var filename = path.join(config.dest, conf.defsDir, name + ".ts");
    utils_1.writeFile(filename, output, config.header);
    return { name: name, def: def };
}
exports.processDefinition = processDefinition;
/**
 * Creates single export line for `def` name
 * @param def name of the definition file w/o extension
 */
function createExport(def) {
    return "export * from './" + conf.defsDir + "/" + def + "';";
}
exports.createExport = createExport;
/**
 * Creates comment naming source definitions for the export
 * @param def name of the definition file w/o extension
 * @param sources list of sources for the file
 */
function createExportComments(file, sources) {
    if (sources.length > 1 || !sources.includes(file)) {
        return ' // sources: ' + sources.join(', ');
    }
    return '';
}
//# sourceMappingURL=definitions.js.map