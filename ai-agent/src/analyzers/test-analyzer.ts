import { Anthropic } from '@anthropic-ai/sdk';
import * as fs from 'fs/promises';
import * as path from 'path';
import { 
  TestResult, 
  Suggestion, 
  AnalysisResult, 
  FlakyTest 
} from '../types/index';

export class TestAnalyzer {
  constructor(private anthropic: Anthropic) {}

  async analyzeFailures(failures: TestResult[]): Promise<AnalysisResult> {
    try {
      const failureDetails = failures.map(f => ({
        testName: f.title,
        error: f.error,
        screenshot: f.screenshot,
        duration: f.duration,
        file: f.file
      }));

      const prompt = `
        Analyze these Playwright test failures and provide insights:
        
        ${JSON.stringify(failureDetails, null, 2)}
        
        Please provide:
        1. Common patterns in failures
        2. Possible root causes
        3. Specific suggestions to fix each failure
        4. Recommendations to prevent similar issues
        
        Format your response as JSON with the structure:
        {
          "message": "Summary of analysis",
          "rootCauses": ["cause1", "cause2"],
          "suggestions": ["suggestion1", "suggestion2"],
          "affectedTests": ["test1", "test2"]
        }
      `;

      const response = await this.anthropic.messages.create({
        model: 'claude-sonnet-5',
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }]
      });

      // Safely extract text from response
      const responseText = this.extractTextFromResponse(response);
      let analysisResult: AnalysisResult;
      
      try {
        analysisResult = JSON.parse(responseText);
      } catch (parseError) {
        // Fallback if JSON parsing fails
        analysisResult = {
          message: "Analysis completed, but response format was unexpected",
          suggestions: [responseText],
          rootCauses: ["Parse error occurred"],
          affectedTests: failures.map(f => f.title)
        };
      }

      return analysisResult;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        message: `Analysis failed: ${errorMessage}`,
        suggestions: ["Please check your API configuration and try again"],
        rootCauses: ["API or configuration error"],
        affectedTests: failures.map(f => f.title)
      };
    }
  }

  async suggestImprovements(testFiles: string[]): Promise<Suggestion[]> {
    const suggestions: Suggestion[] = [];

    for (const testFile of testFiles) {
      try {
        // Check if file exists
        const fileExists = await this.fileExists(testFile);
        if (!fileExists) {
          console.warn(`File not found: ${testFile}`);
          continue;
        }

        const fileContent = await fs.readFile(testFile, 'utf-8');
        
        const prompt = `
          Review this Playwright TypeScript test file and suggest improvements:
          
          File: ${testFile}
          Content:
          ${fileContent}
          
          Focus on:
          - Test reliability and stability
          - Performance optimizations  
          - Code maintainability
          - Missing test coverage areas
          
          Return suggestions as JSON array with format:
          [{
            "type": "reliability",
            "description": "Description of improvement",
            "line": 42,
            "code": "suggested code change"
          }]
        `;

        const response = await this.anthropic.messages.create({
          model: 'claude-sonnet-5',
          max_tokens: 1500,
          messages: [{ role: 'user', content: prompt }]
        });

        const responseText = this.extractTextFromResponse(response);
        let fileSuggestions: any[] = [];
        
        try {
          fileSuggestions = JSON.parse(responseText);
        } catch (parseError) {
          // Create a fallback suggestion if parsing fails
          fileSuggestions = [{
            type: "maintainability",
            description: "AI analysis completed but response format was unexpected",
            line: 1,
            code: responseText.substring(0, 100) + "..."
          }];
        }

        // Ensure each suggestion has the required properties
        const validSuggestions = fileSuggestions
          .filter((s: any) => s && typeof s === 'object')
          .map((s: any) => ({
            type: s.type || 'maintainability',
            description: s.description || 'No description provided',
            file: testFile,
            line: s.line || undefined,
            code: s.code || undefined,
            priority: s.priority || 'medium'
          }));

        suggestions.push(...validSuggestions);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        console.error(`Error analyzing file ${testFile}: ${errorMessage}`);
        
        // Add error suggestion
        suggestions.push({
          type: 'maintainability',
          description: `Failed to analyze file: ${errorMessage}`,
          file: testFile,
          priority: 'low'
        });
      }
    }

    return suggestions;
  }

  async identifyFlakyTests(): Promise<FlakyTest[]> {
    try {
      // This is a placeholder implementation
      // In a real implementation, you would:
      // 1. Read test history from reports or database
      // 2. Analyze test results over time
      // 3. Identify tests with inconsistent results
      
      const testResultsPath = 'test-results';
      const flakyTests: FlakyTest[] = [];
      
      // Check if test results directory exists
      const resultsExist = await this.fileExists(testResultsPath);
      if (!resultsExist) {
        console.log('No test results found for flaky test analysis');
        return [];
      }

      // Placeholder: Return some example flaky tests for demonstration
      flakyTests.push({
        name: 'login should work with valid credentials',
        file: 'tests/auth/login.spec.ts',
        failurePattern: 'Timeout waiting for element to be visible',
        failureRate: 0.15 // 15% failure rate
      });

      return flakyTests;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error(`Error identifying flaky tests: ${errorMessage}`);
      return [];
    }
  }

  // Helper method to safely extract text from Anthropic response
  private extractTextFromResponse(response: any): string {
    try {
      // Handle different response formats from Anthropic API
      if (response.content && Array.isArray(response.content)) {
        for (const block of response.content) {
          if (block.type === 'text' && block.text) {
            return block.text;
          }
        }
      }
      
      // Fallback: try to find text in the response structure
      if (response.content?.[0]?.text) {
        return response.content[0].text;
      }
      
      if (typeof response === 'string') {
        return response;
      }
      
      // Last resort: convert to string
      return JSON.stringify(response);
    } catch (error) {
      console.error('Error extracting text from response:', error);
      return 'Error: Could not extract text from AI response';
    }
  }

  // Helper method to check if file exists
  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  // Helper method to get all test files in a directory
  async getTestFiles(directory: string = 'tests'): Promise<string[]> {
    try {
      const testFiles: string[] = [];
      const exists = await this.fileExists(directory);
      
      if (!exists) {
        return testFiles;
      }

      const files = await fs.readdir(directory, { recursive: true });
      
      for (const file of files) {
        const fullPath = path.join(directory, file.toString());
        const stats = await fs.stat(fullPath);
        
        if (stats.isFile() && (file.toString().endsWith('.spec.ts') || file.toString().endsWith('.test.ts'))) {
          testFiles.push(fullPath);
        }
      }
      
      return testFiles;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error(`Error getting test files: ${errorMessage}`);
      return [];
    }
  }
}