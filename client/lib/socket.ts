/**
 * Socket.io Client
 * Real-time communication for live location sharing and notifications
 */

import { io, Socket } from 'socket.io-client'

let socket: Socket | null = null

/**
 * Initialize socket connection
 */
export const initSocket = (userId: string): Socket => {
  if (!socket || !socket.connected) {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000'
    
    socket = io(apiUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    })

    socket.on('connect', () => {
      console.log('✅ Socket connecté')
      socket?.emit('join-room', userId)
    })

    socket.on('disconnect', () => {
      console.log('⚠️ Socket déconnecté')
    })

    socket.on('connect_error', (error) => {
      console.error('❌ Erreur connexion socket:', error)
    })
  }

  return socket
}

/**
 * Get socket instance
 */
export const getSocket = (): Socket | null => {
  return socket
}

/**
 * Update live location
 */
export const updateLocation = (userId: string, location: {
  coordinates: [number, number]
  address?: string
  city?: string
  country?: string
}) => {
  if (socket && socket.connected) {
    socket.emit('update-location', {
      userId,
      location: {
        coordinates: location.coordinates,
        address: location.address || '',
        city: location.city || '',
        country: location.country || ''
      }
    })
  }
}

/**
 * Stop sharing location
 */
export const stopSharingLocation = (userId: string) => {
  if (socket && socket.connected) {
    socket.emit('stop-sharing-location', userId)
  }
}

/**
 * Disconnect socket
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

/**
 * Listen to notifications
 */
export const onNotification = (callback: (notification: any) => void) => {
  if (socket) {
    socket.on('new-notification', callback)
  }
}

/**
 * Listen to location updates
 */
export const onLocationUpdate = (callback: (data: any) => void) => {
  if (socket) {
    socket.on('location-update', callback)
  }
}

/**
 * Listen to nearby user locations
 */
export const onNearbyUserLocation = (callback: (data: any) => void) => {
  if (socket) {
    socket.on('nearby-user-location', callback)
  }
}
