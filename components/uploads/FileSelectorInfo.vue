<template>
  <div class="nb-padding">
    <p><b>Please read:</b></p>
    <ul class="info-list">
      <li>
        'HPC upload' is the recommended way to upload large raw files to the
        HPC. This is because it is the fastest and most reliable method.
        Choosing this covers most use cases. Please use the 'Local filesystem
        upload' method instead (click tab above) if you require a simpler method
        for smaller files. Remember, we have a step-by-step guide to helping you
        with this form
        <a href="/upload-instructions.html">here</a>.
      </li>
      <li>
        Before using this method, you should create a parent directory in
        <code>/tsl/data/tempWebUploadToSequences</code> that contains a
        subdirectory for each run submission you wish to make over a short
        period of time. To submit 2 runs for a sample for instance, you could
        create a <code>deeks-sample-3945</code> directory, and then create a
        <code>run1</code> and <code>run2</code> subdirectory within that. This
        is to help you keep track of your data and upload it efficiently, and to
        help us keep track of it too.
      </li>
      <li>
        Use the below searchbox to find the specific subdirectory that pertains
        to this run submission. This must be the exact path to the specific
        directory that ONLY contains the raw read files for this particular run
        (plus their associated checksum files, optionally). You cannot have any
        other files in there - for example, raw read files for other runs you
        want to submit, or explanatory .pdf files for this run (you must use
        'Additional Files', see below).
      </li>
      <li>
        You may upload .md5 files in addition to raw reads files here, but you
        must also specify the string MD5 value for each file before proceeding
        in the relevant part of the form (see below).
      </li>
      <li>
        <code>/tsl/data/tempWebUploadToSequences</code> is only a TEMPORARY
        storage space on the HPC for use with this web form. Please be
        considerate of others when creating directories. You should remove data
        from it when you are finished submitting. Submitted files will be moved
        to their destination folder, leaving an empty directory that must be
        tidied by YOU shortly afterwards. Both empty and untouched directories
        may be removed automatically from this location unless you otherwise
        <a href="mailto:george.deeks@tsl.ac.uk">request us</a>. Please do not
        use this location to work out of or as your only copy of your data!
      </li>
      <li>
        This field is not for uploading associated additional files; instead,
        see below.
      </li>
    </ul>
  </div>
</template>
