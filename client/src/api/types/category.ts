import type { Category } from '../models'

export type Request = Pick<Category, 'name' | 'type' | 'parent_id' | 'is_parent' | 'group_id'>

export type Response = Category
