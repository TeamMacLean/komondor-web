<template>
  <div class="section">
    <div class="container">
      <h1 class="title">In-Browser MD5 Checksum Benchmark</h1>
      <h2 class="subtitle">
        Test the performance of MD5 calculation on large files directly in your
        browser.
      </h2>
      <div class="notification is-info is-light">
        <p>
          This is a temporary development page to understand how long it takes
          to calculate MD5 checksums for large FASTQ files before implementing
          the feature in the "New Run" page. Calculations are done entirely on
          your computer; the file is not uploaded.
        </p>
      </div>
      <hr />

      <b-field>
        <b-upload v-model="selectedFile" drag-drop>
          <section class="section">
            <div class="content has-text-centered">
              <p>
                <b-icon icon="upload" size="is-large"></b-icon>
              </p>
              <p v-if="selectedFile">
                Selected file: <strong>{{ selectedFile.name }}</strong>
              </p>
              <p v-else>Drop your file here or click to upload.</p>
            </div>
          </section>
        </b-upload>
      </b-field>

      <b-button
        type="is-primary"
        :disabled="!selectedFile || isProcessing"
        :loading="isProcessing"
        @click="startBenchmark"
      >
        Run Benchmark
      </b-button>

      <hr />

      <div v-if="benchmarkResult" class="box">
        <h3 class="title is-4">Benchmark Results</h3>
        <table class="table is-fullwidth">
          <tbody>
            <tr>
              <th>File Name</th>
              <td>{{ benchmarkResult.fileName }}</td>
            </tr>
            <tr>
              <th>File Size</th>
              <td>{{ benchmarkResult.fileSize }} MB</td>
            </tr>
            <tr>
              <th>Time Taken</th>
              <td>{{ benchmarkResult.time }} seconds</td>
            </tr>
            <tr>
              <th>MD5 Checksum</th>
              <td>
                <code style="word-break: break-all">{{
                  benchmarkResult.md5
                }}</code>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script>
import SparkMD5 from "spark-md5";

export default {
  name: "MD5BenchmarkPage",
  // A development-only tool (the nav link is hidden in production), but the
  // route is reachable by URL, so it is gated like every other page.
  middleware: "auth",
  data() {
    return {
      selectedFile: null,
      isProcessing: false,
      benchmarkResult: null,
    };
  },
  methods: {
    startBenchmark() {
      if (!this.selectedFile) {
        this.$buefy.toast.open({
          message: "Please select a file first.",
          type: "is-warning",
        });
        return;
      }

      this.isProcessing = true;
      this.benchmarkResult = null;

      const reader = new FileReader();
      const startTime = performance.now();

      reader.onload = (e) => {
        try {
          const spark = new SparkMD5.ArrayBuffer();
          spark.append(e.target.result);
          const md5 = spark.end();
          const endTime = performance.now();
          const duration = ((endTime - startTime) / 1000).toFixed(2); // in seconds

          this.benchmarkResult = {
            fileName: this.selectedFile.name,
            fileSize: (this.selectedFile.size / 1024 / 1024).toFixed(2), // in MB
            time: duration,
            md5: md5,
          };
        } catch (err) {
          console.error("Error during MD5 calculation:", err);
          this.$buefy.dialog.alert({
            title: "Error",
            message: "An error occurred while calculating the MD5 checksum.",
            type: "is-danger",
          });
        } finally {
          this.isProcessing = false;
        }
      };

      reader.onerror = () => {
        console.error("Error reading the file.");
        this.$buefy.dialog.alert({
          title: "File Read Error",
          message: "Could not read the selected file.",
          type: "is-danger",
        });
        this.isProcessing = false;
      };

      reader.readAsArrayBuffer(this.selectedFile);
    },
  },
};
</script>

<style scoped>
/* Scoped styles if needed */
</style>
