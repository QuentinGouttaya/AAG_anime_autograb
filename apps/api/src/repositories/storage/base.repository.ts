// storage/base.repository.ts
import { eq, type SQL } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { PgColumn, PgTable, TableConfig } from 'drizzle-orm/pg-core';

export abstract class BaseRepository<T extends PgTable<TableConfig>> {
  constructor(
    protected readonly db: NodePgDatabase,
    protected readonly table: T,
    protected readonly pkColumn: PgColumn,
  ) { }

  protected findAllRows() {
    return this.db.select().from(this.table);
  }

  protected async findRowById(id: number) {
    const [row] = await this.db.select().from(this.table).where(eq(this.pkColumn, id));
    return row ?? null;
  }

  protected findRowsWhere(condition: SQL) {
    return this.db.select().from(this.table).where(condition);
  }

  async delete(id: number): Promise<void> {
    await this.db.delete(this.table).where(eq(this.pkColumn, id));
  }
}
