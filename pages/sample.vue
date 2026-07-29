<template>
  <div class="section">
    <div class="container">
      <div v-if="sample">
        <div class="title-wrapper">
          <div class="title">
            {{
              sample.scientificName ||
              (sample.tplexCsv ? "TPlex Sample" : "Sample")
            }}
            - {{ sample.name }}
          </div>
          <AddAccessionModal
            v-if="!!showAddAcession"
            type="sample"
            :type-id="sample._id"
            :initial-accessions="sample.accessions"
          />
        </div>

        <div v-if="!sample.tplexCsv" class="buttons-wrapper">
          <b-button
            type="is-secondary"
            icon-left="content-copy"
            @click="cloneSample"
          >
            Clone data for new Sample
          </b-button>
        </div>

        <p class="subtitle">
          <nuxt-link
            :to="{ name: 'user', query: { username: sample.owner } }"
            class="has-text-text"
          >
            <b-icon
              icon="account-outline"
              size="is-small"
              class="has-text-grey"
            ></b-icon>
            {{ sample.owner }}
          </nuxt-link>
          <br />
          <b-icon
            icon="account-multiple-outline"
            size="is-small"
            class="has-text-grey"
          ></b-icon>
          {{ sample.group.name }}
          <br />
          <nuxt-link
            :to="{ name: 'project', query: { id: sample.project._id } }"
            class="has-text-text"
          >
            <b-icon
              icon="folder-text-outline"
              size="is-small"
              class="has-text-grey"
            ></b-icon>
            {{ sample.project.name }}
          </nuxt-link>
          <br />
          <b-icon icon="home-lock" size="is-small" class="has-text-grey" />
          Sample accession numbers:{{
            sample.accessions && sample.accessions.length
              ? ` ${sample.accessions.join(", ")}`
              : ` unknown`
          }}
        </p>

        <div v-if="!sample.tplexCsv">
          <div class="columns">
            <div class="column">
              <b-field label="Scientific Name">
                <p>{{ sample.scientificName }}</p>
              </b-field>
            </div>
            <div class="column">
              <b-field label="Common Name">
                <p>{{ sample.commonName }}</p>
              </b-field>
            </div>
            <div class="column">
              <b-field label="NCBI Taxonomy ID">
                <p>{{ sample.ncbi }}</p>
              </b-field>
            </div>
          </div>

          <b-field label="Conditions">
            <p>{{ sample.conditions }}</p>
          </b-field>
        </div>
        <div v-else class="tplex-csv-section box">
          <h2 class="title is-5">Tplex Data</h2>
          <b-field label="Tplex CSV Content Preview">
            <div class="csv-table-container">
              <table
                class="table is-bordered is-striped is-narrow is-hoverable is-fullwidth"
              >
                <thead>
                  <tr>
                    <th
                      v-for="(header, index) in tplexCsvHeaders"
                      :key="`header-${index}`"
                    >
                      {{ header }}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(row, rowIndex) in tplexCsvRows"
                    :key="`row-${rowIndex}`"
                  >
                    <td
                      v-for="(cell, cellIndex) in row"
                      :key="`cell-${rowIndex}-${cellIndex}`"
                    >
                      {{ cell }}
                    </td>
                  </tr>
                </tbody>
              </table>
              <p v-if="hasMoreCsvRows" class="has-text-grey is-size-7 pt-2">
                ... (truncated rows)
              </p>
              <p v-if="hasMoreCsvColumns" class="has-text-grey is-size-7 pt-2">
                ... (truncated columns)
              </p>
            </div>
          </b-field>
          <div class="has-text-right">
            <b-button
              type="is-primary"
              icon-left="download"
              @click="downloadTplexCsv"
            >
              Download CSV file
            </b-button>
          </div>
        </div>
        <!-- End new section -->

        <b-field
          v-if="!sample.tplexCsv"
          label="Additional Files"
          class="additional-files-field"
        >
          <AdditionalFileList
            :files="additionalFiles"
            :parent-path="sample.path"
          />
        </b-field>
        <b-field label="File path">
          <p>/tsl/data/reads{{ sample.path }}</p>
        </b-field>
        <hr />
        <p class="title is-4">Runs</p>
        <RunList
          v-if="sample.runs"
          :sample="sample"
          :runs="sample.runs"
          show-new-button="true"
        />
      </div>
    </div>
  </div>
