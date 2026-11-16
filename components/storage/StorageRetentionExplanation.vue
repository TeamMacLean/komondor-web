<template>
  <div class="mb-4">
    <p>
      Archiving copies the data to AWS. The HPC copy is removed afterwards
      unless a keep date is set. This Komondor record stays.
    </p>
    <p>
      Expiry permits manual deletion review only; nothing is deleted
      automatically.
    </p>
  </div>
</template>

<script>
export default { name: "StorageRetentionExplanation" };
</script>
