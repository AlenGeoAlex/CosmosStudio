<script lang="ts">
	import { activeDialog } from '$lib/service/dialog-service.js';
	import * as AlertDialog from "$lib/components/ui/alert-dialog";

</script>


{#if $activeDialog !== null}
	<AlertDialog.Root open={$activeDialog !== null}>
		<AlertDialog.Content>
			<AlertDialog.Header>
				<AlertDialog.Title>{$activeDialog.title}</AlertDialog.Title>
				<AlertDialog.Description>
					{$activeDialog.descriptions}
				</AlertDialog.Description>
			</AlertDialog.Header>
			<AlertDialog.Footer>
				<AlertDialog.Cancel on:click={$activeDialog.onCancel}>{$activeDialog.cancelText}</AlertDialog.Cancel>
				<AlertDialog.Action on:click={$activeDialog.onApprove}>{$activeDialog.approveText}</AlertDialog.Action>
			</AlertDialog.Footer>
		</AlertDialog.Content>
	</AlertDialog.Root>
{/if}