</template>

<script>
import RunList from "../components/runs/RunList.vue";
import AdditionalFileList from "../components/AdditionalFileList.vue";
import AddAccessionModal from "../components/AddAccessionModal.vue";
import Papa from "papaparse"; // Import papaparse
import { isEnaAdmin } from "~/utils/adminUsers";
import { getApiErrorMessage, getApiErrorStatus } from "~/utils/apiError";

export default {
  components: { RunList, AdditionalFileList, AddAccessionModal },
  middleware: ["auth"],
  asyncData({ route, $axios, error }) {
    if (!route.query.id) {
      error({ statusCode: 404, message: "Sample not found" });
    }

    return $axios
      .get("/sample", { params: { id: route.query.id } })
      .then((res) => {
        if (res.status === 200 && res.data.sample) {
          const verifiedAdditionalFileNames =
            res.data.sample.additionalFiles.map((rf) => rf.file.originalName);
          const actualAdditionalFileNames = res.data.actualAdditionalFiles
            ? JSON.parse(JSON.stringify(res.data.actualAdditionalFiles))
            : [];
          const additionalFilesWithVerifiedField =
            actualAdditionalFileNames.map((additionalFileName) => ({
              fileName: additionalFileName,
              verified:
                !!verifiedAdditionalFileNames.includes(additionalFileName),
            }));

          return {
            sample: res.data.sample,
            additionalFiles: additionalFilesWithVerifiedField,
          };
        } else {
          error({ statusCode: 404, message: "Sample not found" });
        }
      })
      .catch((err) => {
        console.error("Failed to load sample:", err);
        // Was a flat 501 "Sample not found" for every cause, including an
        // expired session and an unreachable API.
        error({
          statusCode: getApiErrorStatus(err) || 500,
          message: getApiErrorMessage(err, {
            fallback: "Could not load this sample.",
          }),
        });
      });
  },
  data() {
    return {
      MAX_PREVIEW_ROWS: 20, // Max rows to display in preview table
      MAX_PREVIEW_COLUMNS: 10, // Max columns to display in preview table
    };
  },
  computed: {
    showAddAcession() {
      return isEnaAdmin(this?.$auth?.$state?.user?.username);
    },
    parsedTplexCsv() {
      // Parse TPlex CSV - handle both old (CSV text) and new (JSON array) formats
      if (this.sample && this.sample.tplexCsv) {
        try {
          // Try to parse as JSON first (new format)
          const csvData = JSON.parse(this.sample.tplexCsv);

          if (Array.isArray(csvData) && csvData.length > 0) {
            // New format: JSON array of objects
            const headers = Object.keys(csvData[0]);
            const rows = csvData.map((obj) =>
              headers.map((key) => obj[key] || "")
            );
            return [headers, ...rows];
          }
        } catch (err) {
          // Not JSON, must be old CSV text format - fall through to Papa.parse
        }

        // Old format: CSV text with \r\n line breaks
        try {
          const result = Papa.parse(this.sample.tplexCsv, {
            header: false,
            skipEmptyLines: true,
          });

          if (result.errors.length) {
            console.error("Error parsing TPlex CSV text:", result.errors);
            return [];
          }

          return result.data;
        } catch (err) {
          console.error("Error parsing TPlex CSV:", err);
          return [];
        }
      }
      return [];
    },
    tplexCsvHeaders() {
      if (this.parsedTplexCsv.length > 0) {
        // Get the first row as headers, and slice to MAX_PREVIEW_COLUMNS
        return this.parsedTplexCsv[0].slice(0, this.MAX_PREVIEW_COLUMNS);
      }
      return [];
    },
    tplexCsvRows() {
      if (this.parsedTplexCsv.length > 1) {
        // Get data rows (skip header row), and slice to MAX_PREVIEW_ROWS
        // Also slice each row to MAX_PREVIEW_COLUMNS
        return this.parsedTplexCsv
          .slice(1, this.MAX_PREVIEW_ROWS + 1)
          .map((row) => row.slice(0, this.MAX_PREVIEW_COLUMNS));
      }
      return [];
    },
    hasMoreCsvRows() {
      // Check if there are more rows than MAX_PREVIEW_ROWS (after header)
      return this.parsedTplexCsv.length > this.MAX_PREVIEW_ROWS + 1;
    },
    hasMoreCsvColumns() {
      // Check if the first row (headers) has more columns than MAX_PREVIEW_COLUMNS
      if (this.parsedTplexCsv.length > 0) {
        return this.parsedTplexCsv[0].length > this.MAX_PREVIEW_COLUMNS;
      }
      return false;
    },
  },
  methods: {
    cloneSample() {
      this.$router.push({
        path: "/samples/new",
        query: {
          clonedSampleId: this.sample._id,
          projectId: this.sample.project._id,
        },
      });
    },
    downloadTplexCsv() {
      if (!this.sample || !this.sample.tplexCsv) {
        this.$buefy.toast.open({
          message: "No Tplex CSV data to download.",
          type: "is-warning",
        });
        return;
      }

      try {
        let csvContent;

        // Try to parse as JSON first (new format)
        try {
          const csvData = JSON.parse(this.sample.tplexCsv);

          if (Array.isArray(csvData) && csvData.length > 0) {
            // New format: Convert JSON array to CSV
            csvContent = Papa.unparse(csvData, {
              header: true,
              skipEmptyLines: true,
            });
          } else {
            throw new Error("Invalid JSON format");
          }
        } catch (jsonErr) {
          // Old format: Already CSV text, use as-is
          csvContent = this.sample.tplexCsv;
        }

        const filename = `tplex_${this.sample.safeName || "sample"}.csv`;
        const blob = new Blob([csvContent], {
          type: "text/csv;charset=utf-8;",
        });

        const link = document.createElement("a");
        if (link.download !== undefined) {
          const url = URL.createObjectURL(blob);
          link.setAttribute("href", url);
          link.setAttribute("download", filename);
          link.style.visibility = "hidden";
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);

          this.$buefy.toast.open({
            message: "CSV file downloaded successfully!",
            type: "is-success",
          });
        } else {
          this.$buefy.dialog.alert({
            title: "Download Not Supported",
            message:
              "Your browser does not support automatic downloads. Please copy the content and save it manually.",
            type: "is-danger",
            hasIcon: false,
          });
          window.open(
            "data:text/csv;charset=utf-8," + encodeURIComponent(csvContent)
          );
        }
      } catch (err) {
        console.error("Error generating CSV download:", err);
        this.$buefy.toast.open({
          message: "Failed to generate CSV file. Please contact support.",
          type: "is-danger",
        });
      }
    },
  },
};
</script>
<style>
.title-wrapper {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.buttons-wrapper {
  margin-bottom: 1rem;
}

.tplex-csv-section {
  border: 1px solid #ddd;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  border-radius: 6px;
  background-color: #fcfcfc;
  box-shadow: 0 2px 3px rgba(10, 10, 10, 0.1), 0 0 0 1px rgba(10, 10, 10, 0.1);
}

/* Styles for the CSV table container */
.csv-table-container {
  max-height: 250px; /* Max height for vertical scroll */
  overflow: auto; /* Enable both horizontal and vertical scrollbars */
  position: relative; /* Needed for sticky header */
  border: 1px solid #eee; /* Light border around the scrollable area */
  border-radius: 4px;
}

.csv-table-container table {
  width: 100%;
  min-width: fit-content; /* Allow table to be wider than container */
  border-collapse: collapse;
}

.csv-table-container thead th {
  position: sticky; /* Make headers sticky */
  top: 0;
  background-color: #f5f5f5; /* Light background for sticky header */
  z-index: 10; /* Ensure header is above scrolling content */
  padding: 0.75rem 1rem; /* Adjust padding as needed */
  border-bottom: 2px solid #dbdbdb;
  text-align: left;
}

.csv-table-container tbody tr td {
  padding: 0.5rem 1rem; /* Adjust padding as needed */
  white-space: nowrap; /* Prevent text wrapping in cells by default */
  overflow: hidden; /* Hide overflow */
  text-overflow: ellipsis; /* Add ellipsis for hidden text */
  max-width: 200px; /* Limit cell width to avoid excessively wide columns */
}

.csv-table-container tbody tr:last-child td {
  border-bottom: none; /* Remove bottom border for the last row if desired */
}

.additional-files-field {
  margin-top: 2rem;
}
</style>
