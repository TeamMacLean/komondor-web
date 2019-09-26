<template>

  <div>
    <Home v-if="renderHome"></Home>
    <div v-else>

      <section class="hero is-medium is-primary">
        <div class="hero-body">
          <div class="container is-large">
            <div class="columns">
              <div class="column">
                <div class="container has-text-centered-mobile">
                  <h1 class="title is--1">
                    Mollis Quam Euismod Ornare
                  </h1>
                  <h2 class="subtitle">
                    Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Maecenas
                    faucibus mollis interdum. Aenean lacinia bibendum nulla sed consectetur.
                  </h2>
                </div>
              </div>
              <div class="column">
                <SigninCard hideHeader="true"/>
              </div>
            </div>
          </div>
        </div>
      </section>


      <section class="section has-background-light">
        <div class="container is-large">
          <div class="container">
            <div class="card has-text-centered">
              <div class="card-content">

                <h2 class="title is-2">Commodo Nullam Venenatis Magna Lorem</h2>
                <p class="subtitle is-5 ">Donec ullamcorper nulla non metus auctor fringilla.</p>

                <br>

                <div class="columns">
                  <div class="column">
                    <b-icon
                      icon="sprout"
                      size="is-large"
                      class="mb-1"
                    ></b-icon>
                    <p class="title is-5">Quam Cras Nibh</p>
                    <p class="subtitle is-6">Pellentesque ornare sem lacinia quam venenatis vestibulum.</p>
                    <a class="button is-large is-info">
                      <span class="is-size-6">
                          Large button w/ regular size text
                      </span>
                    </a>
                  </div>
                  <div class="column">
                    <b-icon
                      icon="dna"
                      size="is-large"
                      class="mb-1"
                    ></b-icon>
                    <p class="title is-5">Quam Cras Nibh</p>
                    <p class="subtitle is-6">Pellentesque ornare sem lacinia quam venenatis vestibulum.</p>
                    <a class="button is-large is-info">
                      <span class="is-size-6">
                          Large button w/ regular size text
                      </span>
                    </a>
                  </div>
                  <div class="column">
                    <b-icon
                      icon="flask"
                      size="is-large"
                      class="mb-1"
                    ></b-icon>
                    <p class="title is-5">Quam Cras Nibh</p>
                    <p class="subtitle is-6">Pellentesque ornare sem lacinia quam venenatis vestibulum.</p>
                    <a class="button is-large is-info is-outlined">
                      <span class="is-size-6">
                          Large button w/ regular size text
                      </span>
                    </a>
                  </div>
                </div>

              </div>
            </div>
          </div>

        </div>
      </section>

    </div>
  </div>
</template>


<script>
  import SigninCard from '~/components/SigninCard';
  import Home from '~/components/home/Home.vue';

  export default {
    components: {SigninCard, Home},
    fetch({store, redirect}) {
      if (store.state.auth.loggedIn) {
        return Promise.all([
          store.dispatch('refreshProjects'),
          store.dispatch('refreshNews')
        ])
      } else {
        return Promise.resolve()
      }
    },
    computed: {
      renderHome() {
        return this.$store.state.auth.loggedIn
      }
    }
  }
</script>

<style>

  #home .fill-height {
    min-height: calc(100vh - 52px);
    /*min-height: 100%;*/
  }

</style>
