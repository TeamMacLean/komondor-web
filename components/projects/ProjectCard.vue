<template>
  <div class="card">
    <div class="card-content">
      <div v-tooltip.top-center='project.name'>
        <p class="truncate">

          <b-icon
            icon="folder-text-outline"
            size="is-small"
            class="has-text-grey">
          </b-icon>
          <nuxt-link :to="{ name: 'project', query: { id: project._id }}" class="title is-5">
            <span class="truncate">{{project.name}}</span>
          </nuxt-link>
        </p>
      </div>

      <p>
        <nuxt-link :to="{ name: 'user', query: { username: project.owner }}" class="has-text-text">
          <b-icon
            icon="account-outline"
            size="is-small"
            class="has-text-grey">
          </b-icon>
          {{project.owner}}
        </nuxt-link>
      </p>
      <p>
        <b-icon
          icon="account-multiple-outline"
          size="is-small"
          class="has-text-grey">
        </b-icon>
        {{project.group.name}}
      </p>
      <p class="truncate">{{project.shortDesc}}</p>


    </div>
  </div>
</template>

<script>
  export default {
    props: ['project']
  }
</script>
