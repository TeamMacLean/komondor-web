<template>
  <div class="is-outlined is-padded mb">
    <div class="delete-button-holder">
      <button
        type="button"
        aria-label="Close message"
        class="delete delete-row"
        @click="onDeleteRow"
      ></button>
    </div>

    <div v-if="paired">
      <div class="columns">
        <div class="column is-6">
          <label class="label">First read file (R1)aa</label>
          <p
            class="help"
          >Choose the file that contains the forward reads (usually having "R1" in the filename).</p>
          <br />
          <RawItem :onUploadStatusChange="onLeftChange"  ref="left" />
        </div>
        <div class="column is-6">
          <label class="label">Second read file (R2)</label>
          <p
            class="help"
          >Choose the file that contains the reverse reads (usually having "R2" in the filename).</p>
          <br />
          <RawItem :onUploadStatusChange="onRightChange"  ref="right" />
        </div>
      </div>
    </div>
    <div v-else>
      <!-- <div class="outlined"> -->
      <RawItem :onUploadStatusChange="onSingleChange" ref="single" />
      <!-- </div> -->
    </div>
  </div>
</template>

<script>
import RawItem from "./_RawItem";
export default {
  props: ["paired", "deleteRow", "rowID", "onUploadStatusChange"],
  components: { RawItem },
  data() {
    return {
      leftDone: false, //left all uploads complete
      rightDone: false, //right all uploads complete
      singleDone: false, //single all uploads complete
      API_URL: process.env.API_URL
    };
  },

  methods: {
    onDeleteRow() {
      //TODO confirm
      // if (this.deleteRow) {
      this.$buefy.dialog.confirm({
        message: "Are you sure?",
        type: "is-danger",
        onConfirm: () => {
          //TODO: delete file from server
          this.deleteRow(this.rowID);
        }
      });
      // }
    },
    onLeftChange(val) {
      if (typeof val === "boolean") {
        this.leftDone = val;
        this.notifyOnChange();
      }
    },
    onRightChange(val) {
      if (typeof val === "boolean") {
        this.rightDone = val;
        this.notifyOnChange();
      }
    },
    onSingleChange(val) {
      if (typeof val === "boolean") {
        this.singleDone = val;
        this.notifyOnChange();
      }
    },
    notifyOnChange() {
      if (this.onUploadStatusChange) {
        if (this.paired) {
          this.onUploadStatusChange(
            this.leftDone && this.rightDone,
            this.rowID
          );
        } else {
          this.onUploadStatusChange(this.singleDone, this.rowID);
        }
      }
    },
    getFiles() {
      if (this.paired) {
        const left = this.$refs["left"].getFiles();
        const right = this.$refs["right"].getFiles();
        left.paired = true;
        right.paired = true;
        return lefts.concat(rights);
        return [left, right];
      } else {
        const single = this.$refs["single"].getFiles();
        single.paired = false;
        return [single];
      }
    }
  }
};
</script>

<style scoped>
.is-outlined {
  border: 1px solid lightgray;
  border-radius: 4px;
}
.is-padded {
  padding: 16px;
}
.mb {
  margin-bottom: 8px;
}
.delete-button-holder {
  position: relative;
  height: 30px;
}
.delete-row {
  position: absolute;
  right: 0;
  top: 0;
}
</style>