<template>
  <div>
    <GroupModal :groupToEdit="groupToEdit"/>

    <div class="section">
      <div class="container">
        <b-tabs class="block" :animated="false">
          <b-tab-item label="General">

          </b-tab-item>
          <b-tab-item label="Name Me Later">
            <b-field label="Library types">
            </b-field>
            <b-field label="Sequencing providers">
            </b-field>
            <b-field label="Sequencing technologies">
            </b-field>
            <b-field label="Library sources">
            </b-field>
            <b-field label="Library selections">
            </b-field>
            <b-field label="Library strategies">
            </b-field>
          </b-tab-item>
          <b-tab-item label="Users">
            <ul>
              <li v-for="user in users">
                <a>{{user.name}}</a>
              </li>
            </ul>
          </b-tab-item>
          <b-tab-item label="Groups">
            <button type="button" class="button is-success" @click="showModalForNewGroup">New</button>
            <hr>

            <div class="columns" v-for="i in Math.ceil(groups.length / 4)">
              <div class="column is-3" v-for="group in groups.slice((i - 1) * 4, i * 4)">
                <div class="card">
                  <div class="card-content truncate">
                    <a @click="editGroup(group)">
                      <p class="title is-4 truncate">
                        {{group.name}}
                      </p>
                    </a>
                    <p class="subtitle is-6">@{{group.safeName}}</p>

                    <b-tag v-if="group.deleted" type="is-danger">Deleted</b-tag>
                  </div>
                </div>
              </div>
            </div>


          </b-tab-item>
          <b-tab-item label="Projects">
            <ProjectList/>
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
              <li v-for="sample in samples">
                <nuxt-link :to="{ name: 'sample', query: { id: sample._id }}">
                  {{sample.scientificName}}
                </nuxt-link>
              </li>
            </ul>
          </b-tab-item>
        </b-tabs>
      </div>
    </div>
  </div>
</template>

<script>
  import GroupModal from '~/components/groups/editModal.vue';
  import ProjectList from '~/components/projects/ProjectList.vue'

  export default {
    middleware: ['auth', 'admin'],
    components: {GroupModal, ProjectList},
    data() {
      return {
        test: 'some test text',
        usersFilterText: '',
        groupsFilterText: '',
        projectsFilterText: '',


        isGroupModalActive: false,
        groupToEdit: null
        // newGroupLdap: '',
        // newGroupsName: '',
        // groupLdapList: []
      }
    },
    mounted() {
      return Promise.all([
        this.$store.dispatch('refreshProjects'),
        this.$store.dispatch('refreshGroups'),
        this.$store.dispatch('refreshUsers'),
        this.$store.dispatch('refreshSamples')
      ])
    },
    // fetch({store}) {
    // return Promise.all([
    //   store.dispatch('refreshProjects'),
    //   store.dispatch('refreshGroups'),
    //   store.dispatch('refreshUsers'),
    //   store.dispatch('refreshSamples')
    // ])
    // },

    computed: {
      samples() {
        return JSON.parse(JSON.stringify(this.$store.state.samples))
      },
      projects() {
        return JSON.parse(JSON.stringify(this.$store.state.projects))
        // return this.$store.state.projects;
      },
      users() {
        return JSON.parse(JSON.stringify(this.$store.state.users))
        // return this.$store.state.users;
      },
      groups() {
        return JSON.parse(JSON.stringify(this.$store.state.groups))
        // return this.$store.state.groups;
      }
    },
    methods: {
      editGroup(group) {
        this.groupToEdit = group;
        this.isGroupModalActive = true;
      },


      showModalForNewGroup() {
        this.isGroupModalActive = true;
        this.groupToEdit = null;
      },
      promptForNewGroup() {

        this.$buefy.dialog.prompt({
          message: `Group Name`,
          inputAttrs: {
            placeholder: "Neil's Group",
            maxlength: 10
          },
          onConfirm: (value) => this.$buefy.toast.open({
            message: `Added group: ${value}`,
            type: 'is-success'
          })
        })
      }
    }
  }
</script>
