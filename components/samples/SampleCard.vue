<template>
  <div class="card">
    <div class="card-content">
      <div>
        <p class="truncate">
          <b-icon icon="flask-outline" size="is-small" class="has-text-grey"></b-icon>
          <nuxt-link :to="{ name: 'sample', query: { id: sample._id }}" class="title is-5">
            <span class="truncate">{{sample.name}}</span>
          </nuxt-link>
        </p>
      </div>
      <p>
        <b-icon icon="account-outline" size="is-small" class="has-text-grey"></b-icon>
        <nuxt-link
          :to="{ name: 'user', query: { username: sample.owner }}"
          class="has-text-text"
        >{{sample.owner}}</nuxt-link>
      </p>
      <p>
        <b-icon icon="account-multiple-outline" size="is-small" class="has-text-grey"></b-icon>
        {{sample.group.name}}
      </p>
      <p>{{sample.ncbi}}</p>
      <p>{{sample.scientificName}}</p>
      <!-- <p>{{sample.commonName}}</p> -->

      <p class="truncate">{{sample.conditions}}</p>
    </div>
  </div>
</template>

<script>
export default {
  props: ["sample"]
};
</script>

