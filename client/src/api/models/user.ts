export interface UserProfile {
    id: string
    name: string
    email: string
    phone?: string | null
    created_at?: string
}

export interface UpdateProfileBody {
    name: string
    phone?: string | null
}

export interface ChangePasswordBody {
    current_password: string
    new_password: string
}
