export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}

export async function generateUniqueSlug(
  name: string,
  isTaken: (slug: string) => Promise<boolean>,
): Promise<string> {
  const baseSlug = slugify(name) || 'category';
  let slug = baseSlug;
  let suffix = 2;

  while (await isTaken(slug)) {
    const trimmedBase = baseSlug.slice(0, Math.max(1, 120 - `-${suffix}`.length));
    slug = `${trimmedBase}-${suffix}`;
    suffix += 1;
  }

  return slug;
}
