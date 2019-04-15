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

  console.log('activated')
  console.log(JSON.stringify(settings))

  const errorColors = new CustomErrorColors(settings)

  context.subscriptions.push(window.onDidChangeActiveTextEditor((editor: TextEditor | undefined) => {
    if (!!editor) {
      errorColors.activeEditorChanged(editor)
    }
  }))

  context.subscriptions.push(workspace.onDidChangeConfiguration((event: ConfigurationChangeEvent) => {
    if (event.affectsConfiguration(settingsName)) {
      const newSettings = workspace.getConfiguration(settingsName)
      // errorColors.updateSettings(newSettings)
    }
  }))

  context.subscriptions.push(errorColors)
}

// this method is called when your extension is deactivated
export function deactivate() {}
