<template>
  <div>
    <div class="wrapper">
      <FileSelectorInfo />

      <b-checkbox v-model="firstDeclaration" class="padding">
        *I declare that I have read the above and understand how to use this
        manner of upload. I know there is a guide on this site to help me, and
        that if I am uncertain of anything I can contact the TSL Bioinformatics
        team for more assistance. I also know that once I try to find a target
        directory path on the HPC below, then I cannot change the library type
        for the Run I am trying to submit.
      </b-checkbox>
      <b-checkbox v-model="secondDeclaration" class="padding">
        *I declare that my storing of data in
        <code>/tsl/data/tempWebUploadToSequences</code> is only temporary, that
        I have no intention on working on my files whilst in this location, and
        that inactivity with this data for >1 month may lead to it being removed
        without warning, and that I have already backed up this data in another
        location before proceeding with this method of upload as an appropriate
        backup.
      </b-checkbox>
    </div>
    <div v-if="!allDeclared">(Please declare the above.)</div>

    <div v-else>
      <b-field label="Target directory path">
        <div class="verticalCenter">
          <span>/tsl/data/tempWebUploadToSequences/</span>
        </div>
        <b-input v-model="targetDirectoryName" class="wider-input"></b-input>
        <b-button
          type="button"
          :loading="loadingFindDirectory"
          :disabled="findDirectoryDisabled"
          @click="findDirectoryClick"
          >Find directory</b-button
        >
      </b-field>
      <div>
        <i>
          Enter a specific subdirectory of
          '/tsl/data/tempWebUploadToSequences/'. For example, to access
          '/tsl/data/tempWebUploadToSequences/deeks/great-project/sample3/run4/',
          please enter 'deeks/great-project/sample3/run4'. If an error occurs,
          please check the target directory on the HPC, or try renaming its path
          to something more simple.
        </i>
      </div>
      <div v-if="paired === null" class="error">
        <i>Please specify a library type.</i>
      </div>

      <div v-if="directoryFiles.length" class="wrapper">
        <div>
          <div v-if="paired && !indexed" class="pairedInfo">
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
          <div v-if="paired && indexed" class="">
            <div><b>A note on paired indexed reads:</b></div>
            <p class="info-text">
              You have selected a indexed paired reads library type. You must,
              using the whole 'Sibling' column, select a positive even number of
              siblings that correspond with each other. For example, select
              <code>myExampleReadFile.r2.fq.gz</code> as the 'sibling' for
              <code>myExampleReadFile.r1.fq.gz</code>, and
              <code>myExampleReadFile.r1.fq.gz</code> as the 'sibling' for
              <code>myExampleReadFile.r2.fq.gz</code>, to create 2 siblings. Do
              this for all paired reads files in the target directory - i.e., at
              least 2. Checksum (.md5 or .txt) files are excluded.
            </p>
            <p class="info-text">
              You must then also mark the files as indexed in the 'Index'
              column. A file cannot both have a sibling and be marked as an
              index.
            </p>
          </div>
          <div class="pairedInfo">
            An MD5 checksum is required for each file. It has 32 characters, for
            example: <code>a371492f16c0940507435909603efe88</code>
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
            <div v-if="indexed" class="column4heading">Index</div>
          </div>

          <div
            v-for="(file, index) in directoryFiles"
            :key="file.name"
            class="row"
          >
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

            <div v-if="indexed" class="column4">
              <b-checkbox
                v-if="!isChecksumFile(file.name)"
                :ref="file.name + '-indexed'"
                v-model="file.indexed"
                :disabled="validatedAndLockedChoices"
              ></b-checkbox>
              <span v-else></span>
            </div>
          </div>
        </div>

        <!-- Display all detailed errors here -->
        <div
          v-if="validationErrors.length > 0"
          class="validation-errors-container"
        >
          <p class="error-summary">
            Validation failed with {{ validationErrors.length }} errors. Please
            review the detailed messages below:
          </p>
          <ul class="detailed-errors-list">
            <li v-for="(err, i) in validationErrors" :key="i">
              {{ err }}
            </li>
          </ul>
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
            ✓ Your choices have been validated successfully
          </span>
          <!-- This 'error' variable is now less critical as detailed errors are listed -->
          <!-- It could potentially be used for a generic error message if something else goes wrong -->
          <!-- <div v-if="error" class="error">{{ error }}</div> -->
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
import FileSelectorInfo from "./FileSelectorInfo";

const targetMaxChunkLength = 18;

