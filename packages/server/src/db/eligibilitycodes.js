const knex = require('./connection');
const { TABLES } = require('./constants');

function getElegibilityCodes() {
    return knex(TABLES.eligibility_codes)
        .select('*');
}

function setAgencyEligibilityCodeEnabled(code, agencyId, enabled) {
    return knex(TABLES.agency_eligibility_codes)
        .insert({
            agency_id: agencyId,
            code,
            enabled,
            updated_at: new Date(),
        })
        .onConflict(['agency_id', 'code'])
        .merge();
}

async function getAgencyEligibilityCodes(agencyId) {
    const eligibilityCodes = await knex(TABLES.eligibility_codes).orderBy('code');
    const agencyEligibilityCodes = await knex(TABLES.agency_eligibility_codes)
        .where('agency_eligibility_codes.agency_id', agencyId)
        .orderBy('code');
    return eligibilityCodes.map((ec) => {
        const agencyEcEnabled = agencyEligibilityCodes.find((aEc) => ec.code === aEc.code);
        if (!agencyEcEnabled) {
            return {
                ...ec,
                created_at: null,
                updated_at: null,
                enabled: false,
            };
        }
        return {
            ...ec,
            ...agencyEcEnabled,
        };
    });
}

module.exports = {
    getElegibilityCodes,
    setAgencyEligibilityCodeEnabled,
    getAgencyEligibilityCodes,
};
