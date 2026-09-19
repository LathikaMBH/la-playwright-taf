#!/usr/bin/env node

import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { TestAutomationAgent } from './agent';

const program = new Command();

program
  .name('test-ai-agent')
  .description('AI agent for your Playwright automation framework')
  .version('1.0.0');

// The agent needs ANTHROPIC_API_KEY, so create it only when a command actually runs
function createAgent(): TestAutomationAgent {
  return new TestAutomationAgent();
}

function fail(spinner: ReturnType<typeof ora> | undefined, label: string, error: unknown): never {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
  spinner?.fail(label);
  console.error(chalk.red(errorMessage));
  process.exit(1);
}

program
  .command('analyze')
  .description('Analyze test failures and provide suggestions')
  .action(async () => {
    let spinner: ReturnType<typeof ora> | undefined;

    try {
      const agent = createAgent();
      spinner = ora('Analyzing test results...').start();
      const result = await agent.analyzeTestFailures();
      spinner.succeed('Analysis complete!');

      console.log(chalk.blue(`\n📊 ${result.message}`));

      if (result.rootCauses?.length) {
        console.log(chalk.yellow('\nRoot causes:'));
        result.rootCauses.forEach((cause, i) => console.log(chalk.white(`${i + 1}. ${cause}`)));
      }

      console.log(chalk.yellow('\n💡 Suggestions:'));
      result.suggestions.forEach((s, i) => console.log(chalk.white(`${i + 1}. ${s}`)));

      if (result.affectedTests?.length) {
        console.log(chalk.gray(`\nAffected tests: ${result.affectedTests.join(', ')}`));
      }
    } catch (error) {
      fail(spinner, 'Analysis failed', error);
    }
  });

program
  .command('generate')
  .description('Generate tests from requirements')
  .action(async () => {
    let spinner: ReturnType<typeof ora> | undefined;

    try {
      const agent = createAgent();
      const answers = await inquirer.prompt([
        {
          type: 'editor',
          name: 'requirements',
          message: 'Enter your requirements (this will open your default editor):',
        },
      ]);

      spinner = ora('Generating tests...').start();
      const tests = await agent.generateTestsFromRequirements(answers.requirements);
      spinner.succeed(`Generated ${tests.length} test case(s)!`);

      console.log(chalk.blue('\n🤖 Generated Tests:'));
      tests.forEach((code, i) => {
        console.log(chalk.gray(`\n--- Test Case ${i + 1} ---`));
        console.log(code);
      });
    } catch (error) {
      fail(spinner, 'Test generation failed', error);
    }
  });

program
  .command('improve')
  .description('Suggest improvements for existing tests')
  .action(async () => {
    let spinner: ReturnType<typeof ora> | undefined;

    try {
      const agent = createAgent();
      spinner = ora('Analyzing tests for improvements...').start();
      const suggestions = await agent.suggestTestImprovements();
      spinner.succeed('Analysis complete!');

      console.log(chalk.blue(`\n💡 Found ${suggestions.length} improvement suggestion(s):`));
      suggestions.forEach((s, i) => {
        console.log(chalk.yellow(`\n${i + 1}. ${s.type.toUpperCase()}${s.priority ? ` (${s.priority})` : ''}`));
        console.log(chalk.white(`   File: ${s.file}${s.line ? `:${s.line}` : ''}`));
        console.log(chalk.white(`   ${s.description}`));
        if (s.code) {
          console.log(chalk.gray(`   Suggested: ${s.code}`));
        }
      });
    } catch (error) {
      fail(spinner, 'Analysis failed', error);
    }
  });

program
  .command('fix-flaky')
  .description('Identify and suggest fixes for flaky tests')
  .action(async () => {
    let spinner: ReturnType<typeof ora> | undefined;

    try {
      const agent = createAgent();
      spinner = ora('Analyzing flaky tests...').start();
      const fixes = await agent.autoFixFlakyTests();
      spinner.succeed('Analysis complete!');

      if (fixes.length === 0) {
        console.log(chalk.green('\n✅ No flaky tests detected!'));
        return;
      }

      console.log(chalk.blue(`\n🔧 Found ${fixes.length} potentially flaky test(s):`));
      fixes.forEach((fix, i) => {
        console.log(chalk.yellow(`\n${i + 1}. ${fix.testFile}`));
        console.log(chalk.white(`   Issue: ${fix.issue}`));
        console.log(chalk.white(`   Confidence: ${Math.round(fix.confidence * 100)}%`));
        console.log(chalk.gray(`   Suggested fix:\n${fix.suggestedFix}`));
      });
    } catch (error) {
      fail(spinner, 'Analysis failed', error);
    }
  });

