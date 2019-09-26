<template>
  <div class="card">
    <div class="card-content">
      <nuxt-link :to="{ name: 'run', query: { id: run._id }}" class="title is-5">{{run.name}}
      </nuxt-link>
      <p>{{run.sequencingProvider}}</p>
      <p>{{run.owner}}</p>
      <p>{{run.ncbi}}</p>
      <p class="truncate">{{run.conditions}}</p>


    </div>

  </div>
</template>

<script>
  export default {
    props: ['run']
  }
</script>

