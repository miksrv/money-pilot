export interface UserProfile {
    id: string
    name: string
    email: string
    phone?: string | null
    currency: string
    created_at?: string
}

export interface UpdateProfileBody {
    name: string
    phone?: string | null
    currency?: string
}

export interface ChangePasswordBody {
    current_password: string
    new_password: string
}
