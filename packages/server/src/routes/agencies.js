const express = require('express');

const router = express.Router({ mergeParams: true });
const { requireAdminUser, requireUser, isPartOfAgency } = require('../lib/access-helpers');
const {
    getAgency,
    getAgencies,
    getTenantAgencies,
    setAgencyThresholds,
    createAgency,
    setAgencyName,
    setAgencyAbbr,
    setAgencyParent,
    deleteAgency,
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

router.delete('/del/:agency', requireAdminUser, async (req, res) => {
    const { agency } = req.params;

    // const {
    //     parent, name, abbreviation, warningThreshold, dangerThreshold,
    // } = req.body;
    const result = await deleteAgency(
        agency,
        // ,
        // parent,
        // name,
        // abbreviation,
        // warningThreshold,
        // dangerThreshold,
    );
    res.json(result);
});

router.put('/name/:agency', requireAdminUser, async (req, res) => {
    const { agency } = req.params;

    const { name } = req.body;
    const result = await setAgencyName(agency, name);
    res.json(result);
});

router.put('/abbr/:agency', requireAdminUser, async (req, res) => {
    const { agency } = req.params;

    const { abbreviation } = req.body;
    const result = await setAgencyAbbr(agency, abbreviation);
    res.json(result);
});

router.put('/parent/:agency', requireAdminUser, async (req, res) => {
    const { agency } = req.params;

    // const { parentId } = req.body.parentId;
    // console.log('reeeeeeqqqqq  ' + req.body.parentId);
    const result = await setAgencyParent(agency, req.body.parentId);
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
