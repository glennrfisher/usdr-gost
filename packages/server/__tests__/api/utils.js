const fetch = require('node-fetch');

require('dotenv').config();

const knex = require('knex')({
    client: 'pg',
    connection: process.env.POSTGRES_TEST_URL,
});

async function getSessionCookie(email) {
    // POSTing an email address generates a passcode.
    const newSession = await fetch(`${process.env.API_DOMAIN}/api/sessions`, {
        method: 'POST',
        body: JSON.stringify({ email }),
        headers: { 'Content-Type': 'application/json' },
    });
    const body = await newSession.json();
    if (!newSession.ok || !body.success) {
        throw new Error(body.message || `Error creating session: ${JSON.stringify(body)}`);
    }

    // Get the new passcode directly from PostgresQL.
    const query = `SELECT created_at, passcode
              FROM access_tokens
              ORDER BY created_at DESC
              LIMIT 1
            ;`;
    const result = await knex.raw(query);
    const { passcode } = result.rows[0];

    // Use the passcode to generate a sessionID ...
    const response = await fetch(`${process.env.API_DOMAIN}/api/sessions/?passcode=${passcode}`, { redirect: 'manual' });
    // ... and the resulting cookie can be used to authorize requests.
    return response.headers.raw()['set-cookie'];
}

function getEndpoint({ agencyId, url }) {
    return `${process.env.API_DOMAIN}/api/organizations/${agencyId}${url}`;
}

function fetchApi(url, agencyId, fetchOptions) {
    return fetch(getEndpoint({ agencyId, url }), fetchOptions);
}

async function disconnectDb() {
    await knex.destroy();
}

module.exports = {
    disconnectDb,
    fetchApi,
    getSessionCookie,
};
