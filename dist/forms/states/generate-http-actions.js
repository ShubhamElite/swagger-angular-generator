"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var _ = require("lodash");
var path = require("path");
var conf_1 = require("../../conf");
var utils_1 = require("../../utils");
function generateHttpActions(config, name, responseDef, actionClassNameBase, simpleName, formSubDirName, paramGroups) {
    var content = '';
    var hasParams = paramGroups.length >= 1;
    content += getActionImports(name, simpleName, hasParams, responseDef.type.startsWith('__model.'));
    content += getActionTypes(name, simpleName);
    content += getActionStartDefinition(simpleName, hasParams);
    content += getActionSuccessDefinition(responseDef);
    content += getActionErrorDefinition();
    content += getActionOverviewType(actionClassNameBase);
    var actionsFileName = path.join(formSubDirName, conf_1.stateDir, "actions.ts");
    utils_1.writeFile(actionsFileName, content, config.header, 'ts', ['max-line-length', 'max-classes-per-file']);
}
exports.generateHttpActions = generateHttpActions;
function getActionImports(name, simpleName, hasParams, importModels) {
    var res = "import {HttpErrorResponse} from '@angular/common/http';\n";
    res += "import {Action} from '@ngrx/store';\n";
    if (hasParams) {
        res += "import {" + _.upperFirst(simpleName) + "Params} from '../../../../controllers/" + name + "';\n";
    }
    if (importModels)
        res += "import * as __model from '../../../../model';\n";
    res += "\n";
    return res;
}
function getActionTypes(controllerName, methodName) {
    var res = "export enum Actions {\n";
    res += utils_1.indent([
        "START = '[" + controllerName + " " + methodName + "] Start',",
        "SUCCESS = '[" + controllerName + " " + methodName + "] Success',",
        "ERROR = '[" + controllerName + " " + methodName + "] Error',",
    ]);
    res += "\n}\n\n";
    return res;
}
function getActionStartDefinition(name, hasParams) {
    var res = "export class Start implements Action {\n";
    res += utils_1.indent("readonly type = Actions.START;\n");
    var params = hasParams ? "public payload: " + _.upperFirst(name) + "Params" : '';
    res += utils_1.indent("constructor(" + params + ") {}\n");
    res += "}\n";
    res += "\n";
    return res;
}
function getActionSuccessDefinition(response) {
    var res = "export class Success implements Action {\n";
    res += utils_1.indent("readonly type = Actions.SUCCESS;\n");
    res += utils_1.indent("constructor(public payload: " + response.type + ") {}\n");
    res += "}\n";
    res += "\n";
    return res;
}
function getActionErrorDefinition() {
    var res = "export class Error implements Action {\n";
    res += utils_1.indent("readonly type = Actions.ERROR;\n");
    res += utils_1.indent("constructor(public payload: HttpErrorResponse) {}\n");
    res += "}\n";
    res += "\n";
    return res;
}
function getActionOverviewType(actionClassNameBase) {
    return "export type " + actionClassNameBase + "Action = Start | Success | Error;\n";
}
function getActionClassNameBase(name) {
    return getClassName(name);
}
exports.getActionClassNameBase = getActionClassNameBase;
function getClassName(name) {
    return _.upperFirst(name);
}
exports.getClassName = getClassName;
//# sourceMappingURL=generate-http-actions.js.map