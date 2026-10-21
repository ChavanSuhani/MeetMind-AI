import { api } from './api'
import { User } from '@/types'

export interface AuthResponse {
  access_token: string
  refresh_token: string
  token_type: string
  user: User
}

export async function registerUser(fullName: string, email: string, password: string): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/register', {
    full_name: fullName,
    email,
    password,
  })
  return data
}

export async function loginUser(email: string, password: string): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/login', { email, password })
  return data
}

export async function fetchCurrentUser(): Promise<User> {
  const { data } = await api.get<User>('/auth/me')
  return data
}
