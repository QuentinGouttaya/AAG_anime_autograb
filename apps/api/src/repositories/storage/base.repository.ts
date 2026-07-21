import { eq, type SQL } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { PgColumn, PgTable, TableConfig } from 'drizzle-orm/pg-core';

export abstract class BaseRepository<T extends PgTable<TableConfig>> {
  constructor(
    protected readonly db: NodePgDatabase,
    protected readonly table: T,
    protected readonly pkColumn: PgColumn,
  ) { }

  protected async findAllRows(): Promise<T['$inferSelect'][]> {
    const rows = await this.db.select().from(this.table as PgTable);

    return rows as T['$inferSelect'][];
  }

  protected async findRowById(id: number): Promise<T['$inferSelect'] | null> {
    const [row] = await this.db
      .select()
      .from(this.table as PgTable)
      .where(eq(this.pkColumn, id));

    return (row as T['$inferSelect'] | undefined) ?? null;
  }

  protected async findRowsWhere(
    condition: SQL,
  ): Promise<T['$inferSelect'][]> {
    const rows = await this.db
      .select()
      .from(this.table as PgTable)
      .where(condition);

    return rows as T['$inferSelect'][];
  }

  async delete(id: number): Promise<void> {
    await this.db.delete(this.table as PgTable).where(eq(this.pkColumn, id));
  }
}
