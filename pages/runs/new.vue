<template>
  <div class="section">
    <div class="container">
      <h1 class="title">New Run</h1>
      <h5>If any options that you need are not listed, please contact system adminstrator.</h5>
      <!-- <h2 class="subtitle">
        Aenean eu leo quam. Pellentesque ornare sem lacinia quam venenatis vestibulum. Morbi leo
        risus, porta ac consectetur ac, vestibulum at eros.
      </h2>-->
      <hr />
      <form @submit.prevent="postForm">
        <div class="columns">
          <div class="column">
            <b-field 
              :type="this.isWarningStyleForNameInput"
              label="Name" 
              message="A short (5-20 characters in length), informative name to identify your data set."
            >
              <b-input
                expanded
                name="name"                              
                v-model="run.name"
                minlength="5"
                maxlength="20"
                required
                id="name"
              ></b-input>
            </b-field>
          </div>
          <div class="column">
            <b-field
              label="Insert size"
              message="What is the average insert size covered by your read pairs? This should be in the communication with your provider."
            >
              <b-input
                placeholder="Number"
                expanded
                type="number"
                min="0"
                required
                v-model="run.insertSize"
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
                placeholder="EI"
                expanded
                type="text"
                required
                v-model="run.sequencingProvider"
              ></b-input>
            </b-field>
          </div>
          <div class="column">
            <b-field
              label="Sequencing technology"
              message="What was the technology used for sequencing? This should be in the communication with your provider."
            >
              <b-select
                placeholder="Select a sequencing technology"
                required
                expanded
                v-model="run.sequencingTechnology"
              >
                <option
                  v-for="option in sequencingTechnologies"
                  :value="option.value"
                  :key="option._id"
                >{{ option.value }}</option>
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
                placeholder="Select a library source"
                required
                expanded
                v-model="run.librarySource"
              >
                <option
                  v-for="option in librarySources"
                  :value="option.value"
                  :key="option._id"
                >{{ option.value }}</option>
              </b-select>
            </b-field>
          </div>

          <div class="column">
            <b-field
              label="Library selection"
              message="Which protocol was used when creating the library?"
            >
              <b-select
                placeholder="Select a library selection"
                required
                expanded
                v-model="run.librarySelection"
              >
                <option
                  v-for="option in librarySelections"
                  :value="option.value"
                  :key="option._id"
                >{{ option.value }}</option>
              </b-select>
            </b-field>
          </div>
        </div>
        <div class="columns">
          <div class="column">
            <b-field
              label="Library type"
              message="Do you have unpaired, paired, or mate-pair reads?"
            >
              <b-select
                placeholder="Select a library type"
                required
                expanded
                v-model="run.libraryType"
              >
                <option
                  v-for="option in libraryTypes"
                  :value="option.value"
                  :key="option._id"
                >{{ computeOptionString(option) }}</option>
              </b-select>
            </b-field>
          </div>

          <div class="column">
            <b-field
              label="Library strategy"
              message="What kind of sequencing experiment was performed?"
            >
              <b-select
                placeholder="Select a library strategy"
                required
                expanded
                v-model="run.libraryStrategy"
              >
                <option
                  v-for="option in libraryStrategies"
                  :value="option.value"
                  :key="option._id"
                >{{ option.value }}</option>
              </b-select>
            </b-field>
          </div>
        </div>

        <hr />
        <b-field 
          label="Raw reads"
        >
          <UploadRaw
            :paired="this.paired"
            :onUploadStatusChange="onRawUploaderChange"
            :allowedExtensions="allowedExtensions"
            ref="rawUploader"
          />
        </b-field>
        <hr />
        <b-field
          label="Additional files"
          message="Please upload any documentation obtained from the sequencing provider, including copies of the communication. If the documentation pertains only to a certain sample or data set, then please add it there instead."
        >
          <Uploader :onUploadStatusChange="onUploaderChange" ref="additionalUploader" />
        </b-field>

        <hr />
        <FormConsentCheckbox />
        <hr />

        <!--<div class="buttons is-right">-->
        <button type="submit" class="button is-success" :disabled="!canSubmit">
          Create run
        </button>
        <div v-if="isAnyRawReadFileFieldIncomplete" class="errorMessage">
          Please complete all upload raw files fields.
        </div>
        <!--</div>-->
      </form>
    </div>
  </div>
</template>

