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
  private greenDecorationType: TextEditorDecorationType
  private redDecorationType: TextEditorDecorationType

  constructor() {
    const rules = {
      borderWidth: '0 0 2px 0',
      borderStyle: 'dotted',
    }
    this.greenDecorationType = window.createTextEditorDecorationType({...rules, borderColor: 'green'})
    this.redDecorationType = window.createTextEditorDecorationType({...rules, borderColor: 'red'})

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
      const greenIssues: Diagnostic[] = []
      const redIssues: Diagnostic[] = []
      issues.forEach((e) => {
        if (e.message.indexOf("possibly 'undefined'") >= 0) {
          greenIssues.push(e)
        } else {
          redIssues.push(e)
        }
      })

      console.log('here', greenIssues.length, redIssues.length)

      editor.setDecorations(
        this.greenDecorationType,
        greenIssues.map((e) => e.range)
      )
      editor.setDecorations(
        this.redDecorationType,
        redIssues.map((e) => e.range)
      )
    }
  }
}
