<template>
  <div>
    <b-modal :active="$parent.isGroupModalActive">
      <form @submit.prevent="handleSubmit">
        <div class="modal-card" style="width: auto">
          <header class="modal-card-head">
            <p class="modal-card-title">{{isEdit?'Edit':'New'}} group</p>
          </header>
          <section class="modal-card-body">
            <!--{{this.groupToEdit}}-->
            <b-field label="Name">
              <b-input
                type="text"
                v-model="newGroupsName"
                required>
              </b-input>
            </b-field>


            <b-field label="LDAP Groups">

              <div class="list is-hoverable">
                <span v-for="groupLdap in ldapGroups"
                      class="list-item message-header has-background-light has-text-info">
                  {{groupLdap}}
                  <button type="button" aria-label="Close message" class="delete is-vcentered"
                          @click="removeLdapGroup(groupLdap)"></button>
                </span>
              </div>


            </b-field>

            <b-field label="Add LDAP Groups">
              <b-field>
                <b-input placeholder="CN=Group1Users,OU=Groups,OU=Example,DC=org" v-model="newGroupLdap"
                         expanded>
                </b-input>
                <p class="control">
                  <button class="button is-info" type="button" @click="addLdapGroup">Add</button>
                </p>
              </b-field>
            </b-field>

            <div class="field" v-if="groupToEdit">
              <b-switch :value="groupToEdit.sendToEna">
                Send to ENA
              </b-switch>
            </div>

          </section>
          <footer class="modal-card-foot buttons" style="justify-content: space-between;">

            <div>
              <button class="button" type="button" @click="$parent.isGroupModalActive = false">Close</button>
              <button class="button is-primary" type="submit">Save</button>
            </div>

            <div>
              <button v-if="groupToEdit && !groupToEdit.deleted" class="button is-danger is-small" type="button"
                      @click="deleteGroup">Delete
              </button>
              <button v-if="groupToEdit && groupToEdit.deleted" class="button is-danger is-small" type="button"
                      @click="resurrectGroup">Resurrect
              </button>
            </div>


          </footer>
        </div>
      </form>
    </b-modal>
  </div>
</template>

<script>
  export default {
    props: ['groupToEdit'],
    data() {
      return {
        newGroupsName: '',
        newGroupLdap: '',
        ldapGroups: []
      }
    },
    computed: {
      isEdit() {
        if (this.groupToEdit) {
          this.newGroupsName = this.groupToEdit.name;
          this.ldapGroups = this.groupToEdit.ldapGroups;
        } else {
          this.newGroupsName = '';
          this.ldapGroups = [];
        }
        return this.groupToEdit
      }
    },
    methods: {
      handleSubmit() {

        //save vs edit

        if (this.isEdit) {
          return this.$axios.post('/api/groups/edit', {
            id: this.groupToEdit._id,
            name: this.newGroupsName,
            ldapGroups: this.ldapGroups
          })
            .then(savedGroup => {
              this.$parent.isGroupModalActive = false;
              this.$store.dispatch('refreshGroups');
              this.$buefy.toast.open({
                message: 'Group saved!',
                type: 'is-success'
              });
            })
            .catch(err => {
              this.$buefy.dialog.alert({
                title: 'Error',
                message: err.message,
                type: 'is-danger'
              })
            })
        } else {
          return this.$axios.post('/api/groups/new', {name: this.newGroupsName, ldapGroups: this.ldapGroups})
            .then(savedGroup => {
              this.$parent.isGroupModalActive = false;
              this.$store.dispatch('refreshGroups');
              this.$buefy.toast.open({
                message: 'Group added!',
                type: 'is-success'
              });
            })
            .catch(err => {
              this.$buefy.dialog.alert({
                title: 'Error',
                message: err.message,
                type: 'is-danger'
              })
            })
        }


      },
      removeLdapGroup(item) {
        this.ldapGroups = this.ldapGroups.filter(function (value, index, arr) {
          return value !== item;
        });
      },
      addLdapGroup() {
        if (this.newGroupLdap) {
          console.log('b', this.ldapGroups);
          this.ldapGroups.push(this.newGroupLdap);
          this.newGroupLdap = '';
        }

      },
      deleteGroup() {

        if (this.groupToEdit) {
          this.$buefy.dialog.confirm({
            title: 'Deleting group',
            message: `Are you sure you want to <b>delete</b> "${this.groupToEdit.name}"?.`,
            confirmText: 'Delete Group',
            type: 'is-danger',
            hasIcon: true,
            // icon: 'times-circle',
            // iconPack: 'fa',
            onConfirm: () => {

              return this.$axios.post('/api/groups/delete', {id: this.groupToEdit._id})
                .then(() => {
                  this.$store.dispatch('refreshGroups');
                  this.$buefy.toast.open('Group deleted!');
                  this.$parent.isGroupModalActive = false;
                })
                .catch(err => {
                  this.$buefy.dialog.alert({
                    title: 'Error',
                    message: err.message,
                    type: 'is-danger',
                  })
                })


            }
          })


        } else {
          //group not found
          this.$buefy.dialog.alert({
            title: 'Error',
            message: `group not found`,
            type: 'is-danger',
          })

        }
      },

      resurrectGroup() {
        if (this.groupToEdit) {
          this.$buefy.dialog.confirm({
            title: 'Resurrecting group',
            message: `Are you sure you want to <b>resurrect</b> "${this.groupToEdit.name}"?.`,
            confirmText: 'Resurrect Group',
            type: 'is-danger',
            hasIcon: true,
            // icon: 'times-circle',
            // iconPack: 'fa',
            onConfirm: () => {

              return this.$axios.post('/api/groups/resurrect', {id: this.groupToEdit._id})
                .then(() => {
                  this.$store.dispatch('refreshGroups');
                  this.$buefy.toast.open('Group resurrected!');
                  this.$parent.isGroupModalActive = false;
                })
                .catch(err => {
                  this.$buefy.dialog.alert({
                    title: 'Error',
                    message: err.message,
                    type: 'is-danger',
                  })
                })


            }
          })


        } else {
          //group not found
          this.$buefy.dialog.alert({
            title: 'Error',
            message: `group not found`,
            type: 'is-danger',
          })

        }
      }
    }
  }
</script>
