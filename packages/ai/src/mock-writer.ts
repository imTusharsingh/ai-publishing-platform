import { MEDIUM_EXPLAINER_SECTIONS } from './medium-article-format';
import { resolveQualityThresholds } from './quality-thresholds';
import type { ArticleWriteInput, ArticleWriteResult } from './types';

function topicLabel(title: string): string {
  return (
    title
      .replace(/^How\s+/i, '')
      .replace(/\s+is reshaping.*$/i, '')
      .trim() || title
  );
}

function buildEasySection(topic: string): string {
  return [
    `<p><strong>${MEDIUM_EXPLAINER_SECTIONS.easy}:</strong></p>`,
    `<p>Imagine you have a giant box filled with everything you need to understand ${topic}. A traditional approach is like a big chest with labels — you can find things if you remember the label, but opening the chest and sorting through it takes time.</p>`,
    `<p>${topic} is more like a super-organized workspace with see-through sections. Each section has a clear code that tells you exactly what is inside. You can spot what you need almost instantly because the layout is designed for fast access rather than manual digging.</p>`,
    `<p>That speed comes from deliberate design choices: data is laid out so reads stay predictable, writes stay safe, and the system does not waste space on bookkeeping you never asked for. For teams shipping features under deadline pressure, that combination matters as much as raw throughput.</p>`,
    `<h3>Here's the catch:</h3>`,
    '<ul>',
    `<li><strong>Limited flexibility:</strong> This model excels when access patterns are simple and well-defined, but it is not a universal replacement for every storage problem.</li>`,
    `<li><strong>One writer at a time:</strong> Many high-performance designs serialize writes to protect consistency — plan workloads accordingly.</li>`,
    `<li><strong>Not a relational database:</strong> If you need complex joins and ad-hoc SQL analytics, a different tool may fit better.</li>`,
    '</ul>',
  ].join('');
}

function buildModerateSection(topic: string, outline: ArticleWriteInput['outline']): string {
  const points = outline.flatMap((section) => section.points);
  const featureBullets = (points.length > 0 ? points.slice(0, 4) : null) ?? [
    'Predictable read latency under concurrent access',
    'Compact on-disk representation with memory-mapped access',
    'ACID transactions with crash-safe durability semantics',
    'Language bindings and a stable C-oriented API surface',
  ];

  return [
    `<h2>${MEDIUM_EXPLAINER_SECTIONS.moderate}</h2>`,
    `<p>${topic} is a high-performance system designed for workloads that prize speed, reliability, and operational simplicity. Here is a structured breakdown of what practitioners care about on day one:</p>`,
    '<ul>',
    `<li><strong>Type:</strong> Embedded, transactional store optimized for key-value and structured record access.</li>`,
    `<li><strong>Structure:</strong> Tree-based indexing that keeps lookups and range scans efficient at scale.</li>`,
    `<li><strong>Speed:</strong> Memory-mapped files and copy-on-write updates minimize syscall overhead during reads.</li>`,
    `<li><strong>Memory:</strong> Lean footprint suitable for edge devices and services with tight resource budgets.</li>`,
    `<li><strong>Durability:</strong> Committed data survives process crashes; design assumes explicit transaction boundaries.</li>`,
    `<li><strong>API:</strong> Low-level primitives familiar to systems programmers; bindings exist for popular languages.</li>`,
    '</ul>',
    `<p><strong>Advantages of ${topic}:</strong></p>`,
    '<ul>',
    ...featureBullets.map(
      (point) =>
        `<li>${point} — with measurable impact on latency, cost, or engineering velocity.</li>`,
    ),
    `<li>Operational simplicity: fewer moving parts than a full database cluster for many embedded use cases.</li>`,
    `<li>Excellent read scaling when many consumers access the same dataset concurrently.</li>`,
    '</ul>',
    '<p><strong>Things to Consider:</strong></p>',
    '<ul>',
    `<li>Schema evolution and migration strategies must be planned — the sweet spot is stable access patterns.</li>`,
    `<li>Write-heavy bursts can queue behind the single-writer model; batch or pipeline writes when possible.</li>`,
    `<li>Observability hooks are lighter than cloud-native DBs; you may need custom metrics around transaction rates.</li>`,
    `<li>Team expertise: strongest when engineers understand mmap, B-trees, and transactional semantics.</li>`,
    '</ul>',
  ].join('');
}

