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
            here. Remember we have a step-by-step guide to helping you with this
            form <a href="/upload-instructions.html">here</a>.
          </li>
          <li>
            Before using this method, you should create a parent directory in
            <code>/tsl/data/tempWebUploadToSequences</code> that contains a
            subdirectory for each run submission you wish to make over a short
            period of time. To submit 2 runs for a sample for instance, you
            could create a <code>deeks-sample-3945</code> directory, and then
            create a <code>run1</code> and <code>run2</code> subdirectory within
            that. This is to help you keep track of your data and upload it
            efficiently, and to help us keep track of it too.
          </li>
          <li>
            Use the below searchbox to find the specific subdirectory that
            pertains to this run submission. This must be the exact path to the
            specific directory that ONLY contains the raw read files for this
            particular run (plus their associated checksum files, optionally).
            You cannot have any other files in there - for example, raw read
            files for other runs you want to submit, or explanatory .pdf files
            for this run (you must use 'Additional Files', see below).
          </li>
          <li>
            You may upload .md5 files in addition to raw reads files here, but
            you must also specify the string MD5 value for each file before
            proceeding in the relevant part of the form (see below).
          </li>
          <li>
            <code>/tsl/data/tempWebUploadToSequences</code> is only a temporary
            storage space on the HPC for use with this web form. Please be
            considerate of others when creating directories. You should remove
            data from it when you are finished submitting. Submitted files will
            be moved to their destination folder, leaving an empty directory
            that must be tidied by YOU shortly afterwards. Both empty and
            untouched (>3 weeks) directories may be removed automatically from
            this location unless you otherwise
            <a href="mailto:george.deeks@tsl.ac.uk">request us</a>.
          </li>
          <li>
            This field is not for uploading associated additional files;
            instead, see below.
          </li>
        </ul>
      </div>

      <b-checkbox v-model="firstDeclaration" class="padding">
        *I declare that I have read the above and understand how to use this
        manner of upload. I know there is a guide on this site to help me, and
        that if I am uncertain of anything I can contact the TSL Bioinformatics
        team for more assistance.
      </b-checkbox>
      <b-checkbox v-model="secondDeclaration" class="padding">
        *I declare that my storing of data in
        <code>/tsl/data/tempWebUploadToSequences</code> is only temporary, and
        that inactivity with this data will lead to it being removed without
        warning, and that I have already backed up this data in another location
        before proceeding with this method of upload as my files may be deleted.
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
        <i>Please specify a library type.</i>
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
            least 2. Checksum (.md5 or .txt) files are excluded.
          </div>
        </div>
        <div>
          <div class="row">
            <div class="column1">
              File name{{
                anyTruncatedFileNames ? " (hover over for untruncated)" : ""
              }}
            </div>
            <div class="column2">MD5 checksum</div>
            <div v-if="paired" class="column3heading">
              Sibling{{
                anyTruncatedFileNames ? " (hover over for untruncated)" : ""
              }}
            </div>
          </div>

          <div v-for="file in directoryFiles" :key="file.name" class="row">
            <div class="column1">
              <code
                v-if="nameMustTruncate(file.name)"
                v-tooltip="{
                  content: file.name,
                  trigger: 'hover',
                  placement: 'top',
                }"
                >{{ truncateName(file.name) }}</code
              >
              <code v-else>{{ truncateName(file.name) }}</code>
            </div>

            <div
              class="column2"
              :style="{ minWidth: '32em', maxWidth: '32em' }"
            >
              <b-input
                v-if="!isChecksumFile(file.name)"
                :ref="file.name + '-MD5'"
                v-model="file.MD5"
                :disabled="validatedAndLockedChoices"
              ></b-input>
              <span v-else>{{ file.MD5 }}</span>
            </div>

            <div v-if="paired" class="column3">
              <b-select
                v-if="!isChecksumFile(file.name)"
                :ref="file.name + '-sibling'"
                class="select-fixed-width"
                placeholder="Select a sibling (if applicable)"
                :disabled="validatedAndLockedChoices"
                expanded
              >
                <option
                  v-for="siblingContender in siblingContenderNames(file)"
                  :key="siblingContender"
                  :value="siblingContender"
                  :title="
                    nameMustTruncate(siblingContender) && siblingContender
                  "
                >
                  {{ truncateName(siblingContender) }}
                </option>
              </b-select>
              <span v-else></span>
            </div>
          </div>
        </div>

        <div class="action-row">
          <b-button type="button" @click="toggleLock" class="validate-lock-btn">
            {{
              validatedAndLockedChoices
                ? "Unlock choices"
                : "Validate and lock choices"
            }}
          </b-button>
          <span v-if="validatedAndLockedChoices" class="validation-message">
            ✓ Your pairs have been validated successfully
          </span>
          <div v-if="error" class="error">
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
      <div v-else-if="fetchFilesError" class="error">
        {{ fetchFilesError }}. Please try again later or contact web admin.
      </div>
    </div>
  </div>
</template>

