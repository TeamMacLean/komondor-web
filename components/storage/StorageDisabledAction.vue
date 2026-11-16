<template>
  <span class="storage-disabled-action">
    <b-tooltip :label="reason" multilined position="is-bottom">
      <span tabindex="0" :aria-describedby="descriptionId" aria-disabled="true">
        <b-button
          disabled
          :type="type"
          :icon-left="iconLeft"
          :aria-describedby="descriptionId"
          ><slot
        /></b-button>
      </span>
    </b-tooltip>
    <span :id="descriptionId" class="help">{{ reason }}</span>
  </span>
</template>

<script>
import { storageReadOnlyMessage } from "~/utils/storageState";

export default {
  name: "StorageDisabledAction",
  props: {
    storage: { type: Object, default: null },
    descriptionId: { type: String, required: true },
    type: { type: String, default: "is-secondary" },
    iconLeft: { type: String, default: undefined },
  },
  computed: {
    reason() {
      return storageReadOnlyMessage(this.storage);
    },
  },
};
</script>

<style scoped>
.storage-disabled-action {
  display: inline-block;
}
/* Disabled native buttons cannot receive mouse events. The wrapper owns them. */
button {
  pointer-events: none;
}
.help {
  max-width: 26rem;
}
</style>
