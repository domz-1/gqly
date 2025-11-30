import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    // Auth Middleware
    const jwt = require('jsonwebtoken');
    const SECRET_KEY = 'supersecretkey';

    app.use((req: any, res: any, next: any) => {
        const authHeader = req.headers.authorization;
        if (authHeader) {
            const token = authHeader.split(' ')[1];
            jwt.verify(token, SECRET_KEY, (err: any, user: any) => {
                if (!err) {
                    req.user = user;
                }
                next();
            });
        } else {
            next();
        }
    });

    await app.listen(3003);
    console.log('NestJS app is running on http://localhost:3003');
    console.log('GraphQL Playground available at http://localhost:3003/graphql');
}
bootstrap();
