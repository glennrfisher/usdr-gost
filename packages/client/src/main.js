import '@babel/polyfill'
import 'mutationobserver-shim'
import './plugins/bootstrap-vue'
import Vue from 'vue';
import { BootstrapVue, IconsPlugin } from 'bootstrap-vue';
import vSelect from 'vue-select';
import Vuelidate from 'vuelidate';

import App from './App.vue';
import router from './router';
import store from './store';


const fetchApi = require('@/helpers/fetchApi');

// Install BootstrapVue
Vue.use(BootstrapVue);
// Optionally install the BootstrapVue icon components plugin
Vue.use(IconsPlugin);
Vue.use(Vuelidate);
Vue.component('v-select', vSelect);

Vue.config.productionTip = false;

fetchApi.get('/api/sessions')
  .then((data) => {
    if (data && data.user) {
      store.dispatch('users/login', data.user);
      store.dispatch('grants/fetchInterestedCodes');
    }
    // const app = createApp(App);
    // app.use(store);
    // app.mount('#app');
    new Vue({
      router,
      store,
      render: (h) => h(App),
    }).$mount('#app');
  })
  .catch((e) => {
    store.dispatch('users/logout');
    console.log(e);
  });
