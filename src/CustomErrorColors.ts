import {
  Diagnostic,
  DiagnosticChangeEvent,
  DiagnosticSeverity,
  Disposable,
  TextEditor,
  TextEditorDecorationType,
  Uri,
  languages,
  window,
} from 'vscode'

interface Settings {
  defaultColor: {
    error: string
    warning: string
  }
  customColors: {
    source: string
    color: string
    errorCode?: string | number
    regex?: string
  }[]
}

interface Config {
  defaultErrorDecoration: TextEditorDecorationType
  defaultWarningDecoration: TextEditorDecorationType
  customColors: {
    [source: string]: {
      code?: string
      regex?: RegExp
      color: string
      decoration: TextEditorDecorationType
    }[]
  }
}

export class CustomErrorColors implements Disposable {
  private disposables: Disposable[]
  private config: Config

  constructor(settings: Settings) {
    this.config = this.createConfig(settings)
    this.disposables = [languages.onDidChangeDiagnostics((e) => this.diagnosticChangedListener(e))]
  }

  public updateSettings(settings: Settings) {
    this.config = this.createConfig(settings)
  }

  private createConfig(settings: Settings): Config {
    const rules = {
      borderWidth: '0 0 2px 0',
      borderStyle: 'solid',
    }
    const config: Config = {
      defaultErrorDecoration: window.createTextEditorDecorationType({
        ...rules,
        borderColor: settings.defaultColor.error
      }),
      defaultWarningDecoration: window.createTextEditorDecorationType({
        ...rules,
        borderColor: settings.defaultColor.warning
      }),
      customColors: {}
    }
    for (const s of settings.customColors) {
      if (!config.customColors[s.source]) {
        config.customColors[s.source] = []
      }
      config.customColors[s.source].push({
        color: s.color,
        decoration: window.createTextEditorDecorationType({
          ...rules,
          borderColor: s.color
        }),
        ...s.errorCode && { code: s.errorCode.toString() },
        ...s.regex && { regex: new RegExp(s.regex) },
      })
    }
    return config
  }

  public activeEditorChanged(editor: TextEditor): void {
    this.updateDiagnosticList(editor.document.uri)
  }

  public dispose(): void {
    for (const disposable of this.disposables) {
      disposable.dispose()
    }
  }

  private diagnosticChangedListener(diagnostic: DiagnosticChangeEvent): void {
    for (const uri of diagnostic.uris) {
      this.updateDiagnosticList(uri)
    }
  }

  private updateDiagnosticList(uri: Uri): void {
    const issues = languages.getDiagnostics(uri)

    const editors = window.visibleTextEditors.filter(({ document }) => document.uri.fsPath === uri.fsPath)
    const editor = editors.length ? editors[0] : null

    if (editor) {
      const unhandledWarnings: Diagnostic[] = []
      const unhandledErrors: Diagnostic[] = []
      const decorations: {
        [color: string]: {
          decoration: any
          issues: Diagnostic[]
        }
      } = {}
      for (const source in this.config.customColors) {
        for (const item of this.config.customColors[source]) {
          decorations[item.color] = {
            decoration: item.decoration,
            issues: []
          }
        }
      }
      issues.forEach((e) => {
        let handled = false
        if (e.source && this.config.customColors[e.source]) {
          for (const item of this.config.customColors[e.source]) {
            const regexMatches = item.regex && e.message.match(item.regex)
            const codeMatches = item.code && e.code && e.code.toString() === item.code
            if (regexMatches || codeMatches) {
              decorations[item.color].issues.push(e)
              handled = true
            }
          }
        }

        if (!handled) {
          if (e.severity === DiagnosticSeverity.Warning) {
            unhandledWarnings.push(e)
          } else if (e.severity === DiagnosticSeverity.Error) {
            unhandledErrors.push(e)
          }
        }
      })

      for (const color in decorations) {
        editor.setDecorations(
          decorations[color].decoration,
          decorations[color].issues.map(e => e.range)
        )
      }

      editor.setDecorations(
        this.config.defaultWarningDecoration,
        unhandledWarnings.map((e) => e.range)
      )
      editor.setDecorations(
        this.config.defaultErrorDecoration,
        unhandledErrors.map((e) => e.range)
      )
    }
  }
}
