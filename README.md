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

Create a `gqly.config.yaml` file in your project. This file defines your GraphQL schema and maps it to your controllers.

### Path Specifications

> [!IMPORTANT]
> **Controller Paths in YAML Config**: Use **relative filenames only** (e.g., `userController.js#getUser`). These are resolved relative to the `controllersPath` option you provide when initializing `gqly`.

> [!IMPORTANT]
> **API Options Paths**: Use **absolute paths** with `path.join(__dirname, ...)` for `configPath` and `controllersPath` options.

### Example Configuration

```yaml
queries:
  getUser:
    description: "Fetch user by ID"
    controller: "userController.js#getUser" # ✅ Relative filename only
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

  getAllUsers:
    description: "Fetch all users"
    controller: "userController.js#getAllUsers" # ✅ Same file, different function
    output:
      type: array
      items:
        type: object
        properties:
          id: { type: integer }
          name: { type: string }
          email: { type: string }

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

  login:
    description: "Login user"
    controller: "authController.js#login" # ✅ Different controller file
    input:
      type: object
      properties:
        email: { type: string }
        password: { type: string }
      required: [email, password]
    output:
      type: object
      properties:
        token: { type: string }
        user:
          type: object
          properties:
            id: { type: integer }
            name: { type: string }
    http: {}
```

### Configuration Options

#### Operation Fields

- **queries/mutations**: Define your GraphQL operations.
- **controller**: Relative filename and function name, separated by `#` (e.g., `userController.js#getUser`).
  - Format: `<filename>#<exportedFunction>`
  - Path is resolved relative to the `controllersPath` option
  - ✅ Correct: `"userController.js#getUser"`
  - ❌ Wrong: `"./controllers/userController.js#getUser"` (don't include directory)
  - ❌ Wrong: `"/absolute/path/userController.js#getUser"` (don't use absolute paths)
- **description**: Human-readable description of the operation.
- **input**: JSON Schema definition for the input arguments (optional for queries without arguments).
- **output**: JSON Schema definition for the return type.
- **http**: HTTP-specific configuration.

#### HTTP Configuration

- **http.paramMapping**: Map GraphQL arguments to `req.params`.
  - Example: `{ id: id }` maps the GraphQL `id` argument to `req.params.id`
  - If omitted, all arguments are mapped to `req.body` by default.

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
import { GqlyModule } from 'gqly/nestjs';
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

Attaches GraphQL endpoint to your Express application.

**Parameters:**

- `app` *(Express Application)*: The Express application instance.
- `configPath` *(string)*: **Absolute path** to the `gqly.config.yaml` file.
  - ✅ Use: `path.join(__dirname, 'gqly.config.yaml')`
  - ❌ Avoid: `'./gqly.config.yaml'` (relative paths may fail)
- `options` *(object)*:
  - `controllersPath` *(string)*: **Absolute path** to the directory containing your controllers.
    - ✅ Use: `path.join(__dirname, 'controllers')`
    - ❌ Avoid: `'./controllers'` (relative paths may fail)
  - `route` *(string, optional)*: The URL path for the GraphQL endpoint. Default: `'/graphql'`
  - `playground` *(boolean, optional)*: Enable/disable GraphQL Playground. Default: `true`

**Example:**

```javascript
const path = require('path');
const { attachGraphQL } = require('gqly');

attachGraphQL(app, path.join(__dirname, 'gqly.config.yaml'), {
    controllersPath: path.join(__dirname, 'controllers'),
    route: '/graphql',
    playground: true
});
```

### `GqlyModule.forRoot(options)` (NestJS)

Creates a dynamic NestJS module for GraphQL integration.

**Parameters:**

- `options` *(object)*:
  - `configPath` *(string)*: **Absolute path** to the `gqly.config.yaml` file.
    - ✅ Use: `path.join(__dirname, '../gqly.config.yaml')`
    - Note: In NestJS, `__dirname` points to the `dist` folder after compilation
  - `controllersPath` *(string)*: **Absolute path** to the directory containing your controllers.
    - ✅ Use: `path.join(__dirname, '../controllers')`
  - `route` *(string, optional)*: The URL path for the GraphQL endpoint. Default: `'/graphql'`
  - `playground` *(boolean, optional)*: Enable/disable GraphQL Playground. Default: `true`

**Example:**

```typescript
import { Module } from '@nestjs/common';
import { GqlyModule } from 'gqly/nestjs';
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

## Path Resolution Summary

| Context | Path Type | Example |
|---------|-----------|---------|
| **YAML Config** - `controller` field | Relative filename only | `"userController.js#getUser"` |
| **Express** - `configPath` | Absolute path | `path.join(__dirname, 'gqly.config.yaml')` |
| **Express** - `controllersPath` | Absolute path | `path.join(__dirname, 'controllers')` |
| **NestJS** - `configPath` | Absolute path | `path.join(__dirname, '../gqly.config.yaml')` |
| **NestJS** - `controllersPath` | Absolute path | `path.join(__dirname, '../controllers')` |

## License

ISC

