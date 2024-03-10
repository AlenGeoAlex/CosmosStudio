<script lang="ts">
	import { Spinner } from 'flowbite-svelte';
	import { shorten } from '$lib/utils';
	import { jumper } from '$lib/service/spinner-service';
	import type { JumperOption } from '$lib/components/shared/commons/models';
	let spinner : Nullable<JumperOption> = $jumper;

	$: {
		spinner = $jumper;
	}
</script>

{#if spinner !== null && spinner !== undefined}
	<div class="flex flex-col spinner-overlay">
		<Spinner color={spinner.color} size={spinner.size} />
		{#if spinner.text !== undefined}
			<h4 class="mt-2 text">{spinner.shorted ? `${shorten(spinner.text, 9)}` : spinner.text}</h4>
		{/if}
	</div>
{/if}

<style>
    .spinner-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9999;
    }

    .text {
        font-family: "Poppins", sans-serif;
        font-size: 1rem;
    }
</style>