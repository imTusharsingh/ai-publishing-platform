import { NotFoundView } from '@/components/not-found-view';
import { getArticles } from '@/lib/api';

export default async function NotFound() {
  let recommended: Awaited<ReturnType<typeof getArticles>>['data'] = [];

  try {
    const response = await getArticles({ limit: 3 });
    recommended = response.data;
  } catch {
    recommended = [];
  }

  return <NotFoundView recommended={recommended} />;
}
