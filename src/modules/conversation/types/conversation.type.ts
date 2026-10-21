export type Conversation = {
  id: number
  topicRegistrationId: number
  name: string
  memberUserIds: number[]
}

export type ChatMessage = {
  id: number
  conversationId: number
  senderId: number
  senderName: string
  content: string
  createdAt: string
}
