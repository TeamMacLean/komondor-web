<template>
  <div>
    <GroupModal :group-to-edit="groupToEdit" />

    <div class="section">
      <div class="container">
        <b-tabs class="block" :animated="false">
          <!-- <b-tab-item label="General"></b-tab-item> -->
          <b-tab-item label="Options">
            <b-field
              v-for="collection in optionCollections"
              :key="collection.key"
              :label="collection.label"
            >
              <div>
                <ul>
                  <li
                    v-for="option in optionsFor(collection)"
                    :key="option._id"
                  >
                    <b-tag
                      size="is-medium"
                      closable
                      aria-close-label="Close tag"
                      @close="promptToDeleteOption(collection, option)"
                      >{{ option.value }}</b-tag
                    >
                  </li>
                </ul>
                <button
                  type="button"
                  class="button is-success"
                  @click="promptForNewOption(collection)"
                >
                  New
                </button>
              </div>
            </b-field>
          </b-tab-item>
          <b-tab-item label="Users">
            <ul>
              <li v-for="user in users" :key="user._id">
                <nuxt-link
                  :to="{ name: 'user', query: { username: user.username } }"
                  >{{ user.name }}</nuxt-link
                >
              </li>
            </ul>
          </b-tab-item>
          <b-tab-item label="Groups">
            <!-- <button
              type="button"
              class="button is-success"
              @click="showModalForNewGroup"
            >
              New
            </button> -->
            <hr />
            <p>Use CLI to update LDAP groups</p>
            <p>db.groups.find({ name: 'two_blades'}).pretty()</p>
            <p>
              db.groups.update({ name: 'two_blades'}, { $push: { ldapGroups:
              'CN=slproj_2BL1_Modify,OU=TSLGroups,OU=NBIGroups,DC=nbi,DC=ac,DC=uk'
              } })
            </p>
            <hr />

            <div
              v-for="i in Math.ceil(groups.length / 4)"
              :key="i"
              class="columns"
            >
              <div
                v-for="group in groups.slice((i - 1) * 4, i * 4)"
                :key="group._id"
                class="column is-3"
              >
                <div class="card">
                  <div class="card-content truncate">
                    <a @click="editGroup(group)">
                      <p class="title is-4 truncate">{{ group.name }}</p>
                    </a>
                    <p class="subtitle is-6">@{{ group.safeName }}</p>

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
                  :to="{ name: 'sample', query: { id: sample._id } }"
                  >{{
                    sample.scientificName || sample.name || "[Unnamed Sample]"
                  }}</nuxt-link
                >
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

import LibraryTypeModal from "./LibraryTypeModal.vue";
import { getApiErrorMessage, isBodyError } from "~/utils/apiError";

/**
 * The five controlled-vocabulary collections on /options/*.
 *
 * `key` is the store state array, `refresh` the action that reloads it, and
 * `endpoint` the API route. Library types are the odd one out: they carry
 * `paired` and `extensions` alongside `value`, so they need a form rather than
 * a single-field prompt.
 */
const OPTION_COLLECTIONS = [
  {
    key: "libraryTypes",
    label: "Library types",
    singular: "Library Type",
    endpoint: "/options/librarytype",
    refresh: "refreshLibraryTypes",
    useModal: true,
  },
  {
    key: "sequencingTechnologies",
    label: "Sequencing technologies",
    singular: "Sequencing Technology",
    endpoint: "/options/sequencingtechnology",
    refresh: "refreshSequencingTechnologies",
  },
  {
    key: "librarySources",
    label: "Library sources",
    singular: "Library Source",
    endpoint: "/options/librarysource",
    refresh: "refreshLibrarySources",
  },
  {
    key: "librarySelections",
    label: "Library selections",
    singular: "Library Selection",
    endpoint: "/options/libraryselection",
    refresh: "refreshLibrarySelections",
  },
  {
    key: "libraryStrategies",
    label: "Library strategies",
    singular: "Library Strategy",
    endpoint: "/options/librarystrategy",
    refresh: "refreshLibraryStrategies",
  },
];

