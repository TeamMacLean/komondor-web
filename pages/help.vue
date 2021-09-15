<template>
  <div class="section">
    <div class="container">
      <h1 class="title">FAQ</h1>

      <p>
        Welcome to sequences.tsl.ac.uk. This site is for uploading raw sequence
        data to the HPC, to better preserve it. If you have raw sequence data,
        and you want to use it on the HPC it needs to be registered on this
        site!
      </p>

      <h3 class="subtitle-override">How are data organised?</h3>

      <p>
        The top level container is the 'project', this holds the metadata about
        the study and is made of many 'samples' (which are equivalent to
        different experimental conditions) and in turn a 'sample' holds many
        'runs' (which are roughly similar to runs of a sequencer machine).
      </p>

      <h3 class="subtitle-override">Do you upload to ENA?</h3>

      <p>
        We can only do this on request now. As the tools at ENA for moving data
        around have changed we're restricted on what editing we can do.
        Previously we could release part of a project/study but now it has to be
        all or nothing. This means that if we upload something you don't want
        released yet and it's in the same project as something you do need to
        release then we'd have to release everything. Please try to contact us
        as soon as possible so we can upload in a timely fashion.
      </p>

      <h3 class="subtitle-override">How do I add my data?</h3>

      <p>
        For a detailed description please see the tutorial
        <a href="/upload-instructions.html">here.</a>
      </p>

      <p>Briefly, to create a project, click the ‘New Project’ button.</p>

      <p>
        To create a sample, find the ‘parent’ project you wish it to belong to,
        then on the overview page for that project, you’ll find a ‘New Sample’
        button.
      </p>

      <p>
        To create a run, find the ‘parent’ sample you wish it to belong to, then
        on the overview page for that sample, you’ll find a ‘New Run’ button.
      </p>

      <p>For all of these, you'll then have a form to fill out and submit.</p>

      <p>
        A ‘New Run’ form includes the chance to upload all of your reads data
        files.
      </p>

      <h3 class="subtitle-override">How do I correct a mistake?</h3>

      <p>
        It is super important to note that the forms are designed in such a way
        that you should enter information once, and get it correct first time
        around. The view of the Bioinformatics department is that you should not
        be making any mistakes at this stage. Once you click the checkbox to say
        you agree you have entered all information reliably, we cannot guarantee
        that we can correct any mistakes you realise afterwards!
      </p>

      <h3 class="subtitle-override">
        Which PROJECTS, SAMPLES & RUNS can I see?
      </h3>

      <p>
        You will be able to view all the projects, samples and runs that you
        have user group permissions for. To view more than this, please speak to
        a member of the Bioinformatics team.
      </p>

      <h3 class="subtitle-override">How do I get my files in?</h3>

      <p>
        Uploading large files is the trickiest technical challenge of this
        website. Slow/remote connections cause problems. Please upload your
        files on site, connecting your computer to the network via a cable! The
        website was designed to optimise this uploading process. Resume-able
        file uploading should now be a thing, for example, whereas it wasn’t in
        datahog.
      </p>

      <p>
        Uploaded files will initially be stored on the server. Once you have
        these files uploaded via the web form, and filled out the rest of the
        web form, submit! They will then be processed and sent to the correct
        path on the HPC.
      </p>

      <p>
        Files that are not successfully uploaded to the HPC from the server will
        be held there, 'in limbo', for up to 7 days, and then they will be
        destroyed.
      </p>

      <h3 class="subtitle-override">
        How will I know if it worked (SUCCESSFUL SUBMISSIONS)
      </h3>

      <p>
        When you successfully submit, you’ll see the overview page for that
        project/sample/run which you just created. This page will also list
        files registered with that project/sample/run that are currently on the
        HPC. For very large files, it may take a while for just-uploaded files
        to appear here - but probably not longer than an hour. It is always
        important to check the files have (eventually) arrived to their
        destination, so keep checking the page, or indeed contact me for
        support.
      </p>

      <h3 class="subtitle-override">
        What if it didn't work ? (UNSUCCESSFUL SUBMISSIONS)
      </h3>

      <!-- TODO mail link for my email -->
      <p>
        Unsuccessful form submissions will return an error. I’m hoping to
        improve the error handling experience for the user in the future. At the
        moment, if you run into any problems, the likely advice from the website
        will be to contact me (george.deeks@tsl.ac.uk), so I can untangle the
        data and figure out what went wrong myself.
      </p>

      <p>
        If you report an error to me, please give as much information as
        possible to work with.
      </p>

      <h3 class="subtitle-override">Can the site do X?</h3>

      <p>
        Maybe. If you have an idea for a feature, please share it. Extra
        features will occasionally be added, based on optimising the site and
        feedback from user experience.
      </p>

      <h3 class="subtitle-override">ANY FURTHER QUESTIONS OR PROBLEMS?</h3>
      <!-- TODO mail link for my email -->
      <p>
        For any more questions or information, or to help solve a problem you
        have encountered, then please don't hesitate to contact me:
        george.deeks@tsl.ac.uk.
      </p>
    </div>
  </div>
</template>
<style scoped>
p {
  margin-bottom: 1rem;
}
.subtitle-override {
  margin-top: 2rem;
  margin-bottom: 1.5rem;
  font-weight: 700;
}
</style>
