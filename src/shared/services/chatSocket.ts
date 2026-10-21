import { Client, type StompSubscription } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import { tokenStorage } from './tokenStorage'
import type { ChatMessage } from '../../modules/conversation/types/conversation.type'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
const WS_ENDPOINT = `${API_BASE_URL}/ws`
type MessageListener = (message: ChatMessage) => void

let client: Client | null = null
const subscriptions = new Map<number, { listeners: Set<MessageListener>; subscription?: StompSubscription }>()

function subscribeConversation(conversationId: number) {
  const entry = subscriptions.get(conversationId)
  if (!client?.connected || !entry || entry.subscription) return
  entry.subscription = client.subscribe(`/topic/conversations/${conversationId}`, (frame) => {
    try {
      const message = JSON.parse(frame.body) as ChatMessage
      entry.listeners.forEach((listener) => listener(message))
    } catch {
      // Bỏ qua message không đúng JSON.
    }
  })
}

export function connectChatSocket() {
  if (client) return
  const token = tokenStorage.getAccessToken()
  if (!token) return
  const stompClient = new Client({
    webSocketFactory: () => new SockJS(WS_ENDPOINT),
    connectHeaders: { Authorization: `Bearer ${token}` },
    reconnectDelay: 5000,
    onConnect: () => subscriptions.forEach((_, id) => subscribeConversation(id)),
  })
  stompClient.activate()
  client = stompClient
}

export function subscribeToConversation(conversationId: number, listener: MessageListener) {
  let entry = subscriptions.get(conversationId)
  if (!entry) {
    entry = { listeners: new Set() }
    subscriptions.set(conversationId, entry)
  }
  entry.listeners.add(listener)
  subscribeConversation(conversationId)
  return () => {
    const current = subscriptions.get(conversationId)
    if (!current) return
    current.listeners.delete(listener)
    if (current.listeners.size === 0) {
      current.subscription?.unsubscribe()
      subscriptions.delete(conversationId)
    }
  }
}

export function sendChatMessage(conversationId: number, content: string) {
  if (!client?.connected) throw new Error('Kết nối chat chưa sẵn sàng')
  client.publish({ destination: '/app/chat.send', body: JSON.stringify({ conversationId, content }) })
}

export function disconnectChatSocket() {
  subscriptions.forEach((entry) => entry.subscription?.unsubscribe())
  subscriptions.clear()
  if (client) void client.deactivate()
  client = null
}
