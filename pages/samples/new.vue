<template>
  <div class="section">
    <div class="container">
      <h1 class="title">New Sample</h1>
      <h3 class="subtitle">
        <i> Ensure required fields (*) are filled in before submitting. </i>
      </h3>
      <hr />
      <form @submit.prevent="postForm">
        <!-- Conditional rendering for project field -->
        <b-field v-if="project && project.name" label="Project*">{{
          project.name
        }}</b-field>
        <b-field v-else label="Project*">Loading Project...</b-field>

        <hr />

        <!-- Rest of your template content.
             Wrap the rest of your form in v-if="project" if many fields depend on it -->
        <div v-if="project">
          <!-- TPLEX SECTION (ADMIN ONLY) -->
          <div v-if="isAdmin" class="box" style="border: 2px solid #336699">
            <h2 class="title is-5">Tplex Data (Admin-only)</h2>
            <b-field>
              <b-checkbox v-model="isTplexChecked">
                Is Tplex sample?
              </b-checkbox>
            </b-field>

            <div v-if="isTplexChecked">
              <ul class="tplex-instructions-list">
                <li>
                  Please upload a single .csv file containing the Tplex data for
                  this sample.
                </li>
                <li>
                  Click 'Done' to remove an uploaded file and try again, or
                  untick the checkbox to remove the tplex option from the
                  submission.
                </li>
                <li>
                  This is a once-only submission where edits cannot be made
                  afterwards, so please triple-check all the data is correct
                  before uploading.
                </li>
                <li>
                  Please ensure the first row has the heading columns in order
                  as follows:
                  <p class="has-text-weight-bold ml-4 mt-1 mb-1">
                    Sample Name, Scientific Name, Common Name, NCBI Taxonomy ID,
                    Conditions
                  </p>
                </li>
                <li>
                  Please also ensure you have at least one entry below the
                  header row.
                </li>
                <li>
                  Once uploaded, please press the 'Validate CSV' button to check
                  the data is correct. Only when validated can you submit the
                  tplex sample.
                </li>
                <li>
                  The name of this Tplex sample will be automatically generated,
                  using the last 6 characters of its Project ID (e.g.,
                  'tplex_sample_<code>xxxxxx</code>'). Subsequent Tplex samples
                  in the same project will have a number added to ensure
                  uniqueness (e.g., 'tplex_sample_<code>xxxxxx</code>_2').
                </li>
              </ul>

              <br />

              <b-field label="Upload Tplex CSV File">
                <UploaderTslPlex
                  ref="tplexCsvUploader"
                  :on-upload-status-change="onTplexUploaderChange"
                />
              </b-field>
            </div>
            <div
              v-if="isTplexChecked"
              class="field is-flex is-justify-content-space-between mt-4"
            >
              <p class="control">
                <b-button
                  type="is-info"
                  icon-left="check"
                  :disabled="!sample.tplexCsv"
                  @click="validateTplexCsv"
                >
                  Validate CSV
                </b-button>
              </p>
              <p class="control">
                <b-icon
                  v-if="validatedCsv"
                  icon="check-circle"
                  type="is-success"
                  size="is-large"
                ></b-icon>
                <span v-if="validatedCsv" class="has-text-success ml-2"
                  >Validated!</span
                >
              </p>
            </div>
          </div>

          <div v-if="!isTplexChecked">
            <div class="columns">
              <div class="column">
                <b-field
                  label="Name*"
                  :class="isWarningStyleForNameInput"
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
          </div>

          <br />

          <div v-if="!canSubmit" class="box is-warning mt-5">
            <p class="title is-6 has-text-warning-dark">
              Submission Disabled - Check these items:
            </p>
            <ul>
              <li>
                Consent Given:
                <b-icon
                  :icon="consentGiven ? 'check-circle' : 'alert-circle'"
                  :type="consentGiven ? 'is-success' : 'is-danger'"
                ></b-icon>
              </li>
              <li>
                Uploads Complete:
                <b-icon
                  :icon="
                    additionalUploadsComplete ? 'check-circle' : 'alert-circle'
                  "
                  :type="additionalUploadsComplete ? 'is-success' : 'is-danger'"
                ></b-icon>
              </li>
              <li>
                Not Submitting:
                <b-icon
                  :icon="!isSubmitting ? 'check-circle' : 'alert-circle'"
                  :type="!isSubmitting ? 'is-success' : 'is-danger'"
                ></b-icon>
              </li>

              <li v-if="!isTplexChecked">
                Standard Fields Valid:
                <b-icon
                  :icon="
                    areStandardFieldsValid ? 'check-circle' : 'alert-circle'
                  "
                  :type="areStandardFieldsValid ? 'is-success' : 'is-danger'"
                ></b-icon>
                <ul v-if="!areStandardFieldsValid" class="ml-4">
                  <li
                    v-if="
                      !sample.name ||
                      sample.name.length < 3 ||
                      sample.name.length > 80
                    "
                  >
                    Name length (3-80 chars)
                  </li>
                  <li v-if="invalidSampleNames.includes(sample.name)">
                    Name already exists
                  </li>
                  <li
                    v-if="
                      !sample.scientificName || sample.scientificName.length < 5
                    "
                  >
                    Scientific Name (min 5 chars)
                  </li>
                  <li v-if="!sample.commonName || sample.commonName.length < 3">
                    Common Name (min 3 chars)
                  </li>
                  <li
                    v-if="
                      sample.ncbi === null ||
                      sample.ncbi === '' ||
                      isNaN(sample.ncbi)
                    "
                  >
                    NCBI ID (must be number)
                  </li>
                  <li
                    v-if="!sample.conditions || sample.conditions.length < 50"
                  >
                    Conditions (min 50 chars)
                  </li>
                </ul>
              </li>

              <li v-if="!isTplexChecked">
                Name not in warning state:
                <b-icon
                  :icon="
                    !isWarningStyleForNameInput
                      ? 'check-circle'
                      : 'alert-circle'
                  "
                  :type="
                    !isWarningStyleForNameInput ? 'is-success' : 'is-danger'
                  "
                ></b-icon>
              </li>

              <li v-if="isTplexChecked">
                Tplex CSV Uploaded:
                <b-icon
                  :icon="!!sample.tplexCsv ? 'check-circle' : 'alert-circle'"
                  :type="!!sample.tplexCsv ? 'is-success' : 'is-danger'"
                ></b-icon>
              </li>
              <li v-if="isTplexChecked">
                Tplex CSV Validated:
                <b-icon
                  :icon="validatedCsv ? 'check-circle' : 'alert-circle'"
                  :type="validatedCsv ? 'is-success' : 'is-danger'"
                ></b-icon>
              </li>
            </ul>
          </div>

          <FormConsentCheckbox
            :initial="consentGiven"
            :on-toggle="onToggleConsent"
          />

          <hr />

          <button
            type="submit"
            class="button is-success"
            :disabled="!canSubmit"
          >
            Create sample
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import UploaderTslPlex from "~/components/uploads/UploaderTslPlex.vue";
import Uploader from "~/components/uploads/Uploader.vue";
import CollapsibleUploaderHelp from "~/components/formHelpers/CollapsibleUploaderHelp";
import FormConsentCheckbox from "~/components/formHelpers/FormConsentCheckbox.vue";
import Papa from "papaparse"; // Import papaparse for CSV parsing

