<template>
    <div class="upload-add-files-instructions">
        <b-collapse class="card" :open="collapseOpen" animation="slide" aria-id="contentIdForA11y3">
            <div
                slot="trigger" 
                slot-scope="props"
                class="card-header"
                role="button"
                aria-controls="contentIdForA11y3"
            >
                <p class="card-header-title">
                    Having problems uploading?
                </p>
                <a class="card-header-icon">
                    <b-icon
                        :icon="props.open ? 'menu-up' : 'menu-down'">
                    </b-icon>
                </a>
            </div>
            <div class="card-content">
                <ul>
                    <li>
                        Please try using on the NBI site, with a wired network cable connection.
                    </li>
                    <li>
                        Remote site downloading is not advised.

                        <div class="indent">
                            <b-collapse :open="false" position="is-bottom" aria-id="contentIdForA11y1">
                                <a slot="trigger" slot-scope="props" aria-controls="contentIdForA11y1">
                                    <b-icon :icon="props.open ? 'menu-up' : 'menu-down'"></b-icon>
                                    {{ !props.open ? 'Show me how to optimise remote site downloading anyway' : 'OK, got it!' }}
                                </a>
                                <div class="mega-indent">
                                    <ol type="1">
                                        <li>Upload files to your OneDrive account (without a VPN connection)</li>
                                        <li>
                                            Use a VPN + 
                                            <a target="_blank" rel="noopener noreferrer" href="http://winrds.nbi.ac.uk/">
                                                RDS 
                                                <b-icon
                                                    icon="link"
                                                    size="is-small"
                                                    class="has-text-blue"
                                                />
                                            </a> 
                                            to connect to a virtual remote desktop onsite
                                        </li>
                                        <li>On the RDS, navigate to this site with a browser such as Chrome</li>
                                        <li>Upload files from your OneDrive account to the site</li>
                                    </ol>
                                </div>
                            </b-collapse>
                        </div>


                    </li>
                    <li>
                        Any further questions or problems, then please <a href="mailto:george.deeks@tsl.ac.uk">contact the system administrator</a>.
                    </li>
                </ul>
            </div>
        </b-collapse>
    </div> 
</template>

<script>
export default {
    data() {
        return {
            collapseOpen: false,
        };
    }
};
</script>

<style>
.upload-add-files-instructions {
    padding-top: 0.75rem;
}

.content {
    margin-bottom: 0 !important;
}

ul {
    padding-left: 1rem;
    list-style-type: square;
}

ol {
    list-style-type: decimal;
    
}

.indent {
    margin-left: 0.25rem;
}
.mega-indent {
    margin-left: 1.5rem;
}
</style>


