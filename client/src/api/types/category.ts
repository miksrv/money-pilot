import type { Category } from '../models'

export type Request = Pick<Category, 'name' | 'type' | 'parent_id'>

export type Response = Category
