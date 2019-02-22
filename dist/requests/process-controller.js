"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Processing of custom types from `paths` section
 * in the schema
 */
var _ = require("lodash");
var path = require("path");
var conf = require("../conf");
var generate_form_modules_1 = require("../forms/generate-form-modules");
var utils_1 = require("../utils");
var process_method_1 = require("./process-method");
var process_responses_1 = require("./process-responses");
/**
 * Creates and serializes class for api communication for controller
 * @param controllers list of methods of the controller
 * @param name
 */
function processController(methods, name, config, definitions) {
    var filename = path.join(config.dest, conf.apiDir, name + ".ts");
    var usesGlobalType = false;
    // make simpleNames unique and process responses
    var simpleNames = _.map(methods, 'simpleName');
    methods.forEach(function (controller) {
        if (simpleNames.filter(function (n) { return n === controller.simpleName; }).length > 1) {
            var preserveCapitals = controller.operationId.replace(/([A-Z])/g, '-$1');
            controller.simpleName = _.lowerFirst(_.camelCase(preserveCapitals));
        }
        controller.responseDef = process_responses_1.processResponses(controller.responses, controller.simpleName, config);
        usesGlobalType = usesGlobalType || controller.responseDef.usesGlobalType;
    });
    var processedMethods = methods.map(function (m) { return process_method_1.processMethod(m, config.unwrapSingleParamMethods); });
    usesGlobalType = usesGlobalType || processedMethods.some(function (c) { return c.usesGlobalType; });
    var content = '';
    var angularCommonHttp = ['HttpClient'];
    if (processedMethods.some(function (c) { return 'header' in c.paramGroups; })) {
        angularCommonHttp.push('HttpHeaders');
    }
    if (processedMethods.some(function (c) { return 'query' in c.paramGroups; })) {
        angularCommonHttp.push('HttpParams');
    }
    content += "import {" + angularCommonHttp.join(', ') + "} from '@angular/common/http';\n";
    content += 'import {Injectable} from \'@angular/core\';\n';
    content += 'import {Observable} from \'rxjs\';\n\n';
    if (usesGlobalType) {
        content += "import * as __" + conf.modelFile + " from '../" + conf.modelFile + "';\n\n";
    }
    var interfaceDef = _.map(processedMethods, 'interfaceDef').filter(Boolean).join('\n');
    if (interfaceDef) {
        content += interfaceDef;
        content += '\n';
    }
    content += "@Injectable()\n";
    content += "export class " + name + "Service {\n";
    content += utils_1.indent('constructor(private http: HttpClient) {}');
    content += '\n';
    content += utils_1.indent(_.map(processedMethods, 'methodDef').join('\n\n'));
    content += '\n}\n';
    if (conf.adHocExceptions.api[name]) {
        content = content.replace(conf.adHocExceptions.api[name][0], conf.adHocExceptions.api[name][1]);
    }
    // controllers
    utils_1.writeFile(filename, content, config.header);
    // forms
    if (config.generateStore) {
        generate_form_modules_1.createForms(config, name, processedMethods, definitions);
    }
}
exports.processController = processController;
//# sourceMappingURL=process-controller.js.map