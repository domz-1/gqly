import {
    GraphQLSchema,
    GraphQLObjectType,
    GraphQLString,
    GraphQLInt,
    GraphQLFloat,
    GraphQLBoolean,
    GraphQLList,
    GraphQLNonNull,
    GraphQLInputObjectType,
    GraphQLFieldConfig,
    GraphQLInputFieldConfig,
    GraphQLType,
    GraphQLInputType,
    GraphQLOutputType
} from 'graphql';
import { GqlyConfig, OperationConfig, JsonSchema } from './configLoader';

export function buildSchema(config: GqlyConfig): GraphQLSchema {
    const queryFields: Record<string, GraphQLFieldConfig<any, any>> = {};
    const mutationFields: Record<string, GraphQLFieldConfig<any, any>> = {};

    if (config.queries) {
        for (const [name, operation] of Object.entries(config.queries)) {
            queryFields[name] = buildOperationField(name, operation);
        }
    }

    if (config.mutations) {
        for (const [name, operation] of Object.entries(config.mutations)) {
            mutationFields[name] = buildOperationField(name, operation);
        }
    }

    const schemaConfig: any = {};
    if (Object.keys(queryFields).length > 0) {
        schemaConfig.query = new GraphQLObjectType({
            name: 'Query',
            fields: queryFields,
        });
    }
    if (Object.keys(mutationFields).length > 0) {
        schemaConfig.mutation = new GraphQLObjectType({
            name: 'Mutation',
            fields: mutationFields,
        });
    }

    return new GraphQLSchema(schemaConfig);
}

function buildOperationField(name: string, operation: OperationConfig): GraphQLFieldConfig<any, any> {
    return {
        description: operation.description,
        type: convertJsonSchemaToGraphQLType(operation.output, `${name}Output`, false) as GraphQLOutputType,
        args: buildArgs(operation.input, name),
        resolve: () => { throw new Error("Resolver not attached yet") },
    };
}

function buildArgs(inputSchema: JsonSchema | undefined, operationName: string): Record<string, GraphQLInputFieldConfig> {
    if (!inputSchema || !inputSchema.properties) return {};

    const args: Record<string, GraphQLInputFieldConfig> = {};
    const required = inputSchema.required || [];

    for (const [key, prop] of Object.entries(inputSchema.properties)) {
        let type = convertJsonSchemaToGraphQLType(prop, `${operationName}Input_${key}`, true) as GraphQLInputType;
        if (required.includes(key)) {
            type = new GraphQLNonNull(type);
        }
        args[key] = { type };
    }
    return args;
}

function convertJsonSchemaToGraphQLType(schema: JsonSchema | undefined, typeName: string, isInput: boolean): GraphQLType {
    if (!schema) return GraphQLString;

    switch (schema.type) {
        case 'string':
            return GraphQLString;
        case 'integer':
            return GraphQLInt;
        case 'number':
            return GraphQLFloat;
        case 'boolean':
            return GraphQLBoolean;
        case 'array':
            if (!schema.items) return new GraphQLList(GraphQLString); // Fallback
            const itemType = convertJsonSchemaToGraphQLType(schema.items, `${typeName}Item`, isInput);
            return new GraphQLList(itemType);
        case 'object':
            const fields: any = {};
            if (schema.properties) {
                for (const [key, prop] of Object.entries(schema.properties)) {
                    fields[key] = { type: convertJsonSchemaToGraphQLType(prop, `${typeName}_${key}`, isInput) };
                }
            }

            const TypeConstructor = isInput ? GraphQLInputObjectType : GraphQLObjectType;
            return new TypeConstructor({
                name: typeName,
                fields: () => fields,
            });
        default:
            return GraphQLString;
    }
}
