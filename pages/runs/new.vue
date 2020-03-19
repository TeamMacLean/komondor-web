<template>
  <div class="section">
    <div class="container">
      <h1 class="title">New Run</h1>
      <!-- <h2 class="subtitle">
        Aenean eu leo quam. Pellentesque ornare sem lacinia quam venenatis vestibulum. Morbi leo
        risus, porta ac consectetur ac, vestibulum at eros.
      </h2>-->
      <hr />
      <form @submit.prevent="postForm">
        <div class="columns">
          <div class="column">
            <b-field label="Name" message="A short, informative name to identify your data set.">
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
                >{{ option.value }}</option>
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
        <b-field label="Raw reads">
          <UploadRaw
            :uploadID="run.rawUploadID"
            :paired="this.paired"
            :onUploadStatusChange="onRawUploaderChange"
            :onMD5Change="onMD5Change"
          />
        </b-field>
        <hr />
        <b-field
          label="Additional files"
          message="Please upload any documentation obtained from the sequencing provider, including copies of the communication. If the documentation pertains only to a certain sample or data set, then please add it there instead."
        >
          <Uploader :uploadID="run.additionalUploadID" :onUploadStatusChange="onUploaderChange" />
        </b-field>
        <!--<div class="buttons is-right">-->
        <button type="submit" class="button is-success" :disabled="!canSubmit">Create run</button>
        <!--</div>-->
      </form>
    </div>
  </div>
</template>

<script>
import Uploader from "~/components/uploads/Uploader.vue";
import UploadRaw from "~/components/uploads/UploaderRaw.vue";
import { v4 as uuidv4 } from "uuid";
export default {
  middleware: "auth",
  components: { Uploader, UploadRaw },
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
          return {
            additionalUploadsComplete: true,
            rawUploadsComplete: false,
            sample: res.data.sample,
            run: {
              sample: res.data.sample._id,
              libraryType: null,
              sequencingProvider: "",
              sequencingTechnology: null,
              librarySource: null,
              librarySelection: null,
              libraryStrategy: null,
              insertSize: null,
              additionalUploadID: uuidv4(),
              rawUploadID: uuidv4(),
              MD5s: []
            }
          };
        } else {
          return error({ statusCode: 500, message: "Project not found" });
        }
      })
      .catch(err => {
        console.error(err);
        error({ statusCode: 500, message: "Project not found" });
      });
  },
  computed: {
    canSubmit() {
      return this.additionalUploadsComplete;
    },
    paired() {
      return this.libraryTypeObject ? this.libraryTypeObject.paired : false;
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
    },
    canSubmit() {
      return this.additionalUploadsComplete && this.rawUploadsComplete;
    }
  },
  methods: {
    onMD5Change(MD5, UUID) {
      // this.run.MD5s[UUID] = MD5;
      let found = false;
      this.run.MD5s = this.run.MD5s.map(m => {
        if (m.UUID === UUID) {
          found = true;
          return { UUID, MD5 };
        } else {
          return m;
        }
      });

      if (!found) {
        this.run.MD5s.push({ UUID, MD5 });
      }
    },
    onUploaderChange(val) {
      if (typeof val === "boolean") {
        this.additionalUploadsComplete = val;
      }
    },
    onRawUploaderChange(val) {
      if (typeof val === "boolean") {
        this.rawUploadsComplete = val;
      }
    },
    postForm() {
      this.run.owner = this.$auth.user.username; //required
      this.run.group = this.sample.group._id;
      this.run.sample = this.sample._id; //required

      // this.run.MD5s = Object.keys(this.run.MD5s).map(m => {
      //   return { UUID: m, MD5: this.run.MD5s[m] };
      // });

      this.$axios
        .post("/runs/new", this.run)
        .then(result => {
          this.$buefy.toast.open({
            message: "Run created!",
            type: "is-success"
          });
          this.$router.push({
            name: "run",
            query: { id: result.data.run._id }
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