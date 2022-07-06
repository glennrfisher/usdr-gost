const fetchApi = require('@/helpers/fetchApi');

function initialState() {
  return {
    agencies: [],
    tenantAgencies: [],
  };
}

export default {
  namespaced: true,
  state: initialState,
  getters: {
    agencies: (state) => state.agencies,
    tenantAgencies: (state) => state.tenantAgencies,
  },
  actions: {
    fetchAgencies({ commit }) {
      fetchApi.get('/api/organizations/:organizationId/agencies').then((data) => commit('SET_AGENCIES', data));
    },
    async createAgency({ dispatch }, body) {
      await fetchApi.post('/api/organizations/:organizationId/agencies/', body);
      dispatch('fetchAgencies');
    },
    async deleteAgency({ dispatch }, agencyId) { // { agencyId, parent, name, abbreviation, warningThreshold, dangerThreshold, }
      // console.log(`agencies      ${agencyId}`);
      await fetchApi.deleteRequest(`/api/organizations/:organizationId/agencies/del/${agencyId}`);
      await dispatch('fetchAgencies');
      // fetchApi.deleteRequest(`/api/organizations/:organizationId/agencies/del/${agencyId}`, {
      //   parent,
      //   name,
      //   abbreviation,
      //   warningThreshold,
      //   dangerThreshold,
      // });
      // dispatch('fetchAgencies');
    },
    async updateThresholds({ dispatch }, { agencyId, warningThreshold, dangerThreshold }) {
      await fetchApi.put(`/api/organizations/:organizationId/agencies/${agencyId}`, {
        // Currently, agencies are seeded into db; only thresholds are mutable.
        warningThreshold,
        dangerThreshold,
      });
      dispatch('fetchAgencies');
    },
    async updateAgencyName({ dispatch }, { agencyId, name }) {
      await fetchApi.put(`/api/organizations/:organizationId/agencies/name/${agencyId}`, {
        name,
      });
      dispatch('fetchAgencies');
    },
    async updateAgencyAbbr({ dispatch }, { agencyId, abbreviation }) {
      await fetchApi.put(`/api/organizations/:organizationId/agencies/abbr/${agencyId}`, {
        abbreviation,
      });
      dispatch('fetchAgencies');
    },
    async updateAgencyParent({ dispatch }, { agencyId, parentId }) {
      // const par = parentId.id;
      // console.log(`DDDDDDDDDDDDD   ${parentId}`);
      await fetchApi.put(`/api/organizations/:organizationId/agencies/parent/${agencyId}`, {
        parentId,
      });
      dispatch('fetchAgencies');
    },
  },
  mutations: {
    SET_AGENCIES(state, data) {
      const { agencies, tenantAgencies } = data;
      state.agencies = agencies;
      state.tenantAgencies = tenantAgencies;
    },
  },
};
