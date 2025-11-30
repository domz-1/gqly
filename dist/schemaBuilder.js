"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildSchema = buildSchema;
const graphql_1 = require("graphql");
function buildSchema(config) {
    const queryFields = {};
    const mutationFields = {};
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
    const schemaConfig = {};
    if (Object.keys(queryFields).length > 0) {
        schemaConfig.query = new graphql_1.GraphQLObjectType({
            name: 'Query',
            fields: queryFields,
        });
    }
    if (Object.keys(mutationFields).length > 0) {
        schemaConfig.mutation = new graphql_1.GraphQLObjectType({
            name: 'Mutation',
            fields: mutationFields,
        });
    }
    return new graphql_1.GraphQLSchema(schemaConfig);
}
function buildOperationField(name, operation) {
    return {
        description: operation.description,
        type: convertJsonSchemaToGraphQLType(operation.output, `${name}Output`, false),
        args: buildArgs(operation.input, name),
        resolve: () => { throw new Error("Resolver not attached yet"); },
    };
}
function buildArgs(inputSchema, operationName) {
    if (!inputSchema || !inputSchema.properties)
        return {};
    const args = {};
    const required = inputSchema.required || [];
    for (const [key, prop] of Object.entries(inputSchema.properties)) {
        let type = convertJsonSchemaToGraphQLType(prop, `${operationName}Input_${key}`, true);
        if (required.includes(key)) {
            type = new graphql_1.GraphQLNonNull(type);
        }
        args[key] = { type };
    }
    return args;
}
function convertJsonSchemaToGraphQLType(schema, typeName, isInput) {
    if (!schema)
        return graphql_1.GraphQLString;
    switch (schema.type) {
        case 'string':
            return graphql_1.GraphQLString;
        case 'integer':
            return graphql_1.GraphQLInt;
        case 'number':
            return graphql_1.GraphQLFloat;
        case 'boolean':
            return graphql_1.GraphQLBoolean;
        case 'array':
            if (!schema.items)
                return new graphql_1.GraphQLList(graphql_1.GraphQLString); // Fallback
            const itemType = convertJsonSchemaToGraphQLType(schema.items, `${typeName}Item`, isInput);
            return new graphql_1.GraphQLList(itemType);
        case 'object':
            const fields = {};
            if (schema.properties) {
                for (const [key, prop] of Object.entries(schema.properties)) {
                    fields[key] = { type: convertJsonSchemaToGraphQLType(prop, `${typeName}_${key}`, isInput) };
                }
            }
            const TypeConstructor = isInput ? graphql_1.GraphQLInputObjectType : graphql_1.GraphQLObjectType;
            return new TypeConstructor({
                name: typeName,
                fields: () => fields,
            });
        default:
            return graphql_1.GraphQLString;
    }
}
