<script lang="ts">
	import Check from "lucide-svelte/icons/check";
	import ChevronsUpDown from "lucide-svelte/icons/chevrons-up-down";
	import * as Command from "$lib/components/ui/command";
	import * as Popover from "$lib/components/ui/popover";
	import { Button } from "$lib/components/ui/button";
	import { cn } from "$lib/utils";
	import { tick } from "svelte";
	import { type IContainer } from '$lib/components/models/azure-models';
	let open = false;
	export let availableContainers : IContainer[] = [];

	export let selectedContainer : string | undefined;

	$: {
		if(availableContainers !== null || availableContainers !== undefined){
			if(availableContainers.length === 1){
				selectedContainer = availableContainers[0].name
			}
		}
	}

	// We want to refocus the trigger button when the user selects
	// an item from the list so users can continue navigating the
	// rest of the form with the keyboard.
	function closeAndFocusTrigger(triggerId: string) {
		open = false;
		tick().then(() => {
			document.getElementById(triggerId)?.focus();
		});
	}
</script>

<Popover.Root bind:open let:ids>
	<Popover.Trigger asChild let:builder>
		<Button
			builders={[builder]}
			variant="outline"
			role="combobox"
			class="w-[328px] justify-between">
			{(selectedContainer === null || selectedContainer === undefined) ? `Select Container` : selectedContainer}
			<ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
		</Button>
	</Popover.Trigger>
	<Popover.Content class="w-[328px] p-0">
		<Command.Root>
			<Command.Input placeholder="Search container..." />
			<Command.Empty>No container found.</Command.Empty>
			<Command.Group>
				{#each availableContainers as container}
					<Command.Item
						value={container.name}
						onSelect={(currentValue) => {
              selectedContainer = currentValue;
              closeAndFocusTrigger(ids.trigger);
            }}
					>
						<Check
							class={cn(
                "mr-2 h-4 w-4",
                selectedContainer !== container.name && "text-transparent"
              )}
						/>
						{container.name}
					</Command.Item>
				{/each}
			</Command.Group>
		</Command.Root>
	</Popover.Content>
</Popover.Root>