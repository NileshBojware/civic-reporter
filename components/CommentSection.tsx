'use client'

import React, { useEffect, useRef, useState } from 'react'
import { MessageCircle, Send, Trash2, Loader2 } from 'lucide-react'

interface Comment {
  id: string
  report_id: string
  user_id: string | null
  author_name: string
  body: string
  created_at: string
}

interface CommentSectionProps {
  reportId: string
  user: { id: string; email?: string } | null
  authorName: string
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

// Deterministic avatar color from author name
const AVATAR_COLORS = [
  'bg-blue-500', 'bg-violet-500', 'bg-emerald-500',
  'bg-amber-500', 'bg-rose-500', 'bg-cyan-500', 'bg-pink-500',
]
function avatarColor(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

export function CommentSection({ reportId, user, authorName }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [body, setBody] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  const fetchComments = async () => {
    try {
      const res = await fetch(`/api/reports/${reportId}/comments`)
      if (res.ok) setComments(await res.json())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchComments()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = body.trim()
    if (!trimmed) return
    if (trimmed.length > 1000) {
      setError('Comment must be 1000 characters or fewer.')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const res = await fetch(`/api/reports/${reportId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user?.id ?? null,
          author_name: authorName,
          body: trimmed,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Failed to post comment.')
        return
      }

      const newComment: Comment = await res.json()
      setComments((prev) => [...prev, newComment])
      setBody('')
      // Scroll to the new comment
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (commentId: string) => {
    if (!user) return
    setDeletingId(commentId)
    try {
      const res = await fetch(
        `/api/reports/${reportId}/comments?comment_id=${commentId}&user_id=${user.id}`,
        { method: 'DELETE' }
      )
      if (res.ok) setComments((prev) => prev.filter((c) => c.id !== commentId))
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="p-6 md:p-8 rounded-lg bg-canvas border border-hairline shadow-sm space-y-5">
      {/* Header */}
      <div className="flex items-center gap-2">
        <MessageCircle className="w-4 h-4 text-brand-accent" />
        <h3 className="text-caption font-bold text-ink uppercase tracking-wider">
          Community Discussion
        </h3>
        {!loading && (
          <span className="ml-auto text-caption text-muted font-semibold">
            {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
          </span>
        )}
      </div>

      {/* Comment list */}
      <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-muted" />
          </div>
        ) : comments.length === 0 ? (
          <p className="text-caption text-muted text-center py-8">
            No comments yet. Be the first to share your thoughts.
          </p>
        ) : (
          comments.map((comment) => {
            const isOwn = user?.id === comment.user_id
            return (
              <div key={comment.id} className="flex gap-3 group">
                {/* Avatar */}
                <div
                  className={`flex-shrink-0 w-8 h-8 rounded-full ${avatarColor(comment.author_name)} flex items-center justify-center text-white text-[11px] font-bold select-none`}
                >
                  {getInitials(comment.author_name)}
                </div>

                {/* Bubble */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-caption font-semibold text-ink">
                      {comment.author_name}
                    </span>
                    <span className="text-[10px] text-muted">{timeAgo(comment.created_at)}</span>

                    {/* Delete — only shown to owner, on hover */}
                    {isOwn && (
                      <button
                        onClick={() => handleDelete(comment.id)}
                        disabled={deletingId === comment.id}
                        className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-muted hover:text-error cursor-pointer"
                        title="Delete comment"
                        aria-label="Delete comment"
                      >
                        {deletingId === comment.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Trash2 className="w-3 h-3" />
                        )}
                      </button>
                    )}
                  </div>
                  <p className="text-body-sm text-body leading-relaxed break-words">
                    {comment.body}
                  </p>
                </div>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Divider */}
      <div className="border-t border-hairline" />

      {/* Compose form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        {error && (
          <p className="text-caption text-error font-semibold">{error}</p>
        )}
        <div className="flex gap-3 items-start">
          {/* Own avatar */}
          <div
            className={`flex-shrink-0 w-8 h-8 rounded-full ${avatarColor(authorName)} flex items-center justify-center text-white text-[11px] font-bold select-none mt-0.5`}
          >
            {getInitials(authorName)}
          </div>

          <div className="flex-1 space-y-2">
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={user ? 'Add a comment…' : 'Log in to comment…'}
              disabled={!user || submitting}
              rows={2}
              maxLength={1000}
              className="w-full px-3 py-2 rounded-md bg-surface-soft border border-hairline text-body-sm text-ink placeholder:text-muted resize-none focus:outline-none focus:border-brand-accent transition disabled:opacity-50 disabled:cursor-not-allowed"
            />

            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted">
                {body.length > 0 && `${body.length}/1000`}
              </span>
              <button
                type="submit"
                disabled={!user || submitting || body.trim().length === 0}
                className="btn-primary h-8 px-4 text-caption flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                <span>{submitting ? 'Posting…' : 'Post'}</span>
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
