<script lang="ts">
	import {
		Button,
		buttonVariants
	} from "$lib/components/ui/button/index.js";
	import * as Dialog from "$lib/components/ui/dialog/index.js";
  import * as Select from "$lib/components/ui/select/index.js";
  import { Checkbox } from "$lib/components/ui/checkbox/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
	import { Label } from "$lib/components/ui/label/index.js";
  import { ExportType } from '$lib/constants/enums';
  import type { Selected } from 'bits-ui';
  import { FolderSearch } from 'lucide-svelte';
  import { browser } from '$app/environment';
  import { delay, isNullOrUndefined } from '$lib/utils';
  import { Spinner } from 'flowbite-svelte';
  import { SpinnerService } from '$lib/service/spinner-service';
  import { onDestroy } from 'svelte';
  import { ImportExportService } from '$lib/service/import-export-service';
  const isBrowser = browser && !('__TAURI__' in window)
	export let open : boolean = false;
	export let exportType : Selected<ExportType> | undefined;
	export let individualFiles : boolean = true;
	export let identifierKeys : string = "id";
	export let dataSource : () => Promise<any>;
	export let selectedContainer : string;
	let zipChecked = false;
	let zipFileName = `export-${new Date().getTime()}.zip`;
	let saveDirectory : string | undefined = undefined;
	let ignoreAzureKeys : boolean = true;
	function handleZipFileName(e : any){
		if(e.target.value){
			var value = e.target.value as string;
			if(value.endsWith(".zip"))
				return;

			zipFileName = `${value}.zip`
		}else{
			zipFileName = `export-${new Date().getTime()}.zip`;
		}
	}

	async function openFileDialog(){

		const dModule = await getDialogModule();
		const path = await dModule?.open({
				multiple: false,
				directory: true
		});

		if(path && path.length > 0){
			saveDirectory = path.toString();
		}

	  async function getDialogModule() : Promise<Nullable<typeof import('@tauri-apps/api/dialog')>> {
		  return await import('@tauri-apps/api/dialog');
	  }
	}

	let isExportValid = false;

	$: {
			if(exportType === undefined){
				isExportValid = false;
			}else if(!saveDirectory){
				isExportValid = false;
			}else if(zipChecked && isNullOrUndefined(zipFileName) && !zipFileName.endsWith(".zip") && zipFileName !== ".zip"){
				isExportValid = false;
			}else{
		  isExportValid = true
			}

			if(exportType && exportType.value === "csv"){
				individualFiles = false;
				zipChecked = false;
			}
	}

	async function startExport(){
			try {
				SpinnerService.setWithOptions({
						text: "Starting Export",
						color: 'green'
				});
				if(exportType?.value === "json"){
					const data = await dataSource();
					const directory = saveDirectory as string;
					const exportResponse = await ImportExportService.jsonService?.to(data, {
							asZip: zipChecked,
							ignoreAzureMetadata: ignoreAzureKeys,
							saveIndividually: individualFiles,
							saveDirectory: directory,
							fileIdentifierProperty: identifierKeys,
							zipName: zipFileName ?? undefined,
					});
					SpinnerService.unset();
				}else{

				}
	  	}finally {
			  open = false;
	  	}
	}

	onDestroy(() => {
		SpinnerService.unset();
	})

</script>


<Dialog.Root bind:open={open}>
	<Dialog.Content class="sm:max-w-[425px]">
		<Dialog.Header>
			<Dialog.Title>Export Settings</Dialog.Title>
			<Dialog.Description>
				Export your loaded documents into different formats.
				<br>
				<span class="font-bold text-red-700">
					Note : Exporting can only fetch the data which are currently loaded in memory,
					This is not a full container/custom data export solution.
				</span>
			</Dialog.Description>
		</Dialog.Header>

		<div class="grid gap-4 py-4">
			<div class="grid grid-cols-4 items-center gap-4">
				<Label for="exportType" class="text-right">Export Type</Label>
				<Select.Root bind:selected={exportType}>
					<Select.Trigger class="col-span-3">
						<Select.Value placeholder="Select an export type" />
					</Select.Trigger>
					<Select.Content>
						<Select.Group>
							<Select.Item value={ExportType.JSON} label="JSON">JSON</Select.Item>
							<Select.Item value={ExportType.CSV} label="CSV">CSV</Select.Item>
						</Select.Group>
					</Select.Content>
				</Select.Root>
			</div>
			<div class="grid grid-cols-4 items-center gap-4">
				<Label for="selectedContainer" class="text-right">Container</Label>
				<Input disabled={true} id="selectedContainer" value={selectedContainer} class="col-span-3" />
			</div>
			<div class="grid grid-cols-4 items-center gap-4">
				<Label for="identifierKeys" class="text-right">File Key</Label>
				<Input id="identifierKeys" value={identifierKeys} class="col-span-3" />
			</div>
			{#if (!isBrowser)}
				<div class="grid grid-cols-4 items-center gap-4">
					<Label for="saveDirectory" class="text-right">Directory</Label>
					<Input disabled id="saveDirectory" value={saveDirectory} class="col-span-2 w-full px-4 py-2" style="min-width: 220px;" />
					<div class="col-span-1 flex justify-end">
						<Button on:click={async () => {await openFileDialog();} } variant="outline" size="icon" class="text-right">
							<FolderSearch />
						</Button>
					</div>
				</div>
			{/if}
			<div class="grid grid-cols-4 items-center gap-4">
				<Label for="zip" class="text-right">Single Zip</Label>
				<Checkbox disabled={exportType && exportType.value === 'csv'} class="col-span-1" bind:checked={zipChecked} id="zip" />
				<Label for="indFiles" class="text-right">Seperate Files</Label>
				<Checkbox disabled={exportType && exportType.value === 'csv'} bind:checked={individualFiles} id="indFiles" />
			</div>
			{#if zipChecked}
				<div class="grid grid-cols-4 items-center gap-4">
					<Label for="zipFileName" class="m-2">Zip Name</Label>
					<Input id="zipFileName" on:change={(e) => handleZipFileName(e)} value={zipFileName} class="col-span-3" />
				</div>
			{/if}
			<div class="grid grid-cols-4 items-center gap-4">
				<Label for="removeAzureKeys" class="text-right">Ignore Meta</Label>
				<Checkbox class="col-span-3" bind:checked={ignoreAzureKeys} id="removeAzureKeys" />
			</div>
		</div>

		<Dialog.Footer>
			<Button on:click={async () => {await startExport()}} disabled={!isExportValid}>Export</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>