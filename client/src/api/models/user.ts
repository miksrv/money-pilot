export interface UserProfile {
    id: string
    name: string
    email: string
    currency: string
    language?: string
    created_at?: string
}

export interface UpdateProfileBody {
    name: string
    currency?: string
    language?: string
}

export interface ChangePasswordBody {
    current_password: string
    new_password: string
}
