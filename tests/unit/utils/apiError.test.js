import { describe, it, expect } from "vitest";
import {
  GENERIC_ERROR_MESSAGE,
  NETWORK_ERROR_MESSAGE,
  readErrorBody,
  isBodyError,
  getApiErrorMessage,
  getApiErrorStatus,
  describeDirectoryError,
} from "~/utils/apiError";

/**
 * Builds an axios-shaped rejection. axios marks its own errors with `config`,
 * which is how the helper tells "the request failed" from "our code threw".
 */
const axiosRejection = (status, data) => {
  const err = new Error(`Request failed with status code ${status}`);
  err.isAxiosError = true;
  err.config = { url: "/anything", method: "get" };
  err.response = { status, data };
  return err;
};

/** A request that never got a response: down API, CORS, dropped connection. */
const networkRejection = () => {
  const err = new Error("Network Error");
  err.isAxiosError = true;
  err.config = { url: "/anything", method: "get" };
  return err;
};

describe("readErrorBody", () => {
  it("reads the `error` field that komondor-api's handleError sends", () => {
    expect(readErrorBody({ error: "Option not found" })).toBe(
      "Option not found"
    );
  });

  it("reads the `message` field that only /login sends", () => {
    expect(readErrorBody({ message: "Bad credentials" })).toBe(
      "Bad credentials"
    );
  });

  it("prefers `error` when a body carries both", () => {
    expect(readErrorBody({ error: "real reason", message: "other" })).toBe(
      "real reason"
    );
  });

  it("ignores a non-string `error` — an Error serialises to {}", () => {
    expect(readErrorBody({ error: {} })).toBe("");
    expect(readErrorBody({ error: { code: 11000 } })).toBe("");
  });

  it("ignores whitespace-only text", () => {
    expect(readErrorBody({ error: "   " })).toBe("");
  });

  it("returns empty for a body with no error at all", () => {
    expect(readErrorBody({ options: [] })).toBe("");
    expect(readErrorBody(null)).toBe("");
    expect(readErrorBody(undefined)).toBe("");
    expect(readErrorBody("a string body")).toBe("");
  });
});

describe("isBodyError", () => {
  // /read-file and /directory-files signal failure at 200.
  it("is true for a 200 that carries an error", () => {
    expect(
      isBodyError({
        status: 200,
        data: { error: "No files found in target directory" },
      })
    ).toBe(true);
  });

  it("is false for a successful listing", () => {
    expect(
      isBodyError({ status: 200, data: { filesResults: ["a.fastq"] } })
    ).toBe(false);
  });

  it("is false for an empty results array, which is a valid answer", () => {
    expect(isBodyError({ status: 200, data: { filesResults: [] } })).toBe(
      false
    );
  });
});

