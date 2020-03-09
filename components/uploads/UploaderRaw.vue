<template>
  <div>
    <div v-if="!uploadID">ERROR! no uploadUD</div>
    <div>
      <div v-if="paired">
        <UploaderRawRow
          v-for="rowID in rowIDs"
          :rowID="rowID"
          :uploadID="uploadID"
          :key="rowID"
          :deleteRow="deleteRow"
        />
      </div>
      <div v-else>
        <Uploader :uploadID="uploadID" />
      </div>
    </div>

    <br />
    <b-button v-if="paired" icon-left="plus" @click="addRow">Add another</b-button>
  </div>
</template>

<script>
import UploaderRawRow from "./UploaderRawRow";
import Uploader from "./Uploader";
import uuidv4 from "uuid/v4";
export default {
  props: ["paired", "uploadID"],
  components: { UploaderRawRow, Uploader },
  data() {
    return {
      API_URL: process.env.API_URL,
      rowIDs: [uuidv4()]
    };
  },
  methods: {
    deleteRow(rowID) {
      this.rowIDs = this.rowIDs.filter(u => u != rowID);
    },
    addRow() {
      this.rowIDs.push(uuidv4());
    }
  }
};
</script>