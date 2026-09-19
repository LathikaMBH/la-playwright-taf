import { Anthropic } from '@anthropic-ai/sdk';
import * as fs from 'fs/promises';
import * as path from 'path';
import { 
  FixResult, 
  FlakyTest, 
  PageObjectModel 
} from '../types/index';

export class TestGenerator {
  constructor(private anthropic: Anthropic) {}

  async generateFromRequirements(requirements: string, existingTests: string[]): Promise<string[]> {
    try {
      const prompt = `
        Generate Playwright TypeScript test cases for these requirements:
        
        ${requirements}
        
        Existing test patterns to follow:
        ${existingTests.slice(0, 3).join('\n---\n')}
        
        Generate comprehensive test cases including:
        - Happy path scenarios
        - Edge cases
        - Error conditions
        - Accessibility tests
        
        Use proper Playwright TypeScript syntax with:
        - Page Object Model patterns
        - Proper assertions
        - Good test descriptions
        - Appropriate selectors
        
        Return the test cases as separate code blocks wrapped in \`\`\`typescript markers.
      `;

      const response = await this.anthropic.messages.create({
        model: 'claude-sonnet-5',
        max_tokens: 3000,
        messages: [{ role: 'user', content: prompt }]
      });

      // Extract text safely from response
      const responseText = this.extractTextFromResponse(response);
      
      // Parse the response and extract individual test cases
      return this.parseGeneratedTests(responseText);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error(`Error generating tests from requirements: ${errorMessage}`);
      
      // Return a fallback test case
      return [
        `// Generated test (fallback due to error: ${errorMessage})
test('should handle basic functionality', async ({ page }) => {
  // TODO: Implement test based on requirements
  await page.goto('/');
  await expect(page).toHaveTitle(/.*/);;
});`
      ];
    }
  }

