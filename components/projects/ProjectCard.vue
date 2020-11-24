<template>
  <div class="card">
    <div class="card-content">
      <div>
        <b-tooltip v-if="this.project.name.length > 40" position="is-bottom" :label="multilinedLabel" multilined size="is-large">
          <p class="truncate">
            <b-icon icon="folder-text-outline" size="is-small" class="has-text-grey"></b-icon>
            <nuxt-link :to="{ name: 'project', query: { id: project._id }}" class="title is-5">
                <span class="truncate">{{truncatedProjectName}}</span>
            </nuxt-link>
          </p>
        </b-tooltip>
        <p v-else class="truncate">
          <b-icon icon="folder-text-outline" size="is-small" class="has-text-grey"></b-icon>
          <nuxt-link :to="{ name: 'project', query: { id: project._id }}" class="title is-5">
              <span class="truncate">{{project.name}}</span>
          </nuxt-link>
        </p>
      </div>
      <p>
        <b-icon icon="account-outline" size="is-small" class="has-text-grey"></b-icon>
        <nuxt-link
          :to="{ name: 'user', query: { username: project.owner }}"
          class="has-text-text"
        >{{project.owner}}</nuxt-link>
      </p>
      <p>
        <b-icon icon="account-multiple-outline" size="is-small" class="has-text-grey"></b-icon>
        {{project.group.name}}
      </p>
      <p class="truncate">{{project.shortDesc}}</p>
    </div>
  </div>
</template>

<script>
export default {
  props: ["project"],
  computed: {
    truncatedProjectName(){
      const totalLength = this.project.name.length;
      const beginning = this.project.name.substring(0, 24)
      const end = this.project.name.substring((totalLength - 24), totalLength)
      return `${beginning}...${end}`
    },
    multilinedLabel(){
      const { name } = this.project
      if (!/\s/.test(name)){
        //break it up
        var newName = name
        var totalLength = name.length
        var addSpaceTargetIndex = 21;
        for (var i = 0; i < totalLength; i++){
          if (i === addSpaceTargetIndex){
            newName = newName.slice(0, addSpaceTargetIndex) + "-" + newName.slice(addSpaceTargetIndex);
            addSpaceTargetIndex = (addSpaceTargetIndex + addSpaceTargetIndex + 1)
            totalLength++
          }
        }
        return newName;
      } else {
        return name
      }
    }
  }
};
</script>
