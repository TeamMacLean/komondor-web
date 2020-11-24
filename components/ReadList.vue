<template>
  <div v-if="!reads.length">
    <p>
      No read files detected in HPC.
    </p>
    <p>
      If you think this is in error, please
      <a :href="emailLink">contact admin</a>
      to resolve this issue. 
    </p>
  </div>
  <div v-else>
    <div>
      <!-- TODO sort paired -->
      <div v-for="read in sortedReads" :key="read._id">
        <div class="fileInfo">

          <b-tooltip v-if="read.verified" position="is-right" label='Raw read file verified in database'>
            <b-icon type="is-success" icon="check" size="is-small"></b-icon>
          </b-tooltip>
          <!-- <b-tooltip v-else label='File unver'>
            <b-icon icon="close" type="is-danger" size="is-small"></b-icon>
          </b-tooltip> -->
          <b-icon v-else icon="close" type="is-white" size="is-small"></b-icon>


          <b-icon icon="file-outline" size="is-small"></b-icon>

          <div class="fileNamePadding">{{read.fileName}}</div>
          <div v-if="read.readInfo.paired" class="fileNamePadding">
            <div v-if="read.readInfo.sibling">
              (PAIRED with {{getSiblingFileName(read.readInfo.sibling)}})
            </div>
            <div v-else>
              (PAIRED)
            </div>
            
          </div>

          <b-button type="button"
            v-clipboard:copy="getFullFilePath(read.fileName)"
            v-clipboard:success="onCopy"
            v-clipboard:error="onError"
          >
            Copy HPC filepath
          </b-button>
        </div> 
      </div>
    </div>
    <!-- if sequences cards -->
  </div>
</template>

<script>
import path from 'path'
export default {
  data() {
    return {
      datastoreRoot: ""
    };
  },
  mounted() {
    this.datastoreRoot = process.env.DATASTORE_ROOT.replace(/['"]+/g, '');

    console.log('what we receive', this.reads);
    
  },
  methods: {
    onCopy: function (e) {
      alert('You just copied onto your clipboard: ' + e.text)
    },
    onError: function (e) {
      alert('Failed to copy texts')
    },
    getFullFilePath: function (fileName) {
      const unixDirConverter = fileName.replace(/\s/g, '\\ ');
      return path.join(this.datastoreRoot, this.runPath, 'raw', unixDirConverter);      
    },
    getSiblingFileName(siblingId){
      return this.reads.find(read => read.readInfo._id === siblingId).fileName
    }
  },
  props: ["runPath", "reads"],
  computed: {
    sortedReads() {
      // console.log('this.file', this.reads);
      
      // TODO pair based on sibling ID (this however will work 90% of the time)
      
      return this.reads.sort((a, b) => (a.fileName > b.fileName) ? 1 : -1 );
    },
    emailLink() {
      const { path, query } = this.$route;
      const { id } = query;
      const trimmedPath = path.replace('\/', '');

      const bodyTextUnformatted = 
        'I am looking at a ' + trimmedPath + ' with an ID of ' + id + '. '
        + 'I am concerned with the ' 
        + `${this.reads.length ? '' : 'lack of'} read files listed. `
        + ' Could you investigate this please?'
      ;

      const bodyText = bodyTextUnformatted.replace(' ', '%20');
      const result = 'mailto:george.deeks@tsl.ac.uk?subject=Issue%20with%20missing%20Komondor%20files&body=' + bodyText;
      return result;
    }
  },
};
</script>

<style>

.fileInfo {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.fileNamePadding {
  margin-right: 15px;
  margin-left: 5px;
}

</style>