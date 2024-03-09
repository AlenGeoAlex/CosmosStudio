<script lang="ts">

import { Button } from '$lib/components/ui/button';
import { ChevronDown, MoreHorizontal, Trash } from 'lucide-svelte';
import * as DropdownMenu from "$lib/components/ui/dropdown-menu";
import { ContainerActions } from '$lib/constants/enums';
import type { IConsole, IContainerActor } from '$lib/schema/schema';
import { createEventDispatcher, onMount } from 'svelte';
import { ConsoleService } from '$lib/service/console-service';
import type { Readable } from 'svelte/store';

const dispatcher = createEventDispatcher();

const DEFAULT_ACTIONS = [
	ContainerActions.Documents,
	ContainerActions.StoredProcedures,
	ContainerActions.UserFunctions
];

export let activeConsoles : Readable<IConsole[]>;

function deleteConsole(consoleId : string){
	dispatcher('delete-console', consoleId)
}

export let selectedAction : IContainerActor = {
	name: ContainerActions.Documents,
	consoleId: undefined
}

function notifyConsoleSelected(cs : IConsole){
	dispatcher('console-selected', cs);
}

onMount( async () => {

});

</script>

<DropdownMenu.Root>
	<DropdownMenu.Trigger>
		<Button variant="ghost" class="me-3">
			<span class="me-2">{selectedAction.name}</span>
			<ChevronDown size={15}/>
		</Button>
	</DropdownMenu.Trigger>
	<DropdownMenu.Content>
			<DropdownMenu.Group>
				{#each DEFAULT_ACTIONS as action}
					<DropdownMenu.Item on:click={() => {selectedAction = {name: action, consoleId: undefined}}}>
						{action}
					</DropdownMenu.Item>
				{/each}
			</DropdownMenu.Group>
		{#if ($activeConsoles.length > 0)}
			<DropdownMenu.Separator/>
			<DropdownMenu.Group>
				{#each $activeConsoles as eachConsole}
					<DropdownMenu.Item on:click={() => {selectedAction = {name: eachConsole.name, consoleId: eachConsole.id}; notifyConsoleSelected(eachConsole)}}>
						<div class="flex flex-row w-full justify-between">
							<span>{eachConsole.name}</span>
							<Button variant="ghost" size="icon" class="h-5 w-4" on:click={() => {deleteConsole(eachConsole.id)}}>
								<Trash />
							</Button>
						</div>
					</DropdownMenu.Item>
				{/each}
			</DropdownMenu.Group>
		{/if}
	</DropdownMenu.Content>
</DropdownMenu.Root>