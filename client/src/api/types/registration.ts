export interface Request {
    email?: string
    password?: string
    name?: string
    language?: string
    demo_data?: boolean
}

export interface Response {
    token?: string
}
