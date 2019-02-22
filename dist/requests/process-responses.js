"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Processing of custom types from `paths` section
 * in the schema
 */
var _ = require("lodash");
var fs = require("fs");
var path = require("path");
var common_1 = require("../common");
var conf = require("../conf");
var definitions_1 = require("../definitions");
/**
 * Process all responses of one method
 * @param httpResponse response object
 * @param name of the context for type name uniqueness
 * @param config global config
 */
function processResponses(httpResponse, name, config) {
    var responses = _.filter(httpResponse, function (r, status) { return (r.schema && Math.floor(Number(status) / 100) === 2); });
    var properties = [];
    for (var _i = 0, responses_1 = responses; _i < responses_1.length; _i++) {
        var response = responses_1[_i];
        if (response.schema && response.schema.properties) {
            var processedDefinition = processNestedSchemaDefinition(response.schema, name, config);
            var propertyOutput = {
                property: "__model." + processedDefinition.name,
                propertyAsMethodParameter: '',
                enumDeclaration: undefined,
                native: false,
                isRequired: false,
            };
            properties.push(propertyOutput);
        }
        else {
            properties = properties.concat(common_1.processProperty(response.schema, undefined, name));
        }
    }
    var property = _.map(properties, 'property');
    var enumDeclaration = _.map(properties, 'enumDeclaration').filter(Boolean).join('\n\n');
    var usesGlobalType = properties.some(function (p) { return !p.native; });
    var type;
    if (property.length) {
        type = _.uniqWith(property, _.isEqual).join(' | ');
    }
    else {
        type = 'void';
    }
    return { type: type, enumDeclaration: enumDeclaration, usesGlobalType: usesGlobalType };
}
exports.processResponses = processResponses;
function processNestedSchemaDefinition(schema, name, config) {
    var processedDef = definitions_1.processDefinition(schema, name + "GeneratedInlineModel", config);
    var filename = path.join(config.dest, conf.modelFile + ".ts");
    var exportDefiniton = definitions_1.createExport(processedDef.name);
    fs.appendFileSync(filename, exportDefiniton + "\n");
    return processedDef;
}
//# sourceMappingURL=process-responses.js.map