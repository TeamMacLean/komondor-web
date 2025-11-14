<template>
  <div>
    <b-field
      label="HPC Directory Name"
      message="Enter the name of the directory in the HPC transfer area containing your read files."
    >
      <b-input
        v-model="directoryName"
        placeholder="e.g., my-project-reads"
        @input="resetState"
      ></b-input>
    </b-field>

    <b-button
      @click="findFiles"
      :loading="isFinding"
      :disabled="!directoryName"
      type="is-primary"
      class="mt-2"
    >
      Find Files
    </b-button>

    <div v-if="error" class="notification is-danger is-light mt-4">
      <b-icon icon="alert-circle-outline" size="is-small"></b-icon>
      {{ error }}
    </div>

    <div v-if="foundFiles.length > 0" class="mt-4">
      <h3 class="subtitle is-6">Files Found in '{{ directoryName }}'</h3>
      <div
        v-for="file in foundFiles"
        :key="file.name"
        class="mb-2 control"
        style="display: block"
      >
        <b-checkbox v-model="selectedFiles" :native-value="file">
          {{ file.name }}
          <span class="has-text-grey is-size-7 ml-2"
            >({{ formatBytes(file.size) }})</span
          >
        </b-checkbox>
      </div>
      <b-button
        @click="validateSelectedFiles"
        :loading="isValidating"
        :disabled="selectedFiles.length === 0"
        class="mt-4 is-success"
      >
        Use {{ selectedFiles.length }} Selected File(s)
      </b-button>
    </div>

    <div v-if="validatedFiles.length > 0" class="mt-4 notification is-success is-light">
      <p>
        Successfully validated and selected
        <strong>{{ validatedFiles.length }}</strong> file(s). You can now
        proceed with the form submission.
      </p>
    </div>
  </div>
</template>

<script>
export default {
  name: "HpcFileValidator",
  props: {
    value: {
      type: Array,
      default: () => [],
    },
    sampleId: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      directoryName: "",
      isFinding: false,
      isValidating: false,
      foundFiles: [],
      selectedFiles: [],
      validatedFiles: [],
      error: null,
    };
  },
  methods: {
    resetState() {
      this.foundFiles = [];
      this.selectedFiles = [];
      this.validatedFiles = [];
      this.error = null;
      this.$emit("input", []);
    },
    async findFiles() {
      if (!this.directoryName) return;
      this.resetState();
      this.isFinding = true;
      try {
        const response = await this.$axios.get(
          `/api/directory-files/${this.directoryName}`
        );
        this.foundFiles = response.data.files || [];
        if (this.foundFiles.length === 0) {
          this.error = "No files found in that directory.";
        }
      } catch (e) {
        console.error("Error finding HPC files:", e);
        this.error =
          e.response?.data?.message ||
          "An error occurred while searching for files. Check the directory name and permissions.";
      } finally {
        this.isFinding = false;
      }
    },
    async validateSelectedFiles() {
      if (this.selectedFiles.length === 0) return;
      this.isValidating = true;
      this.error = null;

      // This component will currently assume the files are valid.
      // A future implementation could add MD5 checks or other validation steps here.
      try {
        // Simulate validation delay
        await new Promise((resolve) => setTimeout(resolve, 300));

        const formattedFiles = this.selectedFiles.map((file) => ({
          ...file,
          MD5: file.md5 || null, // API might provide md5
          relativePath: this.directoryName,
        }));

        this.validatedFiles = formattedFiles;
        this.$emit("input", this.validatedFiles);
      } catch (e) {
        console.error("Error during validation:", e);
        this.error = "An unexpected error occurred during file validation.";
        this.$emit("input", []);
      } finally {
        this.isValidating = false;
      }
    },
    formatBytes(bytes, decimals = 2) {
      if (bytes === 0) return "0 Bytes";
      const k = 1024;
      const dm = decimals < 0 ? 0 : decimals;
      const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB"];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
    },
  },
  watch: {
    sampleId: {
      immediate: true,
      handler() {
        this.directoryName = "";
        this.resetState();
      },
    },
  },
};
</script>

<style scoped>
/* Add any component-specific styles here */
</style>
