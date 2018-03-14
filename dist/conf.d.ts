/** Configuration constants */
import { MethodName, NativeNames } from './types';
export declare const outDir = "src/api";
export declare const defsDir = "models";
export declare const apiDir = "services";
export declare const apiFile = "conf/api/api-docs.json";
export declare const modelFile = "model";
export declare const indentation = 2;
export declare const swaggerFile = "/swagger-ui.html#!/";
export declare const nativeTypes: {
    [key in NativeNames]: string;
};
export declare const allowedParams: {
    [key in MethodName]: string[];
};
export declare const controllerIgnores: string[];
export declare const adHocExceptions: {
    [key: string]: {
        [key: string]: [RegExp, string];
    };
};
