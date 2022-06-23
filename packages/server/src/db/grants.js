const knex = require('./connection');
const { TABLES } = require('./constants');
const helpers = require('./helpers');

const { getInterestedAgencies } = require('./agencies');

async function getGrants({
    currentPage, perPage, agencies, filters, orderBy, searchTerm,
} = {}) {
    const { data, pagination } = await knex(TABLES.grants)
        .select(`${TABLES.grants}.*`)
        .modify((queryBuilder) => {
            if (searchTerm && searchTerm !== 'null') {
                queryBuilder.andWhere(
                    (qb) => qb.where(`${TABLES.grants}.grant_id`, '~*', searchTerm)
                        .orWhere(`${TABLES.grants}.grant_number`, '~*', searchTerm)
                        .orWhere(`${TABLES.grants}.title`, '~*', searchTerm),
                );
            }
            if (filters) {
                if (filters.interestedByUser) {
                    queryBuilder.join(TABLES.grants_interested, `${TABLES.grants}.grant_id`, `${TABLES.grants_interested}.grant_id`);
                }
                if (filters.assignedToAgency) {
                    queryBuilder.join(TABLES.assigned_grants_agency, `${TABLES.grants}.grant_id`, `${TABLES.assigned_grants_agency}.grant_id`);
                }
                queryBuilder.andWhere(
                    (qb) => {
                        helpers.whereAgencyCriteriaMatch(qb, filters.agencyCriteria);

                        if (filters.interestedByUser) {
                            qb.where(`${TABLES.grants_interested}.user_id`, '=', filters.interestedByUser);
                        }
                        if (filters.assignedToAgency) {
                            qb.where(`${TABLES.assigned_grants_agency}.agency_id`, '=', filters.assignedToAgency);
                        }
                    },
                );
            }

            if (orderBy && orderBy !== 'undefined') {
                if (orderBy.includes('interested_agencies')) {
                    queryBuilder.leftJoin(TABLES.grants_interested, `${TABLES.grants}.grant_id`, `${TABLES.grants_interested}.grant_id`);
                    const orderArgs = orderBy.split('|');
                    queryBuilder.orderBy(`${TABLES.grants_interested}.grant_id`, orderArgs[1]);
                    queryBuilder.orderBy(`${TABLES.grants}.grant_id`, orderArgs[1]);
                } else if (orderBy.includes('viewed_by')) {
                    const orderArgs = orderBy.split('|');
                    queryBuilder.leftJoin(TABLES.grants_viewed, `${TABLES.grants}.grant_id`, `${TABLES.grants_viewed}.grant_id`);
                    queryBuilder.orderBy(`${TABLES.grants_viewed}.grant_id`, orderArgs[1]);
                    queryBuilder.orderBy(`${TABLES.grants}.grant_id`, orderArgs[1]);
                } else {
                    const orderArgs = orderBy.split('|');
                    queryBuilder.orderBy(...orderArgs);
                }
            }
        })
        .paginate({ currentPage, perPage, isLengthAware: true });

    const viewedBy = await knex(TABLES.agencies)
        .join(TABLES.grants_viewed, `${TABLES.agencies}.id`, '=', `${TABLES.grants_viewed}.agency_id`)
        .whereIn('grant_id', data.map((grant) => grant.grant_id))
        .andWhere(`${TABLES.agencies}.id`, 'IN', agencies)
        .select(`${TABLES.grants_viewed}.grant_id`, `${TABLES.grants_viewed}.agency_id`, `${TABLES.agencies}.name as agency_name`, `${TABLES.agencies}.abbreviation as agency_abbreviation`);

    const interestedBy = await getInterestedAgencies({ grantIds: data.map((grant) => grant.grant_id), agencies });

    const dataWithAgency = data.map((grant) => {
        const viewedByAgencies = viewedBy.filter((viewed) => viewed.grant_id === grant.grant_id);
        const agenciesInterested = interestedBy.filter((intested) => intested.grant_id === grant.grant_id);
        return {
            ...grant,
            viewed_by_agencies: viewedByAgencies,
            interested_agencies: agenciesInterested,
        };
    });
    return { data: dataWithAgency, pagination };
}

