<template>
  <div id="login" class="card">


    <div v-if="!hideHeader">
      <div class="card-header" v-show="!!!$store.state.user">
        <p class="card-header-title">
          Please sign in
        </p>
      </div>
    </div>

    <div class="card-content">

      <b-message type="is-danger" v-if="error">
        {{error}}
      </b-message>

      <form @submit.prevent="onSubmit" v-if="!$store.state.user">


        <b-field label="Username">
          <div class="control">
            <div class="field has-addons">
              <b-input
                type="test"
                name="username"
                title="username"
                spellcheck="false"
                expanded
                v-model="credentials.username"
                required="required">
              </b-input>
              <button class="button is-static" tabindex="-1">@nbi.ac.uk</button>
            </div>
          </div>
        </b-field>


        <b-field label="Password">
          <b-input id="password" type="password" name="password" title="password"
                   autocomplete="current-password"
                   v-model="credentials.password" required>

          </b-input>

        </b-field>

        <div v-if="submitting">Submitting ....</div>

        <b-field>
          <button type="submit" class="button is-success is-fullwidth">Sign in</button>
        </b-field>
      </form>
      <div v-else>
        You are logged in!
      </div>


    </div>
  </div>
</template>

<script>

  export default {
    props: ['hideHeader'],
    data() {
      return {
        submitting: false,
        error: null,
        credentials: {
          username: '',
          password: ''
        },
      }
    },
    methods: {
      async onSubmit() {
        const self = this;
        self.submitting = true;


        this.$auth.loginWith('local', {
          data: {
            username: self.credentials.username,
            password: self.credentials.password
          }
        })
          .then(() => {
            self.submitting = false;

            this.$buefy.toast.open({
              message: 'Sign in successful',
              type: 'is-success'
            });

            this.$router.push({
              path: '/'
            })

          })
          .catch(err => {
            self.submitting = false;
            self.error = err;
            console.error(err);
          })
      }
    }
  }
</script>

<style>

  #login.card {
    width: 400px;
    border-radius: 4px;
    margin: 0 auto;
  }

  #login .card-content .button.is-static {
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
  }


</style>

