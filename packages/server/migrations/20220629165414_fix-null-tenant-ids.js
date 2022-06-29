// eslint-disable-next-line func-names
exports.up = async function (knex) {
    return knex.schema
        .raw(`update agencies set tenant_id = tenants.id FROM tenants where tenants.display_name = 'State of Nevada Test' and agencies.tenant_id is null`)
        .alterTable('agencies', (table) => {
            table.integer('tenant_id').unsigned().notNullable().alter();
        })
        .raw(`update users set tenant_id = tenants.id FROM tenants where tenants.display_name = 'State of Nevada Test' and users.tenant_id is null`)
        .alterTable('users', (table) => {
            table.integer('tenant_id').unsigned().notNullable().alter();
        });
};
exports.down = async function (knex) {
    return knex.schema
        .alterTable('agencies', (table) => {
            table.integer('tenant_id').unsigned().nullable().alter();
        })
        .alterTable('users', (table) => {
            table.integer('tenant_id').unsigned().nullable().alter();
        });
};
