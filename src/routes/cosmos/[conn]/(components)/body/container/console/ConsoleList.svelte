<script lang="ts">
import { shorten } from '$lib/utils.js';
import { ChevronsLeft, FileDown, RefreshCcw, Upload } from 'lucide-svelte';
import { Button } from '$lib/components/ui/button/index.js';
import * as Table from '$lib/components/ui/table';
import * as Tooltip from '$lib/components/ui/tooltip';
import { createEventDispatcher } from 'svelte';

	const dispatcher = createEventDispatcher();
	export let documentArray : any[] = [];
	export let selectedIndex = -1;
	let hasIdProperty : boolean = false;

	async function loadMore(){
		dispatcher('load-more')
	}

	async function select(index : number){
		dispatcher('select', index)
	}

	$: {
		if(documentArray && documentArray.length > 0){
			hasIdProperty = true;
			for (let documentArrayElement of documentArray) {
				if(!documentArrayElement.hasOwnProperty("id")){
					hasIdProperty = false;
					break;
				}
			}
		}
	}

</script>



<Table.Root>
	<Table.Header>
		<Table.Row>
			<Table.Head class="w-[550px]">{hasIdProperty ? 'Id' : 'Index'}</Table.Head>
			<Table.Head class="text-right">
				<Tooltip.Root>
					<Tooltip.Trigger asChild let:builder>
						<Button builders={[builder]} variant="ghost" size="icon" class="w-4" on:click={async () => {await loadMore()}}>
							<FileDown />
						</Button>
					</Tooltip.Trigger>
					<Tooltip.Content>
						<p>Load next</p>
					</Tooltip.Content>
				</Tooltip.Root>
			</Table.Head>
		</Table.Row>
	</Table.Header>
	<Table.Body>
		{#each documentArray as document, i (i)}
			<Table.Row on:click={async () => {await select(i)}} class="hover:cursor-pointer">
				<Table.Cell>
					{hasIdProperty ? shorten(document?.id ?? '', 36) ?? `` : `#${i}`}
				</Table.Cell>
				<Table.Cell class="text-right">
					{#if (i === selectedIndex)}
						<!-- svelte-ignore a11y-click-events-have-key-events -->
						<div role="button" tabindex="0">
							<ChevronsLeft size={14}/>
						</div>
					{/if}
				</Table.Cell>
			</Table.Row>
		{/each}
	</Table.Body>
</Table.Root>