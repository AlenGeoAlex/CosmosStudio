<script lang="ts">
		import '../app.pcss';
    import { ModeWatcher } from "mode-watcher";
    import { Toaster } from "$lib/components/ui/sonner";
		import LoadingSpinner from '$lib/components/shared/components/LoadingSpinner.svelte';
		import { SpinnerService } from '$lib/service/spinner-service.js';
		import * as AlertDialog from "$lib/components/ui/alert-dialog";
		import AlertComponent from '$lib/components/shared/components/AlertComponent.svelte';
</script>

<ModeWatcher />
<!--<div class="relative">
    <NotificationToast></NotificationToast>
</div>-->
<Toaster />
<LoadingSpinner></LoadingSpinner>
<AlertComponent></AlertComponent>
<slot />
