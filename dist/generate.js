"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/** Generator of API models (interfaces) from BE API json */
var fs = require("fs");
var path = require("path");
var conf = require("./conf");
var axios_1 = require("axios");
var generate_1 = require("./common/generate");
var definitions_1 = require("./definitions");
var process_paths_1 = require("./requests/process-paths");
var utils_1 = require("./utils");
/**
 * Generates API layer for the project based on src to dest
 * @param src source swagger json schema
 * @param dest destination directory
 * @param generateStore decides if redux workflow should be generated
 * @param unwrapSingleParamMethods controls if the single param methods should be generated
 * @param swaggerUrlPath the path where the swagger ui definition can be found
 * @param omitVersion shouldn't generate API version info to generated files
 */
function generate(src, dest, generateStore, unwrapSingleParamMethods, swaggerUrlPath, omitVersion) {
    if (src === void 0) { src = conf.apiFile; }
    if (dest === void 0) { dest = conf.outDir; }
    if (generateStore === void 0) { generateStore = true; }
    if (unwrapSingleParamMethods === void 0) { unwrapSingleParamMethods = false; }
    if (swaggerUrlPath === void 0) { swaggerUrlPath = conf.swaggerUrlPath; }
    if (omitVersion === void 0) { omitVersion = false; }
    axios_1.default.get(src)
        .then(function (response) {
        var schema = response.data;
        // normalize basePath, strip trailing '/'s
        var basePath = schema.basePath;
        if (typeof basePath === 'string') {
            schema.basePath = basePath.replace(/\/+$/, '');
        }
        else
            schema.basePath = '';
        recreateDirectories(dest, generateStore);
        var header = utils_1.processHeader(schema, omitVersion);
        var config = { header: header, dest: dest, generateStore: generateStore, unwrapSingleParamMethods: unwrapSingleParamMethods };
        generateCommon(path.join(dest, conf.commonDir), generateStore);
        if (!fs.existsSync(dest))
            fs.mkdirSync(dest);
        var definitions = definitions_1.processDefinitions(schema.definitions, config);
        process_paths_1.processPaths(schema.paths, "http://" + schema.host + swaggerUrlPath + conf.swaggerFile, config, definitions, schema.basePath);
    })
        .catch(function (error) {
        if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            console.log(error.response.data);
            console.log(error.response.status);
            console.log(error.response.headers);
        }
        else if (error.request) {
            // The request was made but no response was received
            // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
            // http.ClientRequest in node.js
            console.log(error.request);
        }
        else {
            // Something happened in setting up the request that triggered an Error
            console.log('Error', error.message);
        }
        console.log(error);
    });
}
exports.generate = generate;
function recreateDirectories(dest, generateStore) {
    utils_1.emptyDir(path.join(dest, conf.commonDir), true);
    utils_1.emptyDir(path.join(dest, conf.defsDir), true);
    utils_1.emptyDir(path.join(dest, conf.apiDir), true);
    utils_1.emptyDir(path.join(dest, conf.storeDir), true);
    utils_1.createDir(path.join(dest, conf.commonDir));
    utils_1.createDir(path.join(dest, conf.defsDir));
    utils_1.createDir(path.join(dest, conf.apiDir));
    if (generateStore)
        utils_1.createDir(path.join(dest, conf.storeDir));
}
/** Generates common classes, methods, utils */
function generateCommon(dest, generateStore) {
    generate_1.addUtils(dest);
    if (generateStore)
        generate_1.addFormExtensions(dest);
}
//# sourceMappingURL=generate.js.map