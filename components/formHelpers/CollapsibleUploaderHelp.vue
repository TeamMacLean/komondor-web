<template>
    <div class="wrapper">
        <!-- default main collapsible to false; use <script></script> to bind value programmatically -->
        <b-collapse class="card" :open="false" animation="slide" aria-id="collapsible-component-wrapper">
            <div
                slot="trigger" 
                slot-scope="props"
                class="card-header"
                role="button"
                aria-controls="collapsible-component-wrapper"
            >
                <p class="card-header-title">
                    Having problems uploading?
                </p>
                <a class="card-header-icon">
                    <!-- NB b-icon receives props.open from b-collapse open bound prop + trigger slot -->
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

                        <div class="subcontent-indent-small">
                            <!-- default subcontent collapsible to false -->
                            <b-collapse 
                                :open="false" 
                                position="is-bottom" 
                                aria-id="remote-download-faq"
                            >
                                <a slot="trigger" slot-scope="props" aria-controls="remote-download-faq">
                                    <b-icon :icon="props.open ? 'menu-up' : 'menu-down'"></b-icon>
                                    {{ !props.open ? 'Show me how to optimise remote site downloading anyway' : 'OK, got it!' }}
                                </a>
                                <div class="subcontent-indent-large">
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

<!-- no <script></script> needed -->

<style>
.wrapper {
    padding-top: 0.75rem;
}
.content {
    /* ensures collapsible body expands absolutely down */
    margin-bottom: 0 !important;
}
ul {
    padding-left: 1rem;
    list-style-type: square;
}
ol {
    list-style-type: decimal;   
}
.subcontent-indent-small {
    margin-left: 0.25rem;
}
.subcontent-indent-large {
    margin-left: 1.5rem;
}
</style>


