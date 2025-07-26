// @ts-nocheck
import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import * as parser from '@babel/parser';
import traverse from '@babel/traverse';
import { BlockStatement } from '@babel/types';
import * as complexity from 'typhonjs-escomplex';
import { readFile } from 'fs/promises';

export const codeComplexityTool = tool(
  async ({ filePath }: { filePath: string }) => {
    const code = await readFile(filePath, 'utf8');
    const ast = parser.parse(code, {
      sourceType: 'module',
      plugins: ['typescript', 'jsx']
    });

    // Overall complexity
    const report = complexity.analyzeModule(code, {});
    
    // Function-level complexity
    const functions: any[] = [];
    const processFunction = (node: any, type: string) => {
      const calculator = new complexity.ComplexityCalculator();
      const functionComplexity = calculator.calculate(node.body as BlockStatement);
      
      functions.push({
        name: node.id?.name || `Anonymous ${type}`,
        complexity: functionComplexity.cyclomatic,
        line: node.loc?.start.line || 0
      });
    };

    traverse(ast, {
      FunctionDeclaration(path) { processFunction(path.node, 'FunctionDeclaration'); },
      FunctionExpression(path) { processFunction(path.node, 'FunctionExpression'); },
      ArrowFunctionExpression(path) { processFunction(path.node, 'ArrowFunctionExpression'); }
    });

    return {
      overallComplexity: report.aggregate.cyclomatic,
      maintainability: report.maintainability,
      functions
    };
  },
  {
    name: 'code_complexity_analysis',
    description: 'Analyze code complexity and maintainability metrics',
    schema: z.object({
      filePath: z.string().describe('Path to the file to analyze')
    })
  }
);