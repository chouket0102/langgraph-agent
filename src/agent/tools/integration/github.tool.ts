import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { Octokit } from '@octokit/rest';

// Initialize Octokit
const getOctokit = () => new Octokit({
  auth: process.env.GITHUB_TOKEN
});

export const getPRDetailsTool = tool(
  async ({ owner, repo, prNumber }: { owner: string; repo: string; prNumber: number }) => {
    const octokit = getOctokit();
    const { data } = await octokit.pulls.get({ owner, repo, pull_number: prNumber });
    return {
      title: data.title,
      state: data.state,
      changedFiles: data.changed_files,
      additions: data.additions,
      deletions: data.deletions,
      baseBranch: data.base.ref,
      headBranch: data.head.ref
    };
  },
  {
    name: 'get_pr_details',
    description: 'Get details of a GitHub pull request',
    schema: z.object({
      owner: z.string().describe('Repository owner'),
      repo: z.string().describe('Repository name'),
      prNumber: z.number().describe('Pull request number')
    })
  }
);

export const createPRCommentTool = tool(
  async ({ owner, repo, prNumber, body }: { 
    owner: string; 
    repo: string; 
    prNumber: number; 
    body: string 
  }) => {
    const octokit = getOctokit();
    const { data } = await octokit.issues.createComment({
      owner,
      repo,
      issue_number: prNumber,
      body
    });
    return { id: data.id, url: data.html_url };
  },
  {
    name: 'create_pr_comment',
    description: 'Create comment on a GitHub pull request',
    schema: z.object({
      owner: z.string().describe('Repository owner'),
      repo: z.string().describe('Repository name'),
      prNumber: z.number().describe('Pull request number'),
      body: z.string().describe('Comment content (Markdown supported)')
    })
  }
);

export const mergePRTool = tool(
  async ({ owner, repo, prNumber }: { owner: string; repo: string; prNumber: number }) => {
    const octokit = getOctokit();
    const { data } = await octokit.pulls.merge({
      owner,
      repo,
      pull_number: prNumber
    });
    return { merged: data.merged, message: data.message };
  },
  {
    name: 'merge_pr',
    description: 'Merge a GitHub pull request',
    schema: z.object({
      owner: z.string().describe('Repository owner'),
      repo: z.string().describe('Repository name'),
      prNumber: z.number().describe('Pull request number')
    })
  }
);