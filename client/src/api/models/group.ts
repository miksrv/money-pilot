export interface Group {
    id: string
    owner_id: string
    name: string
    description?: string
    is_active: number
    created_at: string
    updated_at: string
}

export interface GroupMember {
    id: string
    group_id: string
    user_id: string
    name: string
    email: string
    role: 'owner' | 'editor' | 'viewer'
    joined_at: string
}

export interface GroupInvitation {
    id: string
    group_id: string
    email: string
    role: 'editor' | 'viewer'
    expires_at: string
    created_at: string
}

export interface PendingInvitation {
    id: string
    token: string
    group_id: string
    group_name: string
    inviter_name: string
    role: 'editor' | 'viewer'
    expires_at: string
}

export interface InviteMemberBody {
    email: string
    role: 'editor' | 'viewer'
}
