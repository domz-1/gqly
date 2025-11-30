import { Module } from '@nestjs/common';
import { GqlyModule } from '../../../src';
import * as path from 'path';

@Module({
    imports: [
        GqlyModule.forRoot({
            configPath: path.join(__dirname, '../gqly.config.yaml'),
            controllersPath: path.join(__dirname, '../controllers'),
            playground: true,
            route: '/graphql',
        }),
    ],
})
export class AppModule { }
