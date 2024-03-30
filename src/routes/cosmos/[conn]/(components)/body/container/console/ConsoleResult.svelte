<script lang="ts">
	import type * as Monaco from 'monaco-editor';
  import { onMount } from 'svelte';
  import { jsonTheme } from '$lib/components/shared/monaco';
  import { isNullOrUndefined } from '$lib/utils';

  export let documentArray : any[] = [];
  export let selectedIndex : number = -1;

	let editor: Monaco.editor.IStandaloneCodeEditor;
	let monaco: typeof Monaco;
	let editorContainer: HTMLElement;

  onMount( async () => {
	  monaco = (await import('$lib/components/shared/monaco')).default;
	  monaco.editor.defineTheme('default-cs', jsonTheme);
	  let strData = ``;
	  if(isNullOrUndefined(documentArray)){
		  strData = '';
		}else{
		  if(selectedIndex >= 0 && selectedIndex < documentArray.length){
			  strData = JSON.stringify(documentArray[selectedIndex], null, 2)
			}else{
			  strData = JSON.stringify(documentArray, null, 2)
			}
		}
	  editor = monaco?.editor.create(editorContainer, {
				value: strData,
				language: "json",
				theme: "default-cs",
				automaticLayout: true,
				readOnly: true
	  });
  })

	$: {
	  if(selectedIndex >= 0 && selectedIndex < documentArray.length){
		  editor?.setValue(JSON.stringify(documentArray[selectedIndex], null, 2));
		}else{
	    editor?.setValue(JSON.stringify(documentArray, null, 2));
		}
	}
</script>

<div class="w-full h-full" 	bind:this={editorContainer}/>