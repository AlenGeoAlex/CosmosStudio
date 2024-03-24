<script lang="ts">
import { Button } from '$lib/components/ui/button';
import * as DropdownMenu from "$lib/components/ui/dropdown-menu";

import { MoreHorizontal } from 'lucide-svelte';
import { createEventDispatcher, onMount } from 'svelte';
const dispatcher = createEventDispatcher();

function createConsole(){
	dispatcher('create-console')
}

function exportAsJson(){
	dispatcher('export-as-json');
}

export let hasContainerSelected : boolean;

</script>


<div class="me-2">
	<DropdownMenu.Root>
		<DropdownMenu.Trigger>
			<Button variant="outline" class="me-3">
				<MoreHorizontal size={20} />
				<span class="ms-2">More</span>
			</Button>
		</DropdownMenu.Trigger>
		<DropdownMenu.Content>
			<DropdownMenu.Group>
				<DropdownMenu.Label>Import/Export</DropdownMenu.Label>
				<DropdownMenu.Separator />
				<DropdownMenu.Item>New</DropdownMenu.Item>
				<DropdownMenu.Item>Import from JSON</DropdownMenu.Item>
				<DropdownMenu.Item>Import from CSV</DropdownMenu.Item>
				{#if (hasContainerSelected)}
					<DropdownMenu.Item on:click={async () => {await exportAsJson();}}>Export</DropdownMenu.Item>
				{/if}
			</DropdownMenu.Group>
			<DropdownMenu.Separator />
			<DropdownMenu.Group>
				<DropdownMenu.Label>Container</DropdownMenu.Label>
				<DropdownMenu.Separator />
				<DropdownMenu.Item
					on:click={() => {createConsole();}}
				>New Console</DropdownMenu.Item>
				<DropdownMenu.Item>New Procedure</DropdownMenu.Item>
				<DropdownMenu.Item>New Function</DropdownMenu.Item>
			</DropdownMenu.Group>
			<DropdownMenu.Separator />
			<DropdownMenu.Group>
				<DropdownMenu.Label class="text-red-600">Danger</DropdownMenu.Label>
				<DropdownMenu.Separator />
				<DropdownMenu.Item class="text-red-500">Delete Container</DropdownMenu.Item>
				<DropdownMenu.Item class="text-red-500">Delete Database</DropdownMenu.Item>
			</DropdownMenu.Group>
		</DropdownMenu.Content>
	</DropdownMenu.Root>
</div>