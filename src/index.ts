import { Command } from 'commander';
import type { Provider, ProviderOption } from './domain/entities.js';
import { createAnthropicCostRepository } from './infrastructure/anthropic-cost-repository.js';
import { createAnthropicUsageRepository } from './infrastructure/anthropic-usage-repository.js';
import { createCompositeCredentialStore } from './infrastructure/composite-credential-store.js';
import { createEnvCredentialStore } from './infrastructure/env-credential-store.js';
import { createJsonPresenter } from './infrastructure/json-presenter.js';
import { createKeychainCredentialStore } from './infrastructure/keychain-credential-store.js';
import { createMultiCostRepository } from './infrastructure/multi-cost-repository.js';
import { createMultiUsageRepository } from './infrastructure/multi-usage-repository.js';
import { createOpenAICostRepository } from './infrastructure/openai-cost-repository.js';
import { createOpenAIUsageRepository } from './infrastructure/openai-usage-repository.js';
import { createOpenRouterCostRepository } from './infrastructure/openrouter-cost-repository.js';
import { createOpenRouterUsageRepository } from './infrastructure/openrouter-usage-repository.js';
import { createTablePresenter } from './infrastructure/table-presenter.js';
import { registerConfigCommand } from './presentation/commands/config.command.js';
import { registerCostCommand } from './presentation/commands/cost.command.js';
import { registerUsageCommand } from './presentation/commands/usage.command.js';

const ENV_VAR_NAMES: Record<Provider, string> = {
  anthropic: 'LLM_COST_ANTHROPIC_API_KEY',
  openai: 'LLM_COST_OPENAI_API_KEY',
  openrouter: 'LLM_COST_OPENROUTER_API_KEY',
};

function buildCredentialStore(provider: Provider) {
  const keychain = createKeychainCredentialStore(provider);
  const env = createEnvCredentialStore(ENV_VAR_NAMES[provider]);
  return createCompositeCredentialStore(
    keychain,
    env,
    provider,
    ENV_VAR_NAMES[provider],
  );
}

const anthropicStore = buildCredentialStore('anthropic');
const openaiStore = buildCredentialStore('openai');
const openrouterStore = buildCredentialStore('openrouter');
const credentialStores = {
  anthropic: anthropicStore,
  openai: openaiStore,
  openrouter: openrouterStore,
};

const usageRepos = {
  anthropic: createAnthropicUsageRepository(() => anthropicStore.load()),
  openai: createOpenAIUsageRepository(() => openaiStore.load()),
  openrouter: createOpenRouterUsageRepository(() => openrouterStore.load()),
};
const costRepos = {
  anthropic: createAnthropicCostRepository(() => anthropicStore.load()),
  openai: createOpenAICostRepository(() => openaiStore.load()),
  openrouter: createOpenRouterCostRepository(() => openrouterStore.load()),
};

const getPresenter = (json: boolean) =>
  json ? createJsonPresenter() : createTablePresenter();

const program = new Command();
program
  .name('llm-cost')
  .description(
    'CLI for LLM API usage and cost reports (Anthropic, OpenAI, OpenRouter)',
  )
  .version('0.2.0');

const ALL_PROVIDERS: Provider[] = ['anthropic', 'openai', 'openrouter'];

const getCostRepository = (p: ProviderOption) =>
  p === 'all'
    ? createMultiCostRepository(ALL_PROVIDERS.map((pr) => costRepos[pr]))
    : costRepos[p];

const getUsageRepository = (p: ProviderOption) =>
  p === 'all'
    ? createMultiUsageRepository(ALL_PROVIDERS.map((pr) => usageRepos[pr]))
    : usageRepos[p];

registerConfigCommand(program, credentialStores);
registerCostCommand(program, getCostRepository, getPresenter);
registerUsageCommand(program, getUsageRepository, getPresenter);

program.parse();
