<template>
  <div>
    <div>
      <UploaderRawRow
        :paired="paired"
        v-for="rowID in rowIDs"
        :rowID="rowID"
        :ref="rowID"
        :key="rowID"
        :deleteRow="deleteRow"
        :onUploadStatusChange="onRowChange"
        :allowedExtensions="allowedExtensions"
      />
    </div>

    <br />
    <div class='bottomPadding'>
      <b-button icon-left="plus" @click="addRow">Add another</b-button>
    </div>
  </div>
</template>

<script>
import UploaderRawRow from "./UploaderRawRow";
import { v4 as uuidv4 } from "uuid";
export default {
  props: ["paired", "onUploadStatusChange", "allowedExtensions"],
  components: { UploaderRawRow },
  data() {
    return {
      API_URL: process.env.API_URL,
      rowIDs: [uuidv4()],
      rowsDone: []
    };
  },
  methods: {
    deleteRow(rowID) {
      this.rowIDs = this.rowIDs.filter(u => u != rowID);
      this.updateStatus();
    },
    addRow() {
      this.rowIDs.push(uuidv4());
      this.updateStatus();
    },
    onRowChange(val, rowID) {
      //
      this.rowsDone[rowID] = val;
      this.updateStatus();
    },
    updateStatus() {
      if (this.rowIDs.length < 1) {
        this.onUploadStatusChange(true);
      } else {
        const filtered = this.rowIDs.filter(rid => {
          return !this.rowsDone[rid];
        });
        const status = filtered.length < 1;
        this.onUploadStatusChange(status);
      }
    },
    getFiles() {
      const self = this;
      const flat = [];
      this.rowIDs.map(rid => {
        if (self.$refs[rid]) {
          const result = self.$refs[rid][0].getFiles().map(ff => {
            const ffWithRowID = {
              ...ff,
              rowID: rid,
            }
            
            flat.push(ffWithRowID);
          });
          return result;          
        }
      });      
      return flat
    }
  }
};
</script>
<style>
.bottomPadding {
  padding-bottom: 1.5rem;
}
</style>