function buildHardSection(topic: string, title: string): string {
  return [
    `<h2>${MEDIUM_EXPLAINER_SECTIONS.hard}</h2>`,
    `<p>Under the hood, ${topic} is engineered as a transactional embedded store rather than a general-purpose relational engine. Records are addressed by keys and stored as byte arrays, with range scans supported for ordered iteration. The implementation favors predictable read paths: readers do not block writers, and writers do not block readers, which is essential for services that mix ingestion pipelines with interactive queries.</p>`,
    `<p>The on-disk layout uses copy-on-write semantics. New versions of pages are written to fresh locations instead of overwriting live data, so a crash mid-transaction cannot tear a valid structure. That design removes the need for a separate write-ahead log in many deployments, improving write throughput because bytes are not duplicated across log and table files.</p>`,
    `<p>Concurrency is handled with multiversion techniques: read transactions see a consistent snapshot while write transactions commit atomically. In practice, read throughput scales with available cores because hot paths avoid global reader locks. Write throughput is bounded by intentional serialization, which is a deliberate trade-off for correctness on commodity hardware.</p>`,
    `<p>For ${title}, the engineering implications are concrete. Teams embedding this technology should benchmark their real key distributions, measure tail latency under parallel readers, and validate recovery behavior by killing processes during writes in staging. Production hardening also means capacity planning for file growth, backup strategy for mmap files, and clear ownership of schema or key-prefix conventions across microservices.</p>`,
    `<p>Common production patterns include local caches fronting remote services, configuration and feature-flag stores, high-churn indices inside larger pipelines, and embedded persistence in edge agents. When paired with disciplined key design and idempotent writers, ${topic} can deliver Medium-grade depth in production — not just benchmark slides.</p>`,
  ].join('');
}

function buildSummarySection(topic: string): string {
  return [
    `<h2>${MEDIUM_EXPLAINER_SECTIONS.summary}</h2>`,
    `<p>${topic} rewards teams that need fast, dependable access with minimal operational surface area. The Easy mental model — organized, transparent, quick to navigate — maps directly to how the system behaves under load. The Moderate checklist captures the features architects compare in evaluations, while the Hard details explain why those features exist and where they break down.</p>`,
    `<p>If your workload matches keyed lookups, ordered scans, and transactional updates with more reads than writes, ${topic} is a strong candidate. If you need ad-hoc analytics, multi-table joins, or constantly shifting schemas, weigh alternatives — but for focused, high-performance storage, the design remains one of the most instructive examples in modern systems engineering.</p>`,
  ].join('');
}

export function buildMockArticleContent(
  title: string,
  summary: string | null,
  outline: ArticleWriteInput['outline'],
): { content: string; contentPlain: string } {
  const topic = topicLabel(title);
  const intro =
    summary?.trim() ||
    `A layered explainer on ${topic} — from intuitive analogies to implementation depth.`;

  const body = [
    buildEasySection(topic),
    buildModerateSection(topic, outline),
    buildHardSection(topic, title),
    buildSummarySection(topic),
  ].join('');

  const minWords = resolveQualityThresholds().minWordCount;
  let content = `<h1>${title}</h1><p>${intro}</p>${body}`;
  let contentPlain = content
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  let wordCount = contentPlain.split(/\s+/).filter(Boolean).length;
  let extraIndex = 0;
  const expansions = [
    `A practical nuance for ${topic}: measure p99 read latency, not just averages, when you size hardware.`,
    `Operators should document key-prefix conventions early — future migrations are cheaper when naming is consistent.`,
    `Security reviews should include file permissions on mmap paths and backup encryption for at-rest copies.`,
  ];

  while (wordCount < minWords) {
    const extra = expansions[extraIndex % expansions.length]!;
    content += `<p>${extra}</p>`;
    contentPlain += ` ${extra}`;
    wordCount = contentPlain.split(/\s+/).filter(Boolean).length;
    extraIndex += 1;
  }

  return { content, contentPlain };
}

export function writeArticleWithMock(input: ArticleWriteInput): ArticleWriteResult {
  const { content, contentPlain } = buildMockArticleContent(
    input.title,
    input.summary,
    input.outline,
  );

  return {
    content,
    contentPlain,
    provider: 'mock',
    model: 'mock-writer-v2-medium',
    promptTokens: null,
    completionTokens: null,
    costUsd: null,
  };
}
