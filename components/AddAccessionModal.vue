<template>
  <section>
    <b-button
      :label="getEditAccessionsLabel"
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
      aria-label="Set accessions modal"
      aria-modal
    >
      <template #default="props">
        <ModalForm
          :type-id="typeId"
          :type="type"
          :initial-accessions="initialAccessions"
          :initial-release-date="initialReleaseDate"
          @close="props.close"
        ></ModalForm>
      </template>
    </b-modal>
  </section>
</template>

<script>
import moment from "moment";
const ModalForm = {
  props: [
    "canCancel",
    "type",
    "typeId",
    "initialAccessions",
    "initialReleaseDate",
  ],
  data() {
    return {
      accessions:
        this.initialAccessions && this.initialAccessions.length
          ? [...this.initialAccessions]
          : [],
      releaseDate: this.initialReleaseDate ? this.initialRelease : "",
    };
  },
  computed: {
    isUpdateAccessionsDisabled: function () {
      const equalsIgnoreOrder = (a, b) => {
        if (a.length !== b.length) return false;
        const uniqueValues = new Set([...a, ...b]);
        for (const v of uniqueValues) {
          const aCount = a.filter((e) => e === v).length;
          const bCount = b.filter((e) => e === v).length;
          if (aCount !== bCount) return false;
        }
        return true;
      };
      const initial = this.initialAccessions || [];
      const edited = this.accessions || [];
      const changedAccessions = !equalsIgnoreOrder(initial, edited);

      if (this.type === "project") {
        /** editing the release date to something invalid disables submission */
        var changedReleaseDate = false;
        if (this.releaseDate === "" && this.initialReleaseDate === undefined) {
          // keep false
        } else if (this.releaseDate !== this.initialReleaseDate) {
          changedReleaseDate = true;
        } else {
          // keep false
        }
        if (changedReleaseDate && !this.isValidDateString) {
          return true;
        }

        /** if either accession or release date have changed validly, submit */

        const isEnabled =
          changedAccessions || (changedReleaseDate && this.isValidDateString);
        return !isEnabled;
      } else {
        // sample or run just need to see change in accessions
        const isEnabled = changedAccessions;
        return !isEnabled;
      }
    },
    isValidDateString: function () {
      return (
        this.releaseDate &&
        moment(this.releaseDate, "DD-MM-YYYY", true).isValid()
      );
    },
    isInvalidTruthyString: function () {
      return (
        this.releaseDate &&
        this.releaseDate.length &&
        !moment(this.releaseDate, "DD-MM-YYYY", true).isValid()
      );
    },
  },
  template: `
    <form @submit.prevent="postForm">
      <div class="modal-card" style="width: auto">
        <header class="modal-card-head">
          <p class="modal-card-title rightPadding">Edit accessions</p>
          <button
            type="button"
            class="delete"
            @click="$emit('close')"/>
        </header>
        <section class="modal-card-body">

        <b-field label="Edit accession numbers">
          <section>
              <b-taginput
                v-model="accessions"
                ellipsis
                icon="label"
                placeholder="Add an accession"
                aria-close-label="Delete this accession">
              </b-taginput>
              <p><i>Hit return to enter</i></p>
            <!-- <p class="content"><b>Accessions:</b> {{ accessions }}</p> -->
          </section>
          </b-field>

          <b-field v-if="type === 'project'" label="Release date for project">
            <br />
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
            :disabled="isUpdateAccessionsDisabled"
            type="is-primary" 
            @click="postForm"  
          />
        </footer>
      </div>
    </form>
  `,
  methods: {
    postForm: function () {
      this.$axios
        // this should really be 'edit' not 'new'
        .post("/accessions/new", {
          accessions: this.accessions,
          releaseDate: this.releaseDate,
          type: this.type,
          typeId: this.typeId,
        })
        .then(() => {
          this.$emit("close");

          this.$buefy.toast.open({
            message: `Successfully edited accessions data`,
            type: "is-success",
          });
          this.$router.app.refresh();
        })
        .catch((err) => {
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
  props: ["typeId", "type", "initialAccessions", "initialReleaseDate"],
  data() {
    return {
      isComponentModalActive: false,
    };
  },
  computed: {
    getEditAccessionsLabel: function () {
      return `Edit ${this.type} accessions`;
    },
  },
};
</script>
<style>
.rightPadding {
  padding-right: 10px;
}
</style>
