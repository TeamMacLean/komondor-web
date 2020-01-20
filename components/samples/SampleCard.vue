<template>
  <div class="card">
    <div class="card-content">
      <p class="truncate">
        <nuxt-link :to="{ name: 'sample', query: { id: sample._id }}" class="title is-5">
          <b-icon
            icon="flask-outline"
            size="is-small"
            class="has-text-grey">
          </b-icon>
          {{sample.name}}

        </nuxt-link>
      </p>
      <p>
        <b-icon
          icon="account-outline"
          size="is-small"
          class="has-text-grey">
        </b-icon>
        {{sample.owner}}
      </p>
      <p>{{sample.scientificName}}</p>
      <p>{{sample.commonName}}</p>
      <p>{{sample.ncbi}}</p>
      <p class="truncate">{{sample.conditions}}</p>


    </div>

  </div>
</template>

<script>
  export default {
    props: ['sample']
  }
</script>

