<script lang="ts">
	import * as Resizable from "$lib/components/ui/resizable";
	import { settings } from '$lib/service/settings-service';
	import { onDestroy, onMount } from 'svelte';
	import { SpinnerService } from '$lib/service/spinner-service';
	import { Container, ErrorResponse, ItemResponse, type QueryIterator } from '@azure/cosmos';
	import type { AzureService } from '$lib/service/azure-service';
	import * as Table from "$lib/components/ui/table";
	import { Button } from '$lib/components/ui/button';
	import { ChevronsLeft, FileDown, ListStart, Loader2, RefreshCcw, Trash, Upload } from 'lucide-svelte';
	import * as Tooltip from "$lib/components/ui/tooltip";
	import { DialogService } from '$lib/service/dialog-service';
	import { ScrollArea } from "$lib/components/ui/scroll-area";
	import { toast } from 'svelte-sonner';
	import { extractCosmosError, getInvalidDefinitions, isNullOrUndefined, shorten } from '$lib/utils';
	import { Separator } from '$lib/components/ui/separator';
	import DocumentWriteMonoco from './document/DocumentWriteMonoco.svelte';

	const abortController : AbortController = new AbortController();
	export let selectedContainer : string;
	export let selectedContainerRef : Container
	export let azureService : AzureService;
	export let hasDocumentSelected : boolean;

	let selectedDocument : any;
	let editedDocumentRaw : Nullable<string>;

	let partitionKey: string;

	let documentArray : any[] = []

	let currentIterator : Nullable<QueryIterator<any>> = null;
	let hasMore = false;
	let savingDocument : Nullable<any>;

	$: {
		if(selectedContainerRef.id === selectedContainer){
			try{
				SpinnerService.setWithOptions({
					text: `Loading ${selectedContainer} references`,
					color: 'blue',
					shorted: false
				});
				getPartitionKey().then(x => {
					partitionKey = x
				})
				SpinnerService.setWithOptions({
					text: `Loading ${selectedContainer} documents`,
					color: 'purple',
					shorted: false
				});
				executeDocumentQuery("SELECT * FROM C ORDER BY C._ts DESC");
			}finally {
				SpinnerService.unset();
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
			})
			return;
		}
		selectedDocument = document;
	}

	async function getPartitionKey() : Promise<string> {
		const getPartitionKeyDefinitionPromise = await selectedContainerRef.getPartitionKeyDefinition();
		const paths = getPartitionKeyDefinitionPromise.resource?.paths;
		return (paths !== null && paths !== undefined && paths.length > 0) ? paths[0] : ``;
	}

	export async function executeDocumentQuery(query : string){
		const queryResponse = await azureService.queryAdapter.query(query, selectedContainerRef);
		if(queryResponse.status){
			documentArray = queryResponse.response?.resources ?? []
			currentIterator = queryResponse.iterator;
			toast.info('Executed', {
				description: `Consumed ≈ ${Math.round(queryResponse.response?.requestCharge ?? 0)} RU`
			})
		}else{
			if(queryResponse.error !== undefined){
				const cosmosError = queryResponse.error as ErrorResponse;
				const message = extractCosmosError(cosmosError);
				if(message){
					toast.error('Invalid Query', {
						description: message,
						action: {
							label: "Undo",
							onClick: () => {
								executeDocumentQuery("SELECT * FROM C ORDER BY C._ts DESC");
							}
						}
					});
				}else{
					toast.error('Invalid Query', {
						action: {
							label: "Undo",
							onClick: () => {
								executeDocumentQuery("SELECT * FROM C ORDER BY C._ts DESC");
							}
						}
					});
				}
			}
		}
	}

	export async function saveCurrent(){
		const editedDocument = await validateUpdate();
		if(isNullOrUndefined(editedDocument))
			return;

		const backupEntity : Nullable<any> = documentArray.find(x => x.id === editedDocument.id)
		const validationResponse = await validateLive(backupEntity);
		if(!validationResponse.isLatest){
			DialogService.create({
				title: `Confirm Update`,
				descriptions: `The entity in database seems to be not matching with the current. Proceeding will overwrite the existing`,
				cancelText: "Abort",
				approveText: "Overwrite",
				onCancel: async () => {

				},
				onApprove: async () => {
					await update(backupEntity, validationResponse.item, editedDocument);
				}
			})
		}else{
			await update(backupEntity, validationResponse.item, editedDocument);
		}
	}

	async function update(backupEntity : any, liveEntity : Nullable<ItemResponse<any>>, toUpdateEntity : any){
		SpinnerService.setWithOptions({
			text: `Saving document ${shorten(selectedDocument?.id) ?? ''}`,
			color: 'blue',
			shorted: false
		})

		try {
			savingDocument = toUpdateEntity;
			if(liveEntity === null || liveEntity === undefined){
				await upsert(toUpdateEntity);
				return;
			}

			const updateResponse = await liveEntity.item.replace(savingDocument);
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
								})
								updateResponse.item.replace(backupEntity)
									.then(async x => {
										const response = await x.resource;
										await replaceInLocal(response);
									})
								toast.info('Reverted successfully')

							}catch (e) {
								toast.error(`Failed`, {
									description: e?.toString()
								})
							}finally {
								SpinnerService.unset();
							}
						}
					}
				})


			}else{
				toast.info('Updated', {
					description: `Updated ${toUpdateEntity.id} and cost ≈ ${updateCost} RU`
				});
				await replaceInLocal(updatedItem);
			}
		}catch (e){
			console.log(e)
			toast.error('Failed Saving', {
				description: 'Failed to update document'
			})
		}finally {
			savingDocument = null;
			SpinnerService.unset();
		}
	}

	async function upsert(toUpdateEntity: any){
		try {
			const updateResponse = await selectedContainerRef.items.upsert(toUpdateEntity);
			const updatedItem = updateResponse.resource;
			const updateCost = Math.round(updateResponse.requestCharge);
			toast.info('Updated', {
				description: `Updated ${toUpdateEntity.id} and cost ≈ ${updateCost} RU`
			});
			await replaceInLocal(updatedItem)
		}catch (e){
			console.log(e)
			toast.error('Failed Saving', {
				description: 'Failed to upsert document'
			})
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
			})
			return null;
		}

		let editedDocument : Nullable<any> = undefined;

		try {
			editedDocument = JSON.parse(editedDocumentRaw as string)
		}catch (e) {}

		if(isNullOrUndefined(editedDocument)){
			toast.error('Invalid Entity', {
				description: 'Not a valid JSON'
			})
			return null;
		}

		const invalidDefinitions = getInvalidDefinitions(editedDocument, ['id', partitionKey.slice(1)]);
		if(invalidDefinitions.length > 0){
			toast.error('Invalid Entity',{
				description: `Missing properties : [${invalidDefinitions.join(", ")}]`
			})
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
				}
			}
		}
		
		return {
			isLatest: true,
			item : null
		};
	}

	async function loadMore(){
		if(currentIterator === null || currentIterator === undefined)
			return;

		documentArray.push(await currentIterator.fetchNext())
	}

	onDestroy(() => {
		try {
			abortController.abort(`Page closed!`);
		}finally {
			SpinnerService.unset();
		}
	});
