<template>
  <div class="section">
    <div class="container">
      <div v-if="run">
        <div class="title-wrapper">
          <div class="title">
            {{ run.name }}
          </div>
          <AddAccessionModal
            v-if="!!showAddAcession"
            type="run"
            :type-id="run._id"
            :initial-accessions="run.accessions"
          />
        </div>

        <p class="subtitle">
          <b-icon
            icon="account-outline"
            size="is-small"
            class="has-text-grey"
          ></b-icon>
          {{ run.owner }}
          <br />
          <b-icon
            icon="account-multiple-outline"
            size="is-small"
            class="has-text-grey"
          ></b-icon>
          {{ run.group.name }}
          <br />
          <nuxt-link
            :to="{ name: 'sample', query: { id: run.sample._id } }"
            class="has-text-text"
          >
            <b-icon
              icon="flask-outline"
              size="is-small"
              class="has-text-grey"
            ></b-icon>
            {{ run.sample.name }}
          </nuxt-link>
          <br />
          <b-icon icon="home-lock" size="is-small" class="has-text-grey" />
          Run accession numbers:{{
            run.accessions.length ? ` ${run.accessions.join(", ")}` : ` unknown`
          }}
        </p>

        <div class="columns">
          <div class="column"></div>
          <div class="column"></div>
        </div>

        <div class="columns">
          <div class="column">
            <b-field label="Sequencing Provider">
              <p>{{ run.sequencingProvider }}</p>
            </b-field>
          </div>
          <div class="column">
            <b-field label="Sequencing Technology">
              <p>{{ run.sequencingTechnology }}</p>
            </b-field>
          </div>
        </div>

        <div class="columns">
          <div class="column">
            <b-field label="Library Source">
              <p>{{ run.librarySource }}</p>
            </b-field>
          </div>
          <div class="column">
            <b-field label="Library Selection">
              <p>{{ run.librarySelection }}</p>
            </b-field>
          </div>
        </div>

        <div class="columns">
          <div class="column">
            <b-field label="Library Type">
              <p>{{ run.libraryType }}</p>
            </b-field>
          </div>
          <div class="column">
            <b-field label="Library Strategy">
              <p>{{ run.libraryStrategy }}</p>
            </b-field>
          </div>
        </div>

        <b-field label="Insert Size">
          <p class="bottomPadding">
            {{ this.insertSizeString }}
          </p>
        </b-field>

        <!-- TODO additioanlfilelist and readlist could be recombined again -->

        <b-field label="Additional Files">
          <AdditionalFileList
            :files="additionalFiles"
            :parent-path="run.path"
          />
        </b-field>

        <div class="bottomPadding"></div>

        <b-field label="Raw Files">
          <ReadList :reads="reads" :run-path="run.path" />
        </b-field>
        <hr />
        <!-- <p class="title is-4">Runs</p>
        <RunList :sample="sample" :samples="sample.runs"></RunList>-->
      </div>
    </div>
  </div>
</template>

<script>
// import RunList from "../components/runs/RunList";
import AdditionalFileList from "../components/AdditionalFileList";
import ReadList from "../components/ReadList";
import AddAccessionModal from "../components/AddAccessionModal";

export default {
  components: {
    AdditionalFileList,
    ReadList,
    AddAccessionModal,
  },
  middleware: ["auth"],
  asyncData({ route, $axios, error }) {
    //TODO check if can view

    if (!route.query.id) {
      error({ statusCode: 404, message: "Run not found" });
    }

    //use cached project if available
    // const cachedProject = store.getters.getCachedSampleById(route.query.id);
    // if (cachedProject) {
    //   return Promise.resolve({
    //     project: cachedProject
    //   })
    // }

    return $axios
      .get("/run", { params: { id: route.query.id } })
      .then((res) => {
        if (res.status === 200 && res.data.run) {
          const dbReadFileEntries = res.data.run.rawFiles;

          //console.log("db reads", dbReadFileEntries);

          const verifiedRawFileNames = dbReadFileEntries.map(
            (rf) => rf.file.originalName
          );

          const verifiedAdditionalFileNames = res.data.run.additionalFiles.map(
            (rf) => rf.file.originalName
          );
          // TODO check this works with empty addFiles and empty raw files

          //console.log("hpc reads", res.data.actualReads);

          const actualReadFileNames = res.data.actualReads
            ? JSON.parse(JSON.stringify(res.data.actualReads))
            : [];
          const actualAdditionalFileNames = res.data.actualAdditionalFiles
            ? JSON.parse(JSON.stringify(res.data.actualAdditionalFiles))
            : [];
          const verifiedReads = actualReadFileNames.map((readFileName) => {
            const readInfo = dbReadFileEntries.find(
              (entry) => entry.file.originalName === readFileName
            );

            if (!readInfo) {
              console.log("no db read info found for: ", readFileName);
            }

            const res = {
              _id:
                (readInfo && readInfo._id) ||
                Math.random().toString(16).substr(2, 12),
              fileName: readFileName,
              paired: (readInfo && readInfo.paired) || false,
              sibling: (readInfo && readInfo.sibling) || false,
              verified: !!verifiedRawFileNames.includes(readFileName),
            };
            // console.log('res', res);
            return res;
          });

          const addFileRes = actualAdditionalFileNames.map(
            (additionalFileName) => ({
              fileName: additionalFileName,
              verified:
                !!verifiedAdditionalFileNames.includes(additionalFileName),
            })
          );

          const result = {
            run: res.data.run,
            reads: verifiedReads,
            additionalFiles: addFileRes,
          };

          console.log("result run", result.run.insertSize);

          return result;
        } else {
          error({ statusCode: 501, message: "Run not found" });
        }
      })
      .catch((err) => {
        console.error(err);
        error({ statusCode: 501, message: "Run not found" });
      });
  },
  computed: {
    insertSizeString() {
      const insertSizeToCheck = this.run.insertSize;
      let insertSizeString = "(not set)";

      if (typeof insertSizeToCheck === "undefined") {
        return;
      } else if (typeof insertSizeToCheck === "null") {
        return;
      } else {
        insertSizeString = insertSizeToCheck.toString();
      }

      return insertSizeString;
    },
    showAddAcession() {
      if (this?.$auth?.$state?.user?.username && process?.env?.ENA_ADMINS) {
        return process.env.ENA_ADMINS.includes(this.$auth.$state.user.username);
      } else {
        return false;
      }
    },
  },
};
</script>
<style scoped>
.bottomPadding {
  margin-bottom: 2rem;
}
.title-wrapper {
  display: flex;
  justify-content: space-between;
}
</style>
