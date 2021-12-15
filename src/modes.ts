import * as vscode from 'vscode';

import { Mode } from './modes_types';
import { VimState } from './vim_state_types';

export async function enterInsertMode(vimState: VimState): Promise<void> {
    vimState.mode = Mode.Insert;
    await setModeContext('extension.simpleVim.insertMode');
}

export async function enterNormalMode(vimState: VimState): Promise<void> {
    vimState.mode = Mode.Normal;
    await setModeContext('extension.simpleVim.normalMode');
}

export async function enterVisualMode(vimState: VimState): Promise<void> {
    vimState.mode = Mode.Visual;
    await setModeContext('extension.simpleVim.visualMode');
}

export async function enterVisualLineMode(vimState: VimState): Promise<void> {
    vimState.mode = Mode.VisualLine;
    await setModeContext('extension.simpleVim.visualLineMode');
}

async function setModeContext(key: string) {
    const modeKeys = [
        'extension.simpleVim.insertMode',
        'extension.simpleVim.normalMode',
        'extension.simpleVim.visualMode',
        'extension.simpleVim.visualLineMode',
    ];

    Promise.all(modeKeys.map(async modeKey => {
        await vscode.commands.executeCommand('setContext', modeKey, key === modeKey);
    }));
}

export function setModeCursorStyle(mode: Mode, editor: vscode.TextEditor): void {
    if (mode === Mode.Insert) {
        editor.options.cursorStyle = vscode.TextEditorCursorStyle.Line;
    } else if (mode === Mode.Normal) {
        editor.options.cursorStyle = vscode.TextEditorCursorStyle.Underline;
    } else if (mode === Mode.Visual || mode === Mode.VisualLine) {
        editor.options.cursorStyle = vscode.TextEditorCursorStyle.LineThin;
    }
}
