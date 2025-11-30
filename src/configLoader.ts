import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

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

export function loadConfig(configPath: string): GqlyConfig {
    const absolutePath = path.resolve(process.cwd(), configPath);
    const fileContent = fs.readFileSync(absolutePath, 'utf8');
    const ext = path.extname(absolutePath);

    let config: any;
    if (ext === '.yaml' || ext === '.yml') {
        config = yaml.load(fileContent);
    } else if (ext === '.json') {
        config = JSON.parse(fileContent);
    } else {
        throw new Error(`Unsupported config file extension: ${ext}`);
    }

    validateConfig(config);
    return config as GqlyConfig;
}

function validateConfig(config: any) {
    if (!config.queries && !config.mutations) {
        throw new Error('Config must contain "queries" or "mutations"');
    }
}
