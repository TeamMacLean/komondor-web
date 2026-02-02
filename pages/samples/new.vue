<template>
  <div class="section">
    <div class="container">
      <h1 class="title">New Sample for {{ project.name }}</h1>
      <h2 class="subtitle">
        Create a single sample or upload a CSV for multiple TPlex samples.
      </h2>
      <hr />

      <b-field>
        <b-checkbox v-model="isTplexChecked" :disabled="isSubmitting">
          Create samples from TPlex CSV file
        </b-checkbox>
      </b-field>
      <hr />

      <form @submit.prevent="submitForm">
        <!-- == TPLEX CSV UPLOAD FORM == -->
        <template v-if="isTplexChecked">
          <b-field
            label="TPlex CSV File*"
            :type="{ 'is-danger': validationErrors.tplexCsv }"
            :message="validationErrors.tplexCsv"
          >
            <b-upload v-model="tplexCsvFile" drag-drop>
              <section class="section">
                <div class="content has-text-centered">
                  <p>
                    <b-icon icon="upload" size="is-large"></b-icon>
                  </p>
                  <p v-if="tplexCsvFile">{{ tplexCsvFile.name }}</p>
                  <p v-else>Drop your CSV here or click to upload</p>
                </div>
              </section>
            </b-upload>
          </b-field>
          <div class="buttons">
            <b-button :disabled="!tplexCsvFile" @click="validateTplexCsv">
              Validate CSV
            </b-button>
            <b-button
              v-if="tplexCsvFile"
              type="is-danger"
              outlined
              @click="removeTplexCsv"
            >
              Remove File
            </b-button>
          </div>
          <div v-if="validatedCsvData.length" class="mt-4 content">
            <p class="has-text-success">
              <b-icon icon="check-circle" size="is-small"></b-icon>
              CSV is valid. Found {{ validatedCsvData.length }} samples.
            </p>
            <ul class="tplex-list">
              <li
                v-for="(item, index) in validatedCsvData.slice(0, 5)"
                :key="index"
              >
                {{ item.name }}
              </li>
              <li v-if="validatedCsvData.length > 5">
                ...and {{ validatedCsvData.length - 5 }} more.
              </li>
            </ul>
          </div>
        </template>

        <!-- == STANDARD SAMPLE FORM == -->
        <template v-else>
          <div class="columns">
            <div class="column">
              <b-field
                label="Sample Name*"
                :type="{ 'is-danger': validationErrors.name }"
                :message="validationErrors.name"
              >
                <b-input v-model.trim="sample.name" required></b-input>
              </b-field>
            </div>
            <div class="column">
              <b-field
                label="Scientific Name*"
                :type="{ 'is-danger': validationErrors.scientificName }"
                :message="validationErrors.scientificName"
              >
                <b-input
                  v-model.trim="sample.scientificName"
                  required
                ></b-input>
              </b-field>
            </div>
          </div>
          <div class="columns">
            <div class="column">
              <b-field
                label="Common Name*"
                :type="{ 'is-danger': validationErrors.commonName }"
                :message="validationErrors.commonName"
              >
                <b-input v-model.trim="sample.commonName" required></b-input>
              </b-field>
            </div>
            <div class="column">
              <b-field
                label="NCBI Taxonomy ID*"
                :type="{ 'is-danger': validationErrors.ncbi }"
                :message="validationErrors.ncbi"
              >
                <b-input v-model="sample.ncbi" type="number" required></b-input>
              </b-field>
            </div>
          </div>

          <b-field
            label="Conditions*"
            :type="{ 'is-danger': validationErrors.conditions }"
            :message="validationErrors.conditions"
          >
            <b-input
              v-model.trim="sample.conditions"
              type="textarea"
              minlength="50"
              placeholder="Describe the experimental conditions for this sample (min 50 characters)."
              required
            ></b-input>
          </b-field>

          <hr />

          <b-field
            label="Additional files"
            message="Upload any documentation specific to this sample."
          >
            <Uploader ref="additionalUploader" />
          </b-field>
          <CollapsibleUploaderHelp />
        </template>

        <hr />

        <!-- == SUBMISSION AREA == -->
        <FormConsentCheckbox v-model="consent" />
        <hr />
        <b-button
          type="submit"
          native-type="submit"
          class="is-success"
          :loading="isSubmitting"
          :disabled="!canSubmit"
        >
          Create Sample(s)
        </b-button>
      </form>
    </div>
  </div>
</template>

<script>
import Papa from "papaparse";
import Uploader from "~/components/uploads/Uploader.vue";
import FormConsentCheckbox from "~/components/formHelpers/FormConsentCheckbox.vue";
import CollapsibleUploaderHelp from "~/components/formHelpers/CollapsibleUploaderHelp.vue";

