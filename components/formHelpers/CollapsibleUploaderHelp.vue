<template>
    <div class="wrapper">
        <b-collapse class="card" :open="false" animation="slide" aria-id="collapsible-component-wrapper">
        <!-- 
            https://buefy.org/documentation/collapse/
            https://vuejs.org/v2/guide/components-slots.html 

            b-collapse has a <slot></slot> called 'trigger' as its first child that will trigger parent collapse toggle 
            let's fill this with a <template></template> that will have access to this b-collapse's props 
            (where we have a bound prop 'open' defauled to a value of false)
        -->
            <template #trigger="props">
                <div
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
            </template>
            <div class="card-content">
                <ul>
                    <li>
                        Please try using on the NBI site, with a wired network cable connection.
                    </li>
                    <li>
                        Remote site downloading is not advised.

                        <div class="subcontent-indent-small">
                            <!-- 
                                in this use of b-collapse, we have 2nd child, which is content displayed based on parent collapse status
                                (which we control with first child <a></a>)
                            -->
                            <b-collapse :open="false" position="is-bottom" aria-id="remote-download-faq">
                                <template #trigger="props">                                        
                                    <a aria-controls="remote-download-faq">
                                        <b-icon :icon="props.open ? 'menu-up' : 'menu-down'"></b-icon>
                                        {{ props.open ? 'OK, got it!' : 'Show me how to optimise remote site downloading anyway' }}
                                    </a>
                                </template>
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
                        Please use a modern browser, i.e. a recent version of: Chrome, Firefox, Edge, Safari. (Not for example Internet Explorer 11!)
                    </li>
                    <li>
                        Max file upload size is 100GB. Please <a href="mailto:george.deeks@tsl.ac.uk">contact the system administrator</a> if your file size is going to be larger than this.
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


