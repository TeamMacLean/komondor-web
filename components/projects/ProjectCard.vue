<template>
  <div class="card">
    <div class="card-content">
      <b-tooltip
        :active="isLongName"
        position="is-bottom"
        :label="multilinedLabel"
        multilined
        size="is-large"
        class="card-title-tooltip"
      >
        <p class="card-title">
          <b-icon
            icon="folder-text-outline"
            size="is-small"
            class="has-text-grey card-title-icon"
          ></b-icon>
          <nuxt-link
            :to="{ name: 'project', query: { id: project._id } }"
            class="title card-title-link"
            :class="isLongName ? 'is-6' : 'is-5'"
          >
            <MiddleTruncate :text="displayName" />
          </nuxt-link>
        </p>
      </b-tooltip>
      <p>
        <b-icon
          icon="account-outline"
          size="is-small"
          class="has-text-grey"
        ></b-icon>
        <nuxt-link
          :to="{ name: 'user', query: { username: project.owner } }"
          class="has-text-text"
          >{{ project.owner }}</nuxt-link
        >
      </p>
      <p>
        <b-icon
          icon="account-multiple-outline"
          size="is-small"
          class="has-text-grey"
        ></b-icon>
        {{ project.group.name }}
      </p>
      <StorageBadge :storage="project.storage" />
      <p class="truncate">{{ project.shortDesc }}</p>
    </div>
  </div>
</template>

<script>
import StorageBadge from "~/components/storage/StorageBadge.vue";
import MiddleTruncate from "~/components/MiddleTruncate.vue";

export default {
  components: { StorageBadge, MiddleTruncate },
  props: {
    project: { type: Object, required: true },
  },
  computed: {
    displayName() {
      return this.project.name;
    },
    // Long names get a smaller font (and a tooltip with the full name);
    // MiddleTruncate handles whatever still doesn't fit.
    isLongName() {
      return (this.project.name || "").length > 40;
    },
    multilinedLabel() {
      const { name } = this.project;
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

<style scoped>
/* b-tooltip is inline-flex and sizes to its content, which let a long title
   push past the card edge. Pin it (and everything inside) to the card width
   so MiddleTruncate has a width to shrink into. */
.card-title-tooltip {
  display: flex;
  max-width: 100%;
}

.card-title-tooltip ::v-deep .tooltip-trigger {
  min-width: 0;
  max-width: 100%;
}

.card-title {
  display: flex;
  align-items: center;
  min-width: 0;
}

.card-title-icon {
  flex-shrink: 0;
  margin-right: 0.25rem;
}

.card-title-link {
  display: flex;
  min-width: 0;
  margin-bottom: 0;
}
</style>
