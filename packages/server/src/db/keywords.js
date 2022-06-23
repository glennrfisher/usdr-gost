const knex = require('./connection');
const { TABLES } = require('./constants');

async function getKeyword(keywordId) {
    const response = await knex(TABLES.keywords)
        .select('*')
        .where('id', keywordId);
    return response[0];
}

function getKeywords() {
    return knex(TABLES.keywords)
        .select('*');
}

async function createKeyword(keyword) {
    const response = await knex
        .insert(keyword)
        .into(TABLES.keywords)
        .returning(['id', 'created_at']);
    return {
        ...keyword,
        id: response[0].id,
        created_at: response[0].created_at,
    };
}

function deleteKeyword(id) {
    return knex(TABLES.keywords)
        .where('id', id)
        .del();
}

function getAgencyKeywords(agencyId) {
    return knex(TABLES.keywords)
        .select('*')
        .where('agency_id', agencyId);
}

module.exports = {
    getKeyword,
    getKeywords,
    createKeyword,
    deleteKeyword,
    getAgencyKeywords,
};
