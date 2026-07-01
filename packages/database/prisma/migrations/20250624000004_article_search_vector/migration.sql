-- Full-text search vector for published articles
ALTER TABLE articles ADD COLUMN IF NOT EXISTS search_vector tsvector;

CREATE OR REPLACE FUNCTION articles_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.summary, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.content_plain, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS articles_search_vector_trigger ON articles;
CREATE TRIGGER articles_search_vector_trigger
  BEFORE INSERT OR UPDATE OF title, summary, content_plain ON articles
  FOR EACH ROW EXECUTE FUNCTION articles_search_vector_update();

UPDATE articles
SET search_vector =
  setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(summary, '')), 'B') ||
  setweight(to_tsvector('english', coalesce(content_plain, '')), 'C')
WHERE search_vector IS NULL;

CREATE INDEX IF NOT EXISTS articles_search_vector_idx ON articles USING GIN (search_vector);
