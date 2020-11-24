<template>
  <div class="news-item">
    <!--<div class="news-left">-->
    <!--<b-icon-->
    <!--icon="account"-->
    <!--size="is-medium"-->
    <!--type="is-black">-->
    <!--</b-icon>-->
    <!--</div>-->
    <!--<div class="news-right">-->

    <p style="margin-bottom:8px;">
      <nuxt-link :to="{name:'user', query:{username:news.user}}" class="has-text-black">
        <strong>{{this.getAuthor(news.user)}}</strong>
      </nuxt-link>
      created a new {{news.type}}
      <span
        class="has-text-grey is-size-7"
        style="margin-left:8px;"
      >
        {{this.getDateInfo}}
        {{/** TODO: if timestamp is around the time of the/a migration, then change this to
              something like 'imported from datahog'
         */}}
      </span>
    </p>
    <div class="card">
      <div class="card-content">
        <div class="content">
          <nuxt-link :to="news.link" class="title is-5 break-all">
            <b-icon icon="folder-text-outline" size="is-small" class="has-text-grey" v-if="news.type === 'project'"></b-icon>
            <b-icon icon="flask-outline" size="is-small" class="has-text-grey" v-if="news.type === 'sample'"></b-icon>

            {{news.name}}
          </nuxt-link>
          <p class="has-text-grey is-size-6">{{bodyLimited}}</p>
        </div>
      </div>
    </div>
    <!--</div>&lt;!&ndash;news right&ndash;&gt;-->
  </div>
</template>

<script>

export default {
  props: ["news"],
  data() {
    return {
      komondorEntryStartTime: null,
    };
  },
  mounted() {
    this.komondorEntryStartTime = process.env.DATAHOG_DEATH;    
  },
  computed: {
    bodyLimited() {
      const maxLength = 200;
      return this.news.body.length < maxLength
        ? this.news.body
        : this.news.body.substr(0, maxLength) + "...";
    },
    getDateInfo(){
      var newsDate = (new Date(this.news.date).getTime() / 1000)

      // console.log(
      //   'sorted', 
      //   [
      //     {'name': 'now', timestamp: (new Date().getTime() / 1000)}, 
      //     {'name': this.news.name, timestamp: newsDate}, 
      //     {'name': 'historic-migration', timestamp: this.komondorEntryStartTime}, 
      //   ].sort((a, b) => (a.timestamp > b.timestamp) ? -1 : 1).map(obj => obj.name)
      // );      

      if (newsDate > this.komondorEntryStartTime){        
        return this.news.dateHuman;
      } else {
        return '(migrated from old database)'
      }      
    }
  },
  methods: {
    getAuthor(user) {
      return user === 'unknown' ? 'Anonymous' : user;
    }
  }
};
</script>
