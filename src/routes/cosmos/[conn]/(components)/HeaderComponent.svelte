<script lang="ts">
	import { ArrowLeft, Database, Plus } from 'lucide-svelte';
	import * as Select from '$lib/components/ui/select';
	import { Label } from '$lib/components/ui/label';
	import { goto } from '$app/navigation';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { validateDatabaseName } from '$lib/utilities/validate-utils';
	import { createEventDispatcher, onDestroy, onMount } from 'svelte';
	import { toast } from 'svelte-sonner';
	import { SpinnerService } from '$lib/service/spinner-service';
	import * as Tooltip from "$lib/components/ui/tooltip";
	import { asRelative } from '$lib/utilities/date-utils';

	const eventDispatcher = createEventDispatcher();
	export let databases: string[] = [];
	export let selectedDatabase : string | undefined;
	export let lastRefreshed : number = -1;
	let databaseCreateOption: {
		enteredName: string,
		validationStatus: boolean
	} = createDefaultDatabaseCreationOption();
	export let dbCreatorState = false;

	onMount(() => {
		if (databases.length === 1)
			selectedDatabase = databases[0];
	});

	$: {
		if(selectedDatabase !== undefined){
			if(!databases.includes(selectedDatabase)){
				toast.error(`The database ${selectedDatabase} seems to be not available any more`);
				selectedDatabase = undefined;
			}
		}
	}
	function handleCreateDatabaseInput(event: any) {
		const target = event.target as HTMLInputElement;
		databaseCreateOption.enteredName = target.value;
		const response = validateDatabaseName(databaseCreateOption.enteredName, databases);
		databaseCreateOption.validationStatus = response?.status ?? false;
	}

	function createDefaultDatabaseCreationOption() : {
		enteredName: string,
		validationStatus: boolean,
		isCreating? : boolean | undefined,
		creationResponse? : string | undefined
	}{
		return  {
			enteredName: 'Database Name',
			validationStatus: false
		};
	}

	function back() {
		goto('/home');
	}

	function changeDatabase(label: string | undefined) {
		if(label === undefined)
			return;

		selectedDatabase = label;
		eventDispatcher('change-database', label);
	}

	function createDatabase(){
		if(!databaseCreateOption.validationStatus)
			toast.error("Please pass a valid name");

		try {

			SpinnerService.setWithOptions({
				text: "Creating database",
				color: 'blue',
			})

			//
			eventDispatcher('create-database', {name : databaseCreateOption.enteredName})
		}catch (e){

		}finally {
			dbCreatorState = false;
			SpinnerService.unset();
		}
	}

	function refreshDatabase(){
		eventDispatcher('refresh-database');
	}

	onDestroy(() => {
		SpinnerService.unset();
	})
</script>

<nav class="bg-black bg-opacity-50 backdrop-filter backdrop-blur-md shadow-lg fixed w-full z-10">
	<div class="max-w mx-auto px-4">
		<div class="flex justify-between h-16 items-center">
			<div class="flex justify-start">
				<div class="flex-shrink-0 flex items-center ml-5">
					<div class="title-header-sub select-none">
						<a href="/home">Cosmos <span class="text-cyan-400">Studio</span></a>
					</div>
				</div>
			</div>
			<div>
				<div class="flex items-center space-x-2">

					<!-- Refresh button -->
					<Tooltip.Root>
						<Tooltip.Trigger asChild let:builder>
							<Button builders={[builder]} variant="ghost" on:click={() => {refreshDatabase()}}>
								<Database  size={16} />
							</Button>
						</Tooltip.Trigger>
						<Tooltip.Content>
							<p>Last Refreshed on {asRelative(lastRefreshed)}. Click to refresh</p>
						</Tooltip.Content>
					</Tooltip.Root>


					<div class="px-2 py-4" id="database">
						<Select.Root onOpenChange={() => {createDefaultDatabaseCreationOption()}} portal={null} selected={{label: selectedDatabase, value: selectedDatabase}} onSelectedChange={(v) => {changeDatabase(v?.label);}}>
							<Select.Trigger class="w-[180px]">
								<Select.Value placeholder="Select database" />
							</Select.Trigger>
							<Select.Content>
								<Select.Group>
									{#if databases.length === 0}
										<Select.Label>No databases</Select.Label>
									{:else}
										<Select.Label>Available databases</Select.Label>
										{#each databases as database}
											<Select.Item value={databases} label={database}>{database}</Select.Item>
										{/each}
									{/if}
								</Select.Group>
							</Select.Content>
							<Select.Input name="favoriteFruit" />
						</Select.Root>
					</div>
					<div>
						<Dialog.Root open={dbCreatorState}>
							<Dialog.Trigger>
								<Button variant="outline" on:click={() => {dbCreatorState=true; databaseCreateOption = createDefaultDatabaseCreationOption()}}>
									<Plus size={16} />
									<span class="ms-2">Create Database</span>
								</Button>
							</Dialog.Trigger>
							<Dialog.Content class="sm:max-w-[425px]">
								<Dialog.Header>
									<Dialog.Title>Create Database</Dialog.Title>
									<Dialog.Description>
										Create a new database in the connected cosmos instance
									</Dialog.Description>
								</Dialog.Header>
								<div class="grid gap-4 py-4">
									<div class="grid grid-cols-4 items-center gap-4">
										<Label class="text-right">Name</Label>
										<Input id="name" value={databaseCreateOption.enteredName}
													 on:input={(e) => {handleCreateDatabaseInput(e);}} class="col-span-3" />
									</div>
								</div>
								<Dialog.Footer>
									<Button disabled={!databaseCreateOption.validationStatus} on:click={() => {createDatabase()}} type="submit">Create</Button>
								</Dialog.Footer>
							</Dialog.Content>
						</Dialog.Root>
					</div>
				</div>
			</div>
		</div>
	</div>
</nav>


<style>
    .title-header-sub {
        font-family: "Poppins", sans-serif;
        font-size: 1.2rem;
        letter-spacing: 0.2rem;
    }
</style>

