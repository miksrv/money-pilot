import { ApiModel } from '@/api'

export const SKELETON_WIDTHS = [80, 60, 70, 55, 65]

export const NAME_MAX_LENGTH = 100

export const DEFAULT_VALUES: ApiModel.Category = {
    name: '',
    type: 'expense',
    parent_id: undefined,
    is_parent: false,
    budget: undefined,
    color: 'grey',
    icon: '💵'
}