<script>
const targetMaxChunkLength = 18;

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
      loadingFindDirectory: false,
      directoryFiles: [],
      targetDirectoryName: "",
      validatedAndLockedChoices: false,
      error: "",
      fetchFilesError: false,
    };
  },
  computed: {
    anyTruncatedFileNames() {
      return this.directoryFiles.some((file) =>
        this.nameMustTruncate(file.name)
      );
    },
    allDeclared() {
      return this.firstDeclaration && this.secondDeclaration;
    },
    findDirectoryDisabled() {
      return !this.targetDirectoryName || this.paired === null;
    },
  },
  methods: {
    nameMustTruncate(name) {
      const ellipsisLength = 3;
      const targetMaxLength =
        targetMaxChunkLength + ellipsisLength + targetMaxChunkLength;
      return targetMaxLength < name.length;
    },
    truncateName(name) {
      if (this.nameMustTruncate(name)) {
        const beginning = name.substring(0, targetMaxChunkLength);
        const end = name.substring(name.length - targetMaxChunkLength);
        return `${beginning}...${end}`;
      } else {
        return name;
      }
    },
    isChecksumFile(filename) {
      const parts = filename.split(".");
      const ext = parts[parts.length - 1].toLowerCase();
      return ext === "md5" || ext === "txt";
    },
    siblingContenderNames(file) {
      const filterArray = this.directoryFiles
        .map((df) => df.name)
        .filter((fn) => fn !== file.name && !this.isChecksumFile(fn));
      return ["None"].concat(filterArray);
    },
    toggleLock() {
      this.error = "";
      if (this.validatedAndLockedChoices) {
        this.onValidationChangeStatus(false);
        this.validatedAndLockedChoices = false;
      } else {
        const validityCheckOutcome = this.validateFileInput();
        if (typeof validityCheckOutcome === "string") {
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
      const copyOfDirectoryFiles = this.directoryFiles.slice();
      let MD5Error = "";

      // Reset MD5 for non-checksum files; for checksum files, leave as read.
      this.directoryFiles.forEach((f) => {
        if (!this.isChecksumFile(f.name)) {
          f.MD5 = "";
        }
      });

      copyOfDirectoryFiles.forEach((file) => {
        if (MD5Error) return;
        if (!this.isChecksumFile(file.name)) {
          const refName = file.name + "-MD5";
          const MD5String = this.$refs[refName][0].value;
          if (!MD5String) {
            MD5Error = "Error: at least one of your MD5 checksums is empty.";
          } else if (MD5String.length !== 32) {
            MD5Error =
              "Error: at least one of your MD5 checksums is the wrong length. An MD5 should be 32 characters in length.";
          } else {
            this.directoryFiles.find((obj) => obj.name === file.name).MD5 =
              MD5String;
          }
        }
      });
      if (MD5Error) return MD5Error;

      // Ensure each MD5 string (non-checksum files) is unique
      const nonChecksumMD5s = this.directoryFiles
        .filter((file) => !this.isChecksumFile(file.name))
        .map((file) => file.MD5);
      if (nonChecksumMD5s.length !== new Set(nonChecksumMD5s).size) {
        return "Error: Each MD5 string must be unique";
      }

      // Sibling validation for paired files (only for non-checksum files)
      let siblingError = "";
      this.directoryFiles.forEach((f) => {
        f.sibling = "";
      });

      if (this.paired) {
        copyOfDirectoryFiles.forEach((file) => {
          if (this.isChecksumFile(file.name)) return;
          if (siblingError) return;
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
            const reciprocal = this.directoryFiles.find(
              (df) => df.sibling === file.name
            ).name;
            if (reciprocal !== siblingString) {
              siblingError =
                "Error: at least one of your siblings do not appear to reciprocate.";
            }
          }
          if (!siblingError) {
            this.directoryFiles.find((obj) => obj.name === file.name).sibling =
              siblingString;
          }
        });
        if (siblingError) return siblingError;

        const allTruthySiblings = this.directoryFiles
          .map((df) => df.sibling)
          .filter((s) => !!s);
        if (allTruthySiblings.length !== new Set(allTruthySiblings).size) {
          return "Error: at least one of your siblings is duplicated.";
        }
        if (allTruthySiblings.length < 2) {
          return "Error: you do not have at least one pair of reads assigned as siblings.";
        }
        if (allTruthySiblings.length % 2 !== 0) {
          return "Error: you do not have an even positive number of paired reads assigned as siblings.";
        }
      }
      return true;
    },
    async getDirectoryFiles() {
      this.directoryFiles = [];
      this.fetchFilesError = "";
      this.loadingFindDirectory = true;
      try {
        const res = await this.$axios.get("/directory-files", {
          params: { targetDirectoryName: this.targetDirectoryName },
        });
        if (res.data.error) throw new Error(res.data.error);
        const filesResults = JSON.parse(JSON.stringify(res.data.filesResults));
        const resultObj = filesResults.map((filename) => ({
          MD5: "",
          name: filename,
          sibling: "",
        }));
        this.directoryFiles = resultObj;

        // For each .md5 or .txt file, attempt to read file contents and store first 32 characters.
        for (const file of this.directoryFiles) {
          if (this.isChecksumFile(file.name)) {
            try {
              const fileRes = await this.$axios.get("/read-file", {
                params: {
                  targetDirectoryName: this.targetDirectoryName,
                  filename: file.name,
                },
                responseType: "text",
              });
              if (fileRes.data) {
                file.MD5 = fileRes.data.substring(0, 32);
              }
            } catch (err) {
              console.error(`Failed to read ${file.name}:`, err);
            }
          }
        }
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
  width: 30vw;
}
.column2 {
  width: 32rem;
  padding: 0 20px;
}
.column3,
.column3heading {
  width: 30vw;
  display: flex;
  justify-content: flex-end;
}
.column3heading {
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
.action-row {
  margin-top: 1rem;
  display: flex;
  align-items: center;
}
.validation-message {
  color: green;
  margin-left: 1rem;
  font-weight: bold;
}
.validate-lock-btn {
  margin-right: 1rem;
}
</style>
