import { graphql } from 'graphql';
import { Application, Request, Response } from 'express';
import { loadConfig } from './configLoader';
import { buildSchema } from './schemaBuilder';
import { resolveController, GqlyContext } from './controllerResolver';

export interface GqlyOptions {
    controllersPath?: string;
    route?: string;
    playground?: boolean;
}

export function attachGraphQL(app: Application, configPath: string, options: GqlyOptions = {}) {
    const config = loadConfig(configPath);
    const schema = buildSchema(config);
    const controllersPath = options.controllersPath || './controllers';

    const typeMap = schema.getTypeMap();
    const queryType = typeMap['Query'];
    const mutationType = typeMap['Mutation'];

    if (queryType && config.queries) {
        const fields = (queryType as any).getFields();
        for (const [name, opConfig] of Object.entries(config.queries)) {
            const field = fields[name];
            const resolver = resolveController(opConfig.controller, controllersPath);

            field.resolve = (source: any, args: any, context: GqlyContext, info: any) => {
                context.operationConfig = opConfig;
                return resolver(args, context);
            };
        }
    }

    if (mutationType && config.mutations) {
        const fields = (mutationType as any).getFields();
        for (const [name, opConfig] of Object.entries(config.mutations)) {
            const field = fields[name];
            const resolver = resolveController(opConfig.controller, controllersPath);

            field.resolve = (source: any, args: any, context: GqlyContext, info: any) => {
                context.operationConfig = opConfig;
                return resolver(args, context);
            };
        }
    }

    const route = options.route || '/graphql';

    app.use(route, async (req: Request, res: Response, next: any) => {
        if (req.method === 'GET' && options.playground) {
            res.setHeader('Content-Type', 'text/html');
            res.send(`
                <!DOCTYPE html>
                <html lang="en">
                <body style="margin: 0; overflow-x: hidden; overflow-y: hidden">
                <div id="sandbox" style="height:100vh; width:100vw;"></div>
                <script src="https://embeddable-sandbox.cdn.apollographql.com/_latest/embeddable-sandbox.umd.production.min.js"></script>
                <script>
                new window.EmbeddedSandbox({
                  target: "#sandbox",
                  initialEndpoint: "${route}",
                });
                </script>
                </body>
                </html>
            `);
            return;
        }

        const { query, variables } = req.body;

        const result = await graphql({
            schema,
            source: query,
            variableValues: variables,
            contextValue: { req },
        });

        res.json(result);
    });

    return {
        schema,
    };
}
