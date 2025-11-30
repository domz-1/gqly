import { Request } from 'express';
import { OperationConfig } from './configLoader';
export interface GqlyContext {
    req: Request;
    operationConfig?: OperationConfig;
}
export declare function resolveController(controllerString: string, controllersPath: string): (args: any, context: GqlyContext) => Promise<any>;
