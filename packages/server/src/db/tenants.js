const knex = require('./connection');
const { TABLES } = require('./constants');

async function getTenantByMainAgencyId(main_agency_id) {
    const query = `SELECT id, display_name, main_agency_id 
  FROM tenants WHERE main_agency_id = ?;`;
    const result = await knex.raw(query, main_agency_id);

    return result.rows;
}

async function getTenant(id) {
    const query = `SELECT id, display_name, main_agency_id 
  FROM tenants WHERE id = ?;`;
    const result = await knex.raw(query, id);

    return result.rows;
}

function setTenantDisplayName(id, display_name) {
    return knex(TABLES.tenants)
        .where({
            id,
        })
        .update({ display_name });
}

module.exports = {
    getTenantByMainAgencyId,
    getTenant,
    setTenantDisplayName,
};
