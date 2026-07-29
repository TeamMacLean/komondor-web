<template>
  <div class="card">
    <div class="card-content">
      <div>
        <b-tooltip
          v-if="sample.name && sample.name.length > 40"
          position="is-bottom"
          :label="multilinedLabel"
          multilined
          size="is-large"
        >
          <p class="truncate">
            <b-icon
              icon="flask-outline"
              size="is-small"
              class="has-text-grey"
            ></b-icon>
            <nuxt-link
              :to="{ name: 'sample', query: { id: sample._id } }"
              class="title is-5"
            >
              <span class="truncate">{{ truncatedSampleName }}</span>
            </nuxt-link>
          </p>
        </b-tooltip>
        <p v-else class="truncate">
          <b-icon
            icon="flask-outline"
            size="is-small"
            class="has-text-grey"
          ></b-icon>
          <nuxt-link
            :to="{ name: 'sample', query: { id: sample._id } }"
            class="title is-5"
          >
            <span class="truncate">{{ sample.name || "[No Name]" }}</span>
          </nuxt-link>
        </p>
      </div>
      <p>
        <b-icon
          icon="account-outline"
          size="is-small"
          class="has-text-grey"
        ></b-icon>
        <nuxt-link
          :to="{ name: 'user', query: { username: sample.owner } }"
          class="has-text-text"
          >{{ sample.owner }}</nuxt-link
        >
      </p>
      <p>
        <b-icon
          icon="account-multiple-outline"
          size="is-small"
          class="has-text-grey"
        ></b-icon>
        {{ sample.group.name }}
      </p>
      <p>
        {{ sample.ncbi || (sample.tplexCsv ? "TPlex data in CSV" : "N/A") }}
      </p>
      <p>
        {{
          sample.scientificName ||
          (sample.tplexCsv ? "TPlex data in CSV" : "N/A")
        }}
      </p>
      <!-- <p>{{sample.commonName}}</p> -->

      <p class="truncate">
        {{
          sample.conditions || (sample.tplexCsv ? "TPlex data in CSV" : "N/A")
        }}
      </p>
    </div>
  </div>
</template>

<script>
export default {
  props: ["sample"],
  computed: {
    truncatedSampleName() {
      if (!this.sample.name) {
        return "[No Name]";
      }
      const totalLength = this.sample.name.length;
      const beginning = this.sample.name.substring(0, 24);
      const end = this.sample.name.substring(totalLength - 24, totalLength);
      return `${beginning}...${end}`;
    },
    multilinedLabel() {
      const { name } = this.sample;
      if (!name) {
        return "[No Name]";
      }
      if (!/\s/.test(name)) {
        //break it up
        var newName = name;
        var totalLength = name.length;
        var addSpaceTargetIndex = 21;
        for (var i = 0; i < totalLength; i++) {
          if (i === addSpaceTargetIndex) {
            newName =
              newName.slice(0, addSpaceTargetIndex) +
              "-" +
              newName.slice(addSpaceTargetIndex);
            addSpaceTargetIndex = addSpaceTargetIndex + addSpaceTargetIndex + 1;
            totalLength++;
          }
        }
        return newName;
      } else {
        return name;
      }
    },
  },
};
</script>
