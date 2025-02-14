import * as vscode from 'vscode';

import { Mode } from './modes_types';
import * as scrollCommands from './scroll_commands';
import { enterInsertMode, enterNormalMode, enterVisualMode, setModeCursorStyle } from './modes';
import { typeHandler } from './type_handler';
import { addTypeSubscription, removeTypeSubscription } from './type_subscription';
import { VimState } from './vim_state_types';
import { escapeHandler } from './escape_handler';


const globalVimState: VimState = {
    typeSubscription: undefined,
    mode: Mode.Insert,
    keysPressed: [],
    registers: {
        contentsList: [],
        linewise: true,
    },
    semicolonAction: () => undefined,
    commaAction: () => undefined,
    lastPutRanges: {
        ranges: [],
        linewise: true,
    },
};

async function onSelectionChange(vimState: VimState, e: vscode.TextEditorSelectionChangeEvent): Promise<void> {
    if (vimState.mode === Mode.Insert) return;

    if (e.selections.every(selection => selection.isEmpty)) {
        // It would be nice if we could always go from visual to normal mode when all selections are empty
        // but visual mode on an empty line will yield an empty selection and there's no good way of
        // distinguishing that case from the rest. So we only do it for mouse events.
        if (
            (vimState.mode === Mode.Visual || vimState.mode === Mode.VisualLine) &&
            e.kind === vscode.TextEditorSelectionChangeKind.Mouse
        ) {
            await enterNormalMode(vimState);
            setModeCursorStyle(vimState.mode, e.textEditor);
        }
    } else {
        if (vimState.mode === Mode.Normal) {
            await enterVisualMode(vimState);
            setModeCursorStyle(vimState.mode, e.textEditor);
        }
    }
}

async function onDidChangeActiveTextEditor(vimState: VimState, editor: vscode.TextEditor | undefined) {
    if (!editor) return;

    if (editor.selections.every(selection => selection.isEmpty)) {
        if (vimState.mode === Mode.Visual || vimState.mode === Mode.VisualLine) {
            await enterNormalMode(vimState);
        }
    } else {
        if (vimState.mode === Mode.Normal) {
            await enterVisualMode(vimState);
        }
    }

    setModeCursorStyle(vimState.mode, editor);

    vimState.keysPressed = [];
}

export async function activate(context: vscode.ExtensionContext): Promise<void> {
    context.subscriptions.push(
        vscode.window.onDidChangeActiveTextEditor((editor) => onDidChangeActiveTextEditor(globalVimState, editor)),
        vscode.window.onDidChangeTextEditorSelection((e) => onSelectionChange(globalVimState, e)),
        vscode.commands.registerCommand(
            'extension.simpleVim.escapeKey',
            () => escapeHandler(globalVimState),
        ),
        vscode.commands.registerCommand(
            'extension.simpleVim.scrollDownHalfPage',
            scrollCommands.scrollDownHalfPage,
        ),
        vscode.commands.registerCommand(
            'extension.simpleVim.scrollUpHalfPage',
            scrollCommands.scrollUpHalfPage,
        ),
        vscode.commands.registerCommand(
            'extension.simpleVim.scrollDownPage',
            scrollCommands.scrollDownPage,
        ),
        vscode.commands.registerCommand(
            'extension.simpleVim.scrollUpPage',
            scrollCommands.scrollUpPage,
        ),
    );

    let initialMode = vscode.workspace.getConfiguration('simpleVim').get('initialMode') as string;

    if (!['insert', 'normal'].includes(initialMode)) {
        initialMode = 'insert';
    }

    switch (initialMode) {
        case 'insert': {
            await enterInsertMode(globalVimState); 
            break;
        }
        case 'normal': {
            await enterNormalMode(globalVimState);
            addTypeSubscription(globalVimState, typeHandler);
            break;
        }
    }

    if (vscode.window.activeTextEditor) {
        onDidChangeActiveTextEditor(globalVimState, vscode.window.activeTextEditor);
    }
}

export function deactivate(): void {
    removeTypeSubscription(globalVimState);
}
