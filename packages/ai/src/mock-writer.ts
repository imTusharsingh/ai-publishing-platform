import { PUBLICATION_SECTIONS } from './publication-writer.prompt';
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

function buildIntroductionSection(topic: string, intro: string): string {
  return [
    `<h2>${PUBLICATION_SECTIONS.introduction}</h2>`,
    `<p>${intro}</p>`,
    `<p>${topic} shows up wherever teams need reliable, fast access to structured information under real-world constraints — from embedded devices to high-traffic services. Understanding it helps you choose the right tool, avoid costly misapplications, and debug production issues with confidence.</p>`,
    `<p>This article walks through core concepts, mechanics, trade-offs, practical scenarios, and actionable recommendations. Whether you are evaluating options or operating a system in production, each section adds something the last did not cover.</p>`,
  ].join('');
}

function buildFundamentalsSection(topic: string): string {
  return [
    `<h2>${PUBLICATION_SECTIONS.fundamentals}</h2>`,
    `<p>At its core, ${topic} is about organizing information so retrieval stays predictable even as data grows. Picture a workshop wall with labeled transparent bins: you memorize the codes once, then walk straight to the right bin instead of searching every drawer.</p>`,
    `<p>A conventional database can feel like a locked filing cabinet — powerful, but each lookup pays an opening cost. ${topic} keeps the catalog close at hand so repeated reads stay snappy when access patterns are keyed and local.</p>`,
    '<h3>Key ideas to internalize</h3>',
    '<ul>',
    `<li><strong>Purpose:</strong> Durable keyed storage with ordered iteration and minimal operational overhead.</li>`,
    `<li><strong>Predictability:</strong> Hot reads avoid extra copies when data is already mapped into the process address space.</li>`,
    `<li><strong>Working set:</strong> Memory use tracks active data; cold pages can be reclaimed by the OS.</li>`,
    '</ul>',
  ].join('');
}

function buildHowItWorksSection(topic: string, outline: ArticleWriteInput['outline']): string {
  const points = outline.flatMap((section) => section.points);
  const featureBullets = (points.length > 0 ? points.slice(0, 4) : null) ?? [
    'Predictable read latency under concurrent access',
    'Compact on-disk layout with memory-mapped reads',
    'Transactional updates with explicit commit boundaries',
    'Stable API surface with bindings for common languages',
  ];

  return [
    `<h2>${PUBLICATION_SECTIONS.howItWorks}</h2>`,
    `<p>At this level, ${topic} is best understood as an embedded system component: you link it into your process, open an environment, and perform transactional reads and writes against ordered key spaces.</p>`,
    '<h3>Workflow</h3>',
    '<ul>',
    `<li><strong>Speed:</strong> Hot reads avoid extra copies when data is already mapped into the process address space.</li>`,
    `<li><strong>Memory:</strong> Working set size tracks active data; cold pages can be reclaimed by the OS.</li>`,
    `<li><strong>Complexity:</strong> Lower than running a separate database tier for many embedded workloads.</li>`,
    `<li><strong>Scalability:</strong> Scales with CPU cores for reads; write throughput follows a single-writer model.</li>`,
    '</ul>',
    '<h3>Implementation characteristics</h3>',
    '<ul>',
    ...featureBullets.map((point) => `<li>${point}</li>`),
    '</ul>',
    `<p>Internally, ${topic} relies on tree-structured indexing so point lookups and range scans share one ordered layout. Pages are allocated append-only: updates write new versions rather than mutating live pages in place, which is how readers continue without blocking writers during commits.</p>`,
    `[IMAGE: Architecture diagram showing how ${topic} handles reads, writes, and transactional commits]`,
    '<h3>Minimal open example</h3>',
    `<pre><code>const env = await openEnv({ path: './data/app.db' });
const db = env.openDb({ name: 'articles' });
await db.put('draft:42', Buffer.from('payload'));
await env.commit();</code></pre>`,
  ].join('');
}

