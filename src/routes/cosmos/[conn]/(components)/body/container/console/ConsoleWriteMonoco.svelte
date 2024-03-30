<script lang="ts">
	import type * as Monaco from 'monaco-editor';
  import { createEventDispatcher, onMount } from 'svelte';
  import { jsonTheme } from '$lib/components/shared/monaco';
  import { isNullOrUndefined } from '$lib/utils';
  import { ConnectionSchema, type IConsole } from '$lib/schema/schema';
  import { ConsoleService } from '$lib/service/console-service';
  import { toast } from 'svelte-sonner';

  const dispatcher = createEventDispatcher();

  export let schema : ConnectionSchema;
  export let selectedDatabase : string;
  export let selectedContainer : string;
  export let activeConsole : IConsole;
	let editor: Monaco.editor.IStandaloneCodeEditor;
	let monaco: typeof Monaco;
	let editorContainer: HTMLElement;
  export let isConsoleDirty = false;


	onMount( async () => {
	  monaco = (await import('$lib/components/shared/monaco')).default;
	  const strData = activeConsole?.content ?? ``;
	  monaco.editor.defineTheme('default-cs', jsonTheme);
	  editor = monaco?.editor.create(editorContainer, {
		  value: !isNullOrUndefined(strData) ? strData : undefined,
		  language: "sql",
		  theme: "default-cs",
		  automaticLayout: true
	  });

	  editor.onDidChangeModelContent(async (e) => {
		  isConsoleDirty = true;
		  activeConsole.content = editor.getValue() ?? ``;
	  });

	  editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, saveAsync)
	  editor.addAction({
		  id: "save-doc",
		  label: "Save Console",
		  contextMenuOrder: 0,
		  contextMenuGroupId: "1_modification",
		  keybindings: [
			  monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS
		  ],
		  run: async () => saveAsync()
	  })

	  editor.addCommand(monaco.KeyMod.Alt | monaco.KeyCode.Enter, execute)
	  editor.addAction({
		  id: "execute-query",
		  label: "Execute Whole/Selection",
		  contextMenuOrder: 0,
		  contextMenuGroupId: "1_modification",
		  keybindings: [
			  monaco.KeyMod.Alt | monaco.KeyCode.Enter
		  ],
		  run: async () => execute()
	  })
	})

	async function saveAsync(showMessage : boolean = true){
		if(activeConsole && isConsoleDirty){
			await ConsoleService.save(schema.id, selectedDatabase, activeConsole);
			isConsoleDirty = false;
			if(showMessage){
		  toast.info("Success", {
			  description: `Saved ${activeConsole.name}`
		  })
			}
		}
	}

	async function execute(){
		let text = undefined;
	  const selection = editor.getSelection();
	  if(selection){
	    text = editor.getModel()?.getValueInRange(selection);
		}

	  //If the selection is empty or nothing selected, take the whole console
	  if(!text || text.length === 0){
	    text = editor.getValue();
		}

	  //If the whole document is empty, then don't sent to the dispatcher
	  if(!text || text.length === 0){
		  toast('Nothing to execute!');
		  return;
		}

	  await saveAsync(false)
	  dispatcher('execute-custom', text)
	}


</script>

<div class="w-full h-full" 	bind:this={editorContainer}/>
