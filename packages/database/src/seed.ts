import { prisma } from './prisma.service';
import { ArticleIdeaStatus, ArticleStatus, PublishFrequency, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const CATEGORIES = [
  {
    name: 'Artificial Intelligence',
    slug: 'artificial-intelligence',
    description: 'AI, machine learning, and intelligent systems',
    keywords: ['ai', 'machine learning', 'llm', 'automation'],
    priorityScore: 95,
  },
  {
    name: 'Startups',
    slug: 'startups',
    description: 'Early-stage companies and founder stories',
    keywords: ['startups', 'founders', 'seed funding'],
    priorityScore: 90,
  },
  {
    name: 'Fintech',
    slug: 'fintech',
    description: 'Financial technology and digital banking',
    keywords: ['fintech', 'payments', 'banking', 'crypto'],
    priorityScore: 85,
  },
  {
    name: 'SaaS',
    slug: 'saas',
    description: 'Software as a service and B2B tools',
    keywords: ['saas', 'b2b', 'cloud software'],
    priorityScore: 80,
  },
  {
    name: 'Venture Capital',
    slug: 'venture-capital',
    description: 'VC funding rounds and investor activity',
    keywords: ['venture capital', 'funding', 'investors'],
    priorityScore: 75,
  },
  {
    name: 'Healthcare',
    slug: 'healthcare',
    description: 'Health tech and medical innovation',
    keywords: ['healthtech', 'biotech', 'digital health'],
    priorityScore: 70,
  },
  {
    name: 'Climate Tech',
    slug: 'climate-tech',
    description: 'Clean energy and sustainability startups',
    keywords: ['climate', 'cleantech', 'sustainability'],
    priorityScore: 65,
  },
];

const SAMPLE_ARTICLES = [
  {
    categorySlug: 'artificial-intelligence',
    title: 'Open-Source LLMs Are Closing the Gap with Frontier Models',
    slug: 'open-source-llms-closing-gap-frontier-models',
    summary:
      'New benchmark results show open-weight models matching proprietary systems on reasoning and coding tasks.',
    content:
      'Open-source language models continue to improve at a rapid pace, narrowing the performance gap with closed frontier systems.',
    seoTitle: 'Open-Source LLMs vs Frontier Models | AI Publishing',
    seoDescription:
      'Benchmark results show open-weight LLMs matching proprietary systems on reasoning and coding tasks.',
  },
  {
    categorySlug: 'startups',
    title: 'Seed Funding Rebounds as AI Infrastructure Startups Lead Q2',
    slug: 'seed-funding-rebounds-ai-infrastructure-q2',
    summary:
      'Early-stage venture activity picked up in the second quarter, led by developer tools and AI infrastructure.',
    content:
      'Venture capitalists are returning to seed-stage deals after a cautious 2025, with AI infrastructure startups attracting the most interest.',
    seoTitle: 'Seed Funding Rebounds in Q2 | Startup News',
    seoDescription:
      'Early-stage venture activity picked up in Q2, led by AI infrastructure and developer tools startups.',
  },
  {
    categorySlug: 'fintech',
    title: 'Neobanks Expand Embedded Finance Partnerships Across Europe',
    slug: 'neobanks-expand-embedded-finance-europe',
    summary:
      'Digital banks are partnering with SaaS platforms to offer lending and payments inside business workflows.',
    content:
      'European neobanks are accelerating embedded finance partnerships as merchants seek integrated payment and lending experiences.',
    seoTitle: 'Neobanks Expand Embedded Finance in Europe',
    seoDescription:
      'Digital banks partner with SaaS platforms to offer lending and payments inside business workflows.',
  },
  {
    categorySlug: 'saas',
    title: 'Vertical SaaS Vendors Double Down on AI Copilots',
    slug: 'vertical-saas-vendors-ai-copilots',
    summary:
      'Industry-specific software companies are shipping copilots trained on domain workflows and customer data.',
    content:
      'Vertical SaaS vendors are embedding AI copilots directly into existing workflows to reduce onboarding friction and increase retention.',
    seoTitle: 'Vertical SaaS Vendors Ship AI Copilots',
    seoDescription:
      'Industry-specific software companies embed AI copilots trained on domain workflows and customer data.',
  },
  {
    categorySlug: 'venture-capital',
    title: 'Growth Funds Shift Focus to Profitability Metrics Over Growth at All Costs',
    slug: 'growth-funds-focus-profitability-metrics',
    summary:
      'Later-stage investors are prioritizing efficient growth and clear paths to profitability in new deals.',
    content:
      'Growth-stage venture funds are rewriting their investment theses around capital efficiency and durable unit economics.',
    seoTitle: 'Growth Funds Prioritize Profitability Metrics',
    seoDescription:
      'Later-stage investors prioritize efficient growth and clear paths to profitability in new deals.',
  },
  {
    categorySlug: 'healthcare',
    title: 'AI Triage Tools Gain Traction in Outpatient Clinics',
    slug: 'ai-triage-tools-outpatient-clinics',
    summary:
      'Clinics are adopting AI-assisted intake systems to prioritize cases and reduce wait times.',
    content:
      'Healthcare providers are piloting AI triage tools that help staff route patients faster while maintaining clinician oversight.',
    seoTitle: 'AI Triage Tools in Outpatient Clinics',
    seoDescription:
      'Clinics adopt AI-assisted intake systems to prioritize cases and reduce patient wait times.',
  },
];

export async function seed() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@example.com';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'Admin123!';
  const passwordHash = await bcrypt.hash(adminPassword, 12);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { passwordHash, role: UserRole.SUPER_ADMIN, isActive: true },
    create: {
      email: adminEmail,
      passwordHash,
      role: UserRole.SUPER_ADMIN,
      isActive: true,
    },
  });

  for (const category of CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: {
        name: category.name,
        description: category.description,
        keywords: category.keywords,
        priorityScore: category.priorityScore,
        publishFrequency: PublishFrequency.DAILY,
        articlesPerCycle: 1,
        isActive: true,
      },
      create: {
        name: category.name,
        slug: category.slug,
        description: category.description,
        keywords: category.keywords,
        priorityScore: category.priorityScore,
        publishFrequency: PublishFrequency.DAILY,
        articlesPerCycle: 1,
        isActive: true,
      },
    });
  }

  for (const article of SAMPLE_ARTICLES) {
    const category = await prisma.category.findUnique({
      where: { slug: article.categorySlug },
      select: { id: true },
    });

    if (!category) {
      continue;
    }

    const idea = await prisma.articleIdea.upsert({
      where: { slugCandidate: article.slug },
      update: {
        title: article.title,
        summary: article.summary,
        status: ArticleIdeaStatus.APPROVED,
        categoryId: category.id,
      },
      create: {
        categoryId: category.id,
        title: article.title,
        slugCandidate: article.slug,
        summary: article.summary,
        status: ArticleIdeaStatus.APPROVED,
      },
    });

    await prisma.article.upsert({
      where: { slug: article.slug },
      update: {
        title: article.title,
        summary: article.summary,
        content: article.content,
        contentPlain: article.content,
        status: ArticleStatus.PUBLISHED,
        publishedAt: new Date('2026-06-20T10:00:00.000Z'),
        categoryId: category.id,
        seoTitle: article.seoTitle,
        seoDescription: article.seoDescription,
      },
      create: {
        categoryId: category.id,
        articleIdeaId: idea.id,
        title: article.title,
        slug: article.slug,
        summary: article.summary,
        content: article.content,
        contentPlain: article.content,
        status: ArticleStatus.PUBLISHED,
        publishedAt: new Date('2026-06-20T10:00:00.000Z'),
        seoTitle: article.seoTitle,
        seoDescription: article.seoDescription,
      },
    });
  }
}
