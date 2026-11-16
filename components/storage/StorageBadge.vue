<template>
  <!-- Compact: one tinted icon, for narrow lists such as the home sidebar. The
       label lives in the tooltip and the aria-label, not on screen. -->
  <span
    v-if="compact && indicator"
    v-tooltip="{ content: indicator.text, html: false, placement: 'top' }"
    class="storage-indicator"
    :class="indicator.type"
    role="img"
    :aria-label="indicator.text"
  >
    <b-icon :icon="indicator.icon" size="is-small" />
  </span>
  <span v-else-if="!compact && description.badge.show" class="storage-badges">
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
import { describeStorage, storageIndicator } from "~/utils/storageState";

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
    compact: {
      type: Boolean,
      default: false,
    },
  },
  computed: {
    isAdmin() {
      return Boolean(this.$store?.getters?.isAdmin);
    },
    description() {
      return describeStorage(this.storage);
    },
    indicator() {
      return storageIndicator(this.storage, { isAdmin: this.isAdmin });
    },
    showAttentionBadge() {
      return (
        this.description.state === "migrating" &&
        this.description.needsAttention &&
        this.isAdmin
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

/* Bulma 0.9's text-on-tint pairs for each state colour: dark enough to read on
   the light sidebar, and matching the full badges elsewhere in hue. */
.storage-indicator {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 50%;
  cursor: help;
}

.storage-indicator.is-info {
  background-color: #eef6fc;
  color: #1d72aa;
}

.storage-indicator.is-warning {
  background-color: #fffbeb;
  color: #947600;
}

.storage-indicator.is-danger {
  background-color: #feecf0;
  color: #cc0f35;
}
</style>
