import './CheckInModal.css'
import './AddToHomeScreenModal.css'

interface AddToHomeScreenModalProps {
  onClose: () => void
}

function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

function isAndroid() {
  return /Android/.test(navigator.userAgent)
}

export function AddToHomeScreenModal({ onClose }: AddToHomeScreenModalProps) {
  const ios = isIOS()
  const android = isAndroid()
  const mobile = ios || android

  function handleBackdropClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal-content add-to-homescreen-modal">
        <header className="modal-header">
          <h3>Add Year Reflection to your home screen</h3>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </header>
        <div className="modal-body">
          <p className="add-to-homescreen-intro">
            Install this app for quick access and a full-screen experience.
          </p>

          {ios && (
            <div className="add-to-homescreen-steps">
              <h4>On iOS</h4>
              <ol>
                <li>
                  Open this page in <strong>Safari</strong>
                </li>
                <li>
                  Tap the <span className="share-icon" aria-hidden> share</span> button in the toolbar (square with arrow pointing up)
                </li>
                <li>
                  Scroll down and tap &ldquo;Add to Home Screen&rdquo;
                </li>
              </ol>
            </div>
          )}

          {android && (
            <div className="add-to-homescreen-steps">
              <h4>On Android</h4>
              <ol>
                <li>
                  Open this page in <strong>Chrome</strong>
                </li>
                <li>
                  Tap the three-dot menu in the top right corner
                </li>
                <li>
                  Tap &ldquo;Add to Home screen&rdquo; or &ldquo;Install app&rdquo;
                </li>
              </ol>
            </div>
          )}

          {!mobile && (
            <p className="add-to-homescreen-desktop muted">
              On desktop, look for the install icon in your browser&apos;s address bar (Chrome, Edge) to add this app.
            </p>
          )}
        </div>
        <footer className="modal-footer">
          <button className="btn-ghost" onClick={onClose}>
            Got it
          </button>
        </footer>
      </div>
    </div>
  )
}
