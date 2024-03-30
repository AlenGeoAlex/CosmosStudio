<script lang="ts">
	import * as Resizable from '$lib/components/ui/resizable';
	import { settings } from '$lib/service/settings-service';
	import { onDestroy, onMount } from 'svelte';
	import { SpinnerService } from '$lib/service/spinner-service';
	import { Container, ErrorResponse, ItemResponse, type QueryIterator } from '@azure/cosmos';
	import type { AzureService } from '$lib/service/azure-service';
	import * as Table from '$lib/components/ui/table';
	import { Button } from '$lib/components/ui/button';
	import { ChevronsLeft, FileDown, ListStart, Loader2, RefreshCcw, Trash, Upload } from 'lucide-svelte';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import { DialogService } from '$lib/service/dialog-service';
	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import { toast } from 'svelte-sonner';
	import {
		copyToClipboard,
		delay,
		extractCosmosError,
		getInvalidDefinitions,
		isNullOrUndefined,
		shorten
	} from '$lib/utils';
	import { Separator } from '$lib/components/ui/separator';
	import DocumentWriteMonoco from './document/DocumentWriteMonoco.svelte';

	const abortController : AbortController = new AbortController();
	export let selectedContainer : string;
	export let selectedContainerRef : Container;
	export let azureService : AzureService;
	export let hasDocumentSelected : boolean;

	let selectedDocument : any;
	let editedDocumentRaw : Nullable<string>;

	let partitionKey: string;

	let isDocDirty: boolean;

	let documentArray : any[] = [];
	let currentIterator : Nullable<QueryIterator<any>> = null;
	let hasMore = false;
	let loadingMore = false;

	let savingDocument : Nullable<any>;
	let isHoveringForRefresh = false;
	$: {
		if(selectedContainerRef.id === selectedContainer){
			try{
				SpinnerService.setWithOptions({
					text: `Loading ${selectedContainer} references`,
					color: 'blue',
					shorted: false
				});
				getPartitionKey().then(x => {
					partitionKey = x;
					documentArray = [];
					selectedDocument = undefined;
				});
				executeDocumentQuery('SELECT * FROM C ORDER BY C._ts DESC');
			}catch (e){

			}
		}
	}

	$: {
		if(documentArray.length >= 1){
			if(isNullOrUndefined(selectedDocument))
				selectedDocument = documentArray[0];
		}else{
			selectedDocument = null;
		}
	}

	$: {
		hasMore = !!(currentIterator !== null && currentIterator !== undefined && currentIterator.hasMoreResults());
	}

	$: {
		hasDocumentSelected = selectedDocument !== null && selectedDocument !== undefined;
	}
	async function select(document : any){
		if(!isNullOrUndefined(savingDocument)){
			toast.error(`Busy`, {
				description: `Save in progress for ${savingDocument?.id}. Please wait!`
			});
			return;
		}
		selectedDocument = document;

	}

	export async function getLoadedDocuments() : Promise<any> {
		return documentArray;
	}

	async function getPartitionKey() : Promise<string> {
		const getPartitionKeyDefinitionPromise = await selectedContainerRef.getPartitionKeyDefinition();
		const paths = getPartitionKeyDefinitionPromise.resource?.paths;
		return (paths !== null && paths !== undefined && paths.length > 0) ? paths[0] : ``;

	}
	export async function executeDocumentQuery(query : string){
		try {
			const queryResponse = await azureService.queryAdapter.query(query, selectedContainerRef);
			if(queryResponse.status){
				documentArray = queryResponse.response?.resources ?? [];
				currentIterator = queryResponse.iterator;
				toast.info('Executed', {
					description: `Consumed ≈ ${Math.round(queryResponse.response?.requestCharge ?? 0)} RU`
				});
			}else{
				if(queryResponse.error !== undefined){
					const cosmosError = queryResponse.error as ErrorResponse;
					const message = extractCosmosError(cosmosError);
					if(message){
						toast.error('Invalid Query', {
							description: message,
							action: {
								label: 'Undo',
								onClick: () => {
									executeDocumentQuery('SELECT * FROM C ORDER BY C._ts DESC');
								}
							}
						});
					}else{
						toast.error('Invalid Query', {
							action: {
								label: 'Undo',
								onClick: () => {
									executeDocumentQuery('SELECT * FROM C ORDER BY C._ts DESC');
								}
							}
						});
					}
				}
			}
		}catch (e){

		}finally {
			SpinnerService.unset();
		}

	}
	export async function saveCurrent(){
		if(!isDocDirty)
			return;

		const editedDocument = await validateUpdate();
		if(isNullOrUndefined(editedDocument)) {
			return;

		}
		const backupEntity : Nullable<any> = documentArray.find(x => x.id === editedDocument.id);
		const validationResponse = await validateLive(backupEntity);
		if(!validationResponse.isLatest){
			DialogService.create({
				title: `Confirm Update`,
				descriptions: `The entity in database seems to be not matching with the current. Proceeding will overwrite the existing`,
				cancelText: 'Abort',
				approveText: 'Overwrite',
				onCancel: async () => {

				},
				onApprove: async () => {
					await update(backupEntity, validationResponse.item, editedDocument);
				}
			});
		}else{
			await update(backupEntity, validationResponse.item, editedDocument);
		}

	}
	async function update(backupEntity : any, liveEntity : Nullable<ItemResponse<any>>, toUpdateEntity : any){

		SpinnerService.setWithOptions({
			text: `Saving document ${shorten(selectedDocument?.id) ?? ''}`,
			color: 'blue',
			shorted: false
		});
		try {
			savingDocument = toUpdateEntity;
			if(liveEntity === null || liveEntity === undefined){
				await upsert(toUpdateEntity);
				return;
			}

			//@ts-ignore
			const updateResponse = await liveEntity.item.replace(savingDocument, {abortSignal: abortController.signal});
			const updatedItem = updateResponse.resource;
			const updateCost = Math.round(updateResponse.requestCharge);
			if(backupEntity){
				await replaceInLocal(updatedItem);
				toast.info('Updated', {
					description: `Updated ${toUpdateEntity.id} and cost ≈ ${updateCost} RU`,
					action: {
						label: `Revert`,
						onClick: () => {
							try {
								SpinnerService.setWithOptions({
									text: `Reverting ${shorten(selectedDocument?.id) ?? ''}`,
									color: 'red',
									shorted: false
								});
								//@ts-ignore
								updateResponse.item.replace(backupEntity, {abortSignal: abortController.signal})
									.then(async x => {
										const response = x.resource;
										await replaceInLocal(response);
									});
								toast.info('Reverted successfully');

							}catch (e) {
								toast.error(`Failed`, {
									description: e?.toString()
								});
							}finally {
								SpinnerService.unset();
							}
						}
					}
				});


			}else{
				toast.info('Updated', {
					description: `Updated ${toUpdateEntity.id} and cost ≈ ${updateCost} RU`
				});
				await replaceInLocal(updatedItem);
			}
		}catch (e){
			console.log(e);
			toast.error('Failed Saving', {
				description: 'Failed to update document'
			});
		}finally {
			savingDocument = null;
			SpinnerService.unset();
		}

	}
	async function upsert(toUpdateEntity: any){
		try {
			//@ts-ignore
			const updateResponse = await selectedContainerRef.items.upsert(toUpdateEntity, {abortSignal: abortController.signal});
			const updatedItem = updateResponse.resource;
			const updateCost = Math.round(updateResponse.requestCharge);
			toast.info('Updated', {
				description: `Updated ${toUpdateEntity.id} and cost ≈ ${updateCost} RU`
			});
			await replaceInLocal(updatedItem);
		}catch (e){
			console.log(e);
			toast.error('Failed Saving', {
				description: 'Failed to upsert document'
			});
		}

	}
	async function replaceInLocal(toUpdateEntity : any){
		const index = documentArray.findIndex(x => x.id === toUpdateEntity.id);
		if(index <= -1){
			documentArray.push(toUpdateEntity);
			selectedDocument = toUpdateEntity;
		}else{
			documentArray[index] = toUpdateEntity;
			if(selectedDocument.id === toUpdateEntity.id){
				selectedDocument = toUpdateEntity;
			}

		}
	}
	async function validateUpdate() : Promise<any> {
		if(!isNullOrUndefined(savingDocument)){
			return null;

		}
		if(!hasDocumentSelected || isNullOrUndefined(editedDocumentRaw)){
			toast.error('Invalid Entity', {
				description: 'No document selected to save!'
			});
			return null;

		}

		let editedDocument : Nullable<any> = undefined;
		let jsonError : Nullable<string>
		try {
			editedDocument = JSON.parse(editedDocumentRaw as string);
		}catch (e : any) {
			jsonError = e.toString();
		}
		if(isNullOrUndefined(editedDocument)){
			toast.error('Invalid Entity', {
				description: `Not a valid JSON. ${jsonError ?? ``}`
			});
			return null;

		}
		const invalidDefinitions = getInvalidDefinitions(editedDocument, ['id', partitionKey.slice(1)]);
		if(invalidDefinitions.length > 0){
			toast.error('Invalid Entity',{
				description: `Missing properties : [${invalidDefinitions.join(', ')}]`
			});
			return null;

		}
		return editedDocument;

	}
	async function validateLive(backupEntity: any) : Promise<{isLatest : boolean, item : Nullable<ItemResponse<any>>}>{
		const liveEntityItem = selectedContainerRef.item(backupEntity.id, backupEntity[partitionKey.slice(1)]);
		let entity : ItemResponse<any> | undefined;
		try {
			entity = await liveEntityItem.read();
		}catch (e){
			entity = undefined;
		}
		if(entity){
			if(entity.etag === backupEntity._etag)
				return {
					isLatest: true,
					item: entity
				};
			else{
				return {
					isLatest: false,
					item: entity
				};
			}

		}
		return {
			isLatest: true,
			item : null
		};

	}
	async function refresh(document : any) {
		try {
			const item = selectedContainerRef.item(document.id, document[partitionKey.slice(1)]);
			const itemResponse = await item?.read();
			let isItemMissing = false;
			if(!item || !itemResponse){
				isItemMissing = true
				return
			}
			const refreshCost = Math.round(itemResponse.requestCharge);
			const resource = itemResponse.resource;
			if(!resource){
				isItemMissing = true;
				return;
			}

			if(isItemMissing){
				const current = DialogService.getCurrent();
				if(!isNullOrUndefined(current)){
					DialogService.close();
				}

				DialogService.create({
					title: "Entity Deleted",
					descriptions: `The document with id ${document.id} is deleted or not found in the server. Do you want to keep the item in the local cache or remove it. Updating from local cache will recreate the object in the server, however the item will be lost if the local cache is refreshed.`,
					approveText: 'Delete local',
					cancelText: `Keep local`,
					onApprove: async () => {
						await remove(document.id)
					}
				})
				return
			}

			await replaceInLocal(resource);
			toast.info('Success', {
				description: `Refreshed successfully and costed ≈ ${refreshCost} RU`,
			})
		}catch (e){
			console.log(e)
			const message = `Failed to refresh the item`
			let cosmosError : Nullable<string>;
			if(e instanceof ErrorResponse){
				 cosmosError = extractCosmosError(e);
			}
			toast.error(message, {
				description: cosmosError ?? ``
			});
		}
	}

	function getPartitionValue(doc : any) : Nullable<string>{
		if(doc === null || doc === undefined)
			return undefined;

		const partitionProp = partitionKey?.slice(1);
		if(!partitionProp)
			return undefined;

		if(partitionProp in doc){
			return doc[partitionProp];
		}else{
			return undefined;
		}
	}

	async function remove(id : string){
		const findIndex = documentArray.findIndex(x => x.id === id);
		documentArray.slice(findIndex, 1);
		selectedDocument = undefined;
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

	function copy(content : string | null | undefined){
		if(content === null || content === undefined)
			return;

		copyToClipboard(content)
			.then(x => {
				toast.info(`Copied ${shorten(content)} to clipboard`)
			})
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
		<Resizable.Pane defaultSize={$settings.resizableSize}>
			<div class="flex-col flex documentList" on:scroll={(e) =>{onLazyScroll(e)}}>
				<Table.Root>
					<Table.Header>
						<Table.Row>
							<Table.Head class="w-[300px]">Id</Table.Head>
							<Table.Head class="w-[300px]">{(partitionKey === null || partitionKey === undefined) ? `` : partitionKey}</Table.Head>
							<Table.Head class="text-right">
								<Tooltip.Root>
									<Tooltip.Trigger asChild let:builder>
										<Button builders={[builder]} variant="ghost" size="icon" class="w-4" on:click={async () => {await loadMore()}}>
											<FileDown />
										</Button>
									</Tooltip.Trigger>
									<Tooltip.Content>
										<p>Load next</p>
									</Tooltip.Content>
								</Tooltip.Root>
							</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
							{#each documentArray as document}
								<Table.Row on:click={async () => {await select(document)}} class="hover:cursor-pointer">
									<Table.Cell>
										<!-- svelte-ignore a11y-no-static-element-interactions -->
										<!-- svelte-ignore a11y-click-events-have-key-events -->
										<span on:click={() => {copy(document?.id ?? '')}} class="hover:text-gray-300">
											{shorten(document?.id ?? '', 36) ?? ``}
										</span>
									</Table.Cell>
									<Table.Cell class="">
										<!-- svelte-ignore a11y-no-static-element-interactions -->
										<!-- svelte-ignore a11y-click-events-have-key-events -->
										<span on:click={() => {copy(getPartitionValue(document))}} class="hover:text-gray-300">
											{shorten(getPartitionValue(document), 36)}
										</span>
									</Table.Cell>
									<Table.Cell class="text-right">
										{#if (savingDocument !== null && savingDocument !== undefined && savingDocument.id === document.id)}
											<Upload size={14}></Upload>
										{:else if (selectedDocument.id === document?.id)}
											<!-- svelte-ignore a11y-click-events-have-key-events -->
											<div role="button" tabindex="0" on:mouseenter={() => {isHoveringForRefresh = true}} on:mouseleave={() => {isHoveringForRefresh = false}} on:click={ async () => {if(!isHoveringForRefresh) return; await refresh(document)}}>
												{#if isHoveringForRefresh}
													<RefreshCcw size={14}/>
												{:else}
													<ChevronsLeft size={14}/>
												{/if}
											</div>
										{/if}
									</Table.Cell>
								</Table.Row>
							{/each}
					</Table.Body>
				</Table.Root>
			</div>
		</Resizable.Pane>
		<Resizable.Handle withHandle />
		<Resizable.Pane>
			<DocumentWriteMonoco
				document={selectedDocument}
				bind:editedDocumentRaw={editedDocumentRaw}
				bind:dirty={isDocDirty}
				on:save-doc={ async () => {await saveCurrent()}}
			></DocumentWriteMonoco>
		</Resizable.Pane>
	</Resizable.PaneGroup>
</div>

<style>

</style>