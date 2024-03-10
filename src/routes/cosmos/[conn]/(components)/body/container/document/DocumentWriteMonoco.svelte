<script lang="ts">
	import { createEventDispatcher, onDestroy, onMount } from 'svelte';
	import type * as Monaco from 'monaco-editor/esm/vs/editor/editor.api';
	import { theme } from '$lib/components/shared/monaco';
	import { isNullOrUndefined } from '$lib/utils';

	const dispatcher = createEventDispatcher();
	let editor: Monaco.editor.IStandaloneCodeEditor;
	let monaco: typeof Monaco;
	let editorContainer: HTMLElement;
	export let document : any;
	export let editedDocumentRaw : Nullable<string> = JSON.stringify(document);
	export let dirty = false;
	onMount(async () => {
		monaco = (await import('$lib/components/shared/monaco')).default;
		const strData = JSON.stringify(document, null, 2);
		monaco.editor.defineTheme('default-cs', theme);
		editor = monaco?.editor.create(editorContainer, {
			value: !isNullOrUndefined(strData) ? strData : undefined,
			language: "json",
			theme: "default-cs",
			automaticLayout: true
		});
		editor.onDidChangeModelContent(async (e) => {
			editedDocumentRaw = editor.getValue();
			dirty = true;
		});
		editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, save)
		editor.addAction({
			id: "save-doc",
			label: "Save",
			contextMenuOrder: 0,
			contextMenuGroupId: "1_modification",
			keybindings: [
				monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS
			],
			run: () => save()
		})
	});

	function save(){
		if(!dirty)
			return

		dispatcher('save-doc');
	}

	$: {
		if(editor){
			if(document){
				const strData = JSON.stringify(document, null, 2);
				editor.setValue(strData)
				editor.updateOptions({readOnly: false})
				dirty = false;
			}else{
				editor.setValue(``);
				editor.updateOptions({readOnly: true})
				dirty = false;
			}
		}
	}

	onDestroy(() => {
		monaco?.editor.getModels().forEach((model) => model.dispose());
		editor?.dispose();
	});
	
</script>

<div class="w-full h-full" 	bind:this={editorContainer}/>
