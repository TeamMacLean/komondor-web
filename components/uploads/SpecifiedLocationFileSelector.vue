<template>
  <div>
    <div class="wrapper">
      <div class="nb-padding">
        <p><b>Please read:</b></p>
        <ul class="info-list">
          <li>
            'HPC upload' is the recommended way to upload large raw files to the
            HPC. This covers most use cases. Please use the 'Local filesystem
            upload' method (click tab above) if your use case is not covered
            here.
          </li>
          <li>
            Before using this method, you should create a directory in
            <code>/tsl/data/tempWebUploadToSequences</code> that contains any
            number of nested subdirectories that pertain to 1 or more run
            submissions you wish to make over a short period of time.
          </li>
          <li>
            Use the below searchbox to find the specific directory that relates
            to this run submission. This directory must only contain raw read
            files and (optionally) their associated MD5 checksums. Secondly, all
            of the raw read files for this submission must be only contained in
            this directory.
          </li>
          <li>
            You may upload .md5 files in addition to raw reads files here, but
            you must also specify the string MD5 value for each file before
            proceeding.
          </li>
          <li>
            <code>/tsl/data/tempWebUploadToSequences</code> is only a temporary
            storage space on the HPC for use with this web form. Please be
            considerate of others when creating directories. You should remove
            data from it when you are finished submitting. Submitted files will
            be moved to their destination folder, leaving an empty directory
            that must be tidied. Both empty and untouched (>3 weeks) directories
            will be removed automatically from this location.
          </li>
          <li>
            This field is not for uploading associated additional files;
            instead, see below.
          </li>
        </ul>
      </div>

      <b-checkbox v-model="firstDeclaration" class="padding">
        I declare that I have read the above and understand how to use this
        manner of upload.
      </b-checkbox>
      <b-checkbox v-model="secondDeclaration" class="padding">
        I declare that my storing of data in
        <code>/tsl/data/tempWebUploadToSequences</code> is only temporary, and
        that inactivity with this data will lead to it being removed without
        warning, and that I have sufficient backups of this data before
        proceeding with this method of upload.
      </b-checkbox>
    </div>
    <div v-if="!allDeclared">(Please declare the above.)</div>

    <div v-else>
      <b-field
        label="Target directory path"
        message="Enter a specific subdirectory of '/tsl/data/tempWebUploadToSequences/'. For example, to access '/tsl/data/tempWebUploadToSequences/deeks/great-project/sample3/run4/', please enter 'deeks/great-project/sample3/run4'. If an error occurs, please check the target directory on the HPC, or try renaming its path to something more simple."
      >
        <div class="verticalCenter">
          <span>/tsl/data/tempWebUploadToSequences/</span>
        </div>
        <b-input v-model="targetDirectoryName" class="wider-input"></b-input>
        <b-button
          type="button"
          :loading="loadingFindDirectory"
          :disabled="findDirectoryDisabled"
          @click="getDirectoryFiles"
          >Find directory</b-button
        >
      </b-field>
      <div v-if="paired === null" class="error">
        <i> Please specify a library type.</i>
      </div>

      <div v-if="directoryFiles.length" class="wrapper">
        <div v-if="paired" class="pairedInfo">
          <div><b>A note on paired reads:</b></div>
          <div>
            You have selected a paired reads library type. You must, using the
            whole 'Sibling' column, select a positive even number of siblings
            that correspond with each other. For example, select
            <code>myExampleReadFile.r2.fq.gz</code> as the 'sibling' for
            <code>myExampleReadFile.r1.fq.gz</code>, and
            <code>myExampleReadFile.r1.fq.gz</code> as the 'sibling' for
            <code>myExampleReadFile.r2.fq.gz</code>, to create 2 siblings. Do
            this for all paired reads files in the target directory - i.e., at
            least 2. Note that you do not need to pair any MD5 files.
          </div>
        </div>
        <div>
          <div class="row">
            <div class="column1">File name</div>
            <div class="column2">MD5 checksum</div>
            <div v-if="paired" class="column3heading">Sibling</div>
          </div>

          <div v-for="file in directoryFiles" :key="file.name" class="row">
            <div class="column1">
              <code>{{ truncateName(file.name) }}</code>
            </div>
            <b-input
              :ref="file.name + '-MD5'"
              v-model="file.MD5"
              :disabled="validatedAndLockedChoices || file.MD5 === 'n/a'"
              class="column2"
            ></b-input>
            <b-select
              v-if="paired"
              :ref="file.name + '-sibling'"
              class="column3"
              placeholder="Select a sibling (if applicable)"
              expanded
            >
              <option
                v-for="siblingContender in siblingContenderNames(file)"
                :key="siblingContender"
                :value="siblingContender"
                class="select-fixed-width"
                :disabled="validatedAndLockedChoices"
              >
                {{ truncateName(siblingContender) }}
              </option>
            </b-select>
          </div>
        </div>

        <div>
          <b-button type="button" @click="toggleLock">{{
            validatedAndLockedChoices
              ? "Unlock choices"
              : "Validate and lock choices"
          }}</b-button>
          <div v-if="!!error" class="error">
            {{ error }}
          </div>
        </div>
      </div>
      <div
        v-if="fetchFilesError == 'Error: No files found in target directory'"
        class="error"
      >
        {{ fetchFilesError }}. Please check target directory, or contact web
        admin.
      </div>
      <div v-else-if="!!fetchFilesError" class="error">
        {{ fetchFilesError }}. Please try again later or contact web admin.
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "SpecifiedLocationFileSelector",
  props: {
    onValidationChangeStatus: { type: Function, required: true },
    paired: { type: Boolean, required: false },
  },
  data() {
    return {
      firstDeclaration: false,
      secondDeclaration: false,
      thirdDeclaration: false,
      fourthDeclaration: false,
      loadingFindDirectory: false,
      directoryFiles: [],
      targetDirectoryName: "cheese",
      validatedAndLockedChoices: false,
      error: "",
      fetchFilesError: false,
    };
  },
  computed: {
    allDeclared() {
      return this.firstDeclaration && this.secondDeclaration;
    },
    findDirectoryDisabled() {
      return (
        !this.targetDirectoryName ||
        // !/^[A-Za-z0-9]+$/.test(this.targetDirectoryName)
        this.paired === null
      );
    },
  },
  methods: {
    truncateName(name) {
      const totalLength = name.length;
      if (12 + 12 + 3 < totalLength) {
        const beginning = name.substring(0, 12);
        const end = name.substring(totalLength - 12, totalLength);
        return `${beginning}...${end}`;
      } else {
        return name;
      }
    },
    toggleLock() {
      this.error = "";
      if (this.validatedAndLockedChoices) {
        this.onValidationChangeStatus(false);
        this.validatedAndLockedChoices = false;
      } else {
        var validityCheckOutcome = this.validateFileInput();
        if (typeof validityCheckOutcome === "string") {
          // error
          this.error = validityCheckOutcome;
        } else {
          this.onValidationChangeStatus({
            relativePath: this.targetDirectoryName,
            files: this.directoryFiles,
          });
          this.validatedAndLockedChoices = true;
        }
      }
    },
    validateFileInput() {
      // assign MD5 and siblings

      var copyOfDirectoryFiles = this.directoryFiles.slice();

      let MD5Error = "";
      // RESET
      this.directoryFiles.forEach((f /*, index*/) => {
        const MD5ToUse = this.isMD5TypeFile(f.name) ? "n/a" : "";
        //: "7C8777D0D59F1116405B685C6B70100" + index; // If you want to temp test

        f.MD5 = MD5ToUse;
      });

      copyOfDirectoryFiles.forEach((file) => {
        if (MD5Error) {
          return;
        }
        const refName = file.name + "-MD5";
        const MD5String = this.$refs[refName][0].value;
        // TODO validate that MD5String is alphanumeric

        if (!MD5String) {
          MD5Error = "Error: at least one of your MD5 checksums is empty.";
        } else if (MD5String.length !== 32 && MD5String !== "n/a") {
          MD5Error =
            "Error: at least one of your MD5 checksums is the wrong length of string. An MD5 should be 32 characters in length.";
        } else {
          this.directoryFiles.find(
            (obj) => obj.name === file.name
          ).MD5 = MD5String;
        }
      });
      if (MD5Error) {
        return MD5Error;
      }

      const allTruthyMD5s = this.directoryFiles
        .map((df) => df.MD5)
        .filter((md5Val) => md5Val !== "n/a");

      if (allTruthyMD5s.length !== new Set(allTruthyMD5s).size) {
        return "Error: at least one of your MD5 checksums is duplicated.";
      }

      // are all sibling selections valid?
      // are sibling choices unique?
      // does each sibling choice have a correspondance?

      // RESET
      let siblingError = "";
      this.directoryFiles.forEach((f) => {
        f.sibling = "";
      });

      if (this.paired) {
        copyOfDirectoryFiles.forEach((file) => {
          if (siblingError) {
            return;
          }
          const siblingRefName = file.name + "-sibling";
          let siblingString = this.$refs[siblingRefName][0].selected;
          if (siblingString === "None") {
            siblingString = "";
          }

          const otherTruthySiblings = this.directoryFiles
            .map((df) => df.sibling)
            .filter((s) => !!s);

          if (otherTruthySiblings.includes(siblingString)) {
            siblingError =
              "Error: at least one of your siblings is assigned more than once.";
          } else if (otherTruthySiblings.includes(file.name)) {
            // check for vice-versa arrangement

            const reciprocal = this.directoryFiles.find(
              (df) => df.sibling === file.name
            ).name;

            //console.log("expecting:", reciprocal, "getting:", siblingString);

            if (reciprocal !== siblingString) {
              siblingError =
                "Error: at least one of your siblings do not appear to reciprocate.";
            }
          }
          if (!siblingError) {
            this.directoryFiles.find(
              (obj) => obj.name === file.name
            ).sibling = siblingString;
          }
        });
        if (siblingError) {
          return siblingError;
        }

        const allTruthySiblings = this.directoryFiles
          .map((df) => df.sibling)
          .filter((s) => !!s);

        if (allTruthySiblings.length !== new Set(allTruthySiblings).size) {
          return "Error: at least one of your siblings is duplicated.";
        }

        const numberOfTruthySiblings = allTruthySiblings.length;
        if (numberOfTruthySiblings < 2) {
          return "Error: you do not have at least one pair of reads assigned as siblings.";
        }
        const evenNumberOfTruthySiblings = numberOfTruthySiblings % 2 == 0;
        if (!evenNumberOfTruthySiblings) {
          return "Error: you do not have an even positive number of paired reads assigned as siblings.";
        }
      }

      return true;
    },
    siblingContenderNames(file) {
      const filterArray = this.directoryFiles
        .map((df) => df.name)
        .filter((fn) => fn !== file.name);

      const resultArray = ["None"].concat(filterArray);
      return resultArray;
    },
    isMD5TypeFile(filename) {
      const parts = filename.split(".");
      const finalPartOfExtension = parts[parts.length - 1];
      const toCheck = finalPartOfExtension.toLowerCase();
      return toCheck === "md5";
    },
    async getDirectoryFiles() {
      this.directoryFiles = [];
      this.fetchFilesError = "";
      this.loadingFindDirectory = true;

      // console.log("this.route", this.$route.query.sample);

      try {
        const res = await this.$axios.get("/directory-files", {
          params: { targetDirectoryName: this.targetDirectoryName },
        });

        if (res.data.error) {
          throw new Error(res.data.error);
        }

        const filesResults = JSON.parse(JSON.stringify(res.data.filesResults));
        const resultObj = filesResults.map((filename /*, index*/) => {
          const MD5ToUse = this.isMD5TypeFile(filename) ? "n/a" : "";
          //: "7C8777D0D59F1116405B685C6B70100" + index; // TEMP if you are testing

          return {
            MD5: MD5ToUse,
            name: filename,
            sibling: "",
          };
        });

        this.directoryFiles = resultObj;
      } catch (e) {
        console.error(e);
        this.fetchFilesError = e;
      } finally {
        this.loadingFindDirectory = false;
      }
    },
  },
};
</script>

<style scoped>
.wrapper {
  margin-bottom: 2rem;
}
.padding {
  margin: 0.5rem 0;
}
.nb-padding {
  margin-bottom: 1rem;
}
.wider-input {
  min-width: 350px;
}
.row {
  padding: 0.5rem;
  width: 100%;
  display: flex;
  justify-content: space-between;
}
.row:first-child {
  font-weight: 700;
}
.column1 {
  width: 100px;
  width: 30vw;
}
.column2 {
  width: 30vw;
  width: 32rem;
  padding: 0 20px;
}
.column3 {
  width: 250px;
  width: 30vw;
  display: flex;
  justify-content: flex-end;
}
.column3heading {
  width: 250px;
  width: 30vw;
  display: flex;
  justify-content: flex-start;
}
.select-fixed-width {
  min-width: 30vw;
}
.error {
  margin-top: 10px;
  color: red;
}
.info-list {
  padding-top: 10px;
}
.info-list > li {
  padding: 5px 0;
}
.verticalCenter {
  display: flex;
  height: 100%;
  align-items: center;
}
.pairedInfo {
  padding-bottom: 20px;
}
</style>
