<script lang="ts">
	import type { PageData } from './$types';
	import type { ConnectionSchema } from '$lib/schema/schema';
	import { DashboardState, StoreKeys } from '$lib/constants/enums';
	import { AzureService } from '$lib/service/azure-service';
	import { SpinnerService } from '$lib/service/spinner-service';
	import { updateConnectionSchema, restoreConnectionHistoryServices } from '$lib/service/connection-history-service';
	import { onDestroy, onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import type { DatabaseManageResponse, IDatabase } from '$lib/components/models/azure-models';
	import HeaderComponent from './(components)/HeaderComponent.svelte';
	import { toast } from 'svelte-sonner';
	import NoDatabaseSelectedComponent from './(components)/NoDatabaseSelectedComponent.svelte';
	import Container from './(components)/Container.svelte';
	import { isNullOrUndefined } from '$lib/utils';

	export let data : PageData;
	const schema : ConnectionSchema = data.schema;
	let currentState : DashboardState = DashboardState.Started;
	const service : AzureService = AzureService.build(schema);
	const ac = new AbortController();
	let availableDatabases : IDatabase[] = []
	//let lastRefreshed : number = -1;

	const childState : {
		header : {
			selectedDatabase : string | undefined,
			openDbCreator : boolean,
			lastRefreshed : number
		},
		container: {
			selectedContainer : string | undefined,
		}
	} = {
		header: {
			selectedDatabase: undefined,
			openDbCreator: false,
			lastRefreshed: -1
		},
		container: {
			selectedContainer: undefined,
		}
	}

	async function run( signal : AbortController) : Promise<void> {
		currentState = DashboardState.StartingConnection;
		SpinnerService.setWithOptions({text: "Reading your databases", color: "yellow"});
		if(signal.signal.aborted)
			return;
		//Load list of available databases in the subscription
		availableDatabases = await service.database.list(signal);
		childState.header.lastRefreshed = Date.now();
		//Update the list to show in the dashboard
		schema.updateDatabases(availableDatabases.map(x => x.name))
		//If there is a last used database, use it
		if(schema.lastUsedDatabase !== undefined){
			if(availableDatabases.map(x => x.name).includes(schema.lastUsedDatabase)){
				childState.header.selectedDatabase = schema.lastUsedDatabase;
			}
		}
		SpinnerService.set("Initialized", "purple");
		currentState = DashboardState.Connected;
		currentState = DashboardState.Initialized
	}


	try{
		SpinnerService.set(`Preparing to connect to ${schema.name}`);
		schema.lastConnected = Date.now();
		SpinnerService.set("Starting...", "blue");

		setTimeout(async () => {
			if(currentState !== DashboardState.StartingConnection)
				return;

			ac.abort("Timeout reached!")
			await goto(`/home?retry=${schema.id}`);
		}, 5000)

		run(ac)
			.then(() => {
			})
			.catch((e) => {
				console.log(e)
				goto(`/home?retry=${schema.id}`);
			})
			.finally(() => {
				SpinnerService.unset();
				updateConnectionSchema(schema);
			})
	}catch (e){
		console.log(e)
		goto(`/home?retry=${schema.id}`);
	}

	$: {
		if(childState.header.selectedDatabase !== undefined)
		{
			toast.info(`Switched to ${childState.header.selectedDatabase}`);
			schema.updateLastUsed(childState.header.selectedDatabase);
		}
	}

	async function refreshDatabaseList(){
		availableDatabases = await service.database.list(ac);
		childState.header.lastRefreshed = Date.now();
	}

	async function createDatabase(e : any){
		const databaseName = e.name;
		let databaseManageResponse : DatabaseManageResponse | undefined = undefined;
		try {
			 databaseManageResponse = await service.database.create(databaseName, ac);
		}catch (e){
			toast.error("Failed to create a database, an unknown error occurred")
		}finally {
			childState.header.openDbCreator = false;
			await refreshDatabaseList();
		}

		if(databaseManageResponse?.status){
			if(availableDatabases.map(x => x.name).includes(databaseName)){
				childState.header.selectedDatabase = databaseName;
			}
		}
	}

	onDestroy(() => {
		SpinnerService.unset();
		ac.abort("Exit")
	})

	onMount( async () => {
		await restoreConnectionHistoryServices();
	})

	function openDbCreator(){
		childState.header.openDbCreator = true;
	}
</script>


<div class="w-screen h-screen overflow-hidden">
	{#if currentState === DashboardState.Initialized}
		<div class="flex flex-col">
		<div class="flex-none w-full h-[4rem]">
			<HeaderComponent
				bind:selectedDatabase={childState.header.selectedDatabase}
				databases={availableDatabases.map(x => x.name)}
				lastRefreshed={childState.header.lastRefreshed}
				dbCreatorState={childState.header.openDbCreator}
				on:refresh-database={async () => {await refreshDatabaseList()}}
				on:create-database={async (e) => {await createDatabase(e.detail);}}
			></HeaderComponent>
		</div>
			<div class="grow h-screen w-full">
				{#if (childState.header.selectedDatabase === null || childState.header.selectedDatabase === undefined)}
					<NoDatabaseSelectedComponent
						dbCount={availableDatabases.length}
						on:open-db-creator={()=> {openDbCreator()}}
					></NoDatabaseSelectedComponent>
				{:else }
					<Container
						schema={schema}
						selectedDatabase={childState.header.selectedDatabase}
						azureService={service}
						bind:selectedContainer={childState.container.selectedContainer}
					></Container>
				{/if}
			</div>
		</div>
	{/if}
</div>