export default {
  name: "SpecifiedLocationFileSelector",
  components: {
    FileSelectorInfo,
  },
  props: {
    onValidationChangeStatus: { type: Function, required: true },
    paired: { type: Boolean, required: false },
    indexed: { type: Boolean, required: false },
    lockLibraryType: { type: Function, required: true },
  },
  data() {
    return {
      // TEST ZONE (Remove these once you're done testing)
      firstDeclaration: true,
      secondDeclaration: true,
      targetDirectoryName: "cheese",
      // END TEST ZONE

      loadingFindDirectory: false,
      directoryFiles: [],
      validatedAndLockedChoices: false,
      // Renamed 'error' to store a generic error, and we'll use validationErrors array
      genericError: "",
      fetchFilesError: false,
      // Array to hold the detailed validation error messages
      validationErrors: [],
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
      // Clear previous errors first
      this.genericError = "";
      this.validationErrors = []; // Clear detailed errors

      if (this.validatedAndLockedChoices) {
        // If unlocking, reset status and clear any previous validated data
        this.onValidationChangeStatus(false); // Assuming this clears state on the parent
        this.validatedAndLockedChoices = false;
        console.log("Choices unlocked.");
      } else {
        // When validating and locking
        const validationResult = this.validateFileInput(); // This now returns an array or true

        if (validationResult === true) {
          // Validation passed! Prepare the payload for the parent component.
          const payload = {
            relativePath: this.targetDirectoryName,
            files: this.directoryFiles.map((file) => {
              const processedFile = {
                name: file.name,
                // Only include MD5, sibling, and indexed for non-checksum files
                ...(!this.isChecksumFile(file.name)
                  ? {
                      MD5: file.MD5,
                      sibling: file.sibling,
                      indexed: file.indexed,
                    }
                  : {}),
              };
              // Clean up null or empty values
              Object.keys(processedFile).forEach((key) => {
                if (processedFile[key] === null || processedFile[key] === "") {
                  delete processedFile[key];
                }
              });
              return processedFile;
            }),
          };

          // Pass the structured payload up
          this.onValidationChangeStatus(payload);
          this.validatedAndLockedChoices = true;
          console.log("Choices validated and locked. Payload sent.");
        } else if (Array.isArray(validationResult)) {
          // Validation failed, and validateFileInput returned an array of errors.
          this.validationErrors = validationResult; // Assign the detailed error messages
          this.genericError = `Validation failed with ${validationResult.length} errors. Please review the detailed messages below.`;
          console.error("Validation failed:", validationResult);
        } else {
          // Fallback for unexpected return types from validateFileInput
          this.genericError = "An unknown validation error occurred.";
          console.error(
            "Unexpected return from validateFileInput:",
            validationResult
          );
        }
      }
    },

    validateFileInput() {
      // --- Logging Setup ---
      const logData = {
        totalFiles: 0,
        needAtLeastOneIndexedFile: false,
        indexedFilesSelected: 0,
        numberOfPairedReadsFiles: 0,
        isNumberOfPairedReadsFilesEvenWholeNumber: false,
        passesTest: false,
      };
      // --- End Logging Setup ---

      const filesData = JSON.parse(JSON.stringify(this.directoryFiles));
      let detailedErrors = [];

      // --- Initialization and Basic File Checks ---
      filesData.forEach((file) => {
        if (this.isChecksumFile(file.name)) return;
        if (file.MD5 === undefined) file.MD5 = "";
        if (file.sibling === undefined) file.sibling = "";
        if (file.indexed === undefined) file.indexed = false;
      });

      // --- MD5 Validation ---
      let hasMD5Errors = false;
      const md5Values = new Set();

      filesData.forEach((file) => {
        if (this.isChecksumFile(file.name)) return;

        logData.totalFiles++; // Count non-checksum files

        const refName = file.name + "-MD5";
        const md5Input = this.$refs[refName]?.[0];

        if (!md5Input) {
          const errorMsg = `[MD5 Error] Input reference for MD5 checksum not found for file: "${file.name}". This may indicate a component rendering issue.`;
          detailedErrors.push(errorMsg);
          hasMD5Errors = true;
          return;
        }

        const MD5String = md5Input.value.trim();

        if (!MD5String) {
          const errorMsg = `[MD5 Error] MD5 checksum is empty for file: "${file.name}". Please provide the MD5 checksum for this file.`;
          detailedErrors.push(errorMsg);
          hasMD5Errors = true;
        } else if (MD5String.length !== 32) {
          const errorMsg = `[MD5 Error] Invalid MD5 checksum length for file "${file.name}". Expected 32 characters, but received ${MD5String.length}. Please correct the checksum.`;
          detailedErrors.push(errorMsg);
          hasMD5Errors = true;
        } else if (md5Values.has(MD5String)) {
          const errorMsg = `[MD5 Error] Duplicate MD5 checksum found. The checksum "${MD5String}" is used for multiple files. Each MD5 checksum must be unique.`;
          detailedErrors.push(errorMsg);
          hasMD5Errors = true;
        } else {
          md5Values.add(MD5String);
          file.MD5 = MD5String;
        }
      });

      // --- Sibling and Index Validation ---
      if (this.paired) {
        let siblingValidationErrors = [];
        let isIndexedLibrary = this.indexed;

        if (isIndexedLibrary) {
          logData.needAtLeastOneIndexedFile = true;
          filesData.forEach((file) => {
            if (!this.isChecksumFile(file.name) && file.indexed) {
              logData.indexedFilesSelected++;
            }
          });
        }

        const performSiblingChecks = (filesToCheck, isIndexedLibrary) => {
          const siblingMap = {};
          const assignedSiblings = new Set();
          let currentErrors = [];

          for (const file of filesToCheck) {
            if (this.isChecksumFile(file.name)) continue;

            const siblingRefName = file.name + "-sibling";
            const siblingSelect = this.$refs[siblingRefName]?.[0];
            let siblingSelection = siblingSelect
              ? siblingSelect.selected
              : file.sibling || "None";

            let isIndexedFile = false;
            if (isIndexedLibrary) {
              const indexedCheckbox = this.$refs[file.name + "-indexed"]?.[0];
              isIndexedFile = indexedCheckbox
                ? indexedCheckbox.newValue
                : file.indexed;
            }

            file.sibling = siblingSelection === "None" ? "" : siblingSelection;
            file.indexed = isIndexedFile;

            if (isIndexedLibrary && file.sibling && file.indexed) {
              const errorMsg = `[Conflict Error] File "${file.name}" cannot have both a sibling "${file.sibling}" assigned and be marked as 'indexed'. Please resolve this conflict.`;
              currentErrors.push(errorMsg);
              continue;
            }

            if (file.sibling) {
              if (assignedSiblings.has(file.sibling)) {
                const errorMsg = `[Sibling Error] The file "${file.sibling}" has been assigned as a sibling to multiple files. Each sibling assignment must be unique.`;
                currentErrors.push(errorMsg);
              } else {
                assignedSiblings.add(file.sibling);
              }
              siblingMap[file.name] = file.sibling;
            }
          }

          if (!currentErrors.some((e) => e.startsWith("[Conflict Error]"))) {
            for (const file of filesToCheck) {
              if (this.isChecksumFile(file.name)) continue;

              const assignedSibling = file.sibling;
              if (
                assignedSibling &&
                siblingMap[assignedSibling] !== file.name
              ) {
                const errorMsg = `[Sibling Error] Reciprocation failed for "${file.name}". It is paired with "${assignedSibling}", but "${assignedSibling}" is not paired back with "${file.name}". Please ensure all sibling pairs are mutual.`;
                currentErrors.push(errorMsg);
              }
            }

            let filesForPairingChecks;
            if (isIndexedLibrary) {
              filesForPairingChecks = filesToCheck.filter(
                (f) => !this.isChecksumFile(f.name) && !f.indexed
              );
            } else {
              filesForPairingChecks = filesToCheck.filter(
                (f) => !this.isChecksumFile(f.name)
              );
            }

            const siblingsAssigned = filesForPairingChecks
              .map((df) => df.sibling)
              .filter((s) => !!s);
            const numRelevantFiles = filesForPairingChecks.length;
            const numSiblingsAssigned = siblingsAssigned.length;

            logData.numberOfPairedReadsFiles = numRelevantFiles;
            logData.isNumberOfPairedReadsFilesEvenWholeNumber =
              numSiblingsAssigned % 2 === 0;

            if (isIndexedLibrary) {
              // --- NEW VALIDATION: If library is indexed, MUST have at least one indexed file selected ---
              if (logData.indexedFilesSelected === 0) {
                const errorMsg = `[Index Error] Library type requires at least one indexed file. No indexed files have been selected.`;
                currentErrors.push(errorMsg);
              }
              // Then, proceed with pairing checks among the non-indexed files
              else if (numRelevantFiles < 2) {
                const errorMsg = `[Sibling Error] You need at least two non-indexed files to form a pair. Currently, there are only ${numRelevantFiles} non-indexed files available.`;
                currentErrors.push(errorMsg);
              } else {
                if (numSiblingsAssigned === 0) {
                  const errorMsg = `[Sibling Error] No siblings have been assigned. For paired reads that are not indexed, you must assign siblings to at least one pair among the non-indexed files.`;
                  currentErrors.push(errorMsg);
                } else if (numSiblingsAssigned % 2 !== 0) {
                  const errorMsg = `[Sibling Error] An odd number of siblings (${numSiblingsAssigned}) have been assigned to non-indexed files. Paired reads must be assigned in even pairs.`;
                  currentErrors.push(errorMsg);
                } else if (numSiblingsAssigned < 2) {
                  const errorMsg = `[Sibling Error] Only one sibling has been assigned (${numSiblingsAssigned}). You need at least one *pair* (i.e., 2 assigned siblings) for paired reads.`;
                  currentErrors.push(errorMsg);
                }
              }
            } else {
              // Case: Paired library, but NOT indexed
              if (numRelevantFiles < 2) {
                const errorMsg = `[Sibling Error] You need at least two paired read files to form a pair. Currently, there are only ${numRelevantFiles} paired read files available.`;
                currentErrors.push(errorMsg);
              } else if (numSiblingsAssigned === 0) {
                const errorMsg = `[Sibling Error] No siblings have been assigned. For paired reads, you must assign siblings to at least one pair.`;
                currentErrors.push(errorMsg);
              } else if (numSiblingsAssigned % 2 !== 0) {
                const errorMsg = `[Sibling Error] An odd number of siblings (${numSiblingsAssigned}) have been assigned. Paired reads must be assigned in even pairs.`;
                currentErrors.push(errorMsg);
              } else if (numSiblingsAssigned < 2) {
                const errorMsg = `[Sibling Error] Only one sibling has been assigned (${numSiblingsAssigned}). You need at least one *pair* (i.e., 2 assigned siblings) for paired reads.`;
                currentErrors.push(errorMsg);
              }
            }
          }
          return currentErrors;
        };

        if (this.indexed) {
          siblingValidationErrors = performSiblingChecks(filesData, true);
        } else {
          siblingValidationErrors = performSiblingChecks(filesData, false);
        }
        detailedErrors.push(...siblingValidationErrors);
      } else if (!this.paired) {
        logData.totalFiles = filesData.filter(
          (f) => !this.isChecksumFile(f.name)
        ).length;
        logData.needAtLeastOneIndexedFile = false;
        logData.indexedFilesSelected = 0;
        logData.numberOfPairedReadsFiles = 0;
        logData.isNumberOfPairedReadsFilesEvenWholeNumber = false;
      }

      // --- Final Result ---
      logData.passesTest = detailedErrors.length === 0 && !hasMD5Errors;
      console.log("--- Validation Log ---");
      console.log(JSON.stringify(logData, null, 2));
      console.log("----------------------");

      if (detailedErrors.length > 0) {
        return detailedErrors;
      } else {
        this.directoryFiles = filesData;
        return true;
      }
    },

    async findDirectoryClick() {
      this.lockLibraryType();
      this.getDirectoryFiles();
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
          indexed: false,
        }));
        this.directoryFiles = resultObj;

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
  align-items: center; /* Vertically align items in the row */
}
.row:first-child {
  font-weight: 700;
}
.column1 {
  width: 20vw;
  padding-right: 0.5rem; /* Add some spacing */
}
.column2 {
  width: 32rem;
  padding: 0 0.5rem; /* Adjust padding */
}
.column3,
.column3heading {
  width: 30vw;
  display: flex;
  justify-content: flex-end;
  padding-left: 0.5rem; /* Add some spacing */
}
.column3heading {
  justify-content: flex-start;
}
.column4 {
  width: 10vw; /* Adjust as needed */
  display: flex;
  justify-content: center;
  align-items: center;
  padding-left: 0.5rem; /* Add some spacing */
}
.column4 > * {
  /* padding-left: 1em; */ /* Removed to allow centering */
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
  flex-wrap: wrap; /* Allow wrapping on smaller screens */
}
.validation-message {
  color: green;
  margin-left: 1rem;
  font-weight: bold;
  margin-bottom: 0.5rem; /* Add some space below if it wraps */
}
.validate-lock-btn {
  margin-right: 1rem;
  margin-bottom: 0.5rem; /* Add some space below if it wraps */
}

/* New styles for displaying detailed errors */
.validation-errors-container {
  margin-top: 1.5rem;
  padding: 1rem;
  border: 1px solid #e06c75; /* Reddish border for errors */
  background-color: #f5f5f5; /* Light background */
  border-radius: 5px;
}
.error-summary {
  color: #e06c75; /* Red text for summary */
  font-weight: bold;
  margin-bottom: 0.75rem;
}
.detailed-errors-list {
  list-style-type: disc;
  margin-left: 1.5rem;
  color: #333; /* Darker text for individual errors */
}
.detailed-errors-list li {
  margin-bottom: 0.5rem;
  font-size: 0.9em; /* Slightly smaller font for readability */
}

.info-text {
  margin-bottom: 0.5rem;
  margin-top: 0.5rem;
}
</style>
