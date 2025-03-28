<template>
  <div>
    <Home v-if="renderHome"></Home>
    <div v-else>
      <section class="hero is-medium is-primary" style="height:calc(100vh - 46px);">
        <div class="hero-body">
          <div class="container is-large">
            <!-- <div class="columns">
            <div class="column">-->
            <div class="container has-text-centered-mobile">
              <h1 class="title is-1 has-text-centered">TSL Sequence Store</h1>

              <!-- <h2
                class="subtitle has-text-centered"
              >This site is for the storage of TSL read data and its associated meta data</h2> -->
            </div>
            <br />
            <!-- </div> -->
            <!-- <div class="column"> -->
            <SigninCard hideHeader="true" />
            <!-- </div> -->
          </div>
        </div>
        <!-- </div> -->
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
    }
  }
};
</script>

<style>
#home .fill-height {
  min-height: calc(100vh - 52px);
  /*min-height: 100%;*/
}
</style>
