/**
 * Base contract for any domain entity inside a bounded context.
 * Every entity is uniquely identified through its `id`.
 */
export interface BaseEntity {
  id: string;
}
