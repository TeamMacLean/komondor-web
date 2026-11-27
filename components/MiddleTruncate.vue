<template>
  <!--
    Ellipsis in the middle, sized by CSS rather than a fixed character count:
    the head shrinks with an ellipsis while the tail always stays visible, so
    "MiSeq RenSeq of Arabidopsis thaliana accessions" becomes
    "MiSeq RenSeq of Ara… thaliana accessions" on a narrow card and shows in
    full when there is room.
  -->
  <span class="middle-truncate" :title="text"
    ><span class="middle-truncate-head">{{ head }}</span
    ><span class="middle-truncate-tail">{{ tail }}</span></span
  >
</template>

<script>
export default {
  props: {
    text: { type: String, default: "" },
    // How many trailing characters are always kept.
    tailLength: { type: Number, default: 18 },
  },
  computed: {
    splitAt() {
      return Math.max(0, this.text.length - this.tailLength);
    },
    head() {
      return this.text.slice(0, this.splitAt);
    },
    tail() {
      return this.text.slice(this.splitAt);
    },
  },
};
</script>

<style scoped>
.middle-truncate {
  display: inline-flex;
  min-width: 0;
  max-width: 100%;
  /* pre, not nowrap: a space either side of the split point would otherwise
     collapse at the flex-item edge ("RenSeq" + "on" -> "RenSeqon") */
  white-space: pre;
}

.middle-truncate-head {
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}

.middle-truncate-tail {
  flex-shrink: 0;
}
</style>
