const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const http = require('http');

const dbPath = path.join(__dirname, 'express/database.sqlite');
const db = new sqlite3.Database(dbPath);

function checkSchema() {
    return new Promise((resolve, reject) => {
        db.all("PRAGMA table_info(Users)", (err, rows) => {
            if (err) return reject(err);
            const hasPassword = rows.some(row => row.name === 'password');
            if (hasPassword) {
                console.log('✅ Password column exists in Users table.');
                resolve(true);
            } else {
                console.log('❌ Password column MISSING in Users table.');
                resolve(false);
            }
        });
    });
}

function graphqlRequest(query) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify({ query });
        const options = {
            hostname: 'localhost',
            port: 3002,
            path: '/graphql',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': data.length
            }
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(body));
                } catch (e) {
                    reject(e);
                }
            });
        });

        req.on('error', reject);
        req.write(data);
        req.end();
    });
}

function addPasswordColumn() {
    return new Promise((resolve, reject) => {
        console.log('🔧 Adding password column to Users table...');
        db.run("ALTER TABLE Users ADD COLUMN password VARCHAR(255)", (err) => {
            if (err) return reject(err);
            console.log('✅ Password column added.');
            resolve();
        });
    });
}

async function run() {
    try {
        const schemaOk = await checkSchema();
        if (!schemaOk) {
            await addPasswordColumn();
        }

        console.log('\nTesting Register...');
        const email = `test${Date.now()}@example.com`;
        const registerQuery = `
            mutation {
                register(name: "Test User", email: "${email}", password: "password123") {
                    token
                    user { id name email }
                }
            }
        `;
        const registerRes = await graphqlRequest(registerQuery);
        console.log('Register Response:', JSON.stringify(registerRes, null, 2));

        if (registerRes.data && registerRes.data.register && registerRes.data.register.token) {
            console.log('✅ Register successful');
        } else {
            console.log('❌ Register failed');
        }

        console.log('\nTesting Login...');
        const loginQuery = `
            mutation {
                login(email: "${email}", password: "password123") {
                    token
                    user { id name email }
                }
            }
        `;
        const loginRes = await graphqlRequest(loginQuery);
        console.log('Login Response:', JSON.stringify(loginRes, null, 2));

        if (loginRes.data && loginRes.data.login && loginRes.data.login.token) {
            console.log('✅ Login successful');
        } else {
            console.log('❌ Login failed');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        db.close();
    }
}

run();
