<template>
  <div>
    <Header/>
    <nuxt/>
  </div>
</template>


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
