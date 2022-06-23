/**
 * seed file for specific tenant
 * will seed tenant and admin for a new tenant. Go to render=> dashboard => shell
 * and run
 * npx knex seed:run --specific=nevada.js --env envinronment-goes-here
 * to seed the tenant.
 * locally make sure to run
 * export POSTGRES_URL="postgresql://localhost:5432/usdr_grants
 */

// const tenants = [
//     {
//         display_name: 'State of Nevada',
//     },
// ];

// const agencies = [
//     {
//         abbreviation: 'Administration',
//         name: 'Adminstration: Grant Office',
//         parent: 0,
//         main_agency_id: 0,
//         tenant_id: 5,
//     },
// ];

// const users = [
//     {
//         email: 'grants.dev+nv@usdigitalresponse.org',
//         name: 'Nevada Multi-Tenant Admin',
//         agency_id: 0,
//         role_id: 1,
//         tenant_id: 5,
//     },
// ];
exports.seed = async (knex) => {
    const tenantId = await knex('tenants').returning('id').insert(
        {
            display_name: 'State of Nevada Test',
        },
    );
    const agencyId = await knex('agencies').returning('id').insert({
        abbreviation: 'AGO',
        name: 'Adminstration: Grants Office',
        parent: 0,
        main_agency_id: 0,
        tenant_id: tenantId[0],
    });
    await knex('users').insert({
        email: 'grants.dev+nv@usdigitalresponse.org',
        name: 'USDR Grants Dev',
        agency_id: agencyId[0],
        role_id: 1,
        tenant_id: tenantId[0],
    });

    await knex('agencies').where('id', agencyId[0]).update({ main_agency_id: agencyId[0] });
    await knex('tenants').where('id', tenantId[0]).update({ main_agency_id: agencyId[0] });
};
