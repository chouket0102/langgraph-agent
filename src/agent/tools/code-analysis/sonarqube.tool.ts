// @ts-nocheck
import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';

export const sonarScanTool = tool(
  async ({ projectKey, projectName }: { projectKey: string; projectName: string }) => {
    const sonarUrl = process.env.SONARQUBE_URL || 'http://localhost:9000';
    const sonarToken = process.env.SONARQUBE_TOKEN;
    
    if (!sonarToken) throw new Error('SonarQube token not configured');

    // Simulated scanner execution
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const issues = await axios.get(`${sonarUrl}/api/issues/search`, {
      params: { componentKeys: projectKey, ps: 500 },
      auth: { username: sonarToken, password: '' }
    }).then(res => res.data.issues);

    return {
      status: 'completed',
      reportUrl: `${sonarUrl}/dashboard?id=${projectKey}`,
      issues: issues.map((issue: any) => ({
        key: issue.key,
        type: issue.type,
        severity: issue.severity,
        component: issue.component,
        line: issue.line,
        message: issue.message
      }))
    };
  },
  {
    name: 'sonar_scan',
    description: 'Scan project with SonarQube and return security issues',
    schema: z.object({
      projectKey: z.string().describe('SonarQube project key'),
      projectName: z.string().describe('Project display name')
    })
  }
);

export const sonarUploadTestResultsTool = tool(
  async ({ projectKey, resultsPath }: { projectKey: string; resultsPath: string }) => {
    const sonarUrl = process.env.SONARQUBE_URL;
    const sonarToken = process.env.SONARQUBE_TOKEN;
    
    if (!sonarUrl || !sonarToken) throw new Error('SonarQube not configured');
    
    const form = new FormData();
    form.append('projectKey', projectKey);
    form.append('report', fs.createReadStream(resultsPath));
    
    const response = await axios.post(`${sonarUrl}/api/measures/upload`, form, {
      headers: form.getHeaders(),
      auth: { username: sonarToken, password: '' }
    });
    
    return { uploaded: response.status === 200 };
  },
  {
    name: 'sonar_upload_test_results',
    description: 'Upload test results to SonarQube',
    schema: z.object({
      projectKey: z.string().describe('SonarQube project key'),
      resultsPath: z.string().describe('Path to test results file')
    })
  }
);