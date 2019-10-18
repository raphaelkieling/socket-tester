import Vue from 'vue';
import ElementUI from 'element-ui';
import VJsoneditor from 'v-jsoneditor'
import 'element-ui/lib/theme-chalk/index.css';
import App from './App.vue';
import JsonViewer from 'vue-json-viewer'

Vue.use(JsonViewer)
Vue.use(ElementUI);
Vue.use(VJsoneditor)

Vue.config.productionTip = false;

new Vue({
  el: '#app',
  render: h => h(App)
});