<template>
  <form @submit.prevent="postForm">
    <div class="modal-card" style="width: auto">
      <header class="modal-card-head">
        <p class="modal-card-title">Library Type</p>
      </header>
      <section class="modal-card-body">
        <b-field label="Name">
          <b-input type="text" placeholder="FASTQ - unpaired" v-model="name" required></b-input>
        </b-field>

        <label class="checkbox">
          <input type="checkbox" v-model="paired" />
          Paired/Mated
        </label>
      </section>
      <footer class="modal-card-foot">
        <button class="button" type="button" @click="$parent.close()">Cancel</button>
        <button class="button is-primary" type="submit">Add</button>
      </footer>
    </div>
  </form>
</template>

<script>
export default {
  props: ["postForm", "name", "paired"]
};
</script>