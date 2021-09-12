<template>
  <div v-if="!!showAdminSection">
    <div class="section">
      <div class="container">
        <h1 class="title">Export data to CSV</h1>

        <p>
          Click the button below to get all Runs and associated data as a .csv
          file:
        </p>
        <br />

        <b-button type="is-primary" @click="downloadCsv">
          Download CSV
        </b-button>
      </div>
    </div>
  </div>
  <div v-else>This page is restricted to admins.</div>
</template>
<script>
import moment from "moment";
export default {
  // components: {  },
  middleware: ["auth"],
  data() {
    return {
      csvFile: null,
    };
  },
  computed: {
    showAdminSection() {
      return process.env.ENA_ADMINS.includes(this.$auth.$state.user.username);
    },
  },
  methods: {
    downloadCsv: function () {
      this.$axios
        .get("/accessions/csv")
        .then((returnObj) => {
          const { data } = returnObj;
          const { csv } = data;

          var hiddenElement = document.createElement("a");
          hiddenElement.href = "data:text/csv;charset=utf-8," + encodeURI(csv);
          hiddenElement.target = "_blank";
          const timestamp = moment().format("DD MMM YYYY, h:mm:ss a");
          const title = `All runs - ${timestamp}.csv`;
          hiddenElement.download = title;
          hiddenElement.click();
        })
        .catch((err) => {
          this.$buefy.toast.open({
            message: err,
            type: "is-danger",
          });
        });
    },
  },
};
</script>
<style></style>
