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
            <b-field
              label="Name"
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
import FormConsentCheckbox from "~/components/formHelpers/formConsentCheckbox"
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

          return {
            additionalUploadsComplete: true,
            project: res.data.project,
            sample: {
              name: "",
              project: res.data.project.id,
              scientificName: "",
              commonName: null,
              ncbi: "",
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
    canSubmit() {
      return this.additionalUploadsComplete;
    }
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

      this.updateAdditionalFiles()

      //
      this.sample.owner = this.$auth.user.username; //required
      this.sample.group = this.project.group;
      this.sample.project = this.project._id; //required
      // this.project.tags = this.tags;
      this.$axios
        .post("/samples/new", this.sample)
        .then(result => {
          this.$buefy.toast.open({
            message: "Sample created!",
            type: "is-success"
          });
          // this.$router.push({
          //   path: '/projects'
          // })
          //
          this.$router.push({
            name: "sample",
            query: { id: result.data.sample._id }
          });
        })
        .catch(err => {
          console.error(err);
          this.$buefy.dialog.alert({
            title: "Error",
            message: err.message,
            type: "is-danger",
            hasIcon: true
          });
        });
    }
  }
};
</script>
