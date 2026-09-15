type AppLoadingProps = {
  label?: string
}

export function AppLoading({ label = 'Đang tải dữ liệu' }: AppLoadingProps) {
  return (
    <div className="app-loading-state" role="status" aria-live="polite">
      <span>{label}</span>
      <span className="app-loading-dots" aria-hidden="true">
        <span />
        <span />
        <span />
      </span>
    </div>
  )
}