function buildTradeoffsSection(topic: string, title: string): string {
  return [
    `<h2>${PUBLICATION_SECTIONS.tradeoffs}</h2>`,
    `<p>Concurrency typically follows multiversion semantics — readers observe a consistent snapshot while a writer prepares a new root. That pattern removes reader locks on the hot path but caps write parallelism by design.</p>`,
    `<p><strong>Best for:</strong> Caches, configuration stores, indices, edge agents, and pipeline staging when latency budgets are tight and operational surface area must stay small.</p>`,
    `<p><strong>Avoid when:</strong> Analysts need SQL across many entities, writers must scale horizontally on one logical dataset, or schemas change weekly without a migration plan.</p>`,
    `[IMAGE: Comparison graphic illustrating when ${topic} excels versus relational databases and in-memory caches]`,
    `<p>Failure modes to rehearse in staging include partial writes during crash, disk full conditions, and mmap failures when file limits are misconfigured. For ${title}, production debugging usually centers on transaction boundaries, environment handle lifetimes, and verifying that readers are not holding snapshots open long enough to block reuse of old pages.</p>`,
  ].join('');
}

function buildRealWorldSection(topic: string): string {
  return [
    `<h2>${PUBLICATION_SECTIONS.realWorld}</h2>`,
    `<p><strong>Use it when</strong> you need microsecond-scale reads colocated with application logic, can tolerate a single writer, and benefit from crash-safe commits without operating a separate database cluster.</p>`,
    `<p><strong>Avoid it when</strong> analysts need SQL across many entities, writers must scale horizontally on one logical dataset, or schemas change weekly without a migration plan.</p>`,
    `<p><strong>Common mistakes</strong> include treating it as a message queue, opening environments per request instead of pooling handles, ignoring fsync policy during benchmarks, and sharing one environment across untrusted tenants without isolation.</p>`,
    `<p><strong>Better alternatives</strong> might include a managed relational database for reporting, an object store for large blobs, or an in-memory cache when durability is not required — ${topic} wins when durability and local speed matter together.</p>`,
  ].join('');
}

function buildBestPracticesSection(topic: string): string {
  return [
    `<h2>${PUBLICATION_SECTIONS.bestPractices}</h2>`,
    '<ul>',
    `<li>Benchmark with production-like keys, value sizes, and read/write ratios before committing.</li>`,
    `<li>Define key namespaces and document them in the repository README or internal wiki.</li>`,
    `<li>Cap reader transaction lifetime; long-lived read transactions can pin old pages.</li>`,
    `<li>Automate backups and test restore on a clean host quarterly.</li>`,
    `<li>Expose metrics: commit rate, map size, reader count, and error codes from the API.</li>`,
    `<li>Run crash-injection tests in staging before trusting durability claims for ${topic}.</li>`,
    '</ul>',
  ].join('');
}

function buildConclusionSection(topic: string): string {
  return [
    `<h2>${PUBLICATION_SECTIONS.conclusion}</h2>`,
    `<p>${topic} solves the problem of fast, dependable local persistence when a full database tier is heavier than the workload demands. It excels at keyed access, ordered scans, and read-heavy services that colocate storage with compute.</p>`,
    `<p>Prefer another approach when relational analytics, elastic write scaling, or schema chaos dominate. The key takeaway: match the tool to access patterns, validate durability under your fsync policy, and invest in key design up front — that is what separates a smooth production rollout from a painful retrofit.</p>`,
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
    `A long-form explainer on ${topic}, from first principles through production practice.`;

  const body = [
    buildIntroductionSection(topic, intro),
    buildFundamentalsSection(topic),
    buildHowItWorksSection(topic, outline),
    buildTradeoffsSection(topic, title),
    buildRealWorldSection(topic),
    buildBestPracticesSection(topic),
    buildConclusionSection(topic),
  ].join('');

  const minWords = resolveQualityThresholds().minWordCount;
  let content = `<h1>${title}</h1>${body}`;
  let contentPlain = content
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  let wordCount = contentPlain.split(/\s+/).filter(Boolean).length;
  let extraIndex = 0;
  const expansions = [
    `When operating ${topic} in production, treat observability as part of the schema: log commit failures, map growth, and reader lifetimes alongside application metrics.`,
    `Capacity planning for ${topic} should include headroom for copy-on-write amplification during bulk imports — steady-state size is not peak size.`,
    `On-call runbooks for ${topic} should list safe restart steps, backup locations, and how to verify integrity after an unclean shutdown.`,
    `Security implications are often overlooked: file permissions on the data directory, backup encryption, and ensuring untrusted inputs cannot blow key or value size limits.`,
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
    model: 'mock-writer-v4-publication',
    promptTokens: null,
    completionTokens: null,
    costUsd: null,
  };
}
