"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var _ = require("lodash");
var nodePath = require("path");
var common_1 = require("../common");
var conf_1 = require("../conf");
var process_params_1 = require("../requests/process-params");
var utils_1 = require("../utils");
function generateFormService(config, name, params, definitions, simpleName, formSubDirName, className) {
    var content = '';
    var formName = 'form';
    var constructor = getConstructor(name, formName, definitions, params);
    content += getImports(name, constructor);
    content += "@Injectable()\n";
    content += "export class " + className + "FormService {\n";
    content += utils_1.indent(formName + ": FormGroup;\n");
    content += constructor;
    content += getFormSubmitFunction(name, formName, simpleName, params);
    content += '}\n';
    var componentHTMLFileName = nodePath.join(formSubDirName, simpleName + ".service.ts");
    utils_1.writeFile(componentHTMLFileName, content, config.header);
}
exports.generateFormService = generateFormService;
function getImports(name, constructor) {
    var imports = [];
    if (constructor.match(/new FormControl\(/))
        imports.push('FormControl');
    if (constructor.match(/new FormGroup\(/))
        imports.push('FormGroup');
    if (constructor.match(/\[Validators\./))
        imports.push('Validators');
    var res = 'import {Injectable} from \'@angular/core\';\n';
    if (imports.length)
        res += "import {" + imports.join(', ') + "} from '@angular/forms';\n";
    if (constructor.match(/new FormArrayExtended\(/)) {
        res += "import {FormArrayExtended} from '../../../common/formArrayExtended';\n";
    }
    if (constructor.match(/new FormMap\(/)) {
        res += "import {FormMap} from '../../../common/formMap';\n";
    }
    res += "import {" + name + "Service} from '../../../controllers/" + name + "';\n";
    res += '\n';
    return res;
}
function getConstructor(name, formName, definitions, params) {
    var res = utils_1.indent('constructor(\n');
    res += utils_1.indent("private " + _.lowerFirst(name) + "Service: " + name + "Service,\n", 2);
    res += utils_1.indent(') {\n');
    var definitionsMap = _.groupBy(definitions, 'name');
    var formDefinition = walkParamOrProp(params, definitionsMap);
    res += utils_1.indent("this." + formName + " = new FormGroup({\n" + formDefinition + "\n});\n", 2);
    res += utils_1.indent('}\n');
    res += '\n';
    return res;
}
function walkParamOrProp(definition, definitions, parentTypes) {
    if (parentTypes === void 0) { parentTypes = []; }
    var res = [];
    var schema = {};
    var required;
    // create unified inputs for
    // 1. parameters
    if (Array.isArray(definition)) {
        schema = {};
        required = [];
        definition.forEach(function (param) {
            if (param.required)
                required.push(param.name);
            schema[param.name] = process_params_1.parameterToSchema(param);
        });
        // 2. properties
    }
    else if (definition.def.properties) {
        required = definition.def.required;
        schema = definition.def.properties;
    }
    // walk the list and build recursive form model
    Object.entries(schema).forEach(function (_a) {
        var paramName = _a[0], param = _a[1];
        var isRequired = required && required.includes(paramName);
        var fieldDefinition = makeField(param, paramName, isRequired, definitions, parentTypes);
        if (fieldDefinition)
            res.push(fieldDefinition);
    });
    return utils_1.indent(res);
}
function makeField(param, name, required, definitions, parentTypes) {
    var newParentTypes = parentTypes.slice();
    if (!param.type) {
        var ref = param.$ref;
        var refType = ref.replace(/^#\/definitions\//, '');
        var defType = common_1.normalizeDef(refType);
        param = definitions[defType][0].def;
        // break type definition chain with cycle
        if (parentTypes.indexOf(ref) >= 0)
            return;
        if (ref)
            newParentTypes = newParentTypes.concat([ref]);
    }
    var type = param.type;
    if (type in conf_1.nativeTypes)
        type = conf_1.nativeTypes[type];
    var control;
    var initializer;
    if (type === 'array') {
        control = 'FormArrayExtended';
        initializer = "() => ";
        var controlInstance = makeField(param.items, undefined, required, definitions, newParentTypes);
        initializer += "(\n" + utils_1.indent(controlInstance) + "), []";
    }
    else if (type === 'object') {
        var def = {
            name: '',
            def: param,
        };
        if (param.additionalProperties) {
            control = 'FormMap';
            initializer = "() => ";
            var controlInstance = makeField(param.additionalProperties, undefined, required, definitions, newParentTypes);
            initializer += "(\n" + utils_1.indent(controlInstance) + "), {}";
        }
        else {
            var fields = walkParamOrProp(def, definitions, newParentTypes);
            control = 'FormGroup';
            initializer = "{\n" + fields + "\n}";
        }
    }
    else {
        control = 'FormControl';
        initializer = typeof param.default === 'string' ? "'" + param.default + "'" : param.default;
    }
    var validators = getValidators(param);
    if (required)
        validators.push('Validators.required');
    var res = "new " + control + "(" + initializer + ", [" + validators.join(', ') + "])";
    if (name) {
        name = common_1.getAccessor(name);
        res = name + ": " + res + ",";
    }
    return res;
}
function getValidators(param) {
    var validators = [];
    if (param.format && param.format === 'email')
        validators.push('Validators.email');
    if (param.maximum)
        validators.push("Validators.max(" + param.maximum + ")");
    if (param.minimum)
        validators.push("Validators.min(" + param.minimum + ")");
    if (param.maxLength)
        validators.push("Validators.maxLength(" + param.maxLength + ")");
    if (param.minLength)
        validators.push("Validators.minLength(" + param.minLength + ")");
    if (param.pattern)
        validators.push("Validators.pattern(/" + param.pattern + "/)");
    return validators;
}
function getFormSubmitFunction(name, formName, simpleName, paramGroups) {
    var rawParam = paramGroups.length ? 'raw = false' : '';
    var res = utils_1.indent("submit(" + rawParam + ") {\n");
    if (paramGroups.length) {
        res += utils_1.indent([
            'const data = raw ?',
            utils_1.indent([
                "this." + formName + ".getRawValue() :",
                "this." + formName + ".value;",
            ]),
        ], 2);
        res += '\n';
    }
    var params = paramGroups.length ? "data" : '';
    res += utils_1.indent("return this." + _.lowerFirst(name) + "Service." + simpleName + "(" + params + ");\n", 2);
    res += utils_1.indent('}\n');
    return res;
}
//# sourceMappingURL=generate-form-service.js.map