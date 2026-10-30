type PageResult<Row> = { data: Row[] | null; error: unknown };
type PaginatedQuery<Row> = {
  range(from: number, to: number): PromiseLike<PageResult<Row>>;
};

/** Aggregate/report queries must not silently stop at PostgREST's default row limit. */
export async function readAllRows<Row>(query: PaginatedQuery<Row>) {
  const rows: Row[] = [];
  const pageSize = 500;
  for (let from = 0; ; from += pageSize) {
    const result = await query.range(from, from + pageSize - 1);
    if (result.error) throw result.error;
    const page = result.data ?? [];
    rows.push(...page);
    if (page.length < pageSize) return { data: rows, error: null };
  }
}
