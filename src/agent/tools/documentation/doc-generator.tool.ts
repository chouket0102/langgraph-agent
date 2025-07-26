// @ts-nocheck
import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import MarkdownIt from 'markdown-it';

const md = new MarkdownIt();

export const generateDocumentationTool = tool(
  async ({ filePath, code }: { filePath: string; code: string }) => {
    const llm = new ChatOpenAI({
      modelName: process.env.CODE_REVIEW_MODEL || 'gpt-4-turbo-preview',
      temperature: 0.1
    });

    const response = await llm.invoke([
      new SystemMessage(`You are a technical writer. Generate documentation for this code:
- Purpose and functionality
- Key classes/functions with parameters
- Usage examples
- Architectural considerations
      
Return documentation in Markdown format`),
      new HumanMessage(`File: ${filePath}\n\nCode:\n\`\`\`\n${code}\n\`\`\``)
    ]);

    const documentation = response.content.toString();
    return {
      markdown: documentation,
      html: md.render(documentation)
    };
  },
  {
    name: 'generate_documentation',
    description: 'Generate documentation for a code file',
    schema: z.object({
      filePath: z.string().describe('Path to the file'),
      code: z.string().describe('File content')
    })
  }
);

export const updateReadmeTool = tool(
  async ({ readmePath, changes }: { readmePath: string; changes: string }) => {
    const fs = await import('fs/promises');
    let content = '';
    
    try {
      content = await fs.readFile(readmePath, 'utf8');
    } catch {
      content = '# Project Documentation\n\n';
    }

    const date = new Date().toISOString().split('T')[0];
    const updateSection = `## Updates (${date})\n\n${changes}\n\n`;
    
    // Add after main header
    const headerEnd = content.indexOf('\n\n') + 2;
    return {
      updatedContent: content.slice(0, headerEnd) + updateSection + content.slice(headerEnd)
    };
  },
  {
    name: 'update_readme',
    description: 'Update README with new changes',
    schema: z.object({
      readmePath: z.string().describe('Path to README.md'),
      changes: z.string().describe('Markdown content to add')
    })
  }
);