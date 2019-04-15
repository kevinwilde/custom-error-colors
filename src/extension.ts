import {
  ConfigurationChangeEvent,
  ExtensionContext,
  TextEditor,
  window,
  workspace,
} from 'vscode'

import { CustomErrorColors } from './CustomErrorColors'

export function activate(context: ExtensionContext) {
	const settings = workspace.getConfiguration('customerrorcolors')
	console.log('activated')

  const errorColors = new CustomErrorColors()

  context.subscriptions.push(window.onDidChangeActiveTextEditor((editor: TextEditor | undefined) => {
    if (!!editor) {
      errorColors.activeEditorChanged(editor)
    }
  }))

  context.subscriptions.push(workspace.onDidChangeConfiguration((event: ConfigurationChangeEvent) => {
    if (event.affectsConfiguration('customerrorcolors')) {
      const _settings = workspace.getConfiguration('customerrorcolors')
        // TODO
    }
  }))

  context.subscriptions.push(errorColors)
}

// this method is called when your extension is deactivated
export function deactivate() {}
