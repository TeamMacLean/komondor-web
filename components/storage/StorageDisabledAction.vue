<template>
  <span class="storage-disabled-action">
    <b-tooltip :label="reason" multilined position="is-bottom">
      <span
        role="button"
        tabindex="0"
        :aria-labelledby="`${descriptionId}-label`"
        :aria-describedby="descriptionId"
        aria-disabled="true"
      >
        <b-button
          disabled
          aria-hidden="true"
          :type="type"
          :icon-left="iconLeft"
          :aria-describedby="descriptionId"
          ><span :id="`${descriptionId}-label`"><slot /></span
        ></b-button>
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