describe("getApiErrorMessage", () => {
  it("reads the API's reason off a non-2xx rejection", () => {
    const err = axiosRejection(400, {
      error: '"value" is required and must be a non-empty string',
      detail: '"value" is required and must be a non-empty string',
      requestId: "1785339914577-pymkceb4s",
    });
    expect(getApiErrorMessage(err)).toBe(
      '"value" is required and must be a non-empty string'
    );
  });

  it("reads /login's `message`, which the old code missed entirely", () => {
    const err = axiosRejection(401, { message: "Bad credentials" });
    // The regression this replaced: err.message is
    // "Request failed with status code 401".
    expect(getApiErrorMessage(err)).toBe("Bad credentials");
    expect(getApiErrorMessage(err)).not.toContain("status code");
  });

  it("never surfaces axios's own 'Request failed with status code' text", () => {
    const err = axiosRejection(500, {});
    expect(getApiErrorMessage(err)).toBe(GENERIC_ERROR_MESSAGE);
  });

  it("describes a request that never reached the server", () => {
    expect(getApiErrorMessage(networkRejection())).toBe(NETWORK_ERROR_MESSAGE);
  });

  it("accepts a resolved 200 response carrying an error body", () => {
    const response = {
      status: 200,
      data: { error: "Directory does not exist" },
    };
    expect(getApiErrorMessage(response)).toBe("Directory does not exist");
  });

  it("shows the message of an Error our own code threw", () => {
    expect(getApiErrorMessage(new Error("Checksum file was empty"))).toBe(
      "Checksum file was empty"
    );
  });

  it("passes a string through unchanged", () => {
    expect(getApiErrorMessage("already a message")).toBe("already a message");
  });

  it("falls back when there is nothing to say", () => {
    expect(getApiErrorMessage(null)).toBe(GENERIC_ERROR_MESSAGE);
    expect(getApiErrorMessage(undefined, { fallback: "custom" })).toBe(
      "custom"
    );
    expect(getApiErrorMessage("", { fallback: "custom" })).toBe("custom");
  });

  it("uses the caller's fallback rather than the generic one", () => {
    const err = axiosRejection(500, {});
    expect(
      getApiErrorMessage(err, { fallback: 'Could not delete "BAM".' })
    ).toBe('Could not delete "BAM".');
  });

  describe("includeRef", () => {
    it("appends the API's request id when asked", () => {
      const err = axiosRejection(500, {
        error: "Failed to calculate MD5",
        requestId: "abc-123",
      });
      expect(getApiErrorMessage(err, { includeRef: true })).toBe(
        "Failed to calculate MD5 (Ref: abc-123)"
      );
    });

    it("is off by default, so routine messages stay short", () => {
      const err = axiosRejection(400, {
        error: "bad input",
        requestId: "abc-123",
      });
      expect(getApiErrorMessage(err)).toBe("bad input");
    });

    it("adds nothing when the body carries no request id", () => {
      const err = axiosRejection(500, { error: "Failed" });
      expect(getApiErrorMessage(err, { includeRef: true })).toBe("Failed");
    });
  });
});

describe("getApiErrorStatus", () => {
  it("returns the status of a failed response", () => {
    expect(getApiErrorStatus(axiosRejection(404, {}))).toBe(404);
    expect(getApiErrorStatus(axiosRejection(403, {}))).toBe(403);
  });

  it("returns null when the request never completed", () => {
    expect(getApiErrorStatus(networkRejection())).toBeNull();
    expect(getApiErrorStatus(new Error("boom"))).toBeNull();
    expect(getApiErrorStatus(null)).toBeNull();
  });
});

describe("describeDirectoryError", () => {
  const PATH = "/tsl/data/tempWebUploadToSequences/my-reads";

  // These four are the live failure modes of GET /directory-files, verified
  // against a running komondor-api.
  it("describes an unreadable directory (200 body error)", () => {
    const response = { data: { error: "Issue reading target directory" } };
    expect(describeDirectoryError(response, PATH)).toBe(
      `Cannot access directory: the path "${PATH}" could not be read.`
    );
  });

  it("describes a missing directory", () => {
    const response = { data: { error: "Directory does not exist" } };
    expect(describeDirectoryError(response, PATH)).toContain("does not exist");
    expect(describeDirectoryError(response, PATH)).toContain(PATH);
  });

  it("describes an empty directory", () => {
    const response = { data: { error: "No files found in target directory" } };
    expect(describeDirectoryError(response, PATH)).toBe(
      `Empty directory: the directory "${PATH}" exists but contains no files.`
    );
  });

  it("describes a refused path, which arrives as a 403 rejection", () => {
    const err = axiosRejection(403, {
      error: "Access denied: Invalid directory path",
    });
    expect(describeDirectoryError(err, PATH)).toContain(
      "outside the HPC transfer area"
    );
  });

  it("tolerates rewording, where the old exact === did not", () => {
    // The previous implementation compared against the literal string
    // "Directory does not exist" and fell through on anything else.
    const reworded = { data: { error: "directory does not exist." } };
    expect(describeDirectoryError(reworded, PATH)).toContain(
      "Directory not found"
    );
  });

  it("still names the path when the message is unrecognised", () => {
    const response = { data: { error: "Something entirely new" } };
    const message = describeDirectoryError(response, PATH);
    expect(message).toContain("Something entirely new");
    expect(message).toContain(PATH);
  });

  it("degrades to a usable message when there is no reason at all", () => {
    expect(describeDirectoryError(networkRejection(), PATH)).toContain(
      NETWORK_ERROR_MESSAGE
    );
  });
});
