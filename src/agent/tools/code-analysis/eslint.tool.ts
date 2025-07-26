import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { ESLint } from 'eslint';
import * as path from 'path';
import { readFile } from 'fs/promises';

export const eslintAnalyzeTool = tool(
  async ({ filePath }: { filePath: string }) => {
    const configPath = process.env.ESLINT_CONFIG_PATH || '.eslintrc.js';
    const eslint = new ESLint({
      overrideConfigFile: configPath,
      useEslintrc: false,
      fix: false,
      errorOnUnmatchedPattern: false,
    });

    const absolutePath = path.resolve(process.cwd(), filePath);
    const results = await eslint.lintFiles([absolutePath]);

    if (results.length === 0 || !results[0].messages) {
      return { errors: [], warnings: [] };
    }

    const messages = results[0].messages;
    const errors = messages.filter(m => m.severity === 2);
    const warnings = messages.filter(m => m.severity === 1);

    return {
      errors: errors.map(e => ({
        ruleId: e.ruleId,
        message: e.message,
        line: e.line,
        column: e.column,
      })),
      warnings: warnings.map(w => ({
        ruleId: w.ruleId,
        message: w.message,
        line: w.line,
        column: w.column,
      })),
    };
  },
  {
    name: 'eslint_analyze',
    description: 'Analyze a file with ESLint and return errors and warnings.',
    schema: z.object({
      filePath: z.string().describe('Path to the file to analyze'),
    }),
  }
);

export const eslintFixTool = tool(
  async ({ filePath }: { filePath: string }) => {
    const configPath = process.env.ESLINT_CONFIG_PATH || '.eslintrc.js';
    const absolutePath = path.resolve(process.cwd(), filePath);
    const originalContent = await readFile(absolutePath, 'utf8');

    const eslint = new ESLint({
      overrideConfigFile: configPath,
      useEslintrc: false,
      fix: true,
    });

    const [result] = await eslint.lintText(originalContent, { filePath: absolutePath });

    if (result && result.output) {
      return { fixed: true, content: result.output };
    }
    return { fixed: false };
  },
  {
    name: 'eslint_fix',
    description: 'Attempt to fix a file with ESLint and return the fixed content if changed.',
    schema: z.object({
      filePath: z.string().describe('Path to the file to fix'),
    }),
  }
);