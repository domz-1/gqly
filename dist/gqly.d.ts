import { Application } from 'express';
export interface GqlyOptions {
    controllersPath?: string;
    route?: string;
    playground?: boolean;
}
export declare function attachGraphQL(app: Application, configPath: string, options?: GqlyOptions): {
    schema: import("graphql").GraphQLSchema;
};
