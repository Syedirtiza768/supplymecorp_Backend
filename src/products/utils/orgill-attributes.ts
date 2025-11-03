export function extractOrgillAttributes(row: Record<string, any>) {
  const attrs: { name: string; value: any; uom?: string | null }[] = [];
  for (let i = 1; i <= 50; i++) {
    const name = row[`attribute_name_${i}`];
    const value = row[`attribute_value_${i}`];
    const uom = row[`attribute_value_uom_${i}`];
    if (name || value || uom) {
      attrs.push({
        name: (name ?? '') as string,
        value: value ?? null,
        uom: uom ?? null,
      });
    }
  }
  return attrs;
}
