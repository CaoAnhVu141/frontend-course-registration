import { apiClient } from '../../../shared/services/apiClient'
import type { Conversation, ChatMessage } from '../types/conversation.type'

export function getMyConversations(): Promise<Conversation[]> {
  return apiClient<Conversation[]>('/api/chat/me')
}

export async function getConversationByTopicRegistration(
  topicRegistrationId: number,
): Promise<Conversation> {
  return apiClient<Conversation>(
    `/api/chat/topic-registrations/${topicRegistrationId}`,
  )
}

export function getConversationMessages(
  conversationId: number,
): Promise<ChatMessage[]> {
  return apiClient<ChatMessage[]>(`/api/chat/${conversationId}/messages`)
}

