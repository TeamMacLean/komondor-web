<template>
  <div class="section">
    <div class="container">
      <h1 class="title">New Sample</h1>
      <!-- <h2 class="subtitle">
        Aenean eu leo quam. Pellentesque ornare sem lacinia quam venenatis vestibulum. Morbi leo
        risus, porta ac consectetur ac, vestibulum at eros.
      </h2>-->
      <hr />
      <form @submit.prevent="postForm">
        <b-field label="Project">{{project.name}}</b-field>

        <div class="columns">
          <div class="column">
            <!-- TODO this field isnt counting its characters, same for run -->
            <b-field
              label="Name"
              :type="this.isWarningStyleForNameInput"
              message="A choose a short, informative name to identify your sample, between 10 and 80 characters."
            >
              <b-input
                name="name"
                v-model="sample.name"
                minlength="10"
                maxlength="80"
                required
                id="name"
              ></b-input>
            </b-field>
          </div>
          <div class="column"></div>
        </div>

        <div class="columns">
          <div class="column">
            <b-field
              label="Scientific Name"
              message="The scientific name of your sample organism as it appears in NCBI Taxonomy. E.g. Solanum lycopersicum."
            >
              <b-input
                name="scientificName"
                v-model="sample.scientificName"
                minlength="5"
                required
                id="scientificName"
              ></b-input>
            </b-field>
          </div>
          <div class="column">
            <b-field
              label="Common Name"
              message="The common name of your sample organism if known (optional). E.g. Tomato."
            >
              <b-input
                name="commonName"
                v-model="sample.commonName"
                minlength="3"
                required
                id="commonName"
              ></b-input>
            </b-field>
          </div>
          <div class="column">
            <b-field
              label="NCBI Taxonomy ID"
              message="The Taxonomy ID for your sample's organism. (Choose the host if you're investigating host - pathogen interactions.)"
            >
              <b-input
                name="ncbi"
                v-model="sample.ncbi"
                type="number"
                required
                id="ncbi"
              ></b-input>
            </b-field>
          </div>
        </div>

        <b-field
          label="Conditions"
          message="Information (required, minimum 50 characters) about the sample conditions (environmental conditions, is it a pathogen interaction?, what pathogen? etc.)"
        >
          <b-input
            type="textarea"
            v-model="sample.conditions"
            minlength="50"
            required
            name="conditions"
            id="conditions"
          ></b-input>
        </b-field>

        <b-field
          label="Additional files"
          message="Please upload any documentation obtained from the sequencing provider, including copies of the communication. If the documentation pertains to the whole project or only to a certain data set, then please add it there instead."
        >
          <Uploader ref="additionalUploader" :onUploadStatusChange="onUploaderChange" />
        </b-field>
        <CollapsibleUploaderHelp />       
        <hr />
        <FormConsentCheckbox />
        <hr />

        <!--<div class="buttons is-right">-->
        <button type="submit" class="button is-success" :disabled="!canSubmit">Create sample</button>
        <!--</div>-->
      </form>
    </div>
  </div>
</template>

<script>
import Uploader from "~/components/uploads/Uploader.vue";
import FormConsentCheckbox from "~/components/formHelpers/FormConsentCheckbox"
import { v4 as uuidv4 } from "uuid";
export default {
  middleware: "auth",
  components: { Uploader, FormConsentCheckbox },
  asyncData({ store, route, $axios, error }) {
    if (!route.query.project) {
      return error({ statusCode: 500, message: "Project not found" });
    }

    return $axios
      .get("/project", { params: { id: route.query.project } })
      .then(res => {
        if (res.status === 200) {
          if (
            res.data.project &&
            res.data.project.group &&
            res.data.project.doNotSendToEna &&
            res.data.project.group.sendToEna
          ) {
            return error({
              message:
                "You have requested that this data not go to ENA, you cannot add any samples until this is resolved."
            });
          }
          
          const existingSampleNamesForThisProject = res.data.project.samples.map(s => s.name)
          return {
            isSubmitting: false,
            additionalUploadsComplete: true,
            project: res.data.project,
            invalidSampleNames: existingSampleNamesForThisProject,
            sample: {
              /* TODO switch back */
              name: "",
              project: res.data.project.id,
              scientificName: "",
              commonName: '',
              ncbi: null,
              conditions: "",
              additionalFiles: []
            }
          };
        }
        return error({ statusCode: 500, message: "Project not found" });
      })
      .catch(err => {
        console.error(err);
        return error({ statusCode: 500, message: "Project not found" });
      });
  },
  computed: {
    isWarningStyleForNameInput() {
      return this.invalidSampleNames.includes(this.sample.name) ? 'is-danger' : '';
    },
    canSubmit() {
      if (
        this.additionalUploadsComplete &&
        !this.isWarningStyleForNameInput &&
        !this.isSubmitting
      ){
        return true
      } else {
        return false
      }
    },
  },
  methods: {
    onUploaderChange(val) {
      //
      if (typeof val === "boolean") {
        this.additionalUploadsComplete = val;
      }
      this.updateAdditionalFiles();
    },
    updateAdditionalFiles() {
      if (this.$refs["additionalUploader"]) {
        this.sample.additionalFiles = this.$refs[
          "additionalUploader"
        ].getFiles();
      }
    },
    postForm() {
      this.isSubmitting = true;
      this.updateAdditionalFiles()

      //
      this.sample.owner = this.$auth.user.username; //required
      this.sample.group = this.project.group;
      this.sample.project = this.project._id; //required
      // this.project.tags = this.tags;
      //console.log('sampleaddfiles', this.sample.additionalFiles);
      
      this.$axios
        .post("/samples/new", this.sample)
        .then(result => {
          // give additionalFile time to enter DB
          setTimeout(() => {
            this.$buefy.toast.open({
              message: "Sample created!",
              type: "is-success"
            });
            this.$router.push({
              name: "sample",
              query: { id: result.data.sample._id }
            });
            this.isSubmitting = false;
          }, 3000);          
        })
        .catch(err => {
          setTimeout(() => {
            console.error(err);
            var errorMessage = err.message;
            if (err.message.includes('500')){
              const type = 'Sample';
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
          }, 2000)
        });
    }
  }
};
</script>
