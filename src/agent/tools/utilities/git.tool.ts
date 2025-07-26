import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import simpleGit from 'simple-git';
import path from 'path';
import fs from 'fs/promises';

export const commitChangesTool = tool(
  async ({ repoPath, message }: { repoPath: string; message: string }) => {
    const git = simpleGit(repoPath);
    await git.add('.');
    const summary = await git.commit(message);
    return { committed: summary.commit.length > 0 };
  },
  {
    name: 'commit_changes',
    description: 'Commit all changes in a repository',
    schema: z.object({
      repoPath: z.string().describe('Path to git repository'),
      message: z.string().describe('Commit message')
    })
  }
);

export const applyPatchTool = tool(
  async ({ repoPath, patchContent }: { repoPath: string; patchContent: string }) => {
    const patchPath = path.join(repoPath, 'agent_patch.patch');
    await fs.writeFile(patchPath, patchContent);
    
    const git = simpleGit(repoPath);
    await git.raw(['apply', patchPath]);
    await fs.unlink(patchPath);
    
    return { applied: true };
  },
  {
    name: 'apply_patch',
    description: 'Apply a patch file to the repository',
    schema: z.object({
      repoPath: z.string().describe('Path to git repository'),
      patchContent: z.string().describe('Patch file content')
    })
  }
);