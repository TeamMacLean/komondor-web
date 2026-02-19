<template>
  <div>
    <div v-if="renderHome">
      <section class="section" style="padding-bottom: 0">
        <b-message type="is-info" has-icon>
          <strong>New Bulk Upload Feature:</strong> Power users can now enter
          multiple projects, samples, and runs using a single CSV file. If you
          are interested in beta testing this feature, please contact George for
          more info. Once this has been tested more thoroughly, it will be
          released to more users publicly.
        </b-message>
      </section>
      <Home></Home>
    </div>
    <div v-else>
      <section
        class="hero is-medium is-primary"
        style="height: calc(100vh - 46px)"
      >
        <div class="hero-body">
          <div class="container is-large">
            <div class="container has-text-centered-mobile">
              <h1 class="title is-1 has-text-centered">TSL Sequence Store</h1>
            </div>
            <br />
            <SigninCard hide-header="true" />
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script>
import SigninCard from "~/components/SigninCard";
import Home from "~/components/home/Home.vue";

export default {
  components: { SigninCard, Home },
  // fetch({store, redirect}) {
  //   if (store.state.auth.loggedIn) {
  //     return Promise.all([
  //       // store.dispatch('refreshProjects'),
  //       // store.dispatch('refreshNews')
  //     ])
  //   } else {
  //     return Promise.resolve()
  //   }
  // },
  computed: {
    renderHome() {
      return this.$store.state.auth.loggedIn;
    },
  },
};
</script>

<style>
#home .fill-height {
  min-height: calc(100vh - 52px);
  /*min-height: 100%;*/
}
</style>
