import { useState, useEffect } from 'react'
import type { Goal } from '../types'
import { shareGoal, getSharesForGoal, unshareGoal, type Share } from '../firestore-storage'
import { useAuth } from '../contexts/AuthContext'
import './ShareModal.css'

interface ShareModalProps {
  goal: Goal
  onClose: () => void
}

export function ShareModal({ goal, onClose }: ShareModalProps) {
  const { currentUser } = useAuth()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [shares, setShares] = useState<Share[]>([])
  const [loadingShares, setLoadingShares] = useState(true)

  useEffect(() => {
    loadShares()
  }, [goal.id])

  async function loadShares() {
    try {
      setLoadingShares(true)
      const goalShares = await getSharesForGoal(goal.id)
      setShares(goalShares)
    } catch (err) {
      console.error('Error loading shares:', err)
    } finally {
      setLoadingShares(false)
    }
  }

  async function handleShare(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim() || !currentUser) return

    setLoading(true)
    setError('')
    setSuccess('')

    const result = await shareGoal(
      currentUser.uid,
      currentUser.displayName || currentUser.email || 'Unknown',
      email.trim(),
      goal.id,
      goal.title
    )

    setLoading(false)

    if (result.success) {
      setSuccess(`Goal shared with ${email}`)
      setEmail('')
      loadShares()
    } else {
      setError(result.error || 'Failed to share goal')
    }
  }

  async function handleUnshare(shareId: string) {
    if (!confirm('Remove access to this goal?')) return

    try {
      await unshareGoal(shareId)
      setSuccess('Access removed')
      loadShares()
    } catch (err) {
      setError('Failed to remove access')
    }
  }

  function handleBackdropClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal-content share-modal">
        <header className="modal-header">
          <div>
            <h3>Share Goal</h3>
            <p className="modal-subtitle">{goal.title}</p>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </header>

        <div className="modal-body">
          <form className="share-form" onSubmit={handleShare}>
            <div className="share-field">
              <label htmlFor="share-email">Share with (email address)</label>
              <div className="share-input-group">
                <input
                  id="share-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="friend@example.com"
                  disabled={loading}
                  required
                />
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={loading || !email.trim()}
                >
                  {loading ? 'Sharing...' : 'Share'}
                </button>
              </div>
            </div>

            {error && <div className="share-error">{error}</div>}
            {success && <div className="share-success">{success}</div>}
          </form>

          <div className="shares-list">
            <h4>Shared with</h4>
            {loadingShares ? (
              <p className="shares-loading">Loading...</p>
            ) : shares.length === 0 ? (
              <p className="shares-empty">Not shared with anyone yet</p>
            ) : (
              <ul className="shares-items">
                {shares.map((share) => (
                  <li key={share.id} className="share-item">
                    <div className="share-item-info">
                      <span className="share-item-email">{share.sharedWithEmail}</span>
                      <span className="share-item-date">
                        Shared {new Date(share.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <button
                      className="btn-ghost btn-sm btn-danger"
                      onClick={() => handleUnshare(share.id)}
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <footer className="modal-footer">
          <button className="btn-ghost" onClick={onClose}>Close</button>
        </footer>
      </div>
    </div>
  )
}
