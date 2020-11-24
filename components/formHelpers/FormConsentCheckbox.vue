<template>
    <div class="field">
        <b-checkbox v-model="checkbox">
            <!-- TODO remove checked attribute -->
            <!-- TODO add required to b-checkbox -->
            I confirm that I have carefully checked all of my input data for this form, and that it is in its final state.
            I accept that, once submitted, I may not be able to edit these fields, including their submission to ENA.
        </b-checkbox>
    </div>
</template>

<script>
    export default {
        data() {
            return {
                checkbox: true,
            }
        }
    }
</script>

<style>
</style>

