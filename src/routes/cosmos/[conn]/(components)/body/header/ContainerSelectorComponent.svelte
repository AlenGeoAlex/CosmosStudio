<script lang="ts">
import { Separator } from '$lib/components/ui/separator';
import * as Select from "$lib/components/ui/select";
import * as Tooltip from "$lib/components/ui/tooltip";

import { Button } from '$lib/components/ui/button';
import MoreSettingsComponent from './MoreSettingsComponent.svelte';
import ContainerSearch from './ContainerSearch.svelte';
import SearchQueryComponent from './SearchQueryComponent.svelte';
import { type IContainer } from '$lib/components/models/azure-models';
import ContainerActionSelector from './ContainerActionSelector.svelte';
import type { IConsole, IContainerActor } from '$lib/schema/schema';
import { createEventDispatcher } from 'svelte';
import type { Readable } from 'svelte/store';
import { ContainerActions } from '$lib/constants/enums';
import { Play, Save } from 'lucide-svelte';
import { Badge } from '$lib/components/ui/badge';
import { formatNumber } from '$lib/utils';
const dispatcher = createEventDispatcher();

export let hasContainerSelected : boolean;
export let availableContainers : IContainer[] = [];
export let activeConsoles : Readable<IConsole[]>;
export let selectedContainer : string | undefined = undefined;
export let selectedContainerAction : IContainerActor;
export let hasDocumentSelected : boolean

export let documentCount : Nullable<number>;
export let isConsoleDirty : boolean;
const options : {
	searchQueries : Map<string, string>,
	currentSelectedQuery : string | undefined,
} = {
	searchQueries : new Map<string, string>,
	currentSelectedQuery: undefined,
}

$: {
	hasContainerSelected = selectedContainer !== null && selectedContainer !== undefined;
}

function executeQuery(e : any){
	dispatcher('execute-query', e)
	if(selectedContainer)
		options.searchQueries.set(selectedContainer, e)
}


$: {
	if(selectedContainer !== null && selectedContainer !== undefined){
		options.currentSelectedQuery = options.searchQueries.get(selectedContainer) ?? undefined
	}
}



</script>

<div class="hidden h-full flex-col md:flex">
	<div class="flex flex-col rounded sm:flex-row sm:items-center sm:space-y-0 md:h-14">
		<div class="basis-1/12 text-center">
			<ContainerActionSelector
				activeConsoles={activeConsoles}
				isConsoleDirty={isConsoleDirty}
				bind:selectedAction={selectedContainerAction}
				on:delete-console
				on:console-selected
			></ContainerActionSelector>
		</div>

		<div class="basis-8/12">
		</div>
		<div class="basis-2/12 text-center">
			<div class="">
				<div class="flex gap-3 justify-center items-center">
					<div class="flex flex-row justify-center items-center gap-2">
						{#if (documentCount !== null && documentCount !== undefined)}

							<Tooltip.Root>
								<Tooltip.Trigger>
									<Badge variant="outline">{formatNumber(documentCount, 1)}</Badge>
								</Tooltip.Trigger>
								<Tooltip.Content>
									<p>{`${selectedContainer} has ${documentCount} documents`}</p>
								</Tooltip.Content>
							</Tooltip.Root>

						{/if}
						{#if (selectedContainerAction.name === ContainerActions.Documents)}
								<Button disabled={!hasDocumentSelected} on:click={() => {dispatcher('save-doc')}} size="icon" variant="ghost">
									<Save size={20}></Save>
								</Button>
						{:else if (selectedContainerAction.name.startsWith('console'))}
							<Button size="icon" variant="ghost">
								<Play class="text-green-500" size={20}></Play>
							</Button>
						{/if}
						<ContainerSearch
						availableContainers={availableContainers}
						bind:selectedContainer={selectedContainer}
						>
						</ContainerSearch>
					</div>

					<div>
						<SearchQueryComponent
							hasContainerSelected={hasContainerSelected}
							bind:previousQuery={options.currentSelectedQuery}
							on:execute-query={(e) => executeQuery(e.detail)}
							selectedAction={selectedContainerAction.name}
						></SearchQueryComponent>
					</div>
					<Separator orientation="vertical"></Separator>
					<MoreSettingsComponent
						hasContainerSelected={hasContainerSelected}
						on:create-console
						on:export-as-json
					></MoreSettingsComponent>

				</div>
			</div>
		</div>


	</div>
	<Separator />
</div>