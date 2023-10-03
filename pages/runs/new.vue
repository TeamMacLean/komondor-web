<template>
  <div class="section">
    <div class="container">
      <h1 class="title">New Run</h1>
      <h5>
        If any options that you need are not listed, please contact system
        administrator.
      </h5>
      <hr />
      <form novalidate @submit.prevent="postForm">
        <div class="columns">
          <div class="column">
            <b-field
              :type="isWarningStyleForNameInput"
              label="Name"
              message="A short (5-20 characters in length), informative name to identify your data set."
            >
              <b-input
                id="name"
                v-model="run.name"
                expanded
                name="name"
                minlength="5"
                maxlength="20"
                required
              ></b-input>
            </b-field>
          </div>
          <div class="column">
            <b-field
              v-if="!isOxfordNanopore"
              label="Insert size"
              message="What is the average insert size covered by your read pairs? This should be in the communication with your provider."
            >
              <b-input
                v-model="run.insertSize"
                placeholder="Number"
                expanded
                type="number"
                min="0"
                required
              ></b-input>
            </b-field>
            <b-field
              v-else
              label="Insert size (Optional)"
              message="This field is optional for Oxford Nanopore. Probably better to leave blank."
            >
              <b-input
                v-model="run.insertSize"
                placeholder="Number"
                expanded
                type="number"
                min="0"
              ></b-input>
            </b-field>
          </div>
        </div>

        <div class="columns">
          <div class="column">
            <b-field
              label="Sequencing provider"
              message="Which company/institute did your sequencing? Please provide at least the name."
            >
              <b-input
                v-model="run.sequencingProvider"
                placeholder="EI"
                expanded
                type="text"
                required
              ></b-input>
            </b-field>
          </div>
          <div class="column">
            <b-field
              label="Sequencing technology"
              message="What was the technology used for sequencing? This should be in the communication with your provider."
            >
              <b-select
                v-model="run.sequencingTechnology"
                placeholder="Select a sequencing technology"
                required
                expanded
              >
                <option
                  v-for="option in sequencingTechnologies"
                  :key="option._id"
                  :value="option.value"
                >
                  {{ option.value }}
                </option>
              </b-select>
            </b-field>
          </div>
        </div>

        <div class="columns">
          <div class="column">
            <b-field
              label="Library source"
              message="From what kind of material was your library prepared?"
            >
              <b-select
                v-model="run.librarySource"
                placeholder="Select a library source"
                required
                expanded
              >
                <option
                  v-for="option in librarySources"
                  :key="option._id"
                  :value="option.value"
                >
                  {{ option.value }}
                </option>
              </b-select>
            </b-field>
          </div>

          <p></p>

          <div class="column">
            <b-field
              label="Library selection"
              message="Which protocol was used when creating the library?"
            >
              <p></p>

              <b-select
                v-model="run.librarySelection"
                placeholder="Select a library selection"
                required
                expanded
              >
                <option
                  v-for="option in librarySelections"
                  :key="option._id"
                  :value="option.value"
                >
                  {{ option.value }}
                </option>
              </b-select>
            </b-field>
          </div>
        </div>
        <div class="columns">
          <div class="column">
            <b-field
              label="Library type"
              message="Do you have unpaired, paired, or mate-pair reads? Please upload compressed files where possible - ENA only accepts these in some cases (e.g. use .fq.gz, not .fastq)"
            >
              <b-select
                v-model="run.libraryType"
                placeholder="Select a library type"
                required
                expanded
              >
                <option
                  v-for="option in libraryTypes"
                  :key="option._id"
                  :value="option.value"
                >
                  {{ computeOptionString(option) }}
                </option>
              </b-select>
            </b-field>
          </div>

          <div class="column">
            <b-field
              label="Library strategy"
              message="What kind of sequencing experiment was performed?"
            >
              <b-select
                v-model="run.libraryStrategy"
                placeholder="Select a library strategy"
                required
                expanded
              >
                <option
                  v-for="option in libraryStrategies"
                  :key="option._id"
                  :value="option.value"
                >
                  {{ option.value }}
                </option>
              </b-select>
            </b-field>
          </div>
        </div>
        <hr />
        <label class="b-field-label-proxy">Raw reads </label>
        <!-- TODO <div><b-icon icon="icon-warning-sign" size="is-small"></b-icon></div> -->

        <b-tabs v-model="activeTab">
          <b-tab-item key="hpc-mv-tab" value="hpc-mv" label="HPC upload">
            <SpecifiedLocationFileSelector
              :paired="paired"
              :allowed-extensions="allowedExtensions"
              :on-validation-change-status="onHpcUploadValidationChangeStatus"
            >
              <!-- TODO: 
              - if paired = true, ALL selections should be paired
              - limit based on allowed extensions (plus .md5)
              -->
            </SpecifiedLocationFileSelector>
          </b-tab-item>
          <b-tab-item
            key="local-filesystem-tab"
            value="local-filesystem"
            label="Local filesystem upload"
          >
            <UploadRawInfo :paired="paired" />
            <b-field>
              <UploadRaw
                v-if="paired !== null"
                ref="rawUploader"
                :paired="paired"
                :on-upload-status-change="onRawUploaderChange"
                :allowed-extensions="allowedExtensions"
              />
            </b-field>
          </b-tab-item>
        </b-tabs>

        <hr />
        <b-field
          label="Additional files"
          message="Please upload any documentation obtained from the sequencing provider, including copies of the communication. If the documentation pertains only to a certain sample or data set, then please add it there instead. Note: this is NOT the place to upload raw sequence files."
        >
          <Uploader
            ref="additionalUploader"
            :on-upload-status-change="onUploaderChange"
          />
        </b-field>

        <hr />
        <FormConsentCheckbox :on-toggle="onToggleFormConsentCheckbox" />

        <b-checkbox v-model="checkFiles" type="checkbox">
          I confirm that I will check my raw read files have moved successfully
          to their correct location on the HPC, and keep a backup copy of these
          files until I confirm.
        </b-checkbox>

        <hr />

        <button type="submit" class="button is-success" :disabled="!canSubmit">
          Create run
        </button>
        <div v-if="shouldShowAllUploadRawMsg" class="errorMessage">
          Please complete all upload raw files fields.
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import Uploader from "~/components/uploads/Uploader.vue";
import UploadRaw from "~/components/uploads/UploaderRaw.vue";
import UploadRawInfo from "~/components/uploads/UploadRawInfo.vue";
import FormConsentCheckbox from "~/components/formHelpers/FormConsentCheckbox";
import SpecifiedLocationFileSelector from "~/components/uploads/SpecifiedLocationFileSelector.vue";
export default {
  name: "NewRun",
  components: {
    Uploader,
    UploadRaw,
    FormConsentCheckbox,
    UploadRawInfo,
    SpecifiedLocationFileSelector,
  },
  middleware: "auth",
  asyncData({ route, $axios, error }) {
    if (!route.query.sample) {
      error({ statusCode: 500, message: "Project not found" });
    }

    return $axios
      .get("/sample", { params: { id: route.query.sample } })
      .then((res) => {
        if (res.status === 200) {
          const existingRunNamesForThisSample = res.data.sample.runs.map(
            (r) => r.name
          );

          return {
            additionalUploadsComplete: true,
            isSubmitting: false,
            rawUploadsComplete: false,
            sample: res.data.sample,
            invalidRunNames: existingRunNamesForThisSample,
            checkFiles: false,
            run: {
              sample: res.data.sample._id,
              // name: "Gary Monk" + Math.floor(Math.random() * 200),
              name: "",
              // libraryType: "BAM",
              libraryType: null, // e.g. 'BAM',
              // sequencingProvider: "EL",
              sequencingProvider: "", // e.g. 'EL'
              // sequencingTechnology: "454 GS",
              sequencingTechnology: null, // e.g. '454 GS'
              // librarySource: "GENOMIC",
              librarySource: null, // e.g. 'GENOMIC'
              // librarySelection: "ChIP",
              librarySelection: null, // e.g. 'ChIP'
              // libraryStrategy: "CLONE",
              libraryStrategy: null, // e.g. 'CLONE'
              // insertSize: 1232,
              insertSize: null, // e.g. 123
              rawFiles: [],
              additionalFiles: [],
            },
            isAnyRawReadFileFieldIncomplete: true,
            activeTab: "hpc-mv",
            tabs: ["hpc-mv", "local-filesystem"],
            validatedHpcUploads: false,
            formConsentCheckbox: false,
          };
        } else {
          return error({ statusCode: 500, message: "Parent sample not found" });
        }
      })
      .catch((err) => {
        console.error(err);
        error({ statusCode: 500, message: "Parent sample not found" });
      });
  },
  computed: {
    // COULD DO: make more robust
    isOxfordNanopore() {
      return this.run.libraryType
        ? this.run.libraryType.toLowerCase().includes("oxford nanopore")
        : false;
    },
    shouldShowAllUploadRawMsg() {
      return (
        this.activeTab !== "hpc-mv" && this.isAnyRawReadFileFieldIncomplete
      );
    },
    getSpecifiedLocation() {
      return "hello";
    },
    isWarningStyleForNameInput() {
      return this.invalidRunNames &&
        this.invalidRunNames.length &&
        this.invalidRunNames.includes(this.run.name)
        ? "is-danger"
        : "";
    },
    rawReadsValidated() {
      if (this.activeTab === "hpc-mv") {
        return this.validatedHpcUploads;
      } else {
        return this.rawUploadsComplete && !this.isAnyRawReadFileFieldIncomplete;
      }
    },
    canSubmit() {
      if (
        this.additionalUploadsComplete &&
        this.rawReadsValidated &&
        !this.isWarningStyleForNameInput &&
        this.formConsentCheckbox &&
        !this.isSubmitting &&
        this.checkFiles
      ) {
        return true;
      } else {
        return false;
      }
    },
    paired() {
      return this.libraryTypeObject ? this.libraryTypeObject.paired : null;
    },
    allowedExtensions() {
      if (
        !this.libraryTypeObject ||
        !this.libraryTypeObject.extensions ||
        !this.libraryTypeObject.extensions.length
      ) {
        return [];
      }
      return this.libraryTypeObject.extensions;
    },
    libraryTypeObject() {
      if (this.run.libraryType) {
        const found = this.libraryTypes.filter(
          (lt) => lt.value == this.run.libraryType
        );
        if (found.length) {
          return found[0];
        } else {
          return null;
        }
      } else {
        return null;
      }
    },
    libraryTypes() {
      return JSON.parse(JSON.stringify(this.$store.state.libraryTypes));
    },
    sequencingProviders() {
      return JSON.parse(JSON.stringify(this.$store.state.sequencingProviders));
    },
    sequencingTechnologies() {
      return JSON.parse(
        JSON.stringify(this.$store.state.sequencingTechnologies)
      );
    },
    librarySources() {
      return JSON.parse(JSON.stringify(this.$store.state.librarySources));
    },
    librarySelections() {
      return JSON.parse(JSON.stringify(this.$store.state.librarySelections));
    },
    libraryStrategies() {
      return JSON.parse(JSON.stringify(this.$store.state.libraryStrategies));
    },
  },
  mounted() {
    this.$store.dispatch("refreshOptions");
  },
  methods: {
    onToggleFormConsentCheckbox(newVal) {
      this.formConsentCheckbox = newVal;
    },
    onHpcUploadValidationChangeStatus(newValue) {
      if (newValue) {
        // truthy results
        this.validatedHpcUploads = true;
        this.run.hpcRawFiles = newValue;
      } else {
        this.validatedHpcUploads = false;
      }
    },
    computeOptionString(option) {
      const typesSupported = !option.extensions.length
        ? " (any file type allowed)"
        : " (permitted file types:" +
          option.extensions.map((ext) => " " + ext) +
          ")";
      return option.value + typesSupported;
    },
    onUploaderChange(val) {
      if (typeof val === "boolean") {
        this.additionalUploadsComplete = val;
      }
      this.updateAdditionalFiles();
    },
    onRawUploaderChange(val) {
      if (typeof val === "boolean") {
        this.rawUploadsComplete = val;
      }
      this.updateRawFiles();
    },
    calculateIsAnyRawReadFileFieldIncomplete() {
      var incompleteFieldDetected = this.run.rawFiles.some((rawFile) => {
        // must have md5 and more than md5+rowId; md5 already handled by UI
        var thisRawFileIsIncomplete =
          /**!rawFile.md5 || */ Object.keys(rawFile).length < 3;
        return thisRawFileIsIncomplete;
      });
      this.isAnyRawReadFileFieldIncomplete = incompleteFieldDetected;
    },
    updateAdditionalFiles() {
      if (this.$refs["additionalUploader"]) {
        this.run.additionalFiles = this.$refs["additionalUploader"].getFiles();
      }
    },
    updateRawFiles() {
      if (this.$refs["rawUploader"]) {
        this.run.rawFiles = this.$refs["rawUploader"].getFiles();
      }
      this.calculateIsAnyRawReadFileFieldIncomplete();
    },
    postForm() {
      this.isSubmitting = true;

      this.updateAdditionalFiles();
      this.updateRawFiles();

      this.run.owner = this.$auth.user.username; //required
      this.run.group = this.sample.group._id;
      this.run.sample = this.sample._id; //required

      this.run.paired = this.paired;

      if (this.activeTab === "hpc-mv") {
        this.run.rawFiles = this.run.hpcRawFiles.files;
      }

      // conditionally add info about hpc mv if applicable
      // otherwise just the method of transfer
      const hpcMvInfo =
        this.activeTab === "hpc-mv"
          ? {
              relativePath: this.run.hpcRawFiles.relativePath,
            }
          : {};
      this.run.rawFilesUploadInfo = {
        method: this.activeTab,
        ...hpcMvInfo,
      };

      this.$axios
        .post("/runs/new", this.run)
        .then((result) => {
          setTimeout(() => {
            this.$buefy.toast.open({
              message: "Run created!",
              type: "is-success",
            });
            this.$router.push({
              name: "run",
              query: {
                id: result.data.run._id,
                /**, justCreated: true // in case we want to tell user large uploads will take time */
              },
            });
            this.isSubmitting = false;
          }, 4000);
        })
        .catch((err) => {
          console.error(err);
          var errorMessage = err.message;
          if (err.message.includes("500")) {
            const type = "Run";
            errorMessage =
              "Unknown 500 error from server. Sorry about that." +
              "\n" +
              type +
              " info may have registered in database." +
              "\nUploads are on remote server, but may not have been registered in database and/or moved to HPC." +
              "\nPlease check all this using this website, and notify system admin of when this happened, and which data you need cleaning up.";
          }
          setTimeout(() => {
            this.$buefy.dialog.alert({
              title: "Error",
              message: errorMessage,
              type: "is-danger",
              hasIcon: false,
            });
            this.isSubmitting = false;
          }, 3000);
        });
    },
  },
};
</script>

<style scoped>
.errorMessage {
  color: #f14668;
  display: block;
  font-size: 0.75rem;
  margin-top: 0.25rem;
}
.b-field-label-proxy {
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
  text-size-adjust: 100%;
  font-family: BlinkMacSystemFont, -apple-system, "Segoe UI", "Roboto", "Oxygen",
    "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue",
    "Helvetica", "Arial", sans-serif;
  line-height: 1.5;
  box-sizing: inherit;
  color: #363636;
  display: block;
  font-size: 1rem;
  font-weight: 700;
  margin-bottom: 0.5em;
}
</style>
