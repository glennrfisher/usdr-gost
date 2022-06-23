let v4;
try {
    // eslint-disable-next-line global-require
    const crypto = require('crypto');
    v4 = crypto.randomUUID;
    if (!v4) {
        // node v12 doesnt have randomUUID
        throw new Error();
    }
} catch (err) {
    console.log('Node lacks crypto support!');
    // eslint-disable-next-line global-require
    ({ v4 } = require('uuid'));
}

const knex = require('./connection');
// const { TABLES } = require('./constants');
// const helpers = require('./helpers');
const { getAgencies } = require('./agencies');

async function getUsers(rootAgencyId) {
    const subAgencies = await getAgencies(rootAgencyId);

    const users = await knex('users')
        .select(
            'users.*',
            'roles.name as role_name',
            'roles.rules as role_rules',
            'agencies.name as agency_name',
            'agencies.abbreviation as agency_abbreviation',
            'agencies.parent as agency_parent_id_id',
        )
        .leftJoin('roles', 'roles.id', 'users.role_id')
        .leftJoin('agencies', 'agencies.id', 'users.agency_id')
        .whereIn('agencies.id', subAgencies.map((subAgency) => subAgency.id));
    return users.map((user) => {
        const u = { ...user };
        if (user.role_id) {
            u.role = {
                id: user.role_id,
                name: user.role_name,
                rules: user.role_rules,
            };
        }
        if (user.agency_id !== null) {
            u.agency = {
                id: user.agency_id,
                name: user.agency_name,
                abbreviation: user.agency_abbreviation,
                agency_parent_id: user.agency_parent_id,
            };
        }
        return u;
    });
}

async function getTenantUsers(tenantId) {
    console.log('db getTenantUsers', tenantId);
    // const subAgencies = await getAgencies(rootAgencyId);

    const users = await knex('users')
        .select(
            'users.*',
            'roles.name as role_name',
            'roles.rules as role_rules',
            'agencies.name as agency_name',
            'agencies.abbreviation as agency_abbreviation',
            'agencies.parent as agency_parent_id_id',
        )
        .leftJoin('roles', 'roles.id', 'users.role_id')
        .leftJoin('agencies', 'agencies.id', 'users.agency_id')
        .where('users.tenant_id', tenantId);
    // .whereIn('agencies.id', subAgencies.map((subAgency) => subAgency.id));
    return users.map((user) => {
        const u = { ...user };
        if (user.role_id) {
            u.role = {
                id: user.role_id,
                name: user.role_name,
                rules: user.role_rules,
            };
        }
        if (user.agency_id !== null) {
            u.agency = {
                id: user.agency_id,
                name: user.agency_name,
                abbreviation: user.agency_abbreviation,
                agency_parent_id: user.agency_parent_id,
            };
        }
        return u;
    });
}

async function deleteUser(id) {
    return knex('users')
        .where('id', id)
        .del();
}

async function createUser(user) {
    const response = await knex
        .insert(user)
        .into('users')
        .returning(['id', 'created_at']);
    return {
        ...user,
        id: response[0].id,
        created_at: response[0].created_at,
    };
}

async function getUser(id) {
    const [user] = await knex('users')
        .select(
            'users.id',
            'users.email',
            'users.name',
            'users.role_id',
            'roles.name as role_name',
            'roles.rules as role_rules',
            'users.agency_id',
            'agencies.name as agency_name',
            'agencies.abbreviation as agency_abbreviation',
            'agencies.parent as agency_parent_id_id',
            'agencies.main_agency_id as agency_main_agency_id',
            'agencies.warning_threshold as agency_warning_threshold',
            'agencies.danger_threshold as agency_danger_threshold',
            'users.tags',
            'users.tenant_id',
        )
        .leftJoin('roles', 'roles.id', 'users.role_id')
        .leftJoin('agencies', 'agencies.id', 'users.agency_id')
        .where('users.id', id);
    if (user.role_id != null) {
        user.role = {
            id: user.role_id,
            name: user.role_name,
            rules: user.role_rules,
        };
    }
    if (user.agency_id != null) {
        user.agency = {
            id: user.agency_id,
            name: user.agency_name,
            abbreviation: user.agency_abbreviation,
            agency_parent_id: user.agency_parent_id,
            warning_threshold: user.agency_warning_threshold,
            danger_threshold: user.agency_danger_threshold,
            main_agency_id: user.agency_main_agency_id,
        };
        let subagencies = [];
        if (user.role.name === 'admin') {
            subagencies = await getAgencies(user.agency_id);
        } else {
            subagencies.push({ ...user.agency });
        }
        user.agency.subagencies = subagencies;
    }
    return user;
}

function getRoles() {
    return knex('roles')
        .select('*')
        .orderBy('name');
}

module.exports = {
    getUsers,
    getTenantUsers,
    deleteUser,
    createUser,
    getUser,
    getRoles,
};
