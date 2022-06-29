// eslint-disable-next-line func-names
exports.up = async function (knex) {
    return knex.schema
        .alterTable('agencies', (table) => {
            table.integer('tenant_id').unsigned().notNullable();
        })
        .raw(`update agencies set agencies.tenant_id = tenant.id from tenant where tenant.name = 'State of Nevada Test' and tenant_id is null`)
        .alterTable('users', (table) => {
            table.integer('tenant_id').unsigned().notNullable();
        }).raw(`update users set users.tenant_id = tenant.id from tenant where tenant.name = 'State of Nevada Test' and tenant_id is null`);
};
exports.down = async function (knex) {
    return knex.schema
        .alterTable('agencies', (table) => {
            table.integer('tenant_id').unsigned().nullable();
        })
        .alterTable('users', (table) => {
            table.integer('tenant_id').unsigned().nullable();
        });
};
