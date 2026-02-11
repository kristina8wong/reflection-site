import { useState } from 'react'
import type { Goal } from '../types'
import { addGoal, updateGoal, deleteGoal } from '../storage'
import './GoalsView.css'

interface GoalsViewProps {
  goals: Goal[]
  currentYear: number
  onRefresh: () => void
}

export function GoalsView({ goals, currentYear, onRefresh }: GoalsViewProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDesc, setEditDesc] = useState('')

  const yearGoals = goals.filter((g) => g.year === currentYear)

  function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    addGoal({
      title: title.trim(),
      description: description.trim(),
      year: currentYear,
    })
    setTitle('')
    setDescription('')
    onRefresh()
  }

  function handleEdit(goal: Goal) {
    setEditingId(goal.id)
    setEditTitle(goal.title)
    setEditDesc(goal.description)
  }

  function handleSaveEdit() {
    if (editingId && editTitle.trim()) {
      updateGoal(editingId, { title: editTitle.trim(), description: editDesc.trim() })
      setEditingId(null)
      onRefresh()
    }
  }

  function handleDelete(id: string) {
    if (confirm('Remove this goal? Its check-ins will also be removed.')) {
      deleteGoal(id)
      if (editingId === id) setEditingId(null)
      onRefresh()
    }
  }

  return (
    <div className="goals-view">
      <section className="goals-intro">
        <h2>Goals for {currentYear}</h2>
        <p className="muted">
          Set your intentions for the year. You’ll revisit each goal every week to reflect on your progress.
        </p>
      </section>

      <form className="goal-form" onSubmit={handleAdd}>
        <input
          type="text"
          placeholder="Goal title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="goal-input"
        />
        <textarea
          placeholder="Describe what you want to achieve (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="goal-textarea"
          rows={2}
        />
        <button type="submit" className="btn-primary" disabled={!title.trim()}>
          Add goal
        </button>
      </form>

      <ul className="goal-list">
        {yearGoals.length === 0 && (
          <li className="goal-empty">
            No goals yet. Add one above to get started.
          </li>
        )}
        {yearGoals.map((goal) => (
          <li key={goal.id} className="goal-card">
            {editingId === goal.id ? (
              <div className="goal-edit">
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="goal-input"
                  autoFocus
                />
                <textarea
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="goal-textarea"
                  rows={2}
                />
                <div className="goal-edit-actions">
                  <button className="btn-primary" onClick={handleSaveEdit}>
                    Save
                  </button>
                  <button
                    className="btn-ghost"
                    onClick={() => setEditingId(null)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="goal-content">
                  <h3>{goal.title}</h3>
                  {goal.description && (
                    <p className="goal-desc">{goal.description}</p>
                  )}
                </div>
                <div className="goal-actions">
                  <button
                    className="btn-ghost btn-sm"
                    onClick={() => handleEdit(goal)}
                  >
                    Edit
                  </button>
                  <button
                    className="btn-ghost btn-sm btn-danger"
                    onClick={() => handleDelete(goal.id)}
                  >
                    Remove
                  </button>
                </div>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
