"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var _ = require("lodash");
var path = require("path");
var conf = require("../conf");
var utils_1 = require("../utils");
// TODO! rename
var generate_form_service_1 = require("./generate-form-service");
var process_module_1 = require("./process-module");
var shared_module_1 = require("./shared-module");
var generate_http_actions_1 = require("./states/generate-http-actions");
var generate_http_effects_1 = require("./states/generate-http-effects");
var generate_http_reducers_1 = require("./states/generate-http-reducers");
function createForms(config, name, processedMethods, definitions) {
    var kebabName = _.kebabCase(name);
    var formBaseDir = path.join(config.dest, conf.storeDir);
    var formDirName = path.join(formBaseDir, "" + kebabName);
    utils_1.createDir(formDirName);
    var _loop_1 = function (processedMethod) {
        var paramGroups = processedMethod.paramGroups;
        var responseDef = processedMethod.responseDef;
        var simpleName = processedMethod.simpleName;
        var formSubDirName = path.join(formBaseDir, "" + kebabName, simpleName);
        utils_1.createDir(formSubDirName);
        var formParams = [];
        Object.values(paramGroups).forEach(function (params) {
            formParams = formParams.concat(params);
        });
        var actionClassNameBase = generate_http_actions_1.getActionClassNameBase(simpleName);
        var className = generate_http_actions_1.getClassName(simpleName);
        var generateForms = formParams.length >= 1;
        if (generateForms) {
            // component.ts
            generate_form_service_1.generateFormService(config, name, formParams, definitions, simpleName, formSubDirName, className);
        }
        // states
        var statesDirName = path.join(formSubDirName, conf.stateDir);
        utils_1.createDir(statesDirName);
        // actions.ts
        generate_http_actions_1.generateHttpActions(config, name, responseDef, actionClassNameBase, simpleName, formSubDirName, formParams);
        // reducers.ts
        generate_http_reducers_1.generateHttpReducers(config, name, actionClassNameBase, formSubDirName, responseDef.type);
        // effects.ts
        generate_http_effects_1.generateHttpEffects(config, name, simpleName, actionClassNameBase, formSubDirName, formParams);
        // form-shared-module.ts
        shared_module_1.createSharedModule(config);
        // module.ts
        process_module_1.createModule(config, name, actionClassNameBase, formSubDirName, simpleName, className, generateForms);
    };
    for (var _i = 0, processedMethods_1 = processedMethods; _i < processedMethods_1.length; _i++) {
        var processedMethod = processedMethods_1[_i];
        _loop_1(processedMethod);
    }
}
exports.createForms = createForms;
//# sourceMappingURL=generate-form-modules.js.map