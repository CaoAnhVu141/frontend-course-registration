import { apiClient } from '../../../shared/services/apiClient'
import type { TopicRegistration } from '../../topicregistrations/types/topicRegistration.type'
import {
  getMyTopicRegistrations,
  getTopicRegistrations,
} from '../../topicregistrations/services/topicRegistrationApi'
import type { Conversation, ChatMessage } from '../types/conversation.type'

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

/** Lấy conversation từ các đăng ký đề tài đã được duyệt của user. */
export async function getMyConversations(
  isLecturer: boolean,
): Promise<Conversation[]> {
  const registrations = isLecturer
    ? await getTopicRegistrations()
    : await getMyTopicRegistrations()

  const approved = registrations.filter(
    (registration: TopicRegistration) => registration.status === 'APPROVED',
  )

  const results = await Promise.allSettled(
    approved.map((registration) =>
      getConversationByTopicRegistration(registration.id),
    ),
  )

  return results
    .filter(
      (result): result is PromiseFulfilledResult<Conversation> =>
        result.status === 'fulfilled',
    )
    .map((result) => result.value)
}
