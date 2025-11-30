import { DynamicModule, Module, Inject, Controller, All, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { graphql } from 'graphql';
import { loadConfig, OperationConfig } from '../configLoader';
import { buildSchema } from '../schemaBuilder';
import { resolveController, GqlyContext } from '../controllerResolver';
import { GqlyOptions } from '../gqly';

export interface NestGqlyOptions extends GqlyOptions {
    configPath?: string;
}

export const GQLY_OPTIONS = 'GQLY_OPTIONS';

function createGqlyController(route: string) {
    @Controller(route)
    class GqlyController {
        private schema: any;
        private config: any;
        private controllersPath: string;
        private options: NestGqlyOptions;

        constructor(@Inject(GQLY_OPTIONS) options: NestGqlyOptions) {
            this.options = options;
            const configPath = options.configPath || 'gqly.config.yaml';
            this.config = loadConfig(configPath);
            this.schema = buildSchema(this.config);
            this.controllersPath = options.controllersPath || './controllers';

            this.setupResolvers();
        }

        private setupResolvers() {
            const typeMap = this.schema.getTypeMap();
            const queryType = typeMap['Query'];
            const mutationType = typeMap['Mutation'];

            if (queryType && this.config.queries) {
                const fields = (queryType as any).getFields();
                for (const [name, opConfig] of Object.entries(this.config.queries)) {
                    const field = fields[name];
                    const resolver = resolveController((opConfig as any).controller, this.controllersPath);

                    field.resolve = (source: any, args: any, context: GqlyContext, info: any) => {
                        context.operationConfig = opConfig as OperationConfig;
                        return resolver(args, context);
                    };
                }
            }

            if (mutationType && this.config.mutations) {
                const fields = (mutationType as any).getFields();
                for (const [name, opConfig] of Object.entries(this.config.mutations)) {
                    const field = fields[name];
                    const resolver = resolveController((opConfig as any).controller, this.controllersPath);

                    field.resolve = (source: any, args: any, context: GqlyContext, info: any) => {
                        context.operationConfig = opConfig as OperationConfig;
                        return resolver(args, context);
                    };
                }
            }
        }

        @All()
        async handle(@Req() req: Request, @Res() res: Response) {
            if (req.method === 'GET' && this.options.playground) {
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

            if (req.method !== 'POST') {
                res.status(405).send('Method Not Allowed');
                return;
            }

            const { query, variables } = req.body;

            const result = await graphql({
                schema: this.schema,
                source: query,
                variableValues: variables,
                contextValue: { req },
            });

            res.json(result);
        }
    }

    return GqlyController;
}

@Module({})
export class GqlyModule {
    static forRoot(options: NestGqlyOptions): DynamicModule {
        const route = options.route || '/graphql';
        const ControllerClass = createGqlyController(route);

        return {
            module: GqlyModule,
            controllers: [ControllerClass],
            providers: [
                {
                    provide: GQLY_OPTIONS,
                    useValue: options,
                },
            ],
        };
    }
}
