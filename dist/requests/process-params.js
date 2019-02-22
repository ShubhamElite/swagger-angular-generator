"use strict";
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Processing of custom types from `paths` section
 * in the schema
 */
var _ = require("lodash");
var common_1 = require("../common");
var utils_1 = require("../utils");
/**
 * Transforms input parameters to interfaces definition
 * @param def definition
 * @param paramsType name of the type
 */
function processParams(def, paramsType) {
    var paramDef = '';
    var typesOnly = '';
    paramDef += "export interface " + paramsType + " {\n";
    var params = _.map(def, function (p) { return common_1.processProperty(parameterToSchema(p), p.name, paramsType, p.required)[0]; });
    var isInterfaceEmpty = !params.length;
    var usesGlobalType = params.some(function (p) { return !p.native; });
    paramDef += utils_1.indent(_.map(params, 'property'));
    paramDef += "\n";
    paramDef += "}\n";
    var enums = _.map(params, 'enumDeclaration').filter(Boolean);
    if (enums.length) {
        paramDef += "\n";
        paramDef += enums.join('\n\n');
        paramDef += "\n";
    }
    params.sort(function (p1, p2) { return (p1.isRequired ? 0 : 1) - (p2.isRequired ? 0 : 1); });
    typesOnly = params.map(function (p) { return p.propertyAsMethodParameter; }).join(', ');
    return { paramDef: paramDef, typesOnly: typesOnly, usesGlobalType: usesGlobalType, isInterfaceEmpty: isInterfaceEmpty };
}
exports.processParams = processParams;
// TODO! use required array to set the variable
// TODO might be unnecessary for v3.0+ of OpenAPI spec
// https://swagger.io/specification/#parameterObject
function parameterToSchema(param) {
    return __assign({
        allowEmptyValue: param.allowEmptyValue,
        default: param.default,
        description: param.description,
        enum: param.enum,
        format: param.format,
        items: param.items,
        maximum: param.maximum,
        maxLength: param.maxLength,
        minimum: param.minimum,
        minLength: param.minLength,
        pattern: param.pattern,
        type: param.type,
        uniqueItems: param.uniqueItems,
    }, param.schema);
}
exports.parameterToSchema = parameterToSchema;
//# sourceMappingURL=process-params.js.map