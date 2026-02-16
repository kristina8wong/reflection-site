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
          {!mobile ? (
            <>
              <p className="add-to-homescreen-intro">
                On mobile? Add this to your home screen for quick access.
              </p>
              <div className="add-to-homescreen-steps">
                <h4>On iOS</h4>
                <ol>
                  <li>Open this page in <strong>Safari</strong></li>
                  <li>Tap the share button in the toolbar (square with arrow up)</li>
                  <li>Scroll down and tap &ldquo;Add to Home Screen&rdquo;</li>
                </ol>
              </div>
              <div className="add-to-homescreen-steps">
                <h4>On Android</h4>
                <ol>
                  <li>Open this page in <strong>Chrome</strong></li>
                  <li>Tap the three-dot menu in the top right</li>
                  <li>Tap &ldquo;Add to Home screen&rdquo; or &ldquo;Install app&rdquo;</li>
                </ol>
              </div>
            </>
          ) : ios ? (
            <div className="add-to-homescreen-steps">
              <h4>On iOS</h4>
              <ol>
                <li>Open this page in <strong>Safari</strong></li>
                <li>Tap the share button in the toolbar (square with arrow up)</li>
                <li>Scroll down and tap &ldquo;Add to Home Screen&rdquo;</li>
              </ol>
            </div>
          ) : (
            <div className="add-to-homescreen-steps">
              <h4>On Android</h4>
              <ol>
                <li>Open this page in <strong>Chrome</strong></li>
                <li>Tap the three-dot menu in the top right corner</li>
                <li>Tap &ldquo;Add to Home screen&rdquo; or &ldquo;Install app&rdquo;</li>
              </ol>
            </div>
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
