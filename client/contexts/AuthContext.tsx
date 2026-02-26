'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import axios from 'axios'
import { useRouter } from 'next/navigation'
import { initSocket, disconnectSocket } from '@/lib/socket'

interface User {
  _id: string
  username: string
  email: string
  firstName?: string
  lastName?: string
  avatar?: string
  bio?: string
  currentLocation?: {
    coordinates: [number, number]
    city?: string
    isSharing?: boolean
  }
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (
    username: string,
    email: string,
    password: string,
    firstName?: string,
    lastName?: string,
    dateOfBirth?: string
  ) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      setLoading(false)
      return
    }

    try {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`)
      setUser(response.data.user)
      
      // Initialize socket connection
      if (response.data.user._id) {
        initSocket(response.data.user._id)
      }
    } catch (error) {
      localStorage.removeItem('token')
      delete axios.defaults.headers.common['Authorization']
    } finally {
      setLoading(false)
    }
  }

  const register = async (
    username: string,
    email: string,
    password: string,
    firstName?: string,
    lastName?: string,
    dateOfBirth?: string
  ) => {
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/register`,
        {
          username,
          email,
          password,
          firstName,
          lastName,
          dateOfBirth,
        }
      )
      
      localStorage.setItem('token', response.data.token)
      axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`
      setUser(response.data.user)
      
      // Initialize socket
      if (response.data.user._id) {
        initSocket(response.data.user._id)
      }
      
      router.push('/feed')
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erreur d\'inscription')
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    delete axios.defaults.headers.common['Authorization']
    disconnectSocket()
    setUser(null)
    router.push('/')
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
