import {
  ConfigurationChangeEvent,
  ExtensionContext,
  TextEditor,
  window,
  workspace,
} from 'vscode'

import { CustomErrorColors } from './CustomErrorColors'

export function activate(context: ExtensionContext) {
  const settingsName = 'custom-error-colors'
	const settings = workspace.getConfiguration(settingsName)

  const errorColors = new CustomErrorColors(settings as any)

  context.subscriptions.push(window.onDidChangeActiveTextEditor((editor: TextEditor | undefined) => {
    if (!!editor) {
      errorColors.activeEditorChanged(editor)
    }
  }))

  context.subscriptions.push(workspace.onDidChangeConfiguration((event: ConfigurationChangeEvent) => {
    if (event.affectsConfiguration(settingsName)) {
      const newSettings = workspace.getConfiguration(settingsName)
      errorColors.updateSettings(newSettings as any)
    }
  }))

  context.subscriptions.push(errorColors)
}

// this method is called when your extension is deactivated
export function deactivate() {}
