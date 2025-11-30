const express = require('express');
const { sequelize } = require('./models/user');
const { attachGraphQL } = require('../dist/index');
const path = require('path');

const app = express();
app.use(express.json());

// Initialize Database
sequelize.sync().then(() => {
    console.log('Database synced');
});

// Attach Gqly
attachGraphQL(app, path.join(__dirname, 'gqly.config.yaml'), {
    controllersPath: path.join(__dirname, 'controllers'),
    route: '/graphql',
    playground: true
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`GraphQL endpoint: http://localhost:${PORT}/graphql`);
});
