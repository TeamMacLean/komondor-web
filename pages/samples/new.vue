<template>
  <div class="section">
    <div class="container">
      <h1 class="title">New Sample</h1>
      <h3 class="subtitle">
        <i> Ensure required fields (*) are filled in before submitting. </i>
      </h3>
      <hr />
      <form @submit.prevent="postForm">
        <b-field label="Project*">{{ project.name }}</b-field>

        <div class="columns">
          <div class="column">
            <!-- TODO this field isnt counting its characters, same for run -->
            <b-field
              label="Name*"
              :type="isWarningStyleForNameInput"
              message="A choose a short, informative name to identify your sample, ideally between 10 and 80 characters."
            >
              <b-input
                id="name"
                v-model="sample.name"
                name="name"
                minlength="3"
                maxlength="80"
                required
              ></b-input>
            </b-field>
          </div>
          <div class="column"></div>
        </div>

        <div class="columns">
          <div class="column">
            <b-field
              label="Scientific Name*"
              message="The scientific name of your sample organism as it appears in NCBI Taxonomy. E.g. Solanum lycopersicum."
            >
              <b-input
                id="scientificName"
                v-model="sample.scientificName"
                name="scientificName"
                minlength="5"
                required
              ></b-input>
            </b-field>
          </div>
          <div class="column">
            <b-field
              label="Common Name*"
              message="The common name of your sample organism if known (optional). E.g. Tomato."
            >
              <b-input
                id="commonName"
                v-model="sample.commonName"
                name="commonName"
                minlength="3"
                required
              ></b-input>
            </b-field>
          </div>
          <div class="column">
            <b-field
              label="NCBI Taxonomy ID*"
              message="The Taxonomy ID for your sample's organism. (Choose the host if you're investigating host - pathogen interactions.)"
            >
              <b-input
                id="ncbi"
                v-model="sample.ncbi"
                name="ncbi"
                type="number"
                required
              ></b-input>
            </b-field>
          </div>
        </div>

        <b-field
          label="Conditions*"
          message="Information (required, minimum 50 characters) about the sample conditions (environmental conditions, is it a pathogen interaction?, what pathogen? etc.)"
        >
          <b-input
            id="conditions"
            v-model="sample.conditions"
            type="textarea"
            minlength="50"
            required
            name="conditions"
          ></b-input>
        </b-field>

        <hr />

        <!-- TPLEX SECTION (ADMIN ONLY) -->
        <div v-if="isAdmin" class="box" style="border: 2px solid #336699">
          <!-- Added custom border style here -->
          <h2 class="title is-5">Tplex Data (Admin-only)</h2>
          <b-field>
            <b-checkbox v-model="isTplexChecked"> Is Tplex sample? </b-checkbox>
          </b-field>

          <b-field
            v-if="isTplexChecked"
            label="Upload Tplex CSV File"
            message="Please upload a single .csv file containing the Tplex data for this sample. Click 'Done' to remove an uploaded file and try again, or untick the checkbox to remove the tplex option from the submission. This is a once-only submission where edits cannot be made afterwards, so please triple-check all the data is correct before uploading."
          >
            <UploaderTslPlex
              ref="tplexCsvUploader"
              :on-upload-status-change="onTplexUploaderChange"
            />
          </b-field>
        </div>

        <b-field
          label="Additional files"
          message="Please upload any documentation obtained from the sequencing provider, including copies of the communication. If the documentation pertains to the whole project or only to a certain data set, then please add it there instead. Note: this is NOT the place to upload raw sequence files."
        >
          <Uploader
            ref="additionalUploader"
            :on-upload-status-change="onUploaderChange"
          />
        </b-field>
        <CollapsibleUploaderHelp />
        <hr />
        <FormConsentCheckbox :initial="false" />
        <hr />

        <button type="submit" class="button is-success" :disabled="!canSubmit">
          Create sample
        </button>
      </form>
    </div>
  </div>
</template>

<script>
import UploaderTslPlex from "~/components/uploads/UploaderTslPlex.vue";
import Uploader from "~/components/uploads/Uploader.vue";
import FormConsentCheckbox from "~/components/formHelpers/FormConsentCheckbox";
import CollapsibleUploaderHelp from "~/components/formHelpers/CollapsibleUploaderHelp";

