<template>
  <div class="section">
    <div class="container">
      <h1 class="title">FAQ</h1>

        <p class='content'>Welcome to Komondor, replacement for the DataHog site! This site is for uploading raw sequence data to the HPC, to better preserve it. If you have raw sequence data, it needs to be registered on this site! </p>

        <p class='content'>Hopefully using this website is intuitive, and fairly similar to datahog. Nevertheless here are helpers on important topics, based on questions we have received about this site.</p>

        <h3 class='subtitle'>VIEWING PROJECTS, SAMPLES & RUNS</h3>

        <p class='content'>You will be able to view all the projects, samples and runs that you have user group permissions for. To view more than this, please speak to a member of the Bioinformatics team.</p>

        <h3 class='subtitle'>CREATING PROJECTS, SAMPLES & RUNS</h3>

        <p class='content'>To create a project, click the ‘New Project’ button.</p>
        <p class='content'>To create a sample, find the ‘parent’ project you wish it to belong to, then on the overview page for that project, you’ll find a ‘New Sample’ button.</p>
        <p class='content'>To create a run, find the ‘parent’ sample you wish it to belong to, then on the overview page for that sample, you’ll find a ‘New Run’ button.</p>

        <p class='content'>For all of these, you'll then have a form to fill out and submit.</p>

        <p class='content'>A ‘New Run’ form includes the chance to upload all of your reads data files.</p>

        <p class='content'>A project, sample or run will also give you the chance to upload any 'additional files' - but please note, these additional files uploaders are different to the 1 specific file uploader on a 'new run' form where you upload reads data files.</p>

        <p class='content'>It is <b>super important</b> to note that the forms are designed in such a way that you should enter information once, and get it correct first time around. The view of the Bioinformatics department is that you should not be making any mistakes at this stage. Once you click the checkbox to say you agree you have entered all information reliably, we cannot guarantee that we can correct any mistakes you realise afterwards!</p>

        <h3 class='subtitle'>UPLOADING FILES</h3>

        <p class='content'>Uploading large files is the trickiest technical challenge of this website. Slow/remote connections cause problems. Please upload your files on site, connecting your computer to the network via a cable! The website was designed to optimise this uploading process. Resume-able file uploading should now be a thing, for example, whereas it wasn’t in datahog.</p>

        <p class='content'>Uploaded files will initially be stored on the Komondor server. Once you have these files uploaded via the web form, and filled out the rest of the web form, submit! They will then be processed and sent to the correct path on the HPC.</p>

        <p class='content'>Files that are not successfully uploaded to the HPC from the Komondor server will be held there, 'in limbo', for up to 7 days, and then they will be destroyed.</p>

        <h3 class='subtitle'>SUCCESSFUL SUBMISSIONS</h3>

        <p class='content'>When you successfully submit, you’ll see the overview page for that project/sample/run which you just created. This page will also list files registered with that project/sample/run that are currently on the HPC. For very large files, it may take a while for just-uploaded files to appear here - but probably not longer than an hour. It is always important to check the files have (eventually) arrived to their destination, so keep checking the page, or indeed contact me for support.</p>

        <h3 class='subtitle'>UNSUCCESSFUL SUBMISSIONS</h3>

        <p class='content'>Unsuccessful form submissions will return an error. I’m hoping to improve the error handling experience for the user in the future (November 2020). At the moment, if you run into any problems, the likely advice from the website will be to contact me (george.deeks@tsl.ac.uk), so I can untangle the data and figure out what went wrong myself.</p>

        <p class='content'>If you report an error to me, please give as much information as possible to work with.</p>

        <h3 class='subtitle'>CAN THE SITE DO X?</h3>

        <p class='content'>Maybe. If you have an idea for a feature, please share it. Extra features will occassionally be added, based on optimising the site and feedback from user experience.</p>

        <h3 class='subtitle'>ANY FURTHER QUESTIONS OR PROBLEMS?</h3>
        <!-- TODO 'mailto webadmin' component (a link that takes title and body args) -->
        <p class='content'>For any more questions or information, or to help solve a problem you have encountered, then please don't hesitate to contact me: george.deeks@tsl.ac.uk.</p>
    </div>
  </div>
</template>
