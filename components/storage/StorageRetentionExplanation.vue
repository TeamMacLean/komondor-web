<template>
  <p class="is-size-7">
    Archiving copies the data to AWS. The HPC copy is removed afterwards unless
    a keep date is set; nothing is deleted automatically. The project metadata
    stays on this Sequence Store.
  </p>
</template>

<script>
export default { name: "StorageRetentionExplanation" };
</script>
