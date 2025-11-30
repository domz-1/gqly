export interface GqlyConfig {
    queries?: Record<string, OperationConfig>;
    mutations?: Record<string, OperationConfig>;
}
export interface OperationConfig {
    description?: string;
    controller: string;
    input?: JsonSchema;
    output?: JsonSchema;
    http?: HttpMapping;
}
export interface JsonSchema {
    type: string;
    properties?: Record<string, JsonSchema>;
    required?: string[];
    items?: JsonSchema;
}
export interface HttpMapping {
    paramMapping?: Record<string, string>;
    queryMapping?: Record<string, string>;
    bodyMapping?: Record<string, string>;
}
export declare function loadConfig(configPath: string): GqlyConfig;
