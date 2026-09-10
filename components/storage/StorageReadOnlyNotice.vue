<template>
  <b-message v-if="description.readOnly" type="is-info" has-icon>
    {{ message }}
  </b-message>
</template>

<script>
import { describeStorage, storageReadOnlyMessage } from "~/utils/storageState";

export default {
  name: "StorageReadOnlyNotice",
  props: {
    storage: {
      type: Object,
      default: null,
    },
  },
  computed: {
    description() {
      return describeStorage(this.storage);
    },
    message() {
      return storageReadOnlyMessage(this.storage);
    },
  },
};
</script>
