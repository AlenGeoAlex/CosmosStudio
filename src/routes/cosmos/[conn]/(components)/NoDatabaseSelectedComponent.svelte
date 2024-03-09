<script lang="ts">
import { CircleSlash } from 'lucide-svelte';
import { Button } from '$lib/components/ui/button';
import { createEventDispatcher, onMount } from 'svelte';

const dispatcher = createEventDispatcher();
export let dbCount : number;
</script>
<div class="h-screen w-screen flex flex-col justify-center items-center overflow-hidden select-none">
	<div class="flex flex-row gap-2 overflow-hidden">

		{#if dbCount <= 0}
			<Button variant="ghost" on:click={() => {dispatcher('open-db-creator')}}>
				<CircleSlash absoluteStrokeWidth />
				 <span class="ms-2">No database found. Create a new database</span>
			</Button>
		{:else}
			<CircleSlash absoluteStrokeWidth />
			<h2 class="text-center">No database selected. Please select a database</h2>
		{/if}
	</div>
</div>

<style>

</style>