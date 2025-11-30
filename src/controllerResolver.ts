import * as path from 'path';
import { Request, Response } from 'express';
import { OperationConfig } from './configLoader';

export interface GqlyContext {
    req: Request;
    operationConfig?: OperationConfig;
}

export function resolveController(controllerString: string, controllersPath: string) {
    const [file, method] = controllerString.split('#');
    const fullPath = path.resolve(process.cwd(), controllersPath, file);

    // Dynamic require
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const controllerModule = require(fullPath);
    const controllerFn = controllerModule[method];

    if (!controllerFn) {
        throw new Error(`Controller method ${method} not found in ${fullPath}`);
    }

    return async (args: any, context: GqlyContext) => {
        // Mock Express Request
        const req = {
            ...context.req,
            body: {} as any,
            params: {} as any,
            query: {} as any,
        } as Request;

        const mapping = context.operationConfig?.http || {};

        // Default: everything to body if no mapping
        if (!mapping.paramMapping && !mapping.queryMapping && !mapping.bodyMapping) {
            req.body = args;
        } else {
            if (mapping.paramMapping) {
                for (const [argKey, paramKey] of Object.entries(mapping.paramMapping)) {
                    req.params[paramKey] = args[argKey];
                }
            }
            // Implement other mappings as needed
            // For now, if paramMapping exists, we assume rest is not automatically mapped to body unless specified
            // But to keep it simple and working with current test:
            // We can put unmapped args into body? Or just leave it.
            // The test userController destructures from req.body.
            // If we only map params, req.body is empty.
            // Let's copy args to body as well for safety in this simple implementation,
            // or be smarter.
            // Let's stick to the previous JS logic: if paramMapping exists, we mapped params.
            // But we didn't copy the rest to body in JS version explicitly in the `else` block?
            // Wait, in JS version:
            // if (!mapping...) { req.body = args } else { if (paramMapping) ... }
            // So if paramMapping existed, req.body was EMPTY.
            // BUT my test worked?
            // getUser uses req.params.id.
            // createUser uses req.body. It has NO http mapping in config. So it went to first if.
            // updateUser uses req.params.id AND req.body. It HAS paramMapping.
            // So in JS version, updateUser would have empty body!
            // Did I test updateUser? Yes.
            // "Updated user: { id: 1, name: 'Test User', email: 'test@example.com' }"
            // Wait, the name didn't change in the log?
            // "Updated user: { id: 1, name: 'Test User', email: 'test@example.com' }"
            // The input was "Updated User" (capital U). The output says "Test User".
            // SO UPDATE FAILED SILENTLY (or just didn't update fields) because body was empty!
            // I need to fix this in TS version.

            // Fix: Always copy args to body, then override/specifics?
            // Or: if paramMapping, put specific args in params. Put ALL args in body too?
            // Express is flexible.
            req.body = { ...args };
        }

        // Mock Express Response
        let responseData: any = null;
        let statusCode = 200;

        const res = {
            status: (code: number) => {
                statusCode = code;
                return res;
            },
            json: (data: any) => {
                responseData = data;
                return res;
            },
            send: (data: any) => {
                responseData = data;
                return res;
            },
        } as unknown as Response;

        await controllerFn(req, res);
        return responseData;
    };
}
