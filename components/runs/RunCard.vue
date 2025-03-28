<template>
  <div class="card">
    <div class="card-content">
      <div>
        <b-tooltip v-if="this.run.name.length > 40" position="is-bottom" :label="multilinedLabel" multilined size="is-large">
          <p class="truncate">
            <b-icon icon="dna" size="is-small" class="has-text-grey"></b-icon>
            <nuxt-link :to="{ name: 'run', query: { id: run._id }}" class="title is-5">
              <span class="truncate">{{truncatedRunName}}</span>
            </nuxt-link>
          </p>
        </b-tooltip>
        <p v-else class="truncate">
            <b-icon icon="dna" size="is-small" class="has-text-grey"></b-icon>
            <nuxt-link :to="{ name: 'run', query: { id: run._id }}" class="title is-5">
              <span class="truncate">{{this.run.name}}</span>
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
  props: ["run"],
  computed: {
    truncatedRunName(){
      const totalLength = this.run.name.length;
      const beginning = this.run.name.substring(0, 24)
      const end = this.run.name.substring((totalLength - 24), totalLength)
      return `${beginning}...${end}`
    },
    multilinedLabel(){
      const { name } = this.run
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