  async generateFlakinessFixes(flakyTests: FlakyTest[]): Promise<FixResult[]> {
    const fixes: FixResult[] = [];

    for (const test of flakyTests) {
      try {
        const prompt = `
          This Playwright test is flaky. Suggest specific fixes:
          
          Test: ${test.name}
          File: ${test.file}
          Failure pattern: ${test.failurePattern}
          Code: ${test.code || 'Code not provided'}
          Failure rate: ${test.failureRate ? (test.failureRate * 100).toFixed(1) + '%' : 'Unknown'}
          
          Provide specific code changes to make it more reliable. Focus on:
          - Adding proper wait conditions
          - Improving selector strategies
          - Adding retry logic where appropriate
          - Handling timing issues
          - Making assertions more robust
          
          Format your response with the suggested fix and explanation.
        `;

        const response = await this.anthropic.messages.create({
          model: 'claude-sonnet-5',
          max_tokens: 1000,
          messages: [{ role: 'user', content: prompt }]
        });

        const responseText = this.extractTextFromResponse(response);
        
        fixes.push({
          testFile: test.file,
          issue: test.failurePattern,
          suggestedFix: responseText,
          confidence: 0.8 // Default confidence level
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        console.error(`Error generating fix for flaky test ${test.name}: ${errorMessage}`);
        
        // Add a fallback fix suggestion
        fixes.push({
          testFile: test.file,
          issue: test.failurePattern,
          suggestedFix: `Error generating fix: ${errorMessage}. Consider adding explicit waits and improving selectors.`,
          confidence: 0.3
        });
      }
    }

    return fixes;
  }

  async generatePageObjects(urls: string[]): Promise<PageObjectModel[]> {
    const pageObjects: PageObjectModel[] = [];

    for (const url of urls) {
      try {
        const prompt = `
          Create a comprehensive Page Object Model for this URL: ${url}
          
          The page object should include:
          1. All interactive elements (buttons, inputs, dropdowns, etc.)
          2. Navigation methods
          3. Form submission methods
          4. Validation methods
          5. Wait conditions
          6. Data extraction methods
          7. TypeScript interfaces for page data
          
          Use modern Playwright patterns with:
          - Proper locator strategies
          - Async/await patterns
          - Error handling
          - Type safety
          - Reusable component patterns
          
          Generate complete TypeScript code with JSDoc documentation.
          Include the class name and list of methods at the end.
        `;

        const response = await this.anthropic.messages.create({
          model: 'claude-sonnet-5',
          max_tokens: 3000,
          messages: [{ role: 'user', content: prompt }]
        });

        const responseText = this.extractTextFromResponse(response);
        const pageObject = this.parsePageObject(responseText, url);
        pageObjects.push(pageObject);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        console.error(`Error generating page object for ${url}: ${errorMessage}`);
        
        // Create a fallback page object
        const fallbackPageObject = this.createFallbackPageObject(url, errorMessage);
        pageObjects.push(fallbackPageObject);
      }
    }

    await this.createPageObjectFiles(pageObjects);
    return pageObjects;
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

  private parseGeneratedTests(response: string): string[] {
    try {
      // Extract test code blocks from the AI response
      const codeBlocks = response.match(/```typescript([\s\S]*?)```/g) || [];
      
      if (codeBlocks.length === 0) {
        // Try to extract any code blocks
        const genericCodeBlocks = response.match(/```([\s\S]*?)```/g) || [];
        if (genericCodeBlocks.length > 0) {
          return genericCodeBlocks.map(block => 
            block.replace(/```\w*|```/g, '').trim()
          );
        }
        
        // If no code blocks found, return the raw response as a single test
        return [response.trim()];
      }
      
      return codeBlocks.map(block => 
        block.replace(/```typescript|```/g, '').trim()
      );
    } catch (error) {
      console.error('Error parsing generated tests:', error);
      return [`// Error parsing generated tests: ${error}\n${response}`];
    }
  }

  private parsePageObject(response: string, url: string): PageObjectModel {
    try {
      // Extract class name from the response
      const classNameMatch = response.match(/class\s+(\w+)/);
      const className = classNameMatch ? classNameMatch[1] : 'GeneratedPageObject';
      
      // Extract methods from the response
      const methodMatches = response.match(/(?:async\s+)?(\w+)\s*\([^)]*\)\s*[:;{]/g) || [];
      const methods = methodMatches.map(match => {
        const methodName = match.match(/(\w+)\s*\(/);
        return methodName ? methodName[1] : 'unknownMethod';
      });

      // Generate filename
      const fileName = `${className.toLowerCase()}.ts`;
      
      return {
        fileName,
        className,
        url,
        code: response,
        methods
      };
    } catch (error) {
      console.error('Error parsing page object:', error);
      return this.createFallbackPageObject(url, `Parse error: ${error}`);
    }
  }

  private createFallbackPageObject(url: string, errorMessage: string): PageObjectModel {
    const className = 'FallbackPageObject';
    const fileName = `${className.toLowerCase()}.ts`;
    
    const fallbackCode = `
import { Page, Locator } from '@playwright/test';
import { BasePage } from './base-page';

/**
 * Fallback Page Object for ${url}
 * Generated due to error: ${errorMessage}
 */
export class ${className} extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async navigateToPage(): Promise<void> {
    await this.navigateTo('${url}');
  }

  async verifyPageLoaded(): Promise<void> {
    await this.waitForLoadState();
    // TODO: Add specific page verification
  }

  // TODO: Add page-specific methods based on actual page content
}
`;

    return {
      fileName,
      className,
      url,
      code: fallbackCode.trim(),
      methods: ['navigateToPage', 'verifyPageLoaded']
    };
  }

  private async createPageObjectFiles(pageObjects: PageObjectModel[]): Promise<void> {
    try {
      // Ensure the pages directory exists
      const pagesDir = 'src/pages';
      await this.ensureDirectoryExists(pagesDir);

      for (const pageObject of pageObjects) {
        const filePath = path.join(pagesDir, pageObject.fileName);
        await fs.writeFile(filePath, pageObject.code, 'utf-8');
        console.log(`✅ Created page object: ${filePath}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error(`Error creating page object files: ${errorMessage}`);
    }
  }

  // Helper method to ensure directory exists
  private async ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
      await fs.access(dirPath);
    } catch {
      // Directory doesn't exist, create it
      await fs.mkdir(dirPath, { recursive: true });
    }
  }
}