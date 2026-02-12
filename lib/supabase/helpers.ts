/**
 * Typed query helpers for Supabase.
 * 
 * Supabase SDK v2.95.1's select query parser doesn't resolve Row types
 * with TypeScript 5.9+. These helpers provide type-safe access.
 */
import type { Database } from './database.types'

type Tables = Database['public']['Tables']

/** Get the Row type for any table */
export type Row<T extends keyof Tables> = Tables[T]['Row']

/** Get the Insert type for any table */
export type InsertRow<T extends keyof Tables> = Tables[T]['Insert']

/** Get the Update type for any table */
export type UpdateRow<T extends keyof Tables> = Tables[T]['Update']

/** All valid table names */
export type TableName = keyof Tables

/**
 * Type-cast a single query result.
 * Use after .select('*').single() or .select('*').maybeSingle()
 */
export function typedRow<T extends keyof Tables>(data: unknown): Row<T> | null {
  return data as Row<T> | null
}

/**
 * Type-cast an array query result.
 * Use after .select('*') without .single()
 */
export function typedRows<T extends keyof Tables>(data: unknown): Row<T>[] {
  return (data || []) as Row<T>[]
}
