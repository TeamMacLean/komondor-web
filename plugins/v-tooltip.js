import Vue from "vue";
import VTooltip from "v-tooltip";

/* Popper keeps a tooltip inside its reference's scroll parent by default. The
   project list in the sidebar scrolls, so tooltips on long project names were
   being squeezed into that narrow column and pushed off the left of the
   screen. Bound them to the document instead so they stay in view. */
Vue.use(VTooltip, {
  defaultBoundariesElement: document.body,
});
