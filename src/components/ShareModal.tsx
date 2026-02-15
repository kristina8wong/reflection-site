import { useState, useEffect, useRef, useCallback } from 'react'
import type { Goal } from '../types'
import { shareGoal, getSharesForGoal, unshareGoal, searchUsers, type Share } from '../firestore-storage'
import type { UserProfile } from '../firestore-storage'
import { useAuth } from '../contexts/AuthContext'
import './CheckInModal.css'
import './ShareModal.css'

interface ShareModalProps {
  goal: Goal
  onClose: () => void
}

export function ShareModal({ goal, onClose }: ShareModalProps) {
  const { currentUser } = useAuth()
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<UserProfile[]>([])
  const [loadingSearch, setLoadingSearch] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [shares, setShares] = useState<Share[]>([])
  const [loadingShares, setLoadingShares] = useState(true)
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    if (currentUser) loadShares()
  }, [goal.id, currentUser])

  async function loadShares() {
    if (!currentUser) return
    try {
      setLoadingShares(true)
      const goalShares = await getSharesForGoal(goal.id, currentUser.uid)
      setShares(goalShares)
    } catch (err) {
      console.error('Error loading shares:', err)
    } finally {
      setLoadingShares(false)
    }
  }

  const sharedWithIds = new Set(shares.map((s) => s.sharedWithId))

  const doSearch = useCallback(async (q: string) => {
    if (q.trim().length < 1) {
      setSuggestions([])
      return
    }
    setLoadingSearch(true)
    try {
      const results = await searchUsers(q)
      setSuggestions(
        results.filter((u) => u.uid !== currentUser?.uid && !sharedWithIds.has(u.uid))
      )
      setShowDropdown(true)
    } catch (err) {
      console.error('Search error:', err)
      setSuggestions([])
    } finally {
      setLoadingSearch(false)
    }
  }, [currentUser?.uid, shares])

  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    if (!query.trim()) {
      setSuggestions([])
      setShowDropdown(false)
      return
    }
    searchTimeoutRef.current = setTimeout(() => doSearch(query), 200)
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    }
  }, [query, doSearch])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function handleSelectUser(user: UserProfile) {
    setSelectedUser(user)
    setQuery('')
    setSuggestions([])
    setShowDropdown(false)
  }

  async function handleShare(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedUser || !currentUser) return

    setLoading(true)
    setError('')
    setSuccess('')

    const result = await shareGoal(
      currentUser.uid,
      currentUser.displayName || currentUser.email || 'Unknown',
      selectedUser.email,
      goal.id,
      goal.title
    )

    setLoading(false)

    if (result.success) {
      setSuccess(`Goal shared with ${selectedUser.displayName || selectedUser.email}`)
      setSelectedUser(null)
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
              <label htmlFor="share-search">Share with (name or email)</label>
              <div className="share-search-wrapper" ref={dropdownRef}>
                <input
                  id="share-search"
                  type="text"
                  value={selectedUser ? `${selectedUser.displayName || 'Unknown'} (${selectedUser.email})` : query}
                  onChange={(e) => {
                    if (!selectedUser) setQuery(e.target.value)
                  }}
                  onFocus={() => query.length >= 1 && setShowDropdown(true)}
                  placeholder="Type name or email to search..."
                  disabled={loading || !!selectedUser}
                  autoComplete="off"
                />
                {selectedUser && (
                  <button
                    type="button"
                    className="share-clear-btn"
                    onClick={() => setSelectedUser(null)}
                    aria-label="Clear selection"
                  >
                    ✕
                  </button>
                )}
                {showDropdown && (suggestions.length > 0 || loadingSearch || (query.trim().length >= 1 && !loadingSearch)) && !selectedUser && (
                  <div className="share-dropdown">
                    {loadingSearch ? (
                      <div className="share-dropdown-loading">Searching...</div>
                    ) : suggestions.length === 0 ? (
                      <div className="share-dropdown-empty">No users found</div>
                    ) : (
                      <ul className="share-dropdown-list">
                        {suggestions.map((user) => (
                          <li key={user.uid}>
                            <button
                              type="button"
                              className="share-dropdown-item"
                              onClick={() => handleSelectUser(user)}
                            >
                              <span className="share-dropdown-name">{user.displayName || 'Unknown'}</span>
                              <span className="share-dropdown-email">{user.email}</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
              <button
                type="submit"
                className="btn-primary share-submit-btn"
                disabled={loading || !selectedUser}
              >
                {loading ? 'Sharing...' : 'Share'}
              </button>
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
                      <span className="share-item-name">
                        {share.sharedWithName
                          ? `${share.sharedWithName} (${share.sharedWithEmail})`
                          : share.sharedWithEmail}
                      </span>
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
