<script lang="ts">

    import {ClipboardCopy} from "lucide-svelte";
    import { Button } from "$lib/components/ui/button";
    import * as Tooltip from "$lib/components/ui/tooltip";
    import {createEventDispatcher} from "svelte";
    import {copyToClipboard} from "$lib/utils";
    import {ToastService} from "$lib/service/toast-service";

export let copyValue: Nullable<string>;
const dispatcher = createEventDispatcher();

async function copyText(){
    if(copyValue === null)
        return;

    try{
        await copyToClipboard(copyValue)
        dispatcher('copy:done', true);
    }catch (err){
        dispatcher('copy:error', err);
    }
}

</script>


<Tooltip.Root>
    <Tooltip.Trigger asChild let:builder>
        <Button
                builders={[builder]}
                variant="ghost"
                size="icon"
                class="my-auto"
                on:click={() => {copyText()}}
        >
            <ClipboardCopy/>
        </Button>
    </Tooltip.Trigger>
    <Tooltip.Content>
        <p>Click to copy</p>
    </Tooltip.Content>
</Tooltip.Root>