</script>

<div class="h-screen w-screen">
	<Resizable.PaneGroup direction="horizontal">
		<Resizable.Pane defaultSize={$settings.resizableSize}>
			<div class="flex w-full flex-col">
				<Table.Root  class="overflow-auto">
					<Table.Header>
						<Table.Row>
							<Table.Head class="w-3/6">Id</Table.Head>
							<Table.Head class="w-2/6">{(partitionKey === null || partitionKey === undefined) ? `` : partitionKey}</Table.Head>
							<Table.Head class="w-1/6">
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
					<Table.Body class="relative">
						<div class="fixed">
							<ScrollArea class="h-screen">
								{#each documentArray as document}
									<Table.Row on:click={async () => {await select(document)}} class="hover:cursor-pointer">
										<Table.Cell class="w-3/6">{document.id ?? ``}</Table.Cell>
										<Table.Cell class="w-2/6">{document[partitionKey.slice(1)]?.toString() ?? ``}</Table.Cell>
										<Table.Cell class="w-1/6">
											{#if (savingDocument !== null && savingDocument !== undefined && savingDocument.id === document.id)}
												<Upload size={14}></Upload>
											{:else if (document.id === selectedDocument.id)}
												<ChevronsLeft size={14}/>
											{/if}
										</Table.Cell>
									</Table.Row>
								{/each}
							</ScrollArea>
						</div>
					</Table.Body>
				</Table.Root>
			</div>
		</Resizable.Pane>
		<Resizable.Handle withHandle />
		<Resizable.Pane>
			<DocumentWriteMonoco
				document={selectedDocument}
				bind:editedDocumentRaw={editedDocumentRaw}
			></DocumentWriteMonoco>
		</Resizable.Pane>
	</Resizable.PaneGroup>
</div>