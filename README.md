# GQLY

![GQLY Cover](https://github.com/domz-1/gqly/raw/main/public/galy-cover.png)

**Zero-Boilerplate GraphQL for Express & NestJS**

`gqly` is a powerful library that instantly turns your existing REST controllers into a GraphQL API without writing schemas, resolvers, or DTOs manually. It inspects your configuration and automatically wires everything up, mapping GraphQL arguments directly to `req.body` and `req.params`.

## Features

- 🚀 **Zero Boilerplate**: No manual schema or resolver definition required.
- 🔄 **Reuse REST Controllers**: Use your existing Express/NestJS controllers as-is.
- 🔌 **Framework Agnostic**: Works seamlessly with both Express and NestJS.
- 📄 **YAML Configuration**: Define your API structure in a simple YAML file.
- 🛡️ **Automatic Argument Mapping**: GraphQL arguments are automatically mapped to `req.body` and `req.params`.
- 🎮 **Built-in Playground**: Includes GraphQL Playground for easy testing.

## Installation

```bash
npm install gqly
# or
yarn add gqly
```

## Configuration

Create a `gqly.config.yaml` file in your project root. This file defines your GraphQL schema and maps it to your controllers.

```yaml
queries:
  getUser:
    description: "Fetch user by ID"
    controller: "userController.js#getUser" # Path to controller file and exported function
    input:
      type: object
      properties:
        id: { type: string }
      required: [id]
    output:
      type: object
      properties:
        id: { type: integer }
        name: { type: string }
        email: { type: string }
    http:
      paramMapping:
        id: id # Maps GraphQL 'id' argument to req.params.id

mutations:
  createUser:
    description: "Create new user"
    controller: "userController.js#createUser"
    input:
      type: object
      properties:
        name: { type: string }
        email: { type: string }
      required: [name, email]
    output:
      type: object
      properties:
        id: { type: integer }
        name: { type: string }
    http: {} # Arguments are automatically mapped to req.body by default
```

### Configuration Options

- **queries/mutations**: Define your operations.
- **controller**: The path to your controller file and the function name, separated by `#`.
- **input**: JSON Schema definition for the input arguments.
- **output**: JSON Schema definition for the return type.
- **http.paramMapping**: Map GraphQL arguments to `req.params`. If omitted, arguments are mapped to `req.body`.

## Usage

### Controller Implementation

`gqly` is designed to work with standard Express-style controllers. Your controllers should expect `req` and `res` objects.

```javascript
// userController.js
exports.getUser = async (req, res) => {
    const { id } = req.params; // Mapped from http.paramMapping
    // ... logic to fetch user
    res.json(user);
};

exports.createUser = async (req, res) => {
    const { name, email } = req.body; // Mapped from input arguments
    // ... logic to create user
    res.json(newUser);
};
```

### Express Integration

```javascript
const express = require('express');
const { attachGraphQL } = require('gqly');
const path = require('path');

const app = express();
app.use(express.json());

// ... your other middleware and routes

attachGraphQL(app, path.join(__dirname, 'gqly.config.yaml'), {
    controllersPath: path.join(__dirname, 'controllers'), // Directory where controllers are located
    route: '/graphql', // Endpoint for GraphQL
    playground: true // Enable GraphQL Playground
});

app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
    console.log('GraphQL endpoint: http://localhost:3000/graphql');
});
```

### NestJS Integration

Import `GqlyModule` in your root `AppModule`.

```typescript
import { Module } from '@nestjs/common';
import { GqlyModule } from 'gqly';
import * as path from 'path';

@Module({
    imports: [
        GqlyModule.forRoot({
            configPath: path.join(__dirname, '../gqly.config.yaml'),
            controllersPath: path.join(__dirname, '../controllers'),
            route: '/graphql',
            playground: true,
        }),
    ],
})
export class AppModule { }
```

## API Reference

### `attachGraphQL(app, configPath, options)`

- `app`: The Express application instance.
- `configPath`: Absolute path to the `gqly.config.yaml` file.
- `options`:
    - `controllersPath`: Absolute path to the directory containing your controllers.
    - `route`: The URL path for the GraphQL endpoint (default: `/graphql`).
    - `playground`: Boolean to enable/disable GraphQL Playground (default: `true`).

### `GqlyModule.forRoot(options)`

- `options`:
    - `configPath`: Absolute path to the `gqly.config.yaml` file.
    - `controllersPath`: Absolute path to the directory containing your controllers.
    - `route`: The URL path for the GraphQL endpoint (default: `/graphql`).
    - `playground`: Boolean to enable/disable GraphQL Playground (default: `true`).