export default {
  name: "NewSample",
  components: {
    UploaderTslPlex,
    Uploader,
    FormConsentCheckbox,
    CollapsibleUploaderHelp,
  },
  middleware: "auth",
  async asyncData({ route, $axios, error, app }) {
    if (!route.query.project) {
      return error({ statusCode: 500, message: "Project not found" });
    }

    try {
      const res = await $axios.get("/project", {
        params: { id: route.query.project },
      });

      if (res.status === 200) {
        if (
          res.data.project &&
          res.data.project.group &&
          res.data.project.doNotSendToEna &&
          res.data.project.group.sendToEna
        ) {
          return error({
            message:
              "You have requested that this data not go to ENA, you cannot add any samples until this is resolved.",
          });
        }

        const existingSampleNamesForThisProject = res.data.project.samples.map(
          (s) => s.name
        );

        const isAdmin = app?.$auth?.user && app.$auth.user.isAdmin;

        return {
          isAdmin,
          isSubmitting: false,
          additionalUploadsComplete: true, // Renamed for clarity
          tplexCsvUploadComplete: true, // New: Track Tplex CSV upload status
          project: res.data.project,
          invalidSampleNames: existingSampleNamesForThisProject,
          isTplexChecked: false, // New: Control for "Is Tplex sample?" checkbox
          /*sample: {
            // fields
            name: "Gasprd",
            scientificName: "Honus Maximum",
            commonName: "Geoffrey",
            ncbi: 3953,
            conditions: "He understand sfootball, he's a quick learner.",
            tplexCsv: null, // New: To store the raw CSV string

            // shared fields
            project: res.data.project.id,
            additionalFiles: [],
          },*/
          sample: {
            /* fields */
            name: "",
            scientificName: "",
            commonName: "",
            ncbi: null,
            conditions: "",
            tplexCsv: null, // New: To store the raw CSV string

            /** shared fields */
            project: res.data.project.id,
            additionalFiles: [],
          },
        };
      }
      return error({ statusCode: 500, message: "Project not found" });
    } catch (err) {
      console.error(err);
      return error({ statusCode: 500, message: "Project not found" });
    }
  },
  computed: {
    isWarningStyleForNameInput() {
      return this.invalidSampleNames.includes(this.sample.name)
        ? "is-danger"
        : "";
    },
    canSubmit() {
      const baseCanSubmit =
        this.additionalUploadsComplete &&
        this.tplexCsvUploadComplete &&
        !this.isWarningStyleForNameInput &&
        !this.isSubmitting;

      if (this.isTplexChecked) {
        // If "Is Tplex sample?" is checked, tplexCsv must not be empty
        return baseCanSubmit && !!this.sample.tplexCsv;
      } else {
        // If not checked, tplexCsv is irrelevant for submission
        return baseCanSubmit;
      }
    },
  },
  methods: {
    onUploaderChange(val) {
      if (typeof val === "boolean") {
        this.additionalUploadsComplete = val;
      }
      this.updateAdditionalFiles();
    },
    updateAdditionalFiles() {
      if (this.$refs["additionalUploader"]) {
        // This Uploader should provide file objects, not raw strings
        // For actual files, we'll typically send upload IDs or similar
        // Let's assume for now `getFiles()` correctly provides what the backend expects
        this.sample.additionalFiles =
          this.$refs["additionalUploader"].getFiles();
      }
    },
    async onTplexUploaderChange(val) {
      if (typeof val === "boolean") {
        this.tplexCsvUploadComplete = val;
      }
      // If upload is complete and there's a file, try to read its content
      if (this.tplexCsvUploadComplete && this.$refs["tplexCsvUploader"]) {
        const files = this.$refs["tplexCsvUploader"].getFiles();
        if (files && files.length > 0) {
          const file = files[0];
          try {
            // Read the content of the CSV file as a string
            const csvContent = await this.readFileAsText(file);
            this.sample.tplexCsv = csvContent;
          } catch (e) {
            console.error("Error reading Tplex CSV file:", e);
            this.$buefy.toast.open({
              message: "Failed to read Tplex CSV file.",
              type: "is-danger",
            });
            this.sample.tplexCsv = null; // Clear if reading fails
          }
        } else {
          this.sample.tplexCsv = null; // Clear if no file or file removed
        }
      } else {
        this.sample.tplexCsv = null; // Clear if uploader status changes or no longer complete
      }
    },
    // Helper function to read file content as text
    readFileAsText(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(e);
        reader.readAsText(file);
      });
    },
    postForm() {
      this.isSubmitting = true;
      this.updateAdditionalFiles(); // Ensure additional files are up to date

      // If "Is Tplex sample?" is NOT checked, explicitly set tplexCsv to null
      // to ensure it's not sent if the user unchecked it after uploading.
      if (!this.isTplexChecked) {
        this.sample.tplexCsv = null;
      }

      this.sample.owner = this.$auth.user.username; //required
      this.sample.group = this.project.group;
      this.sample.project = this.project._id; //required

      this.$axios
        .post("/samples/new", this.sample)
        .then((result) => {
          setTimeout(() => {
            this.$buefy.toast.open({
              message: "Sample created!",
              type: "is-success",
            });
            this.$router.push({
              name: "sample",
              query: { id: result.data.sample._id },
            });
            this.isSubmitting = false;
          }, 3000);
        })
        .catch((err) => {
          setTimeout(() => {
            console.error(err);
            var errorMessage = err.message;
            if (err.message.includes("500")) {
              const type = "Sample";
              errorMessage =
                "Unknown 500 error from server. Sorry about that." +
                "\n" +
                type +
                " info may have registered in database." +
                "\nUploads are on remote server, but may not have been registered in database and/or moved to HPC." +
                "\nPlease check all this using this website, and notify system admin of when this happened, and which data you need cleaning up.";
            }
            this.$buefy.dialog.alert({
              title: "Error",
              message: errorMessage,
              type: "is-danger",
              hasIcon: false,
            });
            this.isSubmitting = false;
          }, 2000);
        });
    },
  },
};
</script>

<style scoped>
/* Any specific styles for your component */
</style>
