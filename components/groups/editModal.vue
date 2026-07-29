<template>
  <div>
    <b-modal :active="$parent.isGroupModalActive">
      <form @submit.prevent="handleSubmit">
        <div class="modal-card" style="width: auto">
          <header class="modal-card-head">
            <p class="modal-card-title">{{ isEdit ? "View" : "View" }} group</p>
          </header>
          <section class="modal-card-body">
            <!--{{this.groupToEdit}}-->
            <b-field label="Name">
              <b-input v-model="newGroupsName" type="text" required readonly>
              </b-input>
            </b-field>

            <b-field label="LDAP Groups">
              <div class="list is-hoverable">
                <!-- Keyed by index, not by value: some groups carry the same
                     LDAP string twice (two_blades does), and a duplicate key
                     makes Vue's patching unreliable. This list is display-only
                     and never reordered, so the index is stable. -->
                <span
                  v-for="(groupLdap, index) in ldapGroups"
                  :key="index"
                  class="list-item message-header has-background-light has-text-info"
                >
                  {{ groupLdap }}
                  <!-- <button
                    type="button"
                    aria-label="Close message"
                    class="delete is-vcentered"
                    @click="removeLdapGroup(groupLdap)"
                  ></button> -->
                </span>
              </div>
            </b-field>

            <!-- <b-field label="Add LDAP Groups">
              <b-field>
                <b-input
                  v-model="newGroupLdap"
                  placeholder="CN=Group1Users,OU=Groups,OU=Example,DC=org"
                  expanded
                >
                </b-input>
                <p class="control">
                  <button
                    class="button is-info"
                    type="button"
                    @click="addLdapGroup"
                  >
                    Add
                  </button>
                </p>
              </b-field>
            </b-field> -->

            <div v-if="groupToEdit" class="field">
              <b-switch
                v-model="sendToEna"
                readonly
                disabled
                :value="groupToEdit.sendToEna"
              >
                Send to ENA
              </b-switch>
            </div>
          </section>
          <footer
            class="modal-card-foot buttons"
            style="justify-content: space-between"
          >
            <div>
              <button
                class="button"
                type="button"
                @click="$parent.isGroupModalActive = false"
              >
                Close
              </button>
              <!-- <button class="button is-primary" type="submit">Save</button> -->
            </div>

            <div>
              <!-- <button
                v-if="groupToEdit && !groupToEdit.deleted"
                class="button is-danger is-small"
                type="button"
                @click="deleteGroup"
              >
                Delete
              </button>
              <button
                v-if="groupToEdit && groupToEdit.deleted"
                class="button is-danger is-small"
                type="button"
                @click="resurrectGroup"
              >
                Resurrect
              </button> -->
            </div>
          </footer>
        </div>
      </form>
    </b-modal>
  </div>
</template>

<script>
import { getApiErrorMessage } from "~/utils/apiError";

