import type { PromptTemplateKey } from '@repo/shared';
import {
  PROMPT_TEMPLATE_DESCRIPTIONS,
  PROMPT_TEMPLATE_KEY_LABELS,
  PROMPT_TEMPLATE_VARIABLE_HINTS,
} from '@repo/shared';
import {
  DEFAULT_ARTICLE_EXPLAINER_FORMAT,
  DEFAULT_ARTICLE_IMAGE_GENERATOR,
  DEFAULT_ARTICLE_IMAGE_GENERATOR_USER,
  DEFAULT_ARTICLE_LISTICLE_FORMAT,
  DEFAULT_ARTICLE_QUALITY_CONTRACT,
  DEFAULT_ARTICLE_WRITER_SYSTEM,
  DEFAULT_ARTICLE_WRITER_USER,
  DEFAULT_CONTENT_PLANNING_SYSTEM,
  DEFAULT_CONTENT_PLANNING_USER,
  DEFAULT_FEATURED_IMAGE_PROMPT,
  DEFAULT_IDEA_PLANNING_SYSTEM,
  DEFAULT_IDEA_PLANNING_USER,
  DEFAULT_QUALITY_SCORING_SYSTEM,
  DEFAULT_QUALITY_SCORING_USER,
  DEFAULT_SEO_GENERATION_SYSTEM,
  DEFAULT_SEO_GENERATION_USER,
  DEFAULT_TREND_DISCOVERY_SYSTEM,
  DEFAULT_TREND_DISCOVERY_USER,
} from './default-bodies';

export const PROMPT_TEMPLATE_KEYS = {
  ARTICLE_WRITER_SYSTEM: 'article_writer_system',
  ARTICLE_WRITER_USER: 'article_writer_user',
  ARTICLE_EXPLAINER_FORMAT: 'article_explainer_format',
  ARTICLE_LISTICLE_FORMAT: 'article_listicle_format',
  ARTICLE_QUALITY_CONTRACT: 'article_quality_contract',
  ARTICLE_IMAGE_GENERATOR: 'article_image_generator',
  ARTICLE_IMAGE_GENERATOR_USER: 'article_image_generator_user',
  CONTENT_PLANNING_SYSTEM: 'content_planning_system',
  CONTENT_PLANNING_USER: 'content_planning_user',
  IDEA_PLANNING_SYSTEM: 'idea_planning_system',
  IDEA_PLANNING_USER: 'idea_planning_user',
  TREND_DISCOVERY_SYSTEM: 'trend_discovery_system',
  TREND_DISCOVERY_USER: 'trend_discovery_user',
  QUALITY_SCORING_SYSTEM: 'quality_scoring_system',
  QUALITY_SCORING_USER: 'quality_scoring_user',
  SEO_GENERATION_SYSTEM: 'seo_generation_system',
  SEO_GENERATION_USER: 'seo_generation_user',
  FEATURED_IMAGE: 'featured_image',
} as const;

export type { PromptTemplateKey };

export interface DefaultPromptDefinition {
  key: PromptTemplateKey;
  name: string;
  description: string;
  body: string;
  variables: string[];
}

function defineDefault(key: PromptTemplateKey, body: string): DefaultPromptDefinition {
  return {
    key,
    name: PROMPT_TEMPLATE_KEY_LABELS[key],
    description: PROMPT_TEMPLATE_DESCRIPTIONS[key],
    body,
    variables: PROMPT_TEMPLATE_VARIABLE_HINTS[key],
  };
}

export const DEFAULT_PROMPT_DEFINITIONS: Record<PromptTemplateKey, DefaultPromptDefinition> = {
  article_writer_system: defineDefault('article_writer_system', DEFAULT_ARTICLE_WRITER_SYSTEM),
  article_writer_user: defineDefault('article_writer_user', DEFAULT_ARTICLE_WRITER_USER),
  article_explainer_format: defineDefault(
    'article_explainer_format',
    DEFAULT_ARTICLE_EXPLAINER_FORMAT,
  ),
  article_listicle_format: defineDefault(
    'article_listicle_format',
    DEFAULT_ARTICLE_LISTICLE_FORMAT,
  ),
  article_quality_contract: defineDefault(
    'article_quality_contract',
    DEFAULT_ARTICLE_QUALITY_CONTRACT,
  ),
  article_image_generator: defineDefault(
    'article_image_generator',
    DEFAULT_ARTICLE_IMAGE_GENERATOR,
  ),
  article_image_generator_user: defineDefault(
    'article_image_generator_user',
    DEFAULT_ARTICLE_IMAGE_GENERATOR_USER,
  ),
  content_planning_system: defineDefault(
    'content_planning_system',
    DEFAULT_CONTENT_PLANNING_SYSTEM,
  ),
  content_planning_user: defineDefault('content_planning_user', DEFAULT_CONTENT_PLANNING_USER),
  idea_planning_system: defineDefault('idea_planning_system', DEFAULT_IDEA_PLANNING_SYSTEM),
  idea_planning_user: defineDefault('idea_planning_user', DEFAULT_IDEA_PLANNING_USER),
  trend_discovery_system: defineDefault('trend_discovery_system', DEFAULT_TREND_DISCOVERY_SYSTEM),
  trend_discovery_user: defineDefault('trend_discovery_user', DEFAULT_TREND_DISCOVERY_USER),
  quality_scoring_system: defineDefault('quality_scoring_system', DEFAULT_QUALITY_SCORING_SYSTEM),
  quality_scoring_user: defineDefault('quality_scoring_user', DEFAULT_QUALITY_SCORING_USER),
  seo_generation_system: defineDefault('seo_generation_system', DEFAULT_SEO_GENERATION_SYSTEM),
  seo_generation_user: defineDefault('seo_generation_user', DEFAULT_SEO_GENERATION_USER),
  featured_image: defineDefault('featured_image', DEFAULT_FEATURED_IMAGE_PROMPT),
};

export function getDefaultPromptDefinition(key: string): DefaultPromptDefinition | null {
  return DEFAULT_PROMPT_DEFINITIONS[key as PromptTemplateKey] ?? null;
}

export { DEFAULT_FEATURED_IMAGE_PROMPT };
