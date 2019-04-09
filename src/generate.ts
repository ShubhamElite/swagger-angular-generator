/** Generator of API models (interfaces) from BE API json */
import * as fs from 'fs';
import * as path from 'path';

import * as conf from './conf';

import axios from 'axios';

import { addFormExtensions, addUtils } from './common/generate';
import { processDefinitions } from './definitions';
import { processPaths } from './requests/process-paths';
import { createDir, emptyDir, processHeader } from './utils';

export interface Config {
  header: string;
  dest: string;
  generateStore: boolean;
  unwrapSingleParamMethods: boolean;
}

/**
 * Generates API layer for the project based on src to dest
 * @param src source swagger json schema
 * @param dest destination directory
 * @param generateStore decides if redux workflow should be generated
 * @param unwrapSingleParamMethods controls if the single param methods should be generated
 * @param swaggerUrlPath the path where the swagger ui definition can be found
 * @param omitVersion shouldn't generate API version info to generated files
 */
export function generate(
  src: string = conf.apiFile,
  dest: string = conf.outDir,
  generateStore = true,
  unwrapSingleParamMethods = false,
  swaggerUrlPath: string = conf.swaggerUrlPath,
  omitVersion = false) {

  axios.get(src)
    .then(response => {
      var schema: any = response.data;
      // normalize basePath, strip trailing '/'s
      const basePath = schema.basePath;
      if (typeof basePath === 'string') {
        schema.basePath = basePath.replace(/\/+$/, '');
      } else {
        schema.basePath = (schema.schemes[0] || 'http') + '://' + (schema.host || 'localhost');
        schema.basePath = schema.basePath.replace(/\/+$/, '');
      }

      recreateDirectories(dest, generateStore);

      const header = processHeader(schema, omitVersion);
      const config: Config = { header, dest, generateStore, unwrapSingleParamMethods };

      generateCommon(path.join(dest, conf.commonDir), generateStore);

      if (!fs.existsSync(dest)) fs.mkdirSync(dest);
      const definitions = processDefinitions(schema.definitions, config);
      processPaths(schema.paths, `http://${schema.host}${swaggerUrlPath}${conf.swaggerFile}`,
        config, definitions, schema.basePath);

    })
    .catch(function (error) {
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.log(error.response.data);
        console.log(error.response.status);
        console.log(error.response.headers);
      } else if (error.request) {
        // The request was made but no response was received
        // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
        // http.ClientRequest in node.js
        console.log(error.request);
      } else {
        // Something happened in setting up the request that triggered an Error
        console.log('Error', error.message);
      }
      console.log(error);
    });

}

function recreateDirectories(dest: string, generateStore: boolean) {
  emptyDir(path.join(dest, conf.commonDir), true);
  emptyDir(path.join(dest, conf.defsDir), true);
  emptyDir(path.join(dest, conf.apiDir), true);
  emptyDir(path.join(dest, conf.storeDir), true);

  createDir(path.join(dest, conf.commonDir));
  createDir(path.join(dest, conf.defsDir));
  createDir(path.join(dest, conf.apiDir));
  if (generateStore) createDir(path.join(dest, conf.storeDir));
}

/** Generates common classes, methods, utils */
function generateCommon(dest: string, generateStore: boolean) {
  addUtils(dest);
  if (generateStore) addFormExtensions(dest);
}