export default {
  name: "NewSample",
  components: {
    UploaderTslPlex,
    Uploader,
    CollapsibleUploaderHelp,
    FormConsentCheckbox,
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
        // Project data and validation checks
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

        const loggedInUsername = app?.$auth?.user?.username;
        const isAdmin =
          loggedInUsername &&
          process?.env?.ENA_ADMINS?.length &&
          process.env.ENA_ADMINS.includes(loggedInUsername);

        // Base object for the component data
        let returnObj = {
          isAdmin,
          isSubmitting: false,
          additionalUploadsComplete: true,
          tplexCsvUploadComplete: true,
          project: res.data.project,
          invalidSampleNames: existingSampleNamesForThisProject,
          isTplexChecked: false,
          consentGiven: false,
          validatedCsv: false,
          sample: {
            name: "",
            scientificName: "",
            commonName: "",
            ncbi: null,
            conditions: "",
            tplexCsv: null,
            project: res.data.project.id,
            additionalFiles: [],
          },
        };

        // Handle cloning if clonedSampleId is present in the query
        if (route.query.clonedSampleId) {
          const clonedSampleId = route.query.clonedSampleId;
          try {
            const clonedSampleResponse = await $axios.get("/sample", {
              params: { id: clonedSampleId },
            });
            if (
              clonedSampleResponse.status === 200 &&
              clonedSampleResponse.data.sample
            ) {
              let clonedSample = clonedSampleResponse.data.sample;

              const plusOneClonedSampleName = clonedSample.name
                ? `${clonedSample.name}_clone`
                : "";

              returnObj.sample.name = plusOneClonedSampleName || "";
              returnObj.sample.scientificName =
                clonedSample.scientificName || "";
              returnObj.sample.commonName = clonedSample.commonName || "";
              returnObj.sample.ncbi = clonedSample.ncbi || null;
              returnObj.sample.conditions = clonedSample.conditions || "";
            }
          } catch (cloneErr) {
            console.error("Error fetching cloned sample data:", cloneErr);
            // Optionally show a toast to the user that cloning failed for this field
            if (app.$buefy && app.$buefy.toast) {
              app.$buefy.toast.open({
                message: "Could not pre-fill data from cloned sample.",
                type: "is-warning",
              });
            }
            // We still want to let the user fill out the form when errored, so we just log the error.
          }
        }

        return returnObj;
      } // End of if (res.status === 200)

      // If project fetch failed
      return error({ statusCode: 500, message: "Project not found" });
    } catch (err) {
      // Catch block for the initial project fetch or other errors
      console.error(err);
      return error({ statusCode: 500, message: "Project not found" });
    }
  },
  computed: {
    isWarningStyleForNameInput() {
      if (this.isTplexChecked) {
        return false;
      }
      return this.invalidSampleNames.includes(this.sample.name);
    },
    areStandardFieldsValid() {
      if (this.isTplexChecked) {
        return true;
      }

      const { name, scientificName, commonName, ncbi, conditions } =
        this.sample;

      const nameValid =
        name &&
        name.length >= 3 &&
        name.length <= 80 &&
        !this.invalidSampleNames.includes(name);
      const scientificNameValid = scientificName && scientificName.length >= 5;
      const commonNameValid = commonName && commonName.length >= 3;
      const ncbiValid = ncbi !== null && ncbi !== "" && !isNaN(ncbi);
      const conditionsValid = conditions && conditions.length >= 50;

      return (
        nameValid &&
        scientificNameValid &&
        commonNameValid &&
        ncbiValid &&
        conditionsValid
      );
    },
    canSubmit() {
      const baseChecks = this.additionalUploadsComplete && !this.isSubmitting;
      const consentCheck = this.consentGiven;

      if (!consentCheck) {
        console.log("canSubmit: Blocked by consentGiven");
        return false;
      }

      if (this.isTplexChecked) {
        // Tplex specific checks
        const tplexValid =
          baseChecks &&
          this.tplexCsvUploadComplete &&
          !!this.sample.tplexCsv &&
          this.validatedCsv;
        console.log(
          `canSubmit (Tplex): baseChecks=${baseChecks}, tplexCsvUploadComplete=${
            this.tplexCsvUploadComplete
          }, hasTplexCsv=${!!this.sample.tplexCsv}, validatedCsv=${
            this.validatedCsv
          }, result=${tplexValid}`
        );
        return tplexValid;
      } else {
        // Non-Tplex specific checks
        const standardFieldsValid = this.areStandardFieldsValid;
        const nameWarning = this.isWarningStyleForNameInput; // This should be a boolean now
        const nonTplexValid = baseChecks && standardFieldsValid && !nameWarning;
        console.log(
          `canSubmit (Non-Tplex): baseChecks=${baseChecks}, areStandardFieldsValid=${standardFieldsValid}, isWarningStyleForNameInput=${nameWarning}, !isWarningStyleForNameInput=${!nameWarning}, result=${nonTplexValid}`
        );
        return nonTplexValid;
      }
    },
  },
  methods: {
    onToggleConsent(newState) {
      this.consentGiven = newState;
    },
    onUploaderChange(val) {
      if (typeof val === "boolean") {
        this.additionalUploadsComplete = val;
      }
      this.updateAdditionalFiles();
    },
    updateAdditionalFiles() {
      if (this.$refs["additionalUploader"]) {
        this.sample.additionalFiles =
          this.$refs["additionalUploader"].getFiles();
      }
    },
    async onTplexUploaderChange(isComplete, file) {
      this.tplexCsvUploadComplete = isComplete; // Update the boolean status
      this.validatedCsv = false; // NEW: Reset validation status when file changes

      if (isComplete && file) {
        try {
          const csvContent = await this.readFileAsText(file);
          this.sample.tplexCsv = csvContent;
        } catch (e) {
          console.error("Error reading Tplex CSV file:", e);
          this.$buefy.toast.open({
            message: "Failed to read Tplex CSV file.",
            type: "is-danger",
          });
          this.sample.tplexCsv = null;
        }
      } else if (!file) {
        this.sample.tplexCsv = null;
      }
    },
    readFileAsText(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(e);
        reader.readAsText(file);
      });
    },
    onConsentToggle(consent) {
      this.consentGiven = consent;
    },
    validateTplexCsv() {
      this.validatedCsv = false; // Reset validation state

      if (!this.sample.tplexCsv) {
        this.$buefy.toast.open({
          message: "No CSV file content to validate.",
          type: "is-warning",
        });
        return;
      }

      // Define expected headers (case-sensitive as per your request)
      const expectedHeaders = [
        "Sample Name",
        "Scientific Name",
        "Common Name",
        "NCBI Taxonomy ID",
        "Conditions",
      ];

      try {
        const parsedResult = Papa.parse(this.sample.tplexCsv, {
          header: false, // We'll manually check headers
          skipEmptyLines: true,
        });

        if (parsedResult.errors.length) {
          throw new Error(
            `CSV parsing error: ${parsedResult.errors
              .map((e) => e.message)
              .join("; ")}`
          );
        }

        const data = parsedResult.data;

        if (data.length === 0) {
          throw new Error("CSV file is empty.");
        }

        // Check headers
        const actualHeaders = data[0].map((h) => h.trim()); // Trim whitespace
        const headerMatch = expectedHeaders.every((expectedHeader, index) => {
          return actualHeaders[index] === expectedHeader;
        });

        if (!headerMatch) {
          // const missingOrMismatch = expectedHeaders.filter(
          //   (expected, index) => actualHeaders[index] !== expected
          // );
          throw new Error(
            `Header mismatch. Expected first 5 columns to be: ${expectedHeaders.join(
              ", "
            )}. Found: ${actualHeaders.slice(0, 5).join(", ")}.`
          );
        }

        // Check for at least one data row below the header
        if (data.length < 2) {
          // If only 1 row (header) or less
          throw new Error(
            "CSV must contain at least one data entry row below the header."
          );
        }

        // If all checks pass
        this.validatedCsv = true;
        this.$buefy.toast.open({
          message: "Tplex CSV validated successfully!",
          type: "is-success",
        });
      } catch (error) {
        console.error("Tplex CSV Validation Error:", error.message);
        this.$buefy.dialog.alert({
          title: "CSV Validation Error",
          message: error.message,
          type: "is-danger",
          hasIcon: false,
        });
        this.validatedCsv = false; // Ensure it's false on failure
      }
    },
    postForm() {
      this.isSubmitting = true;
      this.updateAdditionalFiles();

      if (this.isTplexChecked) {
        // If it's a Tplex sample, these fields become optional.
        this.sample.name = null;
        this.sample.scientificName = null;
        this.sample.commonName = null;
        this.sample.ncbi = null;
        this.sample.conditions = null;
      } else {
        this.sample.tplexCsv = null;
      }

      this.sample.owner = this.$auth.user.username;
      this.sample.group = this.project.group;
      this.sample.project = this.project._id;

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
.tplex-list {
  list-style-type: disc;
  list-style-position: inside;
  margin: 1rem 0;
}

.validate-csv-button {
  margin-bottom: 1rem;
}
</style>
