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
        <b-field label="Project">{{ project.name }}</b-field>

        <div class="columns">
          <div class="column">
            <!-- TODO this field isnt counting its characters, same for run -->
            <b-field
              label="Name"
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
              label="Scientific Name"
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
              label="Common Name"
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
              label="NCBI Taxonomy ID"
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
          label="Conditions"
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

        <!--<div class="buttons is-right">-->
        <button type="submit" class="button is-success" :disabled="!canSubmit">
          Create sample
        </button>
        <!--</div>-->
      </form>
    </div>
  </div>
</template>

<script>
import Uploader from "~/components/uploads/Uploader.vue";
import FormConsentCheckbox from "~/components/formHelpers/FormConsentCheckbox";
import CollapsibleUploaderHelp from "~/components/formHelpers/CollapsibleUploaderHelp";
export default {
  name: "NewSample",
  components: { Uploader, FormConsentCheckbox, CollapsibleUploaderHelp },
  middleware: "auth",
  asyncData({ /**store,*/ route, $axios, error }) {
    if (!route.query.project) {
      return error({ statusCode: 500, message: "Project not found" });
    }

    return $axios
      .get("/project", { params: { id: route.query.project } })
      .then((res) => {
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

          const existingSampleNamesForThisProject =
            res.data.project.samples.map((s) => s.name);
          return {
            isSubmitting: false,
            additionalUploadsComplete: true,
            project: res.data.project,
            invalidSampleNames: existingSampleNamesForThisProject,
            sample: {
              /* fields */
              name: "",
              scientificName: "",
              commonName: "",
              ncbi: null,
              conditions: "",

              /** shared fields */
              project: res.data.project.id,
              additionalFiles: [],

              /* Test data */
              // name: "Wilfried Zaha #" + Math.round(Math.random() * 10000),
              // scientificName: "Andros Townsend",
              // commonName: "Dion Dublin",
              // ncbi: 12345,
              // conditions:
              //   "How lucky are they? Being a test data of my elk, representing all the time!",
            },
          };
        }
        return error({ statusCode: 500, message: "Project not found" });
      })
      .catch((err) => {
        console.error(err);
        return error({ statusCode: 500, message: "Project not found" });
      });
  },
  computed: {
    isWarningStyleForNameInput() {
      return this.invalidSampleNames.includes(this.sample.name)
        ? "is-danger"
        : "";
    },
    canSubmit() {
      if (
        this.additionalUploadsComplete &&
        !this.isWarningStyleForNameInput &&
        !this.isSubmitting
      ) {
        return true;
      } else {
        return false;
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
        this.sample.additionalFiles =
          this.$refs["additionalUploader"].getFiles();
      }
    },
    postForm() {
      this.isSubmitting = true;
      this.updateAdditionalFiles();

      //
      this.sample.owner = this.$auth.user.username; //required
      this.sample.group = this.project.group;
      this.sample.project = this.project._id; //required
      // this.project.tags = this.tags;
      //console.log('sampleaddfiles', this.sample.additionalFiles);

      this.$axios
        .post("/samples/new", this.sample)
        .then((result) => {
          // give additionalFile time to enter DB
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
