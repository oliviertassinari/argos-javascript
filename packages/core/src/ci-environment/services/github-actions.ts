import { execSync } from "child_process";
import type { Service, Context } from "../types";

const getSha = ({ env }: Context) => {
  const isPr =
    env.GITHUB_EVENT_NAME === "pull_request" ||
    env.GITHUB_EVENT_NAME === "pull_request_target";

  if (isPr) {
    const mergeCommitRegex = /^[a-z0-9]{40} [a-z0-9]{40}$/;
    const mergeCommitMessage = execSync("git show --no-patch --format=%P")
      .toString()
      .trim();
    // console.log(
    //   `Handling PR with parent hash(es) '${mergeCommitMessage}' of current commit.`
    // );
    if (mergeCommitRegex.exec(mergeCommitMessage)) {
      const mergeCommit = mergeCommitMessage.split(" ")[1];
      // console.log(
      //   `Fixing merge commit SHA ${process.env.GITHUB_SHA} -> ${mergeCommit}`
      // );
      return mergeCommit;
    } else if (mergeCommitMessage === "") {
      console.error(
        `Error: automatic detection of commit SHA failed.

Please run "actions/checkout" with "fetch-depth: 2". Example:

    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 2

`
      );
      process.exit(1);
    } else {
      console.error(
        `Commit with SHA ${process.env.GITHUB_SHA} is not a valid commit`
      );
      process.exit(1);
    }
  }

  return process.env.GITHUB_SHA ?? null;
};

function getBranch({ env }: Context) {
  if (env.GITHUB_HEAD_REF) {
    return env.GITHUB_HEAD_REF;
  }

  const branchRegex = /refs\/heads\/(.*)/;
  const branchMatches = branchRegex.exec(env.GITHUB_REF || "");
  if (branchMatches) {
    return branchMatches[1];
  }

  return null;
}

const service: Service = {
  detect: ({ env }) => Boolean(env.GITHUB_ACTIONS),
  config: ({ env }) => ({
    name: "GiHub Actions",
    commit: getSha({ env }),
    branch: getBranch({ env }),
  }),
};

export default service;
