<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import type * as Monaco from 'monaco-editor/esm/vs/editor/editor.api';
	import { theme } from '$lib/components/shared/monaco';
	import { isNullOrUndefined } from '$lib/utils';

	let editor: Monaco.editor.IStandaloneCodeEditor;
	let monaco: typeof Monaco;
	let editorContainer: HTMLElement;
	export let document : any;
	export let editedDocumentRaw : Nullable<string> = JSON.stringify(document);

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
		});
	});

	$: {
		if(editor){
			if(document){
				const strData = JSON.stringify(document, null, 2);
				editor.updateOptions({readOnly: false})
				editor.setValue(strData)
			}else{
				editor.setValue(``);
				editor.updateOptions({readOnly: true})
			}
		}
	}

	onDestroy(() => {
		monaco?.editor.getModels().forEach((model) => model.dispose());
		editor?.dispose();
	});
	
</script>

<div class="w-full h-full" 	bind:this={editorContainer}/>