async function getGrant({ grantId }) {
    const results = await knex.table(TABLES.grants)
        .select('*')
        .where({ grant_id: grantId });
    return results[0];
}

async function getTotalGrants({ agencyCriteria, createdTsBounds, updatedTsBounds } = {}) {
    const rows = await knex(TABLES.grants)
        .modify(helpers.whereAgencyCriteriaMatch, agencyCriteria)
        .modify((qb) => {
            if (createdTsBounds && createdTsBounds.fromTs) {
                qb.where('created_at', '>=', createdTsBounds.fromTs);
            }
            if (updatedTsBounds && updatedTsBounds.fromTs) {
                qb.where('updated_at', '>=', updatedTsBounds.fromTs);
            }
        })
        .count();
    return rows[0].count;
}

async function getTotalViewedGrants() {
    const rows = await knex(TABLES.grants_viewed).count();
    return rows[0].count;
}

async function getTotalInterestedGrants() {
    const rows = await knex(TABLES.grants_interested).count();
    return rows[0].count;
}

async function getTotalInterestedGrantsByAgencies() {
    const rows = await knex(TABLES.grants_interested)
        .select(`${TABLES.grants_interested}.agency_id`, `${TABLES.agencies}.name`, `${TABLES.agencies}.abbreviation`,
            knex.raw('SUM(CASE WHEN is_rejection = TRUE THEN 1 ELSE 0 END) rejections'),
            knex.raw('SUM(CASE WHEN is_rejection = FALSE THEN 1 ELSE 0 END) interested'))
        .join(TABLES.agencies, `${TABLES.grants_interested}.agency_id`, `${TABLES.agencies}.id`)
        .join(TABLES.interested_codes, `${TABLES.grants_interested}.interested_code_id`, `${TABLES.interested_codes}.id`)
        .count(`${TABLES.interested_codes}.is_rejection`)
        .groupBy(`${TABLES.grants_interested}.agency_id`, `${TABLES.agencies}.name`, `${TABLES.agencies}.abbreviation`);
    return rows;
}

function markGrantAsViewed({ grantId, agencyId, userId }) {
    return knex(TABLES.grants_viewed)
        .insert({ agency_id: agencyId, grant_id: grantId, user_id: userId });
}

function getGrantAssignedAgencies({ grantId, agencies }) {
    return knex(TABLES.assigned_grants_agency)
        .join(TABLES.agencies, `${TABLES.agencies}.id`, '=', `${TABLES.assigned_grants_agency}.agency_id`)
        .where({ grant_id: grantId })
        .andWhere('agency_id', 'IN', agencies);
}

function assignGrantsToAgencies({ grantId, agencyIds, userId }) {
    const insertPayload = agencyIds.map((aId) => ({
        agency_id: aId,
        grant_id: grantId,
        assigned_by: userId,
    }));
    return knex(TABLES.assigned_grants_agency)
        .insert(insertPayload)
        .onConflict(['agency_id', 'grant_id'])
        .ignore();
}

function unassignAgenciesToGrant({ grantId, agencyIds }) {
    const deleteWhere = agencyIds.map((aId) => ([aId, grantId]));
    return knex(TABLES.assigned_grants_agency)
        .whereIn(['agency_id', 'grant_id'], deleteWhere)
        .delete();
}

function markGrantAsInterested({
    grantId, agencyId, userId, interestedCode,
}) {
    return knex(TABLES.grants_interested)
        .insert({
            agency_id: agencyId,
            grant_id: grantId,
            user_id: userId,
            interested_code_id: interestedCode,
        });
}

module.exports = {
    getGrants,
    getGrant,
    getTotalGrants,
    getTotalViewedGrants,
    getTotalInterestedGrants,
    getTotalInterestedGrantsByAgencies,
    markGrantAsViewed,
    getGrantAssignedAgencies,
    assignGrantsToAgencies,
    unassignAgenciesToGrant,
    markGrantAsInterested,
};
