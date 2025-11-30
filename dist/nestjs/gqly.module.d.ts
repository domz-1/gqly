import { DynamicModule } from '@nestjs/common';
import { GqlyOptions } from '../gqly';
export interface NestGqlyOptions extends GqlyOptions {
    configPath?: string;
}
export declare const GQLY_OPTIONS = "GQLY_OPTIONS";
export declare class GqlyModule {
    static forRoot(options: NestGqlyOptions): DynamicModule;
}
