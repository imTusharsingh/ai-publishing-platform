import { prisma } from './prisma.service';
import { PublishFrequency, UserRole } from '@prisma/client';
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
}
