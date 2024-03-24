<script lang="ts">
	import type { IContainerActor } from '$lib/schema/schema';
	import { ContainerActions } from '$lib/constants/enums';
	import DocumentComponent from './DocumentComponent.svelte';
	import ConsoleComponent from './console/ConsoleComponent.svelte';
	import type { Container } from '@azure/cosmos';
	import type { AzureService } from '$lib/service/azure-service';
  import { ExportService } from '$lib/service/export-service';
  import ExportDialog from '$lib/components/shared/components/ExportDialog.svelte';

	export let selectedContainer : string;
	export let selectedDatabase : string;
	export let selectedContainerActor : IContainerActor;
	export let selectedContainerRef : Container;
	export let azureService : AzureService;
	export let hasDocumentSelected : boolean = false;
	let exportSettingsOpen : boolean = false;
	let documentBody : Nullable<DocumentComponent>;
	export async function documentExecute(query : string){
		await documentBody?.executeDocumentQuery(query)
	}

	export async function saveCurrentDoc(){
		await documentBody?.saveCurrent();
	}

	export async function exportDataJson(){
	  // if (selectedContainerActor.name === ContainerActions.Documents) {
	  //   const data = await documentBody?.getData();
	  //   await ExportService.jsonService?.to(data);
    // }

			exportSettingsOpen = true;
	}

</script>

<div>
	{#if (exportSettingsOpen)}
		<ExportDialog
			exportType={undefined}
			bind:open={exportSettingsOpen}
			selectedContainer={selectedContainer}
			individualFiles={true}
		></ExportDialog>
	{/if}
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
			<ConsoleComponent
				selectedDatabase={selectedDatabase}
				selectedContainerRef={selectedContainerRef}
				selectedContainer={selectedContainer}
				azureService={azureService}
				selectedContainerActor={selectedContainerActor}
			></ConsoleComponent>
	{/if}
</div>