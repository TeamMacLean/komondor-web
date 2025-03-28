<template>
  <form @submit.prevent="postForm">
    <div class="modal-card" style="width: auto">
      <header class="modal-card-head">
        <p class="modal-card-title">Library Type</p>
      </header>
      <section class="modal-card-body">
        <b-field label="Name">
          <b-input type="text" placeholder="FASTQ - unpaired" v-model="name" required></b-input>
        </b-field>

        <b-field>
          <label class="checkbox">
            <input type="checkbox" v-model="paired" />
            Paired/Mated
          </label>
        </b-field>
        <br />
        <b-field label="File extensions" message="Limit possible upload file types to those listed here. Leave blank for no limits on file type.">
          <b-taginput v-model="extensions" ellipsis icon="label" placeholder=".fq.gz"></b-taginput>
        </b-field>
        <!-- George TODO what is the point of tags? -->
        <!-- <p class="content">
          <b>Tags:</b>
          {{ tags }}
        </p> -->
      </section>
      <footer class="modal-card-foot custom-wrapper">
        <div>

        <button class="button" type="button" @click="$parent.close()">Cancel</button>
        <button class="button is-primary" type="submit">Add</button>
        </div>
        <p class="errorMessage" v-if="errors.length">
          <b>Please correct the following error(s):</b>
          <ul>
            <li v-for="(error, index) in errors" :key="index">{{ error }}</li>
          </ul>
        </p>
      </footer>
    </div>
  </form>
</template>

<script>
export default {
  props: ["existingNames"],
  data() {
    return {
      name: "",
      paired: false,
      extensions: [],
      errors: []
    };
  },
  methods: {
    postForm: function() {
      if (this.existingNames.includes(this.name)){
        const libraryTypeAlreadyExistsErrorStr = "Library type '" + this.name + "' already exists"
        if (this.errors.indexOf(libraryTypeAlreadyExistsErrorStr) === -1){
          this.errors.push(libraryTypeAlreadyExistsErrorStr);
        }
        return;
      }

      this.extensions.forEach(extension => {
        // file extensions, i.e. .alphanumeric.repeated.pattern
        if (!(/(\.[0-9a-z]+)+$/.test(extension))){
          this.errors.push('Please ensure file extensions are alphanumeric and starting with a ., e.g. .fastq, .tar.gz');
          return;
        }
      })

      this.$axios
        .post("/options/librarytype", {
          value: this.name,
          paired: this.paired,
          extensions: this.extensions
        })
        .then(() => {
          this.$parent.close();
          this.$store.dispatch("refreshLibraryTypes");
          this.$buefy.toast.open({
            message: `Added: ${this.name}`,
            type: "is-success"
          });
        })
        .catch(err => {
          this.$parent.close();
          this.$buefy.toast.open({
            message: `Failed to save option, error is: ${err}`,
            type: "is-danger"
          });
        });
    }
  }
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