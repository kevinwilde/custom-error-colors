import {
  Diagnostic,
  DiagnosticChangeEvent,
  Disposable,
  TextEditor,
  TextEditorDecorationType,
  Uri,
  languages,
  window,
} from 'vscode'

export class CustomErrorColors implements Disposable {
  private disposables: Disposable[]
  private config: {
    defaultErrorDecoration: TextEditorDecorationType
    defaultWarningDecoration: TextEditorDecorationType
    customColors: {
      [errCode: string]: {
        color: string
        decoration: TextEditorDecorationType
      }
    }
  }

  constructor(settings: any) {
    const rules = {
      borderWidth: '0 0 2px 0',
      borderStyle: 'dotted',
    }
    this.config = {
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
      this.config.customColors[s.source + s.errorCode] = {
        color: s.color,
        decoration: window.createTextEditorDecorationType({
          ...rules,
          borderColor: s.color
        })
      }
    }

    this.disposables = [languages.onDidChangeDiagnostics((e) => this.diagnosticChangedListener(e))]
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

    const editors = window.visibleTextEditors.filter(({ document }) => document.uri === uri)
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
      for (const errSrcCode in this.config.customColors) {
        decorations[this.config.customColors[errSrcCode].color] = {
          decoration: this.config.customColors[errSrcCode].decoration,
          issues: []
        }
      }
      issues.forEach((e) => {
        console.log(JSON.stringify(e))
        if (e.source && e.code && this.config.customColors[e.source + e.code.toString()]) {
          decorations[this.config.customColors[e.source + e.code.toString()].color].issues.push(e)
        } else if (e.source && this.config.customColors[e.source + "*"]) {
          decorations[this.config.customColors[e.source + "*"].color].issues.push(e)
        } else if (e.severity === 1) {
          unhandledWarnings.push(e)
        } else {
          unhandledErrors.push(e)
        }
      })

      console.log('here')

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
