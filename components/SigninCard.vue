<template>
  <div id="login" class="card">
    <div v-if="!hideHeader">
      <div v-show="!!!$store.state.user" class="card-header">
        <p class="card-header-title">Please sign in</p>
      </div>
    </div>

    <div class="card-content">
      <b-message v-if="error" type="is-danger">
        {{ error }}
      </b-message>

      <form v-if="!$store.state.user" @submit.prevent="onSubmit">
        <b-field label="Username">
          <div class="control">
            <div class="field has-addons">
              <b-input
                v-model="credentials.username"
                type="text"
                name="username"
                title="username"
                spellcheck="false"
                expanded
                required="required"
              >
              </b-input>
              <button class="button is-static" tabindex="-1">@nbi.ac.uk</button>
            </div>
          </div>
        </b-field>

        <b-field label="Password">
          <b-input
            id="password"
            v-model="credentials.password"
            type="password"
            name="password"
            title="password"
            autocomplete="current-password"
            required
          >
          </b-input>
        </b-field>

        <div v-if="submitting">Submitting ....</div>

        <b-field>
          <button type="submit" class="button is-success is-fullwidth">
            Sign in
          </button>
        </b-field>
      </form>
      <div v-else>You are logged in!</div>
    </div>
  </div>
</template>

<script>
import { getApiErrorMessage } from "~/utils/apiError";

export default {
  props: ["hideHeader"],
  data() {
    return {
      submitting: false,
      error: null,
      credentials: {
        username: "",
        password: "",
      },
    };
  },
  methods: {
    async onSubmit() {
      const self = this;
      self.submitting = true;

      this.$auth
        .loginWith("local", {
          data: {
            username: self.credentials.username,
            password: self.credentials.password,
          },
        })
        .then(() => {
          self.submitting = false;

          this.$buefy.toast.open({
            message: "Sign in successful",
            type: "is-success",
          });

          this.$router.push({
            path: "/",
          });
        })
        .catch((err) => {
          self.submitting = false;
          // `/login` is the one route that reports failure as `{message}`, so
          // without this the user saw "Request failed with status code 401"
          // instead of "Bad credentials".
          self.error = getApiErrorMessage(err, {
            fallback:
              "Sign in failed. Please check your username and password.",
          });
          console.error(err);
        });
    },
  },
};
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