program
  .command('enhance-reports')
  .description('Generate advanced reporting system')
  .action(async () => {
    let spinner: ReturnType<typeof ora> | undefined;

    try {
      const agent = createAgent();
      spinner = ora('Enhancing reporting system...').start();
      const enhancement = await agent.enhanceReporting();
      spinner.succeed('Reporting system enhanced!');

      console.log(chalk.blue('\n📊 New Reporting Features:'));
      enhancement.features.forEach((feature) => console.log(chalk.white(`  ✅ ${feature}`)));
    } catch (error) {
      fail(spinner, 'Enhancement failed', error);
    }
  });

program
  .command('generate-helpers')
  .option('-d, --domain <domain>', 'Specify your domain (e.g., e-commerce, banking, healthcare)')
  .description('Generate domain-specific helper classes')
  .action(async (options) => {
    const domain = options.domain || 'general';
    let spinner: ReturnType<typeof ora> | undefined;

    try {
      const agent = createAgent();
      spinner = ora(`Generating helpers for ${domain} domain...`).start();
      const helpers = await agent.generateHelperMethods(domain);
      spinner.succeed(`Generated ${helpers.length} helper class(es)!`);

      console.log(chalk.blue('\n🛠️ Generated Helper Classes:'));
      helpers.forEach((helper) => {
        console.log(chalk.white(`  📁 ${helper.className} [${helper.category}] - ${helper.description}`));
      });
    } catch (error) {
      fail(spinner, 'Helper generation failed', error);
    }
  });

program
  .command('optimize-framework')
  .description('Analyze and suggest framework architecture optimizations')
  .action(async () => {
    let spinner: ReturnType<typeof ora> | undefined;

    try {
      const agent = createAgent();
      spinner = ora('Analyzing framework architecture...').start();
      const result = await agent.optimizeFrameworkArchitecture();
      spinner.succeed('Analysis complete!');

      console.log(chalk.blue('\n🏗️ Suggested Improvements:'));
      result.improvements.forEach((item) => console.log(chalk.white(`  • ${item}`)));

      if (result.filesCreated.length) {
        console.log(chalk.yellow('\nSuggested new files:'));
        result.filesCreated.forEach((file) => console.log(chalk.white(`  📄 ${file}`)));
      }

      if (result.configChanges.length) {
        console.log(chalk.yellow('\nSuggested config changes:'));
        result.configChanges.forEach((change) => console.log(chalk.white(`  ⚙️  ${change}`)));
      }
    } catch (error) {
      fail(spinner, 'Optimization failed', error);
    }
  });

program
  .command('create-page-objects')
  .argument('<urls...>', 'One or more page URLs to generate page objects for')
  .description('Generate Page Object Models from URLs (writes files to src/pages)')
  .action(async (urls: string[]) => {
    let spinner: ReturnType<typeof ora> | undefined;

    try {
      const agent = createAgent();
      spinner = ora(`Generating page objects for ${urls.length} URL(s)...`).start();
      const pageObjects = await agent.generatePageObjectModels(urls);
      spinner.succeed(`Generated ${pageObjects.length} page object(s)!`);

      console.log(chalk.blue('\n📄 Page Objects:'));
      pageObjects.forEach((po) => {
        console.log(chalk.white(`  ${po.className} (${po.url}) -> src/pages/${po.fileName}`));
      });
    } catch (error) {
      fail(spinner, 'Page object generation failed', error);
    }
  });

// Global error handler for unhandled errors
process.on('unhandledRejection', (reason) => {
  const errorMessage = reason instanceof Error ? reason.message : String(reason);
  console.error(chalk.red(`Unhandled error: ${errorMessage}`));
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.error(chalk.red(`Uncaught exception: ${errorMessage}`));
  process.exit(1);
});

// Parse command line arguments
program.parse();
