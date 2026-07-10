export function renderPromptTemplate(
  template: string,
  variables: Record<string, string | null | undefined>,
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    const value = variables[key];
    return value?.trim() ?? '';
  });
}
