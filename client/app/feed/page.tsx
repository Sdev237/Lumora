'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import Navbar from '@/components/layout/Navbar'
import PostList from '@/components/posts/PostList'
import api from '@/lib/api'

export default function FeedPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [refreshKey, setRefreshKey] = useState(0)
  const [liveSessions, setLiveSessions] = useState<any[]>([])

  useEffect(() => {
    if (!loading && !user) {
      router.push('/')
    }
  }, [user, loading, router])

  useEffect(() => {
    const fetchLives = async () => {
      try {
        const res = await api.get('/live/active')
        setLiveSessions(res.data.sessions || [])
      } catch {
        setLiveSessions([])
      }
    }
    if (user) {
      fetchLives()
    }
  }, [user])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8 lg:flex lg:space-x-8">
        <div className="flex-1 lg:max-w-3xl mx-auto">
          <PostList key={refreshKey} />
        </div>
        <aside className="hidden lg:block w-80 space-y-4">
          <div className="bg-white rounded-lg shadow-md p-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-2">
              Lives en cours
            </h2>
            {liveSessions.length === 0 ? (
              <p className="text-xs text-gray-500">
                Aucun live pour le moment.
              </p>
            ) : (
              <ul className="space-y-2">
                {liveSessions.map((s: any) => (
                  <li
                    key={s._id}
                    className="flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center space-x-2">
                      {s.host?.avatar ? (
                        <img
                          src={
                            s.host.avatar.startsWith('http')
                              ? s.host.avatar
                              : `${
                                  process.env.NEXT_PUBLIC_API_URL?.replace(
                                    '/api',
                                    ''
                                  ) || 'http://localhost:5000'
                                }${
                                  s.host.avatar.startsWith('/')
                                    ? s.host.avatar
                                    : '/' + s.host.avatar
                                }`
                          }
                          alt={s.host.username}
                          className="w-6 h-6 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-primary-600 flex items-center justify-center text-white text-[10px] font-medium">
                          {s.host?.username?.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-gray-800">
                          {s.host?.username}
                        </p>
                        {s.title && (
                          <p className="text-[11px] text-gray-500 truncate max-w-[140px]">
                            {s.title}
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => router.push(`/live/${s._id}`)}
                      className="px-2 py-1 bg-red-600 text-white rounded-full text-[11px] font-semibold"
                    >
                      Rejoindre
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}