export default {
  props: ["groupToEdit"],
  data() {
    return {
      newGroupsName: "",
      newGroupLdap: "",
      ldapGroups: [],
      // Was never declared, so the computed below added it after instantiation
      // — where Vue 2 cannot make it reactive, and the switch never updated.
      sendToEna: false,
    };
  },
  computed: {
    isEdit() {
      return Boolean(this.groupToEdit);
    },
  },
  watch: {
    groupToEdit: {
      immediate: true,
      handler(group) {
        this.loadForm(group);
      },
    },
  },
  methods: {
    /**
     * Copies the selected group into the form fields.
     *
     * This used to live inside the `isEdit` computed. A computed that assigns
     * to data is re-run by Vue whenever it likes and skipped when its result is
     * cached, so which fields were showing depended on render timing rather
     * than on the selected group.
     */
    loadForm(group) {
      this.newGroupsName = group ? group.name || "" : "";
      // A copy: `addLdapGroup` pushes onto this array, and sharing the store's
      // own array would edit the group in place even if the user cancels.
      this.ldapGroups =
        group && Array.isArray(group.ldapGroups) ? [...group.ldapGroups] : [];
      this.sendToEna = group ? Boolean(group.sendToEna) : false;
      this.newGroupLdap = "";
    },
    handleSubmit() {},
    handleSubmit2() {
      //save vs edit

      if (this.isEdit) {
        return this.$axios
          .post("/groups/edit", {
            id: this.groupToEdit._id,
            name: this.newGroupsName,
            ldapGroups: this.ldapGroups,
            sendToEna: this.sendToEna,
          })
          .then(() => {
            this.$parent.isGroupModalActive = false;
            this.$store.dispatch("refreshGroups");
            this.$buefy.toast.open({
              message: "Group saved!",
              type: "is-success",
            });
          })
          .catch((err) => {
            console.error("Group operation failed:", err);
            this.$buefy.dialog.alert({
              title: "Error",
              // `err.message` on an axios rejection is "Request failed with
              // status code 500"; the API's own reason is in the body.
              message: getApiErrorMessage(err),
              type: "is-danger",
            });
          });
      } else {
        return this.$axios
          .post("/groups/new", {
            name: this.newGroupsName,
            ldapGroups: this.ldapGroups,
          })
          .then(() => {
            this.$parent.isGroupModalActive = false;
            this.$store.dispatch("refreshGroups");
            this.$buefy.toast.open({
              message: "Group added!",
              type: "is-success",
            });
          })
          .catch((err) => {
            console.error("Group operation failed:", err);
            this.$buefy.dialog.alert({
              title: "Error",
              // `err.message` on an axios rejection is "Request failed with
              // status code 500"; the API's own reason is in the body.
              message: getApiErrorMessage(err),
              type: "is-danger",
            });
          });
      }
    },
    removeLdapGroup(item) {
      this.ldapGroups = this.ldapGroups.filter((value) => value !== item);
    },
    addLdapGroup() {
      if (this.newGroupLdap) {
        this.ldapGroups.push(this.newGroupLdap);
        this.newGroupLdap = "";
      }
    },
    deleteGroup() {
      if (this.groupToEdit) {
        this.$buefy.dialog.confirm({
          title: "Deleting group",
          message: `Are you sure you want to <b>delete</b> "${this.groupToEdit.name}"?.`,
          confirmText: "Delete Group",
          type: "is-danger",
          hasIcon: true,
          // icon: 'times-circle',
          // iconPack: 'fa',
          onConfirm: () => {
            return this.$axios
              .post("/groups/delete", { id: this.groupToEdit._id })
              .then(() => {
                this.$store.dispatch("refreshGroups");
                this.$buefy.toast.open("Group deleted!");
                this.$parent.isGroupModalActive = false;
              })
              .catch((err) => {
                console.error("Group operation failed:", err);
                this.$buefy.dialog.alert({
                  title: "Error",
                  message: getApiErrorMessage(err),
                  type: "is-danger",
                });
              });
          },
        });
      } else {
        //group not found
        this.$buefy.dialog.alert({
          title: "Error",
          message: `group not found`,
          type: "is-danger",
        });
      }
    },

    resurrectGroup() {
      if (this.groupToEdit) {
        this.$buefy.dialog.confirm({
          title: "Resurrecting group",
          message: `Are you sure you want to <b>resurrect</b> "${this.groupToEdit.name}"?.`,
          confirmText: "Resurrect Group",
          type: "is-danger",
          hasIcon: true,
          // icon: 'times-circle',
          // iconPack: 'fa',
          onConfirm: () => {
            return this.$axios
              .post("/groups/resurrect", { id: this.groupToEdit._id })
              .then(() => {
                this.$store.dispatch("refreshGroups");
                this.$buefy.toast.open("Group resurrected!");
                this.$parent.isGroupModalActive = false;
              })
              .catch((err) => {
                console.error("Group operation failed:", err);
                this.$buefy.dialog.alert({
                  title: "Error",
                  message: getApiErrorMessage(err),
                  type: "is-danger",
                });
              });
          },
        });
      } else {
        //group not found
        this.$buefy.dialog.alert({
          title: "Error",
          message: `group not found`,
          type: "is-danger",
        });
      }
    },
  },
};
</script>