export default {
  name: "NewSample",
  components: { Uploader, FormConsentCheckbox, CollapsibleUploaderHelp },
  middleware: "auth",

  async asyncData({ $axios, params, error, route }) {
    try {
      // Get projectId from query params (not route params for this page)
      const projectId = route.query.projectId;

      console.log("=== NEW SAMPLE PAGE asyncData ===");
      console.log("params:", JSON.stringify(params));
      console.log("route.query:", JSON.stringify(route.query));
      console.log("route.path:", route.path);
      console.log("projectId extracted:", projectId);
      console.log("=================================");

      if (!projectId) {
        console.error("ERROR: No projectId in query parameters");
        return error({
          statusCode: 400,
          message:
            "Project ID is required. Please navigate from a project page.",
        });
      }

      console.log("Fetching project with ID:", projectId);
      const projectResponse = await $axios.get("/project", {
        params: { id: projectId },
      });

      console.log(
        "Project fetched successfully:",
        projectResponse.data.project.name
      );

      const namesResponse = await $axios.get(
        `/samples/names/${projectResponse.data.project._id}`
      );

      console.log("Sample names fetched successfully");

      return {
        project: projectResponse.data.project,
        existingSampleNames: namesResponse.data.sampleNames || [],
      };
    } catch (err) {
      console.error("Failed to load initial data for new sample page:", err);
      console.error("Error details:", err.response?.data || err.message);
      return error({
        statusCode: err.response?.status || 500,
        message:
          err.response?.data?.message || "Project not found or API error.",
      });
    }
  },

  data() {
    return {
      sample: {
        name: "",
        scientificName: "",
        commonName: "",
        ncbi: null,
        conditions: "",
        project: this.$route.query.projectId,
      },
      isTplexChecked: false,
      tplexCsvFile: null,
      validatedCsvData: [],
      consent: false,
      isSubmitting: false,
    };
  },

  computed: {
    uploadsAreComplete() {
      if (this.isTplexChecked || !this.$refs.additionalUploader) {
        return true;
      }
      if (
        typeof this.$refs.additionalUploader.isUploadComplete === "function"
      ) {
        return this.$refs.additionalUploader.isUploadComplete();
      }
      return true; // Assume complete if method not available
    },

    validationErrors() {
      const errors = {};

      if (this.isTplexChecked) {
        if (this.validatedCsvData.length === 0) {
          errors.tplexCsv = "A valid and validated TPlex CSV file is required.";
        }
      } else {
        // Standard Sample Validation
        if (!this.sample.name) errors.name = "Sample name is required.";
        else if (this.sample.name.length < 3 || this.sample.name.length > 80)
          errors.name = "Name must be between 3 and 80 characters.";
        else if (this.existingSampleNames.includes(this.sample.name))
          errors.name = "This sample name is already in use for this project.";

        if (
          !this.sample.scientificName ||
          this.sample.scientificName.length < 5
        )
          errors.scientificName =
            "Scientific name is required (min 5 characters).";

        if (!this.sample.commonName || this.sample.commonName.length < 3)
          errors.commonName = "Common name is required (min 3 characters).";

        const ncbi = Number(this.sample.ncbi);
        if (!this.sample.ncbi || isNaN(ncbi) || ncbi <= 0)
          errors.ncbi = "A valid, positive NCBI Taxonomy ID is required.";

        if (!this.sample.conditions || this.sample.conditions.length < 50)
          errors.conditions = "Conditions are required (min 50 characters).";
      }

      return errors;
    },

    canSubmit() {
      if (this.isSubmitting) return false;
      return (
        Object.keys(this.validationErrors).length === 0 &&
        this.consent &&
        this.uploadsAreComplete
      );
    },
  },

  watch: {
    isTplexChecked() {
      // Reset validation when switching modes
      this.validatedCsvData = [];
      this.tplexCsvFile = null;
    },
    tplexCsvFile() {
      // Invalidate previous validation if file changes
      this.validatedCsvData = [];
    },
  },

  async created() {
    if (this.$route.query.clonedSampleId) {
      await this.initializeFromClonedSample(this.$route.query.clonedSampleId);
    }
  },

  methods: {
    async initializeFromClonedSample(clonedSampleId) {
      try {
        const { data } = await this.$axios.get("/sample", {
          params: { id: clonedSampleId },
        });
        const clonedSample = data.sample;
        if (clonedSample) {
          this.sample.name = `${clonedSample.name || ""}_clone`;
          this.sample.scientificName = clonedSample.scientificName || "";
          this.sample.commonName = clonedSample.commonName || "";
          this.sample.ncbi = clonedSample.ncbi || null;
          this.sample.conditions = clonedSample.conditions || "";
          this.$buefy.toast.open({
            message: "Form pre-filled from cloned sample.",
            type: "is-info",
          });
        }
      } catch (err) {
        console.error("Error fetching cloned sample:", err);
        this.$buefy.toast.open({
          message: "Could not fetch data for cloning.",
          type: "is-warning",
        });
      }
    },

    validateTplexCsv() {
      if (!this.tplexCsvFile) {
        this.$buefy.toast.open({
          message: "Please select a CSV file first.",
          type: "is-warning",
        });
        return;
      }

      console.log("Validating TPlex CSV file:", this.tplexCsvFile.name);

      Papa.parse(this.tplexCsvFile, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.trim(), // Trim whitespace from headers
        complete: (results) => {
          const expectedHeaders = [
            "name",
            "scientificName",
            "commonName",
            "ncbi",
            "conditions",
          ];
          const actualHeaders = results.meta.fields || [];

          console.log("Expected headers:", expectedHeaders);
          console.log("Actual headers:", actualHeaders);
          console.log("CSV data rows:", results.data.length);

          // Check if CSV is empty
          if (results.data.length === 0) {
            this.validatedCsvData = [];
            this.$buefy.dialog.alert({
              title: "Empty CSV File",
              message: "The CSV file appears to be empty or has no data rows.",
              type: "is-danger",
            });
            return;
          }

          // Check if all expected headers are present
          const missingHeaders = expectedHeaders.filter(
            (h) => !actualHeaders.includes(h)
          );

          if (missingHeaders.length > 0) {
            this.validatedCsvData = [];
            this.$buefy.dialog.alert({
              title: "Invalid CSV Headers",
              message: `CSV headers are missing or incorrect.<br><br>
                <strong>Expected:</strong> ${expectedHeaders.join(", ")}<br>
                <strong>Found:</strong> ${actualHeaders.join(", ")}<br>
                <strong>Missing:</strong> ${missingHeaders.join(", ")}`,
              type: "is-danger",
            });
            return;
          }

          // Filter out any completely empty rows
          this.validatedCsvData = results.data.filter((row) => {
            return (
              row.name ||
              row.scientificName ||
              row.commonName ||
              row.ncbi ||
              row.conditions
            );
          });
          console.log("Validated CSV data:", this.validatedCsvData);

          this.$buefy.toast.open({
            message: `CSV validated successfully! Found ${this.validatedCsvData.length} sample(s).`,
            type: "is-success",
          });
        },
        error: (err) => {
          console.error("CSV parsing error:", err);
          this.validatedCsvData = [];
          this.$buefy.dialog.alert({
            title: "CSV Error",
            message: `Failed to parse CSV file: ${err.message}`,
            type: "is-danger",
          });
        },
      });
    },

    removeTplexCsv() {
      this.tplexCsvFile = null;
      this.validatedCsvData = [];
      this.$buefy.toast.open({
        message: "CSV file removed.",
        type: "is-info",
      });
    },

    async submitForm() {
      if (!this.canSubmit) {
        this.$buefy.toast.open({
          message: "Please correct the errors before submitting.",
          type: "is-warning",
        });
        return;
      }
      this.isSubmitting = true;

      const payload = {
        ...this.sample,
        project: this.project._id,
        group: this.project.group._id,
        owner: this.$auth.user.username,
        tplexCsv: this.isTplexChecked ? this.validatedCsvData : null,
        additionalFiles: this.isTplexChecked
          ? []
          : this.$refs.additionalUploader?.getFiles() || [],
      };

      try {
        const response = await this.$axios.post("/samples/new", payload);
        const createdSample = response.data.sample;

        this.$buefy.toast.open({
          message: `Successfully created ${
            this.isTplexChecked ? this.validatedCsvData.length : 1
          } sample(s)!`,
          type: "is-success",
        });

        // Redirect to the newly created sample page (both standard and TPlex)
        this.$router.push({
          name: "sample",
          query: { id: createdSample._id },
        });
      } catch (err) {
        console.error("Error creating sample(s):", err);
        let message =
          err.response?.data?.error || "An unexpected error occurred.";
        if (err.response?.status === 413) {
          message =
            "The CSV file is too large to submit. Please reduce the number of rows and try again, or contact support.";
        }
        this.$buefy.dialog.alert({
          title: "Submission Failed",
          message,
          type: "is-danger",
        });
      } finally {
        this.isSubmitting = false;
      }
    },
  },
};
</script>

<style scoped>
.tplex-list {
  font-family: monospace;
  font-size: 0.85em;
  list-style-type: square;
  margin-left: 20px;
}
</style>
