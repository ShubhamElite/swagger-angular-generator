"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
var conf = require("./conf");
/**
 * Checks if directory exists
 * @param path
 */
function doesDirExist(path) {
    try {
        return fs.statSync(path).isDirectory();
    }
    catch (e) {
        if (e.code === 'ENOENT') {
            return false;
        }
        else {
            throw e;
        }
    }
}
/**
 * Creates directory based on provided path
 * @param path
 */
function createDir(path) {
    if (!doesDirExist(path))
        fs.mkdirSync(path);
}
exports.createDir = createDir;
/**
 * Recursively deletes the path and optionally creates self as an empty directory
 * @param path
 * @param removeSelf whether to remove the directory itself or just its content
 */
function emptyDir(path, removeSelf) {
    if (removeSelf === void 0) { removeSelf = false; }
    if (!fs.existsSync(path)) {
        if (!removeSelf)
            fs.mkdirSync(path);
        return;
    }
    fs.readdirSync(path).forEach(function (file) {
        var current = path + "/" + file;
        if (fs.lstatSync(current).isDirectory())
            emptyDir(current, removeSelf);
        else
            fs.unlinkSync(current);
    });
    if (removeSelf)
        fs.rmdirSync(path);
}
exports.emptyDir = emptyDir;
/**
 * Indents the input
 * @param input string (with new-line separation) or array of lines
 * @param level of indentation, takes into account `conf` indentation setting
 */
function indent(input, level) {
    if (level === void 0) { level = 1; }
    if (Array.isArray(input))
        input = input.join('\n');
    var res;
    res = input.replace(/^/gm, ' '.repeat(level * conf.indentation));
    res = res.replace(/^\s+$/gm, '');
    return res;
}
exports.indent = indent;
/**
 * Serializes the content to the file including global header
 * @param file
 * @param content
 */
function writeFile(file, content, header, fileType, disableFlags) {
    if (header === void 0) { header = ''; }
    if (fileType === void 0) { fileType = 'ts'; }
    if (fileType === 'ts') {
        if (!disableFlags)
            disableFlags = ['max-line-length'];
        var disable = '';
        if (disableFlags.length)
            disable = "/* tslint:disable:" + disableFlags.join(' ') + " */\n";
        if (header)
            header += '\n';
        content = "" + disable + header + content;
    }
    fs.writeFileSync(file, content);
    out(file + " generated", TermColors.green);
}
exports.writeFile = writeFile;
/**
 * Makes the string commented, supports single/multi-line and empty output
 * @param input string (with new-line separation) or array of lines
 */
function makeComment(input) {
    if (Array.isArray(input))
        input = input.join('\n');
    input = input.split('\n');
    var res = '';
    if (input.length > 1) {
        res = input.map(function (c) { return c ? " * " + c : ' *'; }).join('\n');
        res = "/**\n" + res + "\n */\n";
    }
    else if (input.length && input[0]) {
        res = "/** " + input[0] + " */\n";
    }
    return res;
}
exports.makeComment = makeComment;
/**
 * Creates a unified header for all serialized files
 * @param schemaDef input schema header
 * @param swaggerUrlPath the path where the swagger ui definition can be found
 * @param version should API version info be included in generated files
 */
function processHeader(schemaDef, omitVersion) {
    if (omitVersion === void 0) { omitVersion = false; }
    var relevant = {
        info: schemaDef.info,
        path: schemaDef.host + (schemaDef.basePath || ''),
    };
    if (omitVersion)
        delete relevant.info.version;
    var res = JSON.stringify(relevant, null, conf.indentation);
    res = res.replace(/^[{}]$/gm, '');
    res = res.replace(/^\s*"[^"]+": [{"]/gm, '');
    res = res.replace(/["}],?$/gm, '');
    res = res.split('\n').filter(function (l) { return l.match(/\w/); }).join('\n');
    return makeComment(res);
}
exports.processHeader = processHeader;
var TermColors;
(function (TermColors) {
    TermColors["green"] = "\u001B[32m";
    TermColors["red"] = "\u001B[31m";
    TermColors["default"] = "\u001B[0m";
})(TermColors = exports.TermColors || (exports.TermColors = {}));
/**
 * Outputs text in optional color
 * @param text
 * @param color
 */
function out(text, color) {
    if (Array.isArray(text))
        text = text.join('\n');
    if (color)
        text = "" + color + text + TermColors.default;
    process.stdout.write(text + "\n");
}
exports.out = out;
/**
 * From others it filters out duplicate elements which are included in favoured.
 * Duplicates = same values for keys.
 * @param favoured
 * @param others
 * @param keys
 */
function merge(favoured, others) {
    var keys = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        keys[_i - 2] = arguments[_i];
    }
    var othersFiltered = others
        .filter(function (elem) {
        return !favoured.find(function (subElem) { return keys
            .map(function (k) { return elem[k] === subElem[k]; })
            .every(Boolean); });
    });
    return favoured.concat(othersFiltered);
}
exports.merge = merge;
//# sourceMappingURL=utils.js.map