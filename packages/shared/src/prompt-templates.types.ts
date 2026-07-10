export type PromptTemplateKey =
  | 'article_writer_system'
  | 'article_writer_user'
  | 'article_explainer_format'
  | 'article_listicle_format'
  | 'article_quality_contract'
  | 'article_image_generator'
  | 'article_image_generator_user'
  | 'content_planning_system'
  | 'content_planning_user'
  | 'idea_planning_system'
  | 'idea_planning_user'
  | 'trend_discovery_system'
  | 'trend_discovery_user'
  | 'quality_scoring_system'
  | 'quality_scoring_user'
  | 'seo_generation_system'
  | 'seo_generation_user'
  | 'featured_image';

export interface PromptTemplateEntry {
  id: string;
  key: string;
  name: string;
  body: string;
  variables: string[];
  categoryId: string | null;
  categoryName: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PromptTemplateListResponse {
  data: PromptTemplateEntry[];
}

export interface DefaultPromptDefinitionResponse {
  key: string;
  name: string;
  body: string;
  variables: string[];
  description?: string;
}

export interface PromptCatalogPrompt {
  key: PromptTemplateKey;
  name: string;
  description: string;
  variables: string[];
  defaultBody: string;
  effectiveBody: string;
  dbId: string | null;
  isCustomized: boolean;
  categoryId: string | null;
  categoryName: string | null;
}

export interface PromptCatalogSection {
  id: string;
  title: string;
  description: string;
  prompts: PromptCatalogPrompt[];
}

export interface PromptCatalogResponse {
  sections: PromptCatalogSection[];
}

export interface SavePromptTemplateRequest {
  body: string;
  categoryId?: string | null;
}

export interface CreatePromptTemplateRequest {
  key: string;
  name: string;
  body: string;
  variables: string[];
  categoryId?: string | null;
  isActive?: boolean;
}

export interface UpdatePromptTemplateRequest {
  key?: string;
  name?: string;
  body?: string;
  variables?: string[];
  categoryId?: string | null;
  isActive?: boolean;
}

export const PROMPT_TEMPLATE_SECTIONS: Array<{
  id: string;
  title: string;
  description: string;
  promptKeys: PromptTemplateKey[];
}> = [
  {
    id: 'article-writing',
    title: 'Article writing',
    description: 'System and user prompts used when generating full articles.',
    promptKeys: [
      'article_writer_system',
      'article_writer_user',
      'article_explainer_format',
      'article_listicle_format',
      'article_quality_contract',
      'article_image_generator',
      'article_image_generator_user',
    ],
  },
  {
    id: 'content-planning',
    title: 'Content planning',
    description: 'Prompts that expand an approved idea into a write-ready outline and visual plan.',
    promptKeys: ['content_planning_system', 'content_planning_user'],
  },
  {
    id: 'idea-planning',
    title: 'Idea planning',
    description: 'Prompts that turn a trending topic into an article idea and outline.',
    promptKeys: ['idea_planning_system', 'idea_planning_user'],
  },
  {
    id: 'trend-discovery',
    title: 'Trend discovery',
    description: 'Prompts for discovering fresh editorial topics from live signals.',
    promptKeys: ['trend_discovery_system', 'trend_discovery_user'],
  },
  {
    id: 'quality-scoring',
    title: 'Quality scoring',
    description: 'Prompts that score grammar, readability, and spam risk before publish.',
    promptKeys: ['quality_scoring_system', 'quality_scoring_user'],
  },
  {
    id: 'seo-generation',
    title: 'SEO generation',
    description: 'Prompts that generate SEO title, description, and keywords.',
    promptKeys: ['seo_generation_system', 'seo_generation_user'],
  },
  {
    id: 'featured-image',
    title: 'Featured image',
    description: 'Prompt used to generate editorial hero images for articles.',
    promptKeys: ['featured_image'],
  },
];

export const PROMPT_TEMPLATE_KEY_LABELS: Record<PromptTemplateKey, string> = {
  article_writer_system: 'Article system prompt',
  article_writer_user: 'Article user prompt',
  article_explainer_format: 'Explainer format block',
  article_listicle_format: 'Listicle format block',
  article_quality_contract: 'Writer quality contract',
  article_image_generator: 'Inline image suggestions (system)',
  article_image_generator_user: 'Inline image suggestions (user)',
  content_planning_system: 'Content planning system prompt',
  content_planning_user: 'Content planning user prompt',
  idea_planning_system: 'Idea system prompt',
  idea_planning_user: 'Idea user prompt',
  trend_discovery_system: 'Trend discovery system prompt',
  trend_discovery_user: 'Trend discovery user prompt',
  quality_scoring_system: 'Quality scoring system prompt',
  quality_scoring_user: 'Quality scoring user prompt',
  seo_generation_system: 'SEO system prompt',
  seo_generation_user: 'SEO user prompt',
  featured_image: 'Featured image prompt',
};

export const PROMPT_TEMPLATE_DESCRIPTIONS: Record<PromptTemplateKey, string> = {
  article_writer_system: 'Defines voice, structure, and writing rules for generated articles.',
  article_writer_user: 'User message template with article title, outline, and revision feedback.',
  article_explainer_format: 'Structure block injected for standard explainer articles.',
  article_listicle_format: 'Structure block injected for ranking/listicle articles.',
  article_quality_contract: 'Quality requirements injected into the writer prompt.',
  article_image_generator:
    'System prompt for generating inline diagram and illustration suggestions as JSON.',
  article_image_generator_user:
    'User message with article title, summary, and body excerpt for image planning.',
  content_planning_system:
    'Expands an approved idea into a refined outline, narrative notes, and image suggestions.',
  content_planning_user: 'User message with idea title, summary, outline, and category.',
  idea_planning_system: 'Rules for turning a topic into a title, summary, and outline.',
  idea_planning_user: 'User message with topic title, category, and description.',
  trend_discovery_system: 'Rules for proposing fresh editorial angles as JSON.',
  trend_discovery_user: 'User message with categories, live signals, and dedupe context.',
  quality_scoring_system: 'Scoring criteria for grammar, readability, and spam detection.',
  quality_scoring_user: 'User message with article title, summary, and body excerpt.',
  seo_generation_system: 'Rules for SEO title, description, and keywords output.',
  seo_generation_user: 'User message with article metadata and body excerpt.',
  featured_image: 'Image generation prompt for DALL·E or fallback artwork.',
};

export const PROMPT_TEMPLATE_VARIABLE_HINTS: Record<PromptTemplateKey, string[]> = {
  article_writer_system: [],
  article_writer_user: [
    'title',
    'categoryName',
    'intentLine',
    'summaryLine',
    'outline',
    'formatBlock',
    'qualityContract',
    'revisionBlock',
  ],
  article_explainer_format: [],
  article_listicle_format: [],
  article_quality_contract: ['minWordCount'],
  article_image_generator: [],
  article_image_generator_user: ['title', 'categoryName', 'summary', 'contentPlain'],
  content_planning_system: [],
  content_planning_user: ['title', 'categoryName', 'intent', 'summary', 'outline'],
  idea_planning_system: [],
  idea_planning_user: ['topicTitle', 'categoryName', 'topicDescription'],
  trend_discovery_system: [],
  trend_discovery_user: ['maxTopics', 'categories', 'signals', 'existingTopics', 'recentArticles'],
  quality_scoring_system: [],
  quality_scoring_user: ['title', 'summary', 'contentPlain'],
  seo_generation_system: [],
  seo_generation_user: ['title', 'categoryName', 'summary', 'contentPlain'],
  featured_image: ['title', 'summary', 'categoryName', 'slug'],
};