export default {
  components: { GroupModal, ProjectList },
  middleware: ["auth", "admin"],
  data() {
    return {
      test: "some test text",
      usersFilterText: "",
      groupsFilterText: "",
      projectsFilterText: "",

      isGroupModalActive: false,
      groupToEdit: null,
      optionCollections: OPTION_COLLECTIONS,
      // newGroupLdap: '',
      // newGroupsName: '',
      // groupLdapList: []
    };
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
    // Kept because the library-type modal needs the existing names to check
    // for duplicates; the other four collections are read via `optionsFor`.
    libraryTypes() {
      return JSON.parse(JSON.stringify(this.$store.state.libraryTypes));
    },
  },
  mounted() {
    return Promise.all([
      this.$store.dispatch("refreshProjects"),
      this.$store.dispatch("refreshGroups"),
      this.$store.dispatch("refreshUsers"),
      this.$store.dispatch("refreshSamples"),
      this.$store.dispatch("refreshOptions"),
    ]);
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
          maxlength: 20,
        },
        onConfirm: (value) =>
          this.$buefy.toast.open({
            message: `Added group: ${value}`,
            type: "is-success",
          }),
      });
    },
    /** The options in one collection, detached from store state. */
    optionsFor(collection) {
      return JSON.parse(
        JSON.stringify(this.$store.state[collection.key] || [])
      );
    },

    promptForNewOption(collection) {
      // Library types need more than a value, so they get a form.
      if (collection.useModal) {
        return this.$buefy.modal.open({
          parent: this,
          component: LibraryTypeModal,
          hasModalCard: true,
          trapFocus: true,
          props: {
            existingNames: this.libraryTypes.map((lt) => lt.value),
          },
        });
      }

      this.$buefy.dialog.prompt({
        message: collection.singular,
        inputAttrs: {
          minlength: 2,
        },
        onConfirm: (value) => this.createOption(collection, value),
      });
    },

    async createOption(collection, value) {
      try {
        const response = await this.$axios.post(collection.endpoint, { value });

        // Success used to be inferred purely from axios not throwing. The API
        // answers a successful create with the saved document, so check for it
        // rather than assume it.
        if (isBodyError(response)) {
          throw response;
        }
        if (!response.data || !response.data.doc) {
          throw new Error(
            `The server accepted the request but did not confirm "${value}" was saved. Reload to check.`
          );
        }

        const refreshed = await this.$store.dispatch(collection.refresh);
        this.$buefy.toast.open({
          message: refreshed
            ? `Added: ${value}`
            : `Added: ${value} — but the list could not be reloaded. Refresh the page to see it.`,
          type: refreshed ? "is-success" : "is-warning",
          duration: refreshed ? 3000 : 6000,
        });
      } catch (err) {
        console.error(
          `Failed to add an option to ${collection.endpoint}:`,
          err
        );
        this.$buefy.toast.open({
          message: getApiErrorMessage(err, {
            fallback: `Could not add "${value}".`,
          }),
          type: "is-danger",
          duration: 5000,
        });
      }
    },

    promptToDeleteOption(collection, option) {
      this.$buefy.dialog.confirm({
        message: `Delete ${option.value}?`,
        onConfirm: () => this.deleteOption(collection, option),
      });
    },

    async deleteOption(collection, option) {
      try {
        const response = await this.$axios.delete(collection.endpoint, {
          data: { id: option._id },
        });

        if (isBodyError(response)) {
          throw response;
        }

        // A delete that matched nothing is a 404 since BREAKING_CHANGES §4, so
        // reaching here means a document really was removed. The reload is what
        // confirms it to the user.
        const refreshed = await this.$store.dispatch(collection.refresh);
        this.$buefy.toast.open({
          message: refreshed
            ? `Deleted: ${option.value}`
            : `Deleted: ${option.value} — but the list could not be reloaded. Refresh the page.`,
          type: refreshed ? "is-success" : "is-warning",
          duration: refreshed ? 3000 : 6000,
        });
      } catch (err) {
        console.error(
          `Failed to delete an option from ${collection.endpoint}:`,
          err
        );
        this.$buefy.toast.open({
          message: getApiErrorMessage(err, {
            fallback: `Could not delete "${option.value}".`,
          }),
          type: "is-danger",
          duration: 5000,
        });
      }
    },
  },
};
</script>

<style>
ul li .tag {
  margin-bottom: 8px;
}
</style>
