<script lang="ts">

import { Input } from '$lib/components/ui/input';
import { Button } from '$lib/components/ui/button';
import { TextSearch } from 'lucide-svelte';
import * as Popover from "$lib/components/ui/popover";
import * as Tooltip from "$lib/components/ui/tooltip";
import { validateSql } from '$lib/utilities/validate-utils';
import { createEventDispatcher, setContext } from 'svelte';
import { ContainerActions } from '$lib/constants/enums';

const eventDispatcher = createEventDispatcher();
export let hasContainerSelected : boolean;
export let previousQuery : string | undefined;
export let selectedAction : string;
const SQL_DEFAULT = "SELECT * FROM c ";
let openQuery = false;
export let query = previousQuery === undefined ? SQL_DEFAULT.toLowerCase() : previousQuery;
let validQuery : boolean = validateSql(query);

$: {
	validQuery = validateSql(query);
}

$: {
	if(query.length === 0)
		query = SQL_DEFAULT.toLowerCase();
}

function onChange(e : any) {
	query = e.target.value
}

function executeQuery(){
	openQuery = false;
	eventDispatcher('execute-query', query);
	setContext("search-query", query);
}

</script>

<Popover.Root open={openQuery} onOpenChange={(e) => {openQuery = e;}}>
	<Popover.Trigger asChild let:builder>
		<Button builders={[builder]} variant="outline" disabled={!hasContainerSelected}>
			<TextSearch size={16} class="me-2"/>
			Query
		</Button>
	</Popover.Trigger>
	<Popover.Content class="mt-3 w-1/3 h-[4.8rem]">
		<div class="h-full w-full">
			<div class="flex flex-row justify-center items-center gap-1.5">
				<Input type="text" id="query" on:input={(e) => {onChange(e)}} value={query} placeholder={query}/>
				{#if validQuery}
					<Button disabled={selectedAction !== ContainerActions.Documents || !validQuery} on:click={() => {executeQuery();}} variant="ghost" class="ms-2"><TextSearch size={16} class="me-2"/></Button>
					{:else }
					<Tooltip.Root>
						<Tooltip.Trigger asChild let:builder>
							<Button builders={[builder]}  variant="ghost" class="ms-2"><TextSearch size={16} class="me-2"/></Button>
						</Tooltip.Trigger>
						<Tooltip.Content>
							<p>Only select queries are allowed</p>
						</Tooltip.Content>
					</Tooltip.Root>
					{/if}
			</div>
		</div>
	</Popover.Content>
</Popover.Root>

<style>

</style>