<template>
  <span v-if="description.badge.show" class="storage-badges">
    <b-tag :type="description.badge.type" :size="size">
      <b-icon :icon="description.badge.icon" size="is-small" class="mr-1" />
      {{ description.badge.text }}
    </b-tag>
    <b-tag v-if="showAttentionBadge" type="is-danger" :size="size" class="ml-1">
      <b-icon icon="alert-circle-outline" size="is-small" class="mr-1" />
      AWS move needs attention
    </b-tag>
  </span>
</template>

<script>
import { describeStorage } from "~/utils/storageState";

export default {
  name: "StorageBadge",
  props: {
    storage: {
      type: Object,
      default: null,
    },
    size: {
      type: String,
      default: "is-small",
    },
  },
  computed: {
    description() {
      return describeStorage(this.storage);
    },
    showAttentionBadge() {
      return (
        this.description.state === "migrating" &&
        this.description.needsAttention &&
        Boolean(this.$store?.getters?.isAdmin)
      );
    },
  },
};
</script>

<style scoped>
.storage-badges {
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
}
</style>
