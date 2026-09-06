export type ConfirmationOptions = {
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  tone?: 'danger' | 'primary'
}

export type ConfirmationContextValue = {
  confirm: (options: ConfirmationOptions) => Promise<boolean>
}
