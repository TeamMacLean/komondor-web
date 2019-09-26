<template>
  <div>
    <Header/>

    <!--<section class="section">-->
    <!--<div class="container">-->
    <nuxt/>
    <!--</div>-->
    <!--</section>-->
  </div>
</template>

<style>
  /*html, body {*/
  /*!*background: #F7F7F7;*!*/
  /*}*/
</style>


<script>
  import Header from '~/components/Header.vue'

  export default {
    components: {
      Header
    },
    data() {
      return {
        online: true
      }
    },
    mounted() {
      if (!window.navigator) {
        this.online = false;
        return
      }
      this.online = Boolean(window.navigator.onLine);
      window.addEventListener('offline', this._toggleNetworkStatus);
      window.addEventListener('online', this._toggleNetworkStatus);
    },
    methods:{
      _toggleNetworkStatus({ type }){
        this.online = type === 'online';

        if(this.online){
          this.$buefy.toast.open({
            message: 'You are back online!',
            type: 'is-success'
          })
        } else {
          this.$buefy.toast.open('You are offline')
        }
      }
    }
  }
</script>
