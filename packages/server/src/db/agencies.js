const knex = require('./connection');
const { TABLES } = require('./constants');

const { getAgencyEligibilityCodes } = require('./eligibilitycodes');
const { getAgencyKeywords } = require('./keywords');

async function getAgencyCriteriaForAgency(agencyId) {
    const eligibilityCodes = await getAgencyEligibilityCodes(agencyId);
    const enabledECodes = eligibilityCodes.filter((e) => e.enabled);
    const keywords = await getAgencyKeywords(agencyId);

    return {
        eligibilityCodes: enabledECodes.map((c) => c.code),
        keywords: keywords.map((c) => c.search_term),
    };
}

function getInterestedAgencies({ grantIds, agencies }) {
    return knex(TABLES.agencies)
        .join(TABLES.grants_interested, `${TABLES.agencies}.id`, '=', `${TABLES.grants_interested}.agency_id`)
        .join(TABLES.users, `${TABLES.users}.id`, '=', `${TABLES.grants_interested}.user_id`)
        .leftJoin(TABLES.interested_codes, `${TABLES.interested_codes}.id`, '=', `${TABLES.grants_interested}.interested_code_id`)
        .whereIn('grant_id', grantIds)
        .andWhere(`${TABLES.agencies}.id`, 'IN', agencies)
        .select(`${TABLES.grants_interested}.grant_id`, `${TABLES.grants_interested}.agency_id`,
            `${TABLES.agencies}.name as agency_name`, `${TABLES.agencies}.abbreviation as agency_abbreviation`,
            `${TABLES.users}.id as user_id`, `${TABLES.users}.email as user_email`, `${TABLES.users}.name as user_name`,
            `${TABLES.interested_codes}.id as interested_code_id`, `${TABLES.interested_codes}.name as interested_code_name`, `${TABLES.interested_codes}.is_rejection as interested_is_rejection`);
}

/*  isSubOrganization(parent, candidateChild) returns true if
  candidateChild is a child of parent.
  Normally parent will be the agency_id of the logged in user, and
  candidateChild will be the agency_id in the request header.
*/
async function isSubOrganization(parent, candidateChild) {
    const query = `
  with recursive hierarchy as (
    select id, parent from agencies
    where id = ?
    union all
    select agencies.id, agencies.parent from agencies
    inner join hierarchy
    on agencies.id = hierarchy.parent
  )
  select id from hierarchy;
  `;

    const result = await knex.raw(query, candidateChild);
    // console.dir(result.rows.map((rec) => rec.id));
    return result.rows.map((rec) => rec.id).indexOf(parent) !== -1;
}

async function getAgency(agencyId) {
    const query = `SELECT id, name, abbreviation, parent, warning_threshold, danger_threshold, tenant_id
  FROM agencies WHERE id = ?;`;
    const result = await knex.raw(query, agencyId);

    return result.rows;
}

async function getAgencies(rootAgency) {
    const query = `WITH RECURSIVE subagencies AS (
  SELECT id, name, abbreviation, parent, warning_threshold, danger_threshold, tenant_id
  FROM agencies WHERE id = ?
  UNION
      SELECT a.id, a.name, a.abbreviation, a.parent, a.warning_threshold, a.danger_threshold, a.tenant_id
      FROM agencies a INNER JOIN subagencies s ON s.id = a.parent
  ) SELECT * FROM subagencies ORDER BY name; `;
    const result = await knex.raw(query, rootAgency);

    return result.rows;
}

async function getTenantAgencies(tenantId) {
    return knex('agencies')
        .select('*')
        .where('tenant_id', tenantId);
}

async function createAgency({
    name, abbreviation, parent, warning_threshold, danger_threshold, main_agency_id, tenant,
}) {
    // seeded agencies with hardcoded ids will make autoicrement fail since it doesnt
    // know which is the next id
    await knex.raw('select setval(\'agencies_id_seq\', max(id)) from agencies');
    return knex(TABLES.agencies)
        .insert({
            parent,
            name,
            abbreviation,
            warning_threshold,
            danger_threshold,
            main_agency_id,
            tenant_id: tenant,
        });
}

async function deleteAgency(
    id, parent, name, abbreviation, warning_threshold, danger_threshold,
) {
    // seeded agencies with hardcoded ids will make autoicrement fail since it doesnt
    // know which is the next id
    console.log(`indexjs   ${id}`);
    await knex.raw('select setval(\'agencies_id_seq\', max(id)) from agencies');
    // console.log('sdfghjkjhg   ' + knex(TABLES.agencies.where(id)));
    return knex(TABLES.agencies)
        .where({
            id,
            parent,
            name,
            abbreviation,
            warning_threshold,
            danger_threshold,
        })
        .del();
}

function setAgencyThresholds(id, warning_threshold, danger_threshold) {
    return knex(TABLES.agencies)
        .where({
            id,
        })
        .update({ warning_threshold, danger_threshold });
}

function setAgencyName(id, agen_name) {
    // console.log('agen name === ' + agen_name);
    return knex(TABLES.agencies)
        .where({
            id,
        })
        .update({ name: agen_name });
}

function setAgencyAbbr(id, agen_abbr) {
    return knex(TABLES.agencies)
        .where({
            id,
        })
        .update({ abbreviation: agen_abbr });
}

function setAgencyParent(id, agen_parent) {
    // console.log('agen id in index.js ' + id);
    return knex(TABLES.agencies)
        .where({
            id,
        })
        .update({ parent: agen_parent });
}

module.exports = {
    getAgency,
    getAgencies,
    getTenantAgencies,
    createAgency,
    deleteAgency,
    setAgencyThresholds,
    setAgencyName,
    setAgencyAbbr,
    setAgencyParent,
    isSubOrganization,
    getAgencyCriteriaForAgency,
    getInterestedAgencies,
};
