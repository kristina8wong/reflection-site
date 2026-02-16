import { useTheme, type ColorScheme } from '../contexts/ThemeContext'
import './CheckInModal.css'
import './SettingsModal.css'

interface SettingsModalProps {
  onClose: () => void
}

const RED_GREEN: { id: ColorScheme; label: string; description: string } = {
  id: 'red-green',
  label: 'Red–Green scale',
  description: 'Struggling (1) → Thriving (5)',
}

const SINGLE_HUES: { id: ColorScheme; label: string }[] = [
  { id: 'gold', label: 'Gold' },
  { id: 'teal', label: 'Teal' },
  { id: 'blue', label: 'Blue' },
  { id: 'purple', label: 'Purple' },
  { id: 'rose', label: 'Rose' },
  { id: 'coral', label: 'Coral' },
]

export function SettingsModal({ onClose }: SettingsModalProps) {
  const { colorScheme, setColorScheme } = useTheme()

  function handleBackdropClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal-content settings-modal">
        <header className="modal-header">
          <h3>Settings</h3>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </header>
        <div className="modal-body">
          <h4 className="settings-section-title">Color scheme</h4>
          <p className="settings-section-desc">
            Choose how check-in ratings appear in the Year View
          </p>

          <div className="settings-scale-row">
            <button
              type="button"
              className={`settings-option settings-scale-option ${colorScheme === RED_GREEN.id ? 'selected' : ''}`}
              onClick={() => setColorScheme(RED_GREEN.id)}
            >
              <div className="settings-option-preview">
                {[1, 2, 3, 4, 5].map((n) => (
                  <span
                    key={n}
                    className={`preview-dot rating-${n}`}
                    data-theme="red-green"
                  />
                ))}
              </div>
              <div className="settings-option-text">
                <span className="settings-option-label">{RED_GREEN.label}</span>
                <span className="settings-option-desc">{RED_GREEN.description}</span>
              </div>
            </button>
          </div>

          <p className="settings-single-hue-label">Single-hue intensity (1 = light, 5 = full)</p>
          <div className="settings-swatches">
            {SINGLE_HUES.map((scheme) => (
              <button
                key={scheme.id}
                type="button"
                className={`settings-swatch ${colorScheme === scheme.id ? 'selected' : ''}`}
                onClick={() => setColorScheme(scheme.id)}
                title={scheme.label}
                aria-label={`${scheme.label} color scheme`}
              >
                <div className="settings-swatch-dots">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <span
                      key={n}
                      className={`preview-dot rating-${n}`}
                      data-theme={scheme.id}
                    />
                  ))}
                </div>
                <span className="settings-swatch-label">{scheme.label}</span>
              </button>
            ))}
          </div>
        </div>
        <footer className="modal-footer">
          <button className="btn-ghost" onClick={onClose}>
            Done
          </button>
        </footer>
      </div>
    </div>
  )
}
