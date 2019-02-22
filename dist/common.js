"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var _ = require("lodash");
var tsutils_1 = require("tsutils");
var conf = require("./conf");
var utils_1 = require("./utils");
/**
 * Processes one property of the type
 * @param prop property definition
 * @param name property name
 * @param namespace usage context for type name uniqueness
 */
function processProperty(prop, name, namespace, required, exportEnums) {
    if (name === void 0) { name = ''; }
    if (namespace === void 0) { namespace = ''; }
    if (required === void 0) { required = false; }
    if (exportEnums === void 0) { exportEnums = true; }
    var type;
    var enumDeclaration;
    var native = true;
    var isMap = false;
    if (prop.properties) {
        return _.flatMap(prop.properties, function (v, k) { return processProperty(v, k, namespace, prop.required); });
    }
    if (prop.enum || (prop.items && prop.items.enum)) {
        type = _.upperFirst(name);
        // file added to make the enum globally unique
        type += _.upperFirst(namespace);
        if (!type.match(/Enum/))
            type += 'Enum';
        var list = prop.enum || prop.items.enum;
        var exp = exportEnums ? 'export ' : '';
        enumDeclaration = exp + "type " + type + " =\n" + utils_1.indent('\'' + list.join('\' |\n\'')) + '\';';
        if (prop.type === 'array')
            type += '[]';
    }
    else {
        var defType = void 0;
        switch (prop.type) {
            case undefined:
                defType = translateType(prop.$ref);
                type = defType.type;
                break;
            case 'array':
                defType = translateType(prop.items.type || prop.items.$ref);
                if (defType.arraySimple)
                    type = defType.type + "[]";
                else
                    type = "Array<" + defType.type + ">";
                break;
            default:
                if (prop.additionalProperties) {
                    var ap = prop.additionalProperties;
                    var additionalType = void 0;
                    if (ap.type === 'array') {
                        defType = translateType(ap.items.type || ap.items.$ref);
                        additionalType = defType.type + "[]";
                    }
                    else {
                        defType = translateType(prop.additionalProperties.type ||
                            prop.additionalProperties.$ref);
                        additionalType = defType.type;
                    }
                    if (name) {
                        type = "{[key: string]: " + additionalType + "}";
                    }
                    else {
                        name = '[key: string]';
                        type = additionalType;
                        isMap = true;
                    }
                }
                else {
                    defType = translateType(prop.type);
                    type = defType.type;
                }
        }
        native = defType.native;
    }
    var optional = '';
    if (required === false && !isMap)
        optional = '?';
    else if (Array.isArray(required) && !required.includes(name)) {
        optional = '?';
    }
    var readOnly = '';
    if (prop.readOnly)
        readOnly = 'readonly ';
    var comments = [];
    if (prop.description)
        comments.push(prop.description);
    if (prop.example)
        comments.push("example: " + prop.example);
    if (prop.format)
        comments.push("format: " + prop.format);
    if (prop.default)
        comments.push("default: " + prop.default);
    var comment = utils_1.makeComment(comments);
    var property;
    var propertyAsMethodParameter;
    // pure type is returned if no name is specified
    if (name) {
        if (!isMap)
            name = getAccessor(name);
        property = "" + comment + readOnly + name + optional + ": " + type + ";";
        propertyAsMethodParameter = "" + name + optional + ": " + type;
    }
    else {
        property = "" + type;
        propertyAsMethodParameter = property;
    }
    return [{ property: property, propertyAsMethodParameter: propertyAsMethodParameter, enumDeclaration: enumDeclaration, native: native, isRequired: optional !== '?' }];
}
exports.processProperty = processProperty;
/**
 * - recursive inside-out unwrapping of generics
 * - space removal e.g.
 *   getFilename('PagedResources«Page«ItemCategoryDto»»') =>
 *               'ItemCategoryDtoPagePagedResources'
 * @param type original type name
 * @return normalized type name
 */
function normalizeDef(type) {
    var res = '';
    while (true) {
        var generic = type.match(/([^«]+)«(.+)»/);
        if (!generic) {
            break;
        }
        res = generic[1] + res;
        type = generic[2];
    }
    res = type + res;
    res = res.trim();
    res = res.replace(/\./g, ' ');
    if (res.match(/ /)) {
        res = _.camelCase(res);
    }
    res = _.upperFirst(res);
    return res;
}
exports.normalizeDef = normalizeDef;
/**
 * Translates schema type into native/defined type for typescript
 * @param type definition
 */
function translateType(type) {
    if (type in conf.nativeTypes) {
        var typeType = type;
        return {
            type: conf.nativeTypes[typeType],
            native: true,
            arraySimple: true,
        };
    }
    var subtype = type.match(/^#\/definitions\/(.*)/);
    if (subtype)
        return resolveDefType(subtype[1]);
    return { type: type, native: true, arraySimple: true };
}
exports.translateType = translateType;
/**
 * Checks whether the type should reference internally defined type
 * and returns its reference to globally exported interfaces
 * @param type
 */
function resolveDefType(type) {
    // check direct native types for definitions and generics
    // does not seem to happen but the function is ready for that
    if (type in conf.nativeTypes) {
        var typedType = type;
        return {
            type: conf.nativeTypes[typedType],
            native: true,
            arraySimple: true,
        };
    }
    type = normalizeDef(type);
    return {
        type: "__" + conf.modelFile + "." + type,
        native: false,
        arraySimple: true,
    };
}
function getAccessor(key, propName) {
    if (propName === void 0) { propName = ''; }
    var res = key;
    if (tsutils_1.isValidPropertyName(key)) {
        if (propName)
            return propName + "." + res;
        return res;
    }
    res = "'" + res + "'";
    if (propName)
        return propName + "[" + res + "]";
    return res;
}
exports.getAccessor = getAccessor;
function getObjectPropSetter(key, propName, suffix) {
    if (suffix === void 0) { suffix = ''; }
    return getAccessor(key) + ": " + getAccessor(key, propName) + suffix + ",";
}
exports.getObjectPropSetter = getObjectPropSetter;
//# sourceMappingURL=common.js.map