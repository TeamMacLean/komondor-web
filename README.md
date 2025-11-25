# komondor

> TSL Sequence Data

## Config
copy `.env.example` to `.env`

### Environment Variables

#### `HPC_DIRECTORY_PREFIX`
The prefix path for HPC directory uploads. This is prepended to user input in the HPC Directory Name field.

- **Production**: `/tsl/data/tempWebUploadToSequences/`
- **Development**: `~/../komondor-api/fake-mnt/tempWebUploadToSequences/`

When a user enters a directory name like "cheese", the full path becomes:
- Production: `/tsl/data/tempWebUploadToSequences/cheese`
- Development: `~/../komondor-api/fake-mnt/tempWebUploadToSequences/cheese`

**Example `.env` for development:**
```
HPC_DIRECTORY_PREFIX=~/../komondor-api/fake-mnt/tempWebUploadToSequences
```

**Example `.env` for production:**
```
HPC_DIRECTORY_PREFIX=/tsl/data/tempWebUploadToSequences
```

**Note:** A trailing slash will be automatically added if not present, so both `tempWebUploadToSequences` and `tempWebUploadToSequences/` work correctly.

If not set, defaults to `/tsl/data/tempWebUploadToSequences/`

## Build Setup

``` bash
# install dependencies
$ npm run install

# serve with hot reload at localhost:3000
$ npm run dev

# build for production and launch server
$ npm run build
$ npm run start

# generate static project
$ npm run generate
```

