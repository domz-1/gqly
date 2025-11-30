"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var GqlyModule_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GqlyModule = exports.GQLY_OPTIONS = void 0;
const common_1 = require("@nestjs/common");
const graphql_1 = require("graphql");
const configLoader_1 = require("../configLoader");
const schemaBuilder_1 = require("../schemaBuilder");
const controllerResolver_1 = require("../controllerResolver");
exports.GQLY_OPTIONS = 'GQLY_OPTIONS';
function createGqlyController(route) {
    let GqlyController = class GqlyController {
        constructor(options) {
            this.options = options;
            const configPath = options.configPath || 'gqly.config.yaml';
            this.config = (0, configLoader_1.loadConfig)(configPath);
            this.schema = (0, schemaBuilder_1.buildSchema)(this.config);
            this.controllersPath = options.controllersPath || './controllers';
            this.setupResolvers();
        }
        setupResolvers() {
            const typeMap = this.schema.getTypeMap();
            const queryType = typeMap['Query'];
            const mutationType = typeMap['Mutation'];
            if (queryType && this.config.queries) {
                const fields = queryType.getFields();
                for (const [name, opConfig] of Object.entries(this.config.queries)) {
                    const field = fields[name];
                    const resolver = (0, controllerResolver_1.resolveController)(opConfig.controller, this.controllersPath);
                    field.resolve = (source, args, context, info) => {
                        context.operationConfig = opConfig;
                        return resolver(args, context);
                    };
                }
            }
            if (mutationType && this.config.mutations) {
                const fields = mutationType.getFields();
                for (const [name, opConfig] of Object.entries(this.config.mutations)) {
                    const field = fields[name];
                    const resolver = (0, controllerResolver_1.resolveController)(opConfig.controller, this.controllersPath);
                    field.resolve = (source, args, context, info) => {
                        context.operationConfig = opConfig;
                        return resolver(args, context);
                    };
                }
            }
        }
        async handle(req, res) {
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
            const result = await (0, graphql_1.graphql)({
                schema: this.schema,
                source: query,
                variableValues: variables,
                contextValue: { req },
            });
            res.json(result);
        }
    };
    __decorate([
        (0, common_1.All)(),
        __param(0, (0, common_1.Req)()),
        __param(1, (0, common_1.Res)()),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Object, Object]),
        __metadata("design:returntype", Promise)
    ], GqlyController.prototype, "handle", null);
    GqlyController = __decorate([
        (0, common_1.Controller)(route),
        __param(0, (0, common_1.Inject)(exports.GQLY_OPTIONS)),
        __metadata("design:paramtypes", [Object])
    ], GqlyController);
    return GqlyController;
}
let GqlyModule = GqlyModule_1 = class GqlyModule {
    static forRoot(options) {
        const route = options.route || '/graphql';
        const ControllerClass = createGqlyController(route);
        return {
            module: GqlyModule_1,
            controllers: [ControllerClass],
            providers: [
                {
                    provide: exports.GQLY_OPTIONS,
                    useValue: options,
                },
            ],
        };
    }
};
exports.GqlyModule = GqlyModule;
exports.GqlyModule = GqlyModule = GqlyModule_1 = __decorate([
    (0, common_1.Module)({})
], GqlyModule);
