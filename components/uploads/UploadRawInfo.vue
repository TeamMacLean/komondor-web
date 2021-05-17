<template>
  <div class="wrapper">
    <div class="field-description">
      <p>
        <i>
          This is not the standard way to upload raw reads files. However, it is
          more flexible.
        </i>
      </p>
    </div>
    <div class="field-description">
      <p>
        You must be able to access your target files via your local filesystem.
        If needed, mount the HPC to your local filesystem.
      </p>
    </div>
    <div v-if="paired === null" class="error">
      Please select a library type before uploading files. Only upload files
      that match the file extensions permitted by the library type.
    </div>
    <CollapsibleUploaderHelp />
  </div>
</template>

<script>
import CollapsibleUploaderHelp from "~/components/formHelpers/CollapsibleUploaderHelp";
export default {
  name: "UploadRawInfo",
  components: { CollapsibleUploaderHelp },
  props: {
    paired: { type: Boolean, required: false },
  },
};
</script>

<style scoped>
.wrapper {
  margin-bottom: 2rem;
}
.field-description {
  margin-bottom: 1rem;
}
.error {
  color: red;
  margin-bottom: 1rem;
}
</style>
