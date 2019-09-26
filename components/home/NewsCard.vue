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
          <strong>{{news.user}}</strong>
        </nuxt-link>
        {{news.title}}
        <span class="has-text-grey is-size-7" style="margin-left:8px;">{{news.dateHuman}}</span>
      </p>
      <div class="card">

        <div class="card-content">
          <div class="content">
            <nuxt-link :to="news.link" class="title is-5  break-all">
              <b-icon
                v-if="news.type === 'project'"
                icon="alpha-p-box-outline"
                class="has-text-grey"
                size="is-small">
              </b-icon>
              <b-icon
                v-if="news.type === 'sample'"
                icon="alpha-s-box-outline"
                class="has-text-grey"
                size="is-small">
              </b-icon>
              {{news.name}}
            </nuxt-link>
            <p class="has-text-grey is-size-6">
              {{bodyLimited}}
            </p>
          </div>
        </div>
      </div>
    <!--</div>&lt;!&ndash;news right&ndash;&gt;-->
  </div>
</template>

<script>
  export default {
    props: ['news'],
    computed: {
      bodyLimited() {
        const maxLength = 200;
        return this.news.body.length < maxLength ? this.news.body : this.news.body.substr(0, maxLength) + '...';
      }
    }
  }
</script>
