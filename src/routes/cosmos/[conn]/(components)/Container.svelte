<script lang="ts">

import ContainerSelectorComponent from './body/header/ContainerSelectorComponent.svelte';
import { AzureService } from '$lib/service/azure-service';
import { type IContainer } from '$lib/components/models/azure-models';
import { onMount } from 'svelte';
import ContainerBody from './body/container/ContainerBody.svelte';
import NoContainerSelectedComponent from './body/header/NoContainerSelectedComponent.svelte';
import { ConnectionSchema, type IConsole, type IContainerActor } from '$lib/schema/schema';
import { ConsoleService } from '$lib/service/console-service';
import { toast } from 'svelte-sonner';
import { type Readable, readonly, writable } from 'svelte/store';
import { ContainerActions } from '$lib/constants/enums';
import { Container } from '@azure/cosmos';

export let schema : ConnectionSchema;
export let azureService : AzureService;
export let selectedContainer : string | undefined;
export let selectedDatabase : string;
let hasDocumentSelected : boolean;

let selectedContainerRef : Nullable<Container> = null;

let selectedContainerAction : IContainerActor = {
	name: ContainerActions.Documents,
	consoleId: undefined
};

let availableContainers : IContainer[] = [];

let storePromise : Promise<Readable<IConsole[]>> = ConsoleService.storeOf(schema.id, selectedDatabase);
let containerBody : ContainerBody;
$: {
	azureService.container.list(selectedDatabase).then((containers) => {
		availableContainers = containers;
	})
}

$: {
	if(selectedContainer !== undefined)
		azureService.container.getRef(selectedContainer, selectedDatabase)
			.then(x => {
				selectedContainerRef = x;
			})
			.catch(er => {
				console.log(er)
			});
}

async function saveCurrentDoc(){
	await containerBody.saveCurrentDoc();
}

async function loadContainers(){
	availableContainers = await azureService.container.list(selectedDatabase)
}

async function createConsole(){
	if(!selectedContainer){
		toast.error('No Container', {
			description: "No container selected, Please select a container to create a console"
		})
		return;
	}

	const console = await ConsoleService.create(schema.id, selectedDatabase, selectedContainer);
	selectedContainerAction = {
		name: console.name,
		consoleId: console.id
	}

	toast.success('Created', {
		description: `Created and switched to ${console.name}`,
		action: {
			label: "Delete",
			onClick: event => {
				deleteConsole(console.id)
			}
		}
	})
}

async function copyConsole(console : IConsole) {
	const newConsole = await ConsoleService.copy(schema.id, selectedDatabase, console);
	selectedContainerAction = {
		name: newConsole.name,
		consoleId: newConsole.id
	}

	toast.success('Created', {
		description: `Created and switched to ${newConsole.name}`,
		action: {
			label: "Delete",
			onClick: event => {
				deleteConsole(newConsole.id)
			}
		}
	})
}

async function deleteConsole(consoleId : string, missingContainer : boolean = false){
	if(selectedContainerAction.consoleId !== undefined && selectedContainerAction.consoleId === consoleId){
		selectedContainerAction = {
			name: ContainerActions.Documents,
			consoleId: undefined
		}
	}

	const backup = await ConsoleService.get(schema.id, selectedDatabase, consoleId);
	await ConsoleService.delete(schema.id, selectedDatabase, consoleId);

	if(missingContainer){
		toast.info('Deleted', {
			description: `The container in which the console is created is not found!`
		})
		return;
	}

	if(backup !== null && backup !== undefined){
		toast.info('Deleted', {
			description: `Successfully deleted ${backup?.name}`,
			action: {
				label: "Undo",
				onClick: event => {
					copyConsole(backup)
				}
			}
		})
	}else {
		toast.info('Delete', {
			description: "Successfully deleted"
		})
	}
}

export async function executeQuery(e : string){
	await containerBody.documentExecute(e);
}

async function processConsoleSelected(cs : IConsole){
	const boundContainer = cs.boundContainer;
	if(!availableContainers.map(x => x.name).includes(boundContainer)){
		selectedContainerAction = {
			name: ContainerActions.Documents,
			consoleId: undefined
		};
		await deleteConsole(cs.id, true);
		return;
	}

	selectedContainer = boundContainer;
}

onMount( async () => {
	await loadContainers();
});
</script>


<div>
	{#await storePromise}
<!--		<ContainerSelectorComponent-->
<!--			hasContainerSelected={selectedContainer !== undefined}-->
<!--			availableContainers={availableContainers}-->
<!--			bind:selectedContainer={selectedContainer}-->
<!--			activeConsoles={readonly(writable([]))}-->
<!--			bind:selectedContainerAction={selectedContainerAction}-->
<!--			on:create-console={async () => {await createConsole()}}-->
<!--			on:delete-console={async (e) => {await deleteConsole(e.detail)}}-->
<!--		></ContainerSelectorComponent>-->
	{:then store}
		<ContainerSelectorComponent
			hasContainerSelected={selectedContainer !== undefined}
			availableContainers={availableContainers}
			hasDocumentSelected={hasDocumentSelected}
			bind:selectedContainerAction={selectedContainerAction}
			bind:selectedContainer={selectedContainer}
			activeConsoles={store}
			on:create-console={async () => {await createConsole()}}
			on:delete-console={async (e) => {await deleteConsole(e.detail)}}
			on:execute-query={async (e) => {await executeQuery(e.detail)}}
			on:save-doc={async () => {await saveCurrentDoc()}}
			on:console-selected={async (e) => {await processConsoleSelected(e.detail)}}
		></ContainerSelectorComponent>
	{/await}
	{#if (selectedContainer !== null && selectedContainer !== undefined && ( selectedContainerRef !== null && selectedContainerRef !== undefined))}
		<ContainerBody
			bind:selectedContainer={selectedContainer}
			bind:selectedContainerActor={selectedContainerAction}
			bind:this={containerBody}
			selectedContainerRef={selectedContainerRef}
			selectedDatabase={selectedDatabase}
			azureService={azureService}
			bind:hasDocumentSelected={hasDocumentSelected}
		>
		</ContainerBody>
	{:else}
		<NoContainerSelectedComponent></NoContainerSelectedComponent>
	{/if}
</div>