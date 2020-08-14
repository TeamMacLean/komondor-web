<template>
  <div>
    <GroupModal :groupToEdit="groupToEdit" />

    <div class="section">
      <div class="container">
        <b-tabs class="block" :animated="false">
          <!-- <b-tab-item label="General"></b-tab-item> -->
          <b-tab-item label="Options">
            <b-field label="Library types">
              <div>
                <ul>
                  <li v-for="option in libraryTypes" :key="option._id">
                    <b-tag
                      size="is-medium"
                      closable
                      aria-close-label="Close tag"
                      @close="promptToDeleteLibraryType(option)"
                    >{{option.value}}</b-tag>
                  </li>
                </ul>
                <button type="button" class="button is-success" @click="promptForNewLibraryType">New</button>
              </div>
            </b-field>

            <b-field label="Sequencing technologies">
              <div>
                <ul>
                  <li v-for="option in sequencingTechnologies" :key="option._id">
                    <b-tag
                      size="is-medium"
                      closable
                      aria-close-label="Close tag"
                      @close="promptToDeleteSequencingTechnology(option)"
                    >{{option.value}}</b-tag>
                  </li>
                </ul>
                <button
                  type="button"
                  class="button is-success"
                  @click="promptForNewSequencingTechnology"
                >New</button>
              </div>
            </b-field>
            <b-field label="Library sources">
              <div>
                <ul>
                  <li v-for="option in librarySources" :key="option._id">
                    <b-tag
                      size="is-medium"
                      closable
                      aria-close-label="Close tag"
                      @close="promptToDeleteLibrarySource(option)"
                    >{{option.value}}</b-tag>
                  </li>
                </ul>
                <button
                  type="button"
                  class="button is-success"
                  @click="promptForNewLibrarySource"
                >New</button>
              </div>
            </b-field>
            <b-field label="Library selections">
              <div>
                <ul>
                  <li v-for="option in librarySelections" :key="option._id">
                    <b-tag
                      size="is-medium"
                      closable
                      aria-close-label="Close tag"
                      @close="promptToDeleteLibrarySelection(option)"
                    >{{option.value}}</b-tag>
                  </li>
                </ul>
                <button
                  type="button"
                  class="button is-success"
                  @click="promptForNewLibrarySelection"
                >New</button>
              </div>
            </b-field>
            <b-field label="Library strategies">
              <div>
                <ul>
                  <li v-for="option in libraryStrategies" :key="option._id">
                    <b-tag
                      size="is-medium"
                      closable
                      aria-close-label="Close tag"
                      @close="promptToDeleteLibraryStrategy(option)"
                    >{{option.value}}</b-tag>
                  </li>
                </ul>
                <button
                  type="button"
                  class="button is-success"
                  @click="promptForNewLibraryStrategy"
                >New</button>
              </div>
            </b-field>
          </b-tab-item>
          <b-tab-item label="Users">
            <ul>
              <li v-for="user in users" :key="user._id">
                <nuxt-link :to="{ name: 'user', query: { username: user.username}}">{{user.name}}</nuxt-link>
              </li>
            </ul>
          </b-tab-item>
          <b-tab-item label="Groups">
            <button type="button" class="button is-success" @click="showModalForNewGroup">New</button>
            <hr />

            <div class="columns" v-for="i in Math.ceil(groups.length / 4)" :key="i">
              <div
                class="column is-3"
                v-for="group in groups.slice((i - 1) * 4, i * 4)"
                :key="group._id"
              >
                <div class="card">
                  <div class="card-content truncate">
                    <a @click="editGroup(group)">
                      <p class="title is-4 truncate">{{group.name}}</p>
                    </a>
                    <p class="subtitle is-6">@{{group.safeName}}</p>

                    <b-tag v-if="group.deleted" type="is-danger">Deleted</b-tag>
                  </div>
                </div>
              </div>
            </div>
          </b-tab-item>
          <b-tab-item label="Projects">
            <ProjectList />
            <!--<ul>-->
            <!--<li v-for="project in projects">-->
            <!--<nuxt-link :to="{ name: 'project', query: { id: project._id }}">-->
            <!--{{project.name}}-->
            <!--</nuxt-link>-->
            <!--</li>-->
            <!--</ul>-->
          </b-tab-item>
          <b-tab-item label="Samples">
            <ul>
              <li v-for="sample in samples" :key="sample._id">
                <nuxt-link
                  :to="{ name: 'sample', query: { id: sample._id }}"
                >{{sample.scientificName}}</nuxt-link>
              </li>
            </ul>
          </b-tab-item>
        </b-tabs>
      </div>
    </div>
  </div>
</template>

<script>
import GroupModal from "~/components/groups/editModal.vue";
import ProjectList from "~/components/projects/ProjectList.vue";

import LibraryTypeModal from "./LibraryTypeModal";

export default {
  middleware: ["auth", "admin"],
  components: { GroupModal, ProjectList },
  data() {
    return {
      test: "some test text",
      usersFilterText: "",
      groupsFilterText: "",
      projectsFilterText: "",

      isGroupModalActive: false,
      groupToEdit: null
      // newGroupLdap: '',
      // newGroupsName: '',
      // groupLdapList: []
    };
  },
  mounted() {
    return Promise.all([
      this.$store.dispatch("refreshProjects"),
      this.$store.dispatch("refreshGroups"),
      this.$store.dispatch("refreshUsers"),
      this.$store.dispatch("refreshSamples"),
      this.$store.dispatch("refreshOptions")
    ]);
  },

  computed: {
    samples() {
      return JSON.parse(JSON.stringify(this.$store.state.samples));
    },
    projects() {
      return JSON.parse(JSON.stringify(this.$store.state.projects));
    },
    users() {
      return JSON.parse(JSON.stringify(this.$store.state.users));
    },
    groups() {
      return JSON.parse(JSON.stringify(this.$store.state.groups));
    },
    libraryTypes() {
      return JSON.parse(JSON.stringify(this.$store.state.libraryTypes));
    },
    sequencingTechnologies() {
      return JSON.parse(
        JSON.stringify(this.$store.state.sequencingTechnologies)
      );
    },
    librarySources() {
      return JSON.parse(JSON.stringify(this.$store.state.librarySources));
    },
    librarySelections() {
      return JSON.parse(JSON.stringify(this.$store.state.librarySelections));
    },
    libraryStrategies() {
      return JSON.parse(JSON.stringify(this.$store.state.libraryStrategies));
    }
  },
  methods: {
    editGroup(group) {
      this.groupToEdit = group;
      this.isGroupModalActive = true;
    },
    reloadOptions() {
      this.$store.dispatch("refreshOptions");
    },
    showModalForNewGroup() {
      this.isGroupModalActive = true;
      this.groupToEdit = null;
    },
    promptForNewGroup() {
      this.$buefy.dialog.prompt({
        message: `Group Name`,
        inputAttrs: {
          placeholder: "e.g. jjones",
          maxlength: 20
        },
        onConfirm: value =>
          this.$buefy.toast.open({
            message: `Added group: ${value}`,
            type: "is-success"
          })
      });
    },
    promptForNewLibraryType() {
      this.$buefy.modal.open({
        parent: this,
        component: LibraryTypeModal,
        hasModalCard: true,
        trapFocus: true,
        props: {
          existingNames: this.libraryTypes.map(lt => lt.value)
        }
      });

      // this.$buefy.dialog.prompt({
      //   message: `Library Type`,
      //   inputAttrs: {
      //     minlength: 2
      //   },
      //   onConfirm: value => {
      //     this.$axios
      //       .post("/options/librarytype", { value })
      //       .then(() => {
      //         this.$store.dispatch("refreshLibraryTypes");
      //         this.$buefy.toast.open({
      //           message: `Added: ${value}`,
      //           type: "is-success"
      //         });
      //       })
      //       .catch(err => {
      //         this.$buefy.toast.open({
      //           message: `Failed to save option`,
      //           type: "is-danger"
      //         });
      //       });
      //   }
      // });
    },
    promptToDeleteLibraryType(option) {
      this.$buefy.dialog.confirm({
        message: `Delete ${option.value}?`,
        onConfirm: () => {
          this.$axios
            .delete("/options/librarytype", { data: { id: option._id } })
            .then(() => {
              this.$store.dispatch("refreshLibraryTypes");
              this.$buefy.toast.open({
                message: `Deleted: ${option.value}`,
                type: "is-success"
              });
            })
            .catch(err => {
              console.error(err);
              this.$buefy.toast.open({
                message: `Failed to delete option`,
                type: "is-danger"
              });
            });
        }
      });
    },
    promptForNewSequencingTechnology() {
      this.$buefy.dialog.prompt({
        message: `Sequencing Technology`,
        inputAttrs: {
          minlength: 2
        },
        onConfirm: value => {
          this.$axios
            .post("/options/sequencingtechnology", { value })
            .then(() => {
              this.$store.dispatch("refreshSequencingTechnologies");
              this.$buefy.toast.open({
                message: `Added: ${value}`,
                type: "is-success"
              });
            })
            .catch(err => {
              console.error(err);
              this.$buefy.toast.open({
                message: `Failed to save option`,
                type: "is-danger"
              });
            });
        }
      });
    },
    promptToDeleteSequencingTechnology(option) {
      this.$buefy.dialog.confirm({
        message: `Delete ${option.value}?`,
        onConfirm: () => {
          this.$axios
            .delete("/options/sequencingtechnology", {
              data: { id: option._id }
            })
            .then(() => {
              this.$store.dispatch("refreshSequencingTechnologies");
              this.$buefy.toast.open({
                message: `Deleted: ${option.value}`,
                type: "is-success"
              });
            })
            .catch(err => {
              console.error(err);
              this.$buefy.toast.open({
                message: `Failed to delete option, error: ${err}`,
                type: "is-danger"
              });
            });
        }
      });
    },
    promptForNewLibrarySource() {
      this.$buefy.dialog.prompt({
        message: `Library Source`,
        inputAttrs: {
          minlength: 2
        },
        onConfirm: value => {
          this.$axios
            .post("/options/librarysource", { value })
            .then(() => {
              this.$store.dispatch("refreshLibrarySources");
              this.$buefy.toast.open({
                message: `Added: ${value}`,
                type: "is-success"
              });
            })
            .catch(err => {
              console.error(err);
              this.$buefy.toast.open({
                message: `Failed to save option`,
                type: "is-danger"
              });
            });
        }
      });
    },
    promptToDeleteLibrarySource(option) {
      this.$buefy.dialog.confirm({
        message: `Delete ${option.value}?`,
        onConfirm: () => {
          this.$axios
            .delete("/options/librarysource", { data: { id: option._id } })
            .then(() => {
              this.$store.dispatch("refreshLibrarySources");
              this.$buefy.toast.open({
                message: `Deleted: ${option.value}`,
                type: "is-success"
              });
            })
            .catch(err => {
              console.error(err);
              this.$buefy.toast.open({
                message: `Failed to delete option`,
                type: "is-danger"
              });
            });
        }
      });
    },
    promptForNewLibrarySelection() {
      this.$buefy.dialog.prompt({
        message: `Library Selection`,
        inputAttrs: {
          // placeholder: "e.g. jjones",
          // maxlength: 20
          minlength: 2
        },
        onConfirm: value => {
          this.$axios
            .post("/options/libraryselection", { value })
            .then(() => {
              this.$store.dispatch("refreshLibrarySelections");
              this.$buefy.toast.open({
                message: `Added: ${value}`,
                type: "is-success"
              });
            })
            .catch(err => {
              console.error(err);
              this.$buefy.toast.open({
                message: `Failed to save option`,
                type: "is-danger"
              });
            });
        }
      });
    },
    promptToDeleteLibrarySelection(option) {
      this.$buefy.dialog.confirm({
        message: `Delete ${option.value}?`,
        onConfirm: () => {
          this.$axios
            .delete("/options/libraryselection", { data: { id: option._id } })
            .then(() => {
              this.$store.dispatch("refreshLibrarySelections");
              this.$buefy.toast.open({
                message: `Deleted: ${option.value}`,
                type: "is-success"
              });
            })
            .catch(err => {
              console.error(err);
              this.$buefy.toast.open({
                message: `Failed to delete option`,
                type: "is-danger"
              });
            });
        }
      });
    },
    promptForNewLibraryStrategy() {
      this.$buefy.dialog.prompt({
        message: `Library Strategy`,
        inputAttrs: {
          minlength: 2
        },
        onConfirm: value => {
          this.$axios
            .post("/options/librarystrategy", { value })
            .then(() => {
              this.$store.dispatch("refreshLibraryStrategies");
              this.$buefy.toast.open({
                message: `Added: ${value}`,
                type: "is-success"
              });
            })
            .catch(err => {
              console.error(err);
              this.$buefy.toast.open({
                message: `Failed to save option`,
                type: "is-danger"
              });
            });
        }
      });
    },
    promptToDeleteLibraryStrategy(option) {
      this.$buefy.dialog.confirm({
        message: `Delete ${option.value}?`,
        onConfirm: () => {
          this.$axios
            .delete("/options/librarystrategy", { data: { id: option._id } })
            .then(() => {
              this.$store.dispatch("refreshLibraryStrategies");
              this.$buefy.toast.open({
                message: `Deleted: ${option.value}`,
                type: "is-success"
              });
            })
            .catch(err => {
              console.error(err);
              this.$buefy.toast.open({
                message: `Failed to delete option, error: ${err}`,
                type: "is-danger"
              });
            });
        }
      });
    }
  }
};
</script>

<style>
ul li .tag {
  margin-bottom: 8px;
}
</style>