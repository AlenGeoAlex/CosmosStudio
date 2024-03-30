<script lang="ts">
	import * as Resizable from "$lib/components/ui/resizable/index.js";
	import { settings } from '$lib/service/settings-service';
  import { type Container, ErrorResponse, type QueryIterator } from '@azure/cosmos';
	import { ConnectionSchema, type IConsole, type IContainerActor } from '$lib/schema/schema';
	import type { AzureService } from '$lib/service/azure-service';
	import { ConsoleService } from '$lib/service/console-service';
  import { getContext, onDestroy, onMount } from 'svelte';
	import { ContextKeys } from '$lib/constants/enums';
  import ConsoleWriteMonoco from './ConsoleWriteMonoco.svelte';
  import { toast } from 'svelte-sonner';
  import { SpinnerService } from '$lib/service/spinner-service';
  import ConsoleResult from './ConsoleResult.svelte';
  import ConsoleList from './ConsoleList.svelte';
  import type { PaneAPI } from 'paneforge';

  const abortController : AbortController = new AbortController();
	export let schema = getContext<ConnectionSchema>(ContextKeys.ConnectionSchema);
	export let selectedDatabase : string;
	export let selectedContainer : string;
	export let selectedContainerActor : IContainerActor;
	export let selectedContainerRef : Container;
	export let azureService : AzureService;
	let selectedIndex = -1;

	let activeConsole : IConsole;
  let documentArray : any[] = [];
  let currentIterator : Nullable<QueryIterator<any>> = null;
  let loadingMore = false;
  let listPane : PaneAPI;
  let resultPane : PaneAPI;
  let collapseListPane = true;
  let collapseResultPane =true;
	export let isConsoleDirty : boolean;
	$: {
		if(selectedContainerActor.consoleId !== undefined && activeConsole?.id !== selectedContainerActor.consoleId){
			ConsoleService.get(schema.id, selectedDatabase, selectedContainerActor.consoleId)
				.then(x => {
					if(x){
						activeConsole = x;
						isConsoleDirty = false;
						if(activeConsole.content && activeConsole.content.length > 0 && typeof activeConsole.content === 'string')
							exportCustomQuery(activeConsole.content)
					}
				});
		}
	}

	async function exportCustomQuery(e : string){
		await executeDocumentQuery(e);
	}

  export async function executeDocumentQuery(query : string){
	  try {
		  const queryResponse = await azureService.queryAdapter.query(query, selectedContainerRef);
		  if(queryResponse.status){
			  documentArray = queryResponse.response?.resources ?? [];
			  currentIterator = queryResponse.iterator;
			  selectedIndex = -1;
			  toast.info('Executed', {
				  description: `Consumed ≈ ${Math.round(queryResponse.response?.requestCharge ?? 0)} RU`
			  });
			  if(documentArray.length === 0){
				  listPane.collapse();
				}else{
				  if(collapseListPane)
					  listPane.expand();
				}
		  }else{
			  toast.error('Failed',{
				  description: `Failed to execute the query. ${queryResponse.error}`
				})
			}
	  }catch (e){

	  }finally {
		  SpinnerService.unset();
	  }

  }


  async function loadMore(){
	  if(loadingMore)
		  return;


	  if(currentIterator === null || currentIterator === undefined) {
		  return;
	  }
	  if(!currentIterator.hasMoreResults()){
		  return
	  }
	  loadingMore = true;

	  try {
		  SpinnerService.setWithOptions({
			  text: "Loading more",
			  shorted: false,
			  color: 'purple'
		  });
		  const feedResponse = await currentIterator.fetchNext();
		  const resources = feedResponse.resources;
		  if(!resources || resources.length === 0){
			  return;
		  }
		  documentArray = documentArray.concat(resources);
		  toast.info('Success', {
			  description: `Loaded ${resources.length} more on [${documentArray.length}] results and costed ≈ ${Math.round(feedResponse.requestCharge)} RU`
		  })
	  }catch (e){

	  }finally {
		  loadingMore = false;
		  SpinnerService.unset();
	  }
  }

  export async function getLoadedDocuments() : Promise<any> {
	  return documentArray;
  }

  async function select(index : number){
	  selectedIndex = index;
	}

  async function onLazyScroll(e : any) {
	  //@ts-ignore
	  const offsetHeight = e.target?.offsetHeight;
	  //@ts-ignore
	  const scrollTop = e.target?.scrollTop;
	  //@ts-ignore
	  const scrollHeight = e.target?.scrollHeight;
	  const currentScroll = offsetHeight + scrollTop + 3;
	  if(currentScroll >= scrollHeight){
		  await loadMore();
	  }
  }

  onDestroy(() => {
	  try {
		  abortController.abort(`Page closed!`);
	  }finally {
		  SpinnerService.unset();
	  }
  });
</script>

<div class="">
	<Resizable.PaneGroup direction="horizontal">
		<Resizable.Pane defaultSize={$settings.resizableSize} collapsible={true} onCollapse={() => (collapseListPane = true)} bind:pane={listPane}
		>
			<div class="flex-col flex documentList" on:scroll={(e) =>{onLazyScroll(e)}}>
				<ConsoleList
					on:select={(e) => {select(e.detail)}}
					documentArray={documentArray}
					selectedIndex={selectedIndex}
				></ConsoleList>
			</div>
		</Resizable.Pane>
		<Resizable.Handle withHandle />
		<Resizable.Pane>
			<Resizable.PaneGroup direction="vertical">
				<Resizable.Pane defaultSize={60}>
					<div class="flex h-full items-center justify-center p-6">
						<ConsoleWriteMonoco
							bind:isConsoleDirty
							schema={schema}
							selectedDatabase={selectedDatabase}
							selectedContainer={selectedContainer}
							on:execute-custom={async (e) => {await exportCustomQuery(e.detail)}}
							bind:activeConsole={activeConsole}
						></ConsoleWriteMonoco>
					</div>
				</Resizable.Pane>
				<Resizable.Handle withHandle />
				<Resizable.Pane
					defaultSize={40}
					collapsible={true}
					onCollapse={() => (collapseResultPane = true)}
					bind:pane={resultPane}>
					<ConsoleResult
						documentArray={documentArray}
						selectedIndex={selectedIndex}>
					</ConsoleResult>
				</Resizable.Pane>
			</Resizable.PaneGroup>
		</Resizable.Pane>
	</Resizable.PaneGroup>
</div>
