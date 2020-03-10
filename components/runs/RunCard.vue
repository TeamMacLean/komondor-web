<template>
  <div class="card">
    <div class="card-content">
      <div>
        <p class="truncate">
          <b-icon icon="dna" size="is-small" class="has-text-grey"></b-icon>
          <nuxt-link :to="{ name: 'run', query: { id: run._id }}" class="title is-5">
            <span class="truncate">{{run.name}}</span>
          </nuxt-link>
        </p>
      </div>
      <p>
        <b-icon icon="account-outline" size="is-small" class="has-text-grey"></b-icon>
        <nuxt-link :to="{ name: 'user', query: { username: run.owner }}" class="has-text-text">
          
          {{run.owner}}
        </nuxt-link>
      </p>
      <p>
        <b-icon icon="account-multiple-outline" size="is-small" class="has-text-grey"></b-icon>
        {{run.group.name}}
      </p>
      <!-- <p>{{sample.commonName}}</p> -->

      <p class="truncate">{{run.conditions}}</p>
    </div>
  </div>
</template>

<script>
export default {
  props: ["run"]
};
</script>

