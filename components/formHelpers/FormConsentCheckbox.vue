/* eslint-disable prettier/prettier */
<template>
  <div class="field">
    <b-checkbox v-model="internalValue" type="checkbox" required>
      *I confirm that I have carefully checked all of my input data for this
      form, and that it is in its final state. I accept that, once submitted, I
      may not be able to edit these fields, including their submission to ENA.
    </b-checkbox>
  </div>
</template>

<script>
export default {
  props: {
    value: {
      type: Boolean,
      default: false,
    },
  },
  computed: {
    internalValue: {
      get() {
        return this.value;
      },
      set(newValue) {
        this.$emit("input", newValue);
      },
    },
  },
};
</script>

<style></style>
