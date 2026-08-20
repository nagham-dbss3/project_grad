import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ar } from '@/i18n/ar'

type Props = {
  children: ReactNode
  title?: string
}

type State = { error: Error | null }

/** Catches render/runtime errors so a screen crash does not blank the whole app. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <Card>
        <CardContent className="p-6 text-center space-y-3">
          <h2 className="text-lg font-bold">{this.props.title ?? ar.common.errorTitle}</h2>
          <p className="text-sm text-muted-foreground">{ar.common.errorBody}</p>
          {this.state.error.message ? (
            <p className="text-xs text-destructive font-mono break-all">{this.state.error.message}</p>
          ) : null}
          <Button
            variant="outline"
            onClick={() => this.setState({ error: null })}
          >
            {ar.common.retry}
          </Button>
        </CardContent>
      </Card>
    )
  }
}
