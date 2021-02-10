<template>
    <div class="wrapper">
        <div class="field-description">
            Please select a library type before uploading files. Only upload files that match the file extensions permitted by the library type.
        </div>
        <CollapsibleUploaderHelp />       
    </div>
</template>

<script>
import CollapsibleUploaderHelp from "~/components/formHelpers/CollapsibleUploaderHelp"
export default {
    name: 'UploadRawInfo',
    components: { CollapsibleUploaderHelp },
};
</script>

<style scoped>
.wrapper {
    margin-bottom: 2rem;
}
.field-description {
    margin-bottom: 1rem;
}
</style>