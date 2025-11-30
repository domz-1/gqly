"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.attachGraphQL = attachGraphQL;
const graphql_1 = require("graphql");
const configLoader_1 = require("./configLoader");
const schemaBuilder_1 = require("./schemaBuilder");
const controllerResolver_1 = require("./controllerResolver");
function attachGraphQL(app, configPath, options = {}) {
    const config = (0, configLoader_1.loadConfig)(configPath);
    const schema = (0, schemaBuilder_1.buildSchema)(config);
    const controllersPath = options.controllersPath || './controllers';
    const typeMap = schema.getTypeMap();
    const queryType = typeMap['Query'];
    const mutationType = typeMap['Mutation'];
    if (queryType && config.queries) {
        const fields = queryType.getFields();
        for (const [name, opConfig] of Object.entries(config.queries)) {
            const field = fields[name];
            const resolver = (0, controllerResolver_1.resolveController)(opConfig.controller, controllersPath);
            field.resolve = (source, args, context, info) => {
                context.operationConfig = opConfig;
                return resolver(args, context);
            };
        }
    }
    if (mutationType && config.mutations) {
        const fields = mutationType.getFields();
        for (const [name, opConfig] of Object.entries(config.mutations)) {
            const field = fields[name];
            const resolver = (0, controllerResolver_1.resolveController)(opConfig.controller, controllersPath);
            field.resolve = (source, args, context, info) => {
                context.operationConfig = opConfig;
                return resolver(args, context);
            };
        }
    }
    const route = options.route || '/graphql';
    app.use(route, async (req, res, next) => {
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
        const result = await (0, graphql_1.graphql)({
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
