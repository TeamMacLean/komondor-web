<template>
  <section>
    <b-button
      label="Set accession number"
      type="is-primary"
      size="is-medium"
      @click="isComponentModalActive = true"
    />

    <b-modal
      v-model="isComponentModalActive"
      has-modal-card
      trap-focus
      :destroy-on-hide="false"
      aria-role="dialog"
      aria-label="Set accession number modal"
      aria-modal
    >
      <template #default="props">
        <ModalForm
          :type-id="typeId"
          :type="type"
          @close="props.close"
        ></ModalForm>
      </template>
    </b-modal>
  </section>
</template>

<script>
import moment from "moment";
const ModalForm = {
  props: ["canCancel", "type", "typeId"],
  data() {
    return {
      accession: "",
      releaseDate: "",
    };
  },
  template: `
  <form @submit.prevent="postForm">
      <div class="modal-card" style="width: auto">
        <header class="modal-card-head">
          <p class="modal-card-title rightPadding">Enter new accession</p>
          <button
            type="button"
            class="delete"
            @click="$emit('close')"/>
        </header>
        <section class="modal-card-body">

        <b-field label="Accession number">
              <b-input
                type="text"
                v-model="accession"
                placeholder=""
                required>
              </b-input>
          </b-field>

          <b-field v-if="type === 'project'" label="Release date for project">
              <b-input
                type="test"
                v-model="releaseDate"
                placeholder="DD-MM-YYYY"
                >
              </b-input>
          </b-field>
          <p v-if="type === 'project'"><i>(Optional. Please stick to correct date format.)</i></p>

        </section>
        <footer class="modal-card-foot">
          <b-button
            label="Cancel"
            @click="$emit('close')" />
          <b-button
            label="Send"
            :disabled="!accession"
            type="is-primary" 
            @click="postForm"  
          />
        </footer>
      </div>
    </form>
  `,
  methods: {
    postForm: function () {
      if (
        this.releaseDate &&
        !moment(this.releaseDate, "DD-MM-YYYY", true).isValid()
      ) {
        this.$buefy.toast.open({
          message: "Invalid date format! Please change.",
          type: "is-danger",
        });
        return;
      }

      this.$axios
        .post("/accessions/new", {
          accession: this.accession,
          releaseDate: this.releaseDate,
          type: this.type,
          typeId: this.typeId,
        })
        .then(() => {
          console.log("this", this);
          this.$emit("close");

          this.$buefy.toast.open({
            message: `Added accession '${this.accession}'${
              this.releaseDate ? ` and release date '${this.releaseDate}'` : ""
            }`,
            type: "is-success",
          });
          this.$router.app.refresh();
        })
        .catch((err) => {
          console.log("SADNESS");

          this.$emit("close");
          this.$buefy.toast.open({
            message: err,
            type: "is-danger",
          });
        });
    },
  },
};

export default {
  components: {
    ModalForm,
  },
  props: ["typeId", "type"],
  data() {
    return {
      isComponentModalActive: false,
    };
  },
};
</script>
<style>
.rightPadding {
  padding-right: 10px;
}
</style>
