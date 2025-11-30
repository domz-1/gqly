const express = require('express');
const { sequelize } = require('./models/user');
const { attachGraphQL } = require('../../dist/index');
const path = require('path');

const app = express();
app.use(express.json());

// Initialize Database
sequelize.sync().then(() => {
    console.log('Database synced');
});

// Auth Middleware
const jwt = require('jsonwebtoken');
const SECRET_KEY = 'supersecretkey';

app.use((req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader) {
        const token = authHeader.split(' ')[1];
        jwt.verify(token, SECRET_KEY, (err, user) => {
            if (!err) {
                req.user = user;
            }
            next();
        });
    } else {
        next();
    }
});

// Attach Gqly
attachGraphQL(app, path.join(__dirname, 'gqly.config.yaml'), {
    controllersPath: path.join(__dirname, 'controllers'),
    route: '/graphql',
    playground: true
});

const PORT = 3002;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`GraphQL endpoint: http://localhost:${PORT}/graphql`);
});
