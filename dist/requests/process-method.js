"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Processing of custom types from `paths` section
 * in the schema
 */
var lodash_1 = require("lodash");
var common_1 = require("../common");
var conf = require("../conf");
var utils_1 = require("../utils");
var process_params_1 = require("./process-params");
/**
 * Transforms method definition to typescript method
 * with single typed param object that is separated into several objects
 * and passed to api service
 * @param method data needed for method processing
 * @param unwrapSingleParamMethods boolean
 */
function processMethod(method, unwrapSingleParamMethods) {
    var methodDef = '';
    var interfaceDef = '';
    var url = method.url.replace(/{([^}]+)}/g, function (_, key) { return "${" + common_1.getAccessor(key, 'pathParams') + "}"; });
    var allowed = conf.allowedParams[method.methodName];
    var paramSeparation = [];
    var paramsSignature = '';
    var params;
    var usesGlobalType = false;
    var paramTypes = [];
    var paramGroups = {};
    var splitParamsMethod = '';
    var simpleName = method.simpleName;
    var methodName = method.methodName;
    if (method.paramDef) {
        var paramDef = method.paramDef.filter(function (df) { return allowed.includes(df.in); });
        paramGroups = lodash_1.groupBy(paramDef, 'in');
        var paramsType = lodash_1.upperFirst(method.simpleName + "Params");
        var processedParams = process_params_1.processParams(paramDef, paramsType);
        paramTypes = Object.keys(paramGroups);
        paramSeparation = getParamSeparation(paramGroups);
        paramsSignature = getParamsSignature(processedParams, paramsType);
        usesGlobalType = processedParams.usesGlobalType;
        interfaceDef = getInterfaceDef(processedParams);
        if (unwrapSingleParamMethods && processedParams.typesOnly.length > 0 && paramDef.length === 1) {
            splitParamsMethod = getSplitParamsMethod(method, processedParams);
        }
    }
    params = getRequestParams(paramTypes, method.methodName);
    methodDef += '\n';
    methodDef += utils_1.makeComment([method.summary, method.description, method.swaggerUrl].filter(Boolean));
    methodDef += method.simpleName + "(" + paramsSignature + "): Observable<" + method.responseDef.type + "> {\n";
    // apply the param definitions, e.g. bodyParams
    methodDef += utils_1.indent(paramSeparation);
    if (paramSeparation.length)
        methodDef += '\n';
    var body = "return this.http." + method.methodName + "<" + method.responseDef.type + ">" +
        ("(`" + method.basePath + url + "`" + params + ");");
    methodDef += utils_1.indent(body);
    methodDef += "\n";
    methodDef += "}";
    methodDef += splitParamsMethod;
    if (method.responseDef.enumDeclaration) {
        if (interfaceDef)
            interfaceDef += '\n';
        interfaceDef += method.responseDef.enumDeclaration + "\n";
    }
    var responseDef = method.responseDef;
    return { methodDef: methodDef, interfaceDef: interfaceDef, usesGlobalType: usesGlobalType, paramGroups: paramGroups, responseDef: responseDef, simpleName: simpleName, methodName: methodName };
}
exports.processMethod = processMethod;
function getSplitParamsMethod(method, processedParams) {
    var splitParamsMethod = '';
    var splitParamsSignature = getSplitParamsSignature(processedParams);
    splitParamsMethod += "\n" + method.simpleName + "_(" + splitParamsSignature + "): Observable<" + method.responseDef.type + "> {\n";
    var propAssignments = getPropertyAssignments(method.paramDef);
    splitParamsMethod += utils_1.indent("return this." + method.simpleName + "(" + propAssignments + ");\n");
    splitParamsMethod += '}\n';
    return splitParamsMethod;
}
/**
 * Creates a definition of paramsSignature, which serves as input to http methods
 * @param processedParams
 * @param paramsType
 */
function getParamsSignature(processedParams, paramsType) {
    return !processedParams.isInterfaceEmpty ? "params: " + paramsType : '';
}
function getSplitParamsSignature(paramsOutput) {
    return paramsOutput.typesOnly;
}
function getPropertyAssignments(params) {
    return '{' + params.map(function (p) { return p.name; }).join(', ') + '}';
}
/**
 * Creates a definition of interfaceDef, which defines interface for the http method input
 * @param processedParams
 */
function getInterfaceDef(processedParams) {
    return !processedParams.isInterfaceEmpty ? processedParams.paramDef : '';
}
/**
 * Creates a definition of pathParams, bodyParams, queryParms or formDataParams
 * @param paramGroups
 */
function getParamSeparation(paramGroups) {
    return lodash_1.map(paramGroups, function (group, groupName) {
        var baseDef;
        var def;
        var list = lodash_1.map(group, function (p) {
            // header params values need to be strings
            var suffix = groupName === 'header' && p.type !== 'string' ?
                '.toString()' :
                '';
            return common_1.getObjectPropSetter(p.name, 'params', suffix);
        });
        if (groupName === 'query') {
            baseDef = '{\n' + utils_1.indent(list) + '\n};';
            def = "const queryParamBase = " + baseDef + "\n\n";
            def += 'let queryParams = new HttpParams();\n';
            def += 'Object.entries(queryParamBase).forEach(([key, value]: [string, any]) => {\n';
            def += '  if (value !== undefined) {\n';
            def += '    if (typeof value === \'string\') queryParams = queryParams.set(key, value);\n';
            def += '    else queryParams = queryParams.set(key, JSON.stringify(value));\n';
            def += '  }\n';
            def += '});\n';
            return def;
        }
        if (groupName === 'body') {
            // when the schema: { '$ref': '#/definitions/exampleDto' } construct is used
            if ('schema' in group[0]) {
                def = "params." + group[0].name + ";";
            }
            else {
                def = '{\n' + utils_1.indent(list) + '\n};';
            }
            // bodyParams keys with value === undefined are removed
            var res = "const " + groupName + "Params = " + def + "\n";
            res += 'const bodyParamsWithoutUndefined: any = {};\n';
            res += 'Object.entries(bodyParams || {}).forEach(([key, value]: [string, any]) => {\n';
            res += '  if (value !== undefined) bodyParamsWithoutUndefined[key] = value;\n';
            res += '});';
            return res;
        }
        def = '{\n' + utils_1.indent(list) + '\n}';
        if (groupName === 'header') {
            def = "new HttpHeaders(" + def + ")";
        }
        def += ';';
        return "const " + groupName + "Params = " + def;
    });
}
/**
 * Returns a list of additional params for http client call invocation
 * @param paramTypes list of params types
 * @param methodName name of http method to invoke
 */
function getRequestParams(paramTypes, methodName) {
    var res = '';
    if (['post', 'put', 'patch'].includes(methodName)) {
        if (paramTypes.includes('body')) {
            res += ', bodyParamsWithoutUndefined';
        }
        else if (paramTypes.includes('formData')) {
            res += ', formDataParams';
        }
        else {
            res += ', {}';
        }
    }
    var optionParams = [];
    if (paramTypes.includes('query')) {
        optionParams.push('params: queryParams');
    }
    if (paramTypes.includes('header')) {
        optionParams.push('headers: headerParams');
    }
    if (optionParams.length)
        res += ", {" + optionParams.join(', ') + "}";
    return res;
}
//# sourceMappingURL=process-method.js.map