const express = require('express');

const router = express.Router({ mergeParams: true });
const { requireAdminUser, requireUser, isPartOfAgency } = require('../lib/access-helpers');
const {
    getAgency, getAgencies, getTenantAgencies, setAgencyThresholds, createAgency,
} = require('../db');

router.get('/', requireUser, async (req, res) => {
    const { user } = req.session;
    let response;
    if (user.role.name === 'admin') {
        const agencies = await getAgencies(req.session.selectedAgency);
        const tenantAgencies = await getTenantAgencies(user.tenant_id);
        response = { agencies, tenantAgencies };
        // response = await getAgencies(req.session.selectedAgency);
    } else {
        const agencies = await getAgency(req.session.selectedAgency);
        response = { agencies };
    }
    res.json(response);
});

router.put('/:agency', requireAdminUser, async (req, res) => {
    // Currently, agencies are seeded into db; only thresholds are mutable.
    const { agency } = req.params;

    const { warningThreshold, dangerThreshold } = req.body;
    const result = await setAgencyThresholds(agency, warningThreshold, dangerThreshold);
    res.json(result);
});

router.post('/', requireAdminUser, async (req, res) => {
    const { user } = req.session;
    if (!isPartOfAgency(user.agency.subagencies, req.body.parentId)) {
        throw new Error(`You dont have access parent agency`);
    }
    const agency = {
        name: req.body.name,
        abbreviation: req.body.abbreviation,
        parent: Number(req.body.parentId),
        warning_threshold: Number(req.body.warningThreshold),
        danger_threshold: Number(req.body.dangerThreshold),
        main_agency_id: req.session.selectedAgency,
        tenant: user.tenant_id,
    };
    const parentAgency = await getAgency(agency.parent);
    if (!parentAgency) {
        throw new Error(`Agency ${agency.parent} not found`);
    }
    const result = await createAgency(agency);

    res.json(result);
});

module.exports = router;
