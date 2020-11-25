<template>
    <div class="field" @click=check()>
        <b-checkbox type="checkbox" v-model="checked" required>
            I confirm that I have carefully checked all of my input data for this form, and that it is in its final state.
            I accept that, once submitted, I may not be able to edit these fields, including their submission to ENA.    
        </b-checkbox>
    </div>
</template>

<script>
    export default {
        props: ['initialVal', 'onToggle'],
        data() {
            return {
                checked: !!this.initialVal, // defaults to false if no value supplied
            }
        },
        methods: {
            check: function() {
                // report the opposite of the pre-toggled state
                const newState = !this.checked;
                if (!!this.onToggle){
                    this.onToggle(newState)
                }
            }
        }
    }
</script>

<style>
</style>
