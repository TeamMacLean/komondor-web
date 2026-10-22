import { describe, expect, it } from "vitest";
import AdditionalFileList from "~/components/AdditionalFileList.vue";
import ReadList from "~/components/ReadList.vue";

describe("API-provided file locations", () => {
  it.each([ReadList, AdditionalFileList])("copies the exact stored location without rebuilding raw/additional paths", (component) => {
    expect(component.methods.getFullFilePath.call({}, { originalName: "old.fastq.txt", path: "/p/processed/new.fastq", locationUri: "s3://bucket/group/p/processed/new.fastq" })).toBe("s3://bucket/group/p/processed/new.fastq");
    expect(component.methods.getFullFilePath.call({ location: { rawUri: "/guessed" } }, { originalName: "old.fastq" })).toBe("");
  });
  it("appends a read filename to the API's raw URI", () => {
    expect(
      ReadList.methods.getFullFilePath.call(
        { location: { rawUri: "s3://archive/data/project/run/raw/" } },
        "read one.fastq.gz"
      )
    ).toBe("s3://archive/data/project/run/raw/read one.fastq.gz");
  });

  it("appends an additional filename to the API's additional URI", () => {
    expect(
      AdditionalFileList.methods.getFullFilePath.call(
        {
          location: {
            additionalUri: "s3://archive/data/project/additional",
          },
        },
        "notes.pdf"
      )
    ).toBe("s3://archive/data/project/additional/notes.pdf");
  });

  it("does not invent a path when the API supplies no location", () => {
    expect(
      ReadList.methods.getFullFilePath.call({ location: null }, "read.fastq")
    ).toBe("");
  });

  it("labels an archived checksum as historical", () => {
    const status = ReadList.methods.md5Status.call(
      {
        archived: true,
        readOnly: true,
        runStatus: "complete",
        isAllowedExtension: () => true,
      },
      {
        file: { originalName: "read.fastq.gz" },
        MD5: "abc",
        destinationMd5: "abc",
        md5Mismatch: false,
      }
    );

    expect(status.text).toBe("Verified before archive");
  });
});
