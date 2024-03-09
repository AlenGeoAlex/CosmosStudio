<script lang="ts">
    import {type IToastOption, ToastOptions} from "$lib/components/shared/commons/models";
    import {ToastType} from "$lib/components/shared/commons/enums";
    import {toast, ToastService} from "$lib/service/toast-service";
    import {Indicator, Toast} from "flowbite-svelte";
    import { fly } from 'svelte/transition';

    let notificationCount : number = 0;
    let activeToast : Nullable<ToastOptions>;

    $ : {
        activeToast = $toast.length >= 1 ? $toast[$toast.length - 1] : null;
        notificationCount = $toast.length
    }
    // -- Functions
    function getColorFromOptions(opt : IToastOption) : "green" | "red" | "orange" | "gray" | "yellow" | "blue" | "indigo" | "purple" | "none" {
        if(opt.color !== null)
            return opt.color;

        switch (opt.type) {
            case ToastType.Notification:
                return "green";
            case ToastType.Warning:
                return "orange";
            case ToastType.Error:
                return "red";
            case ToastType.Alert:
                return "blue"
            default:
                return "purple"
        }
    }
</script>

{#if activeToast !== null}
    <Toast class="absolute top-10 right-6 z-50" transition={fly} color={getColorFromOptions(activeToast)} on:close={() => ToastService.remove(activeToast?.id)}>
        {activeToast.text}
        <Indicator color="blue" border size="xl" placement="top-right" class="text-xs font-bold">{notificationCount}</Indicator>
    </Toast>
{/if}

