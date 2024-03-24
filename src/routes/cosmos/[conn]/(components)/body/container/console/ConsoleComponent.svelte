<script lang="ts">
	import * as Resizable from "$lib/components/ui/resizable/index.js";
	import { settings } from '$lib/service/settings-service';
	import { shorten } from '$lib/utils';
	import type { Container } from '@azure/cosmos';
	import { ConnectionSchema, type IConsole, type IContainerActor } from '$lib/schema/schema';
	import type { AzureService } from '$lib/service/azure-service';
	import { ConsoleService } from '$lib/service/console-service';
	import { getContext, onMount } from 'svelte';
	import { ContextKeys } from '$lib/constants/enums';

	export let schema = getContext<ConnectionSchema>(ContextKeys.ConnectionSchema);
	export let selectedDatabase : string;
	export let selectedContainer : string;
	export let selectedContainerActor : IContainerActor;
	export let selectedContainerRef : Container;
	export let azureService : AzureService;

	let activeConsole : IConsole;

	$: {
		if(selectedContainerActor.consoleId !== undefined){
			ConsoleService.get(schema.id, selectedDatabase, selectedContainerActor.consoleId)
				.then(x => {
					console.log(x);
				});
		}
	}

	onMount(() => {

	})
</script>

<div class="">
	<Resizable.PaneGroup direction="horizontal">
		<Resizable.Pane defaultSize={$settings.resizableSize}>
			<div class="flex-col flex documentList">

			</div>
		</Resizable.Pane>
		<Resizable.Handle withHandle />
		<Resizable.Pane>
			<Resizable.PaneGroup direction="vertical">
				<Resizable.Pane defaultSize={60}>
					<div class="flex h-full items-center justify-center p-6">
						<span class="font-semibold">Two</span>
					</div>
				</Resizable.Pane>
				<Resizable.Handle withHandle />
				<Resizable.Pane defaultSize={40}>
					<div class="flex h-full items-center justify-center p-6">
						<span class="font-semibold">Three</span>
					</div>
				</Resizable.Pane>
			</Resizable.PaneGroup>
		</Resizable.Pane>
	</Resizable.PaneGroup>
</div>
