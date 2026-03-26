import type { Category } from '../models'

export type Request = Pick<Category, 'name' | 'type' | 'parent_id' | 'is_parent'>

export type Response = Category
