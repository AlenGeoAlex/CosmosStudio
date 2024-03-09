import * as monaco from 'monaco-editor';

// Import the workers in a production-safe way.
// This is different than in Monaco's documentation for Vite,
// but avoids a weird error ("Unexpected usage") at runtime
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker';
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker';
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker';
import { editor } from 'monaco-editor';
// @ts-ignore
import IStandaloneThemeData = editor.IStandaloneThemeData;


self.MonacoEnvironment = {
	getWorker: function (_: string, label: string) {
		switch (label) {
			case 'json':
				return new jsonWorker();
			case 'typescript':
			case 'javascript':
				return new tsWorker();
			default:
				return new editorWorker();
		}
	}
};

export default monaco;

export const theme : IStandaloneThemeData = {
	base: "vs-dark",
	inherit: true,
	rules: [
		{ token: 'string.key.json', foreground: '#21cae5' }, // Color for keys
		{ token: 'string.value.json', foreground: '#f8f8f7' }, // Color for values
		{ token: 'number.json', foreground: '#bce117' }, // Color for numbers
		{ token: 'variable.other.json', foreground: '#FFD700' }, // Color for other variables
	],
	colors: {
		"editor.foreground": "#f8f8f7",
		"editor.background": "#0c0a09",
		"editor.selectionBackground": "#373B41",
		"editor.lineHighlightBackground": "#282A2E",
		"editorCursor.foreground": "#AEAFAD",
		"editorWhitespace.foreground": "#4B4E55"
	}
}