<script>
import Uploader from "~/components/uploads/Uploader.vue";
import UploadRaw from "~/components/uploads/UploaderRaw.vue";
import FormConsentCheckbox from "~/components/formHelpers/FormConsentCheckbox"
import { v4 as uuidv4 } from "uuid";
export default {
  name: 'New Run',
  middleware: "auth",
  components: { Uploader, UploadRaw, FormConsentCheckbox },
  mounted() {
    this.$store.dispatch("refreshOptions");
  },
  asyncData({ store, route, $axios, error }) {
    if (!route.query.sample) {
      error({ statusCode: 500, message: "Project not found" });
    }

    return $axios
      .get("/sample", { params: { id: route.query.sample } })
      .then(res => {
        if (res.status === 200) {

          const existingRunNamesForThisSample = res.data.sample.runs.map(r => r.name)

          return {
            additionalUploadsComplete: true,
            isSubmitting: false,
            rawUploadsComplete: false,
            sample: res.data.sample,
            invalidRunNames: existingRunNamesForThisSample,
            run: {
              name: "",
              sample: res.data.sample._id,
              libraryType: null, // e.g. 'BAM',
              sequencingProvider: '', // e.g. 'EL'
              sequencingTechnology: null, // e.g. '454 GS' 
              librarySource: null, // e.g. 'GENOMIC' 
              librarySelection: null,// e.g. 'ChIP'
              libraryStrategy: null,// e.g. 'CLONE' 
              insertSize: null,// e.g. 123 
              // additionalUploadID: uuidv4(),
              // rawUploadID: uuidv4(),
              rawFiles: [],
              additionalFiles: []
            },
            isAnyRawReadFileFieldIncomplete: true,
          };
        } else {
          return error({ statusCode: 500, message: "Parent sample not found" });
        }
      })
      .catch(err => {
        console.error(err);
        error({ statusCode: 500, message: "Parent sample not found" });
      });
  },
  computed: {
    isWarningStyleForNameInput() {
      return this.invalidRunNames.includes(this.run.name) ? 'is-danger' : '';
    },
    canSubmit() {
      if (
        this.additionalUploadsComplete &&
        this.rawUploadsComplete &&
        !this.isAnyRawReadFileFieldIncomplete &&
        !this.isWarningStyleForNameInput && 
        !this.isSubmitting
      ){
        return true
      } else {
        return false
      }
    },
    paired() {
      return this.libraryTypeObject ? this.libraryTypeObject.paired : false;
    },
    allowedExtensions() {
      return this.libraryTypeObject
        ? this.libraryTypeObject.extensions.map(e=>'.'+e.split('.').pop())
        : [".thisfileexentionshouldnotexist"];
    },
    libraryTypeObject() {
      if (this.run.libraryType) {
        const found = this.libraryTypes.filter(
          lt => lt.value == this.run.libraryType
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
    }
  },
  methods: {
    computeOptionString(option) {
      const typesSupported = !option.extensions.length ? ' (any file type allowed)' : ' (suggested file types:' + option.extensions.map(ext => (' ' + ext)) + ')';
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
      var incompleteFieldDetected = this.run.rawFiles.some(rawFile => {
        // must have md5 and more than md5+rowId; md5 already handled by UI
        var thisRawFileIsIncomplete = /**!rawFile.md5 || */Object.keys(rawFile).length < 3
        //console.log('this rawFile is empty:', thisRawFileIsIncomplete);
        return thisRawFileIsIncomplete        
      })
      //console.log('isAnyRawReadFileFieldIncomplete', incompleteFieldDetected);      
      this.isAnyRawReadFileFieldIncomplete = incompleteFieldDetected;
      //console.log('calculating is there is any raw read file field incomplete:', incompleteFieldDetected );
      
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

      this.$axios
        .post("/runs/new", this.run)
        .then(result => {
          setTimeout(() => {
            this.$buefy.toast.open({
              message: "Run created!",
              type: "is-success"
            });
            this.$router.push({
              name: "run",
              query: { id: result.data.run._id/**, justCreated: true SO WE CAN TELL THEM UPLOADS TAKE A WHILE IF LARGE */ }
            });
            this.isSubmitting = false;
          }, 2500);
        })
        .catch(err => {
          console.error(err);
          var errorMessage = err.message;
          if (err.message.includes('500')){
            const type = 'Run';
            errorMessage = 'Unknown 500 error from server. Sorry about that.' + 
              '\n' + type + ' info may have registered in database.' + 
              '\nUploads are on remote server, but may not have been registered in database and/or moved to HPC.'  
              '\nPlease check all this using this website, and notify system admin of when this happened, and which data you need cleaning up.';
          }  
          this.$buefy.dialog.alert({
            title: "Error",
            message: errorMessage,
            type: "is-danger",
            hasIcon: false
          });
          this.isSubmitting = false;
        });
    }
  }
};
</script>

<style scoped>
.errorMessage {
  color: #f14668;
  display: block;
  font-size: 0.75rem;
  margin-top: 0.25rem;
}
</style>