import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import type { PropsWithChildren } from 'react'
import type {
  ConfirmationContextValue,
  ConfirmationOptions,
} from '../types/confirmation.type'

const ConfirmationContext = createContext<ConfirmationContextValue | null>(null)

export function ConfirmationProvider({ children }: PropsWithChildren) {
  const [options, setOptions] = useState<ConfirmationOptions | null>(null)
  const resolver = useRef<((confirmed: boolean) => void) | null>(null)

  const close = useCallback((confirmed: boolean) => {
    resolver.current?.(confirmed)
    resolver.current = null
    setOptions(null)
  }, [])

  const confirm = useCallback((nextOptions: ConfirmationOptions) => {
    resolver.current?.(false)
    setOptions(nextOptions)

    return new Promise<boolean>((resolve) => {
      resolver.current = resolve
    })
  }, [])

  useEffect(() => {
    if (!options) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') close(false)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [close, options])

  return (
    <ConfirmationContext.Provider value={{ confirm }}>
      {children}

      {options && (
        <div
          className="confirmation-backdrop"
          role="presentation"
          onMouseDown={() => close(false)}
        >
          <section
            className="confirmation-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirmation-title"
            aria-describedby="confirmation-message"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className={`confirmation-icon ${options.tone ?? 'danger'}`}>!</div>
            <div className="confirmation-content">
              <h3 id="confirmation-title">{options.title ?? 'Xác nhận thao tác'}</h3>
              <p id="confirmation-message">{options.message}</p>
            </div>
            <div className="confirmation-actions">
              <button type="button" className="cancel" onClick={() => close(false)}>
                {options.cancelText ?? 'Hủy'}
              </button>
              <button
                type="button"
                className={options.tone ?? 'danger'}
                onClick={() => close(true)}
                autoFocus
              >
                {options.confirmText ?? 'Xác nhận'}
              </button>
            </div>
          </section>
        </div>
      )}
    </ConfirmationContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useConfirmation() {
  const context = useContext(ConfirmationContext)

  if (!context) {
    throw new Error('useConfirmation phải được dùng bên trong ConfirmationProvider')
  }

  return context
}
