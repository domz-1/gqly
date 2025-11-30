const http = require('http');

function request(query, variables = {}) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify({ query, variables });
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: '/graphql',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': data.length,
            },
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => (body += chunk));
            res.on('end', () => {
                try {
                    resolve(JSON.parse(body));
                } catch (e) {
                    reject(e);
                }
            });
        });

        req.on('error', (e) => reject(e));
        req.write(data);
        req.end();
    });
}

async function runTests() {
    console.log('Starting tests...');

    // 1. Create User
    console.log('1. Testing createUser...');
    const createRes = await request(`
    mutation CreateUser($name: String!, $email: String!) {
      createUser(name: $name, email: $email) {
        id
        name
        email
      }
    }
  `, { name: 'Test User', email: 'test@example.com' });

    if (createRes.errors) {
        console.error('Create failed:', JSON.stringify(createRes.errors, null, 2));
        process.exit(1);
    }
    const user = createRes.data.createUser;
    console.log('Created user:', user);

    // 2. Get User
    console.log('\n2. Testing getUser...');
    const getRes = await request(`
    query GetUser($id: String!) {
      getUser(id: $id) {
        id
        name
        email
      }
    }
  `, { id: String(user.id) }); // Ensure ID is string as per config input type

    if (getRes.errors) {
        console.error('Get failed:', JSON.stringify(getRes.errors, null, 2));
        process.exit(1);
    }
    console.log('Got user:', getRes.data.getUser);

    // 3. Update User
    console.log('\n3. Testing updateUser...');
    const updateRes = await request(`
    mutation UpdateUser($id: String!, $name: String!, $email: String!) {
      updateUser(id: $id, name: $name, email: $email) {
        id
        name
        email
      }
    }
  `, { id: String(user.id), name: 'Updated User', email: 'updated@example.com' });

    if (updateRes.errors) {
        console.error('Update failed:', JSON.stringify(updateRes.errors, null, 2));
        process.exit(1);
    }
    console.log('Updated user:', updateRes.data.updateUser);

    // 4. Delete User
    console.log('\n4. Testing deleteUser...');
    const deleteRes = await request(`
    mutation DeleteUser($id: String!) {
      deleteUser(id: $id) {
        message
      }
    }
  `, { id: String(user.id) });

    if (deleteRes.errors) {
        console.error('Delete failed:', JSON.stringify(deleteRes.errors, null, 2));
        process.exit(1);
    }
    console.log('Delete result:', deleteRes.data.deleteUser);

    console.log('\nAll tests passed!');
}

// Wait for server to start (simple delay)
setTimeout(runTests, 2000);
