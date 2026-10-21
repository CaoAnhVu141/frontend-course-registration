import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { MessageCircle, Send, X } from 'lucide-react'
import { hasRole } from '../../../shared/utils/roleLabel'
import { tokenStorage } from '../../../shared/services/tokenStorage'
import { connectChatSocket, disconnectChatSocket, sendChatMessage, subscribeToConversation } from '../../../shared/services/chatSocket'
import { useNotification } from '../../notification'
import { getConversationMessages, getMyConversations } from '../services/conversationApi'
import type { ChatMessage, Conversation } from '../types/conversation.type'
import './ChatWidget.css'

export function ChatWidget() {
  const user = useMemo(() => tokenStorage.getUser(), [])
  const isLecturer = hasRole(user?.roles, 'LECTURER')
  const canChat = isLecturer || hasRole(user?.roles, 'STUDENT')
  const { error: showError } = useNotification()
  const [isOpen, setIsOpen] = useState(false)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [unread, setUnread] = useState<Record<number, number>>({})
  const [draft, setDraft] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isMessagesLoading, setIsMessagesLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const selectedConversation = conversations.find((item) => item.id === selectedId)

  const loadConversations = useCallback(async () => {
    if (!canChat) return
    try {
      setIsLoading(true)
      const data = await getMyConversations()
      setConversations(data)
      setSelectedId((current) => current && data.some((item) => item.id === current) ? current : data[0]?.id ?? null)
    } catch (loadError) {
      showError(loadError instanceof Error ? loadError.message : 'Không thể tải danh sách cuộc trò chuyện')
    } finally {
      setIsLoading(false)
    }
  }, [canChat, isLecturer, showError])

  useEffect(() => {
    if (!canChat) return
    connectChatSocket()
    void loadConversations()
    return () => disconnectChatSocket()
  }, [canChat, loadConversations])

  useEffect(() => {
    if (!selectedId) { setMessages([]); return }
    let cancelled = false
    setIsMessagesLoading(true)
    void getConversationMessages(selectedId).then((data) => {
      if (!cancelled) setMessages(data)
    }).catch((loadError) => {
      if (!cancelled) showError(loadError instanceof Error ? loadError.message : 'Không thể tải lịch sử tin nhắn')
    }).finally(() => { if (!cancelled) setIsMessagesLoading(false) })

    setUnread((current) => ({ ...current, [selectedId]: 0 }))
    return () => { cancelled = true }
  }, [selectedId, showError, user?.id])

  // Subscribe tất cả nhóm để vẫn nhận được tin mới và badge khi đang mở nhóm khác.
  useEffect(() => {
    if (!conversations.length) return

    const unsubscribers = conversations.map((conversation) =>
      subscribeToConversation(conversation.id, (message) => {
        if (message.conversationId === selectedId) {
          setMessages((current) =>
            current.some((item) => item.id === message.id)
              ? current
              : [...current, message],
          )
        }

        if (
          message.senderId !== Number(user?.id) &&
          (message.conversationId !== selectedId || !isOpen)
        ) {
          setUnread((current) => ({
            ...current,
            [message.conversationId]: (current[message.conversationId] ?? 0) + 1,
          }))
        }
      }),
    )

    return () => unsubscribers.forEach((unsubscribe) => unsubscribe())
  }, [conversations, isOpen, selectedId, user?.id])

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  function submitMessage() {
    const content = draft.trim()
    if (!selectedId || !content) return
    try { sendChatMessage(selectedId, content); setDraft('') }
    catch (sendError) { showError(sendError instanceof Error ? sendError.message : 'Gửi tin nhắn thất bại') }
  }

  if (!canChat) return null
  const unreadTotal = Object.values(unread).reduce((sum, value) => sum + value, 0)

  return <div className="chat-widget">
    {isOpen && <section className="chat-panel" aria-label="Tin nhắn realtime">
      <header className="chat-panel-header"><div><strong>Tin nhắn</strong><span>{conversations.length} cuộc trò chuyện</span></div><button type="button" onClick={() => setIsOpen(false)} aria-label="Đóng chat"><X size={18} /></button></header>
      <div className="chat-panel-body">
        <aside className="chat-conversation-list">
          {isLoading && <p className="chat-empty-small">Đang tải...</p>}
          {!isLoading && conversations.length === 0 && <p className="chat-empty-small">Chưa có nhóm được duyệt.</p>}
          {conversations.map((conversation) => <button type="button" className={`chat-conversation-item ${conversation.id === selectedId ? 'is-selected' : ''}`} key={conversation.id} onClick={() => { setSelectedId(conversation.id); setUnread((current) => ({ ...current, [conversation.id]: 0 })) }}><span className="chat-conversation-avatar">{conversation.name.charAt(0)}</span><span className="chat-conversation-name">{conversation.name}</span>{!!unread[conversation.id] && <small>{unread[conversation.id]}</small>}</button>)}
        </aside>
        <div className="chat-conversation-content">
          {selectedConversation ? <><div className="chat-current-title">{selectedConversation.name}</div><div className="chat-messages">
            {isMessagesLoading && <p className="chat-empty">Đang tải lịch sử...</p>}
            {!isMessagesLoading && messages.length === 0 && <p className="chat-empty">Bắt đầu trao đổi về đề tài nhé.</p>}
            {messages.map((message) => { const isMine = message.senderId === Number(user?.id); return <div className={`chat-message-row ${isMine ? 'is-mine' : ''}`} key={message.id}><div className="chat-message-bubble">{!isMine && <small>{message.senderName}</small>}<p>{message.content}</p><time>{formatTime(message.createdAt)}</time></div></div> })}<div ref={messagesEndRef} />
          </div><form className="chat-composer" onSubmit={(event) => { event.preventDefault(); submitMessage() }}><input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Nhập tin nhắn..." maxLength={2000} /><button type="submit" disabled={!draft.trim()} aria-label="Gửi tin nhắn"><Send size={17} /></button></form></> : <p className="chat-empty">Chọn một cuộc trò chuyện để bắt đầu.</p>}
        </div>
      </div>
    </section>}
    <button
      type="button"
      className="chat-fab"
      onClick={() => {
        setIsOpen((current) => {
          const next = !current
          if (next && selectedId) {
            setUnread((unreadByConversation) => ({
              ...unreadByConversation,
              [selectedId]: 0,
            }))
          }
          return next
        })
      }}
      aria-label="Mở tin nhắn"
    >
      <MessageCircle size={23} />
      {!!unreadTotal && <span>{unreadTotal > 99 ? '99+' : unreadTotal}</span>}
    </button>
  </div>
}

function formatTime(value: string) { return new Date(value).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) }
