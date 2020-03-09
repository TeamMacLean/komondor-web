<template>
  <div class="is-vertical-center">
    <SigninCard />
  </div>
</template>

<script>
import SigninCard from "~/components/SigninCard";

export default {
  components: { SigninCard },
  fetch({ params, redirect, store }) {
    //redirect to / is already signed in, possible redirect loop.
    if (store.state.auth.loggedIn) {
      redirect(301, "/");
    }
  }
};
</script>
