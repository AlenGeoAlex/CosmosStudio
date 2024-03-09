<script lang="ts">
	import type { IContainerActor } from '$lib/schema/schema';
	import { ContainerActions } from '$lib/constants/enums';
	import DocumentComponent from './DocumentComponent.svelte';
	import ConsoleComponent from './ConsoleComponent.svelte';
	import type { Container } from '@azure/cosmos';
	import type { AzureService } from '$lib/service/azure-service';

	export let selectedContainer : string;
	export let selectedDatabase : string;
	export let selectedContainerActor : IContainerActor;
	export let selectedContainerRef : Container;
	export let azureService : AzureService;
	export let hasDocumentSelected : boolean = false;
	let documentBody : Nullable<DocumentComponent>;
	export async function documentExecute(query : string){
		await documentBody?.executeDocumentQuery(query)
	}

	export async function saveCurrentDoc(){
		await documentBody?.saveCurrent();
	}

</script>

<div>
	{#if (selectedContainerActor.consoleId === undefined)}
		{#if (selectedContainerActor.name === ContainerActions.Documents)}
			<DocumentComponent
				bind:this={documentBody}
				selectedContainerRef={selectedContainerRef}
				selectedContainer={selectedContainer}
				azureService={azureService}
				bind:hasDocumentSelected={hasDocumentSelected}
			></DocumentComponent>
		{/if}
	{:else}
			<ConsoleComponent></ConsoleComponent>
	{/if}
</div>