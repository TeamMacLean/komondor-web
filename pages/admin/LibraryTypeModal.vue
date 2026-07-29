<template>
  <form @submit.prevent="postForm">
    <div class="modal-card" style="width: auto">
      <header class="modal-card-head">
        <p class="modal-card-title">Library Type</p>
      </header>
      <section class="modal-card-body">
        <b-field label="Name">
          <b-input
            v-model="name"
            type="text"
            placeholder="FASTQ - unpaired"
            required
          ></b-input>
        </b-field>

        <b-field>
          <label class="checkbox">
            <input v-model="paired" type="checkbox" />
            Paired/Mated
          </label>
        </b-field>
        <br />
        <b-field
          label="File extensions"
          message="Limit possible upload file types to those listed here. Leave blank for no limits on file type."
        >
          <b-taginput
            v-model="extensions"
            ellipsis
            icon="label"
            placeholder=".fq.gz"
          ></b-taginput>
        </b-field>
        <!-- George TODO what is the point of tags? -->
        <!-- <p class="content">
          <b>Tags:</b>
          {{ tags }}
        </p> -->
      </section>
      <footer class="modal-card-foot custom-wrapper">
        <div>
          <button class="button" type="button" @click="$parent.close()">
            Cancel
          </button>
          <button class="button is-primary" type="submit">Add</button>
        </div>
        <!-- A div, not a p: a <ul> inside a <p> implicitly closes it, so the
             closing tag became a parse error and the list rendered outside. -->
        <div v-if="errors.length" class="errorMessage">
          <b>Please correct the following error(s):</b>
          <ul>
            <li v-for="(error, index) in errors" :key="index">{{ error }}</li>
          </ul>
        </div>
      </footer>
    </div>
  </form>
</template>

<script>
import { getApiErrorMessage, isBodyError } from "~/utils/apiError";

export default {
  props: ["existingNames"],
  data() {
    return {
      name: "",
      paired: false,
      extensions: [],
      errors: [],
    };
  },
  methods: {
    postForm: function () {
      if (this.existingNames.includes(this.name)) {
        const libraryTypeAlreadyExistsErrorStr =
          "Library type '" + this.name + "' already exists";
        if (this.errors.indexOf(libraryTypeAlreadyExistsErrorStr) === -1) {
          this.errors.push(libraryTypeAlreadyExistsErrorStr);
        }
        return;
      }

      this.extensions.forEach((extension) => {
        // file extensions, i.e. .alphanumeric.repeated.pattern
        if (!/(\.[0-9a-z]+)+$/.test(extension)) {
          this.errors.push(
            "Please ensure file extensions are alphanumeric and starting with a ., e.g. .fastq, .tar.gz"
          );
          return;
        }
      });

      const name = this.name;

      this.$axios
        .post("/options/librarytype", {
          value: name,
          paired: this.paired,
          extensions: this.extensions,
        })
        .then((response) => {
          // The API confirms a create by returning the saved document.
          if (isBodyError(response) || !response.data || !response.data.doc) {
            throw response;
          }
          this.$parent.close();
          return this.$store
            .dispatch("refreshLibraryTypes")
            .then((refreshed) => {
              this.$buefy.toast.open({
                message: refreshed
                  ? `Added: ${name}`
                  : `Added: ${name} — but the list could not be reloaded. Refresh the page to see it.`,
                type: refreshed ? "is-success" : "is-warning",
                duration: refreshed ? 3000 : 6000,
              });
            });
        })
        .catch((err) => {
          console.error("Failed to save library type:", err);
          this.$parent.close();
          this.$buefy.toast.open({
            // Was `${err}`, which stringifies an axios rejection to
            // "Error: Request failed with status code 400".
            message: getApiErrorMessage(err, {
              fallback: `Could not add "${name}".`,
            }),
            type: "is-danger",
            duration: 5000,
          });
        });
    },
  },
};
</script>

<style scoped>
.custom-wrapper {
  display: flex;
  flex-direction: column;
}
.errorMessage {
  color: #f14668;
  display: block;
  font-size: 1rem;
  margin-top: 1rem;
}
</style>
