<script lang="ts">
    import { Button } from "$lib/components/ui/button";
    import * as Card from "$lib/components/ui/card";
    import * as Select from "$lib/components/ui/select";
    import { Input } from "$lib/components/ui/input";
    import { Label } from "$lib/components/ui/label";
    import {KeyRound} from "lucide-svelte";
    import {Separator} from "$lib/components/ui/separator";
    import Clipboard from "$lib/components/shared/components/Clipboard.svelte";
    import { createEventDispatcher, onMount } from 'svelte';
    import {ToastService} from "$lib/service/toast-service";
    import {toast} from "svelte-sonner";
    import { ConnectionSchema } from '$lib/schema/schema';
    import { v4 as uuidv4 } from 'uuid';
    // --
    let endpoint: Nullable<string> = null;
    let primaryKey: Nullable<string> = null;
    let connectionName: Nullable<string> = endpoint;
    let database: Nullable<string> = null;
    let validEntry : boolean = false;

    const dispatcher = createEventDispatcher();

    onMount(() => {
        validateEntry();
    })

    // -- Functions
    function validateEntry() {
        validEntry = !(!endpoint || !primaryKey || endpoint.length === 0 || primaryKey.length === 0);
    }

    function updateName(){
        if(connectionName === null || connectionName.length === 0)
            connectionName = endpoint;
    }

    function saveAndConnect(){
        const id = uuidv4()
        if(connectionName && endpoint && primaryKey)
        {
            const schema = new ConnectionSchema(id, connectionName, endpoint, primaryKey, [], -1, undefined, undefined)
            dispatcher("save-connect", schema);
            clear();
        }else{
            toast("Failed to save connection schema")
        }
    }

    function clear(){
        connectionName = null;
        primaryKey = null;
        endpoint = null;
        database = null;
    }
</script>

<style>

</style>

<Card.Root class="w-[400px]">
    <Card.Header>
        <Card.Title>Cosmos</Card.Title>
        <Card.Description>Sign in to your cosmos database</Card.Description>
    </Card.Header>
    <Card.Content>
        <form>
            <div class="grid w-full items-center gap-4">
                <div class="flex flex-col space-y-1.5">
                    <Label for="framework">Endpoint</Label>
                    <div class="flex flex-row gap-2">
                        <Input
                                on:change={() => {validateEntry(); updateName()}}
                                on:input={() => {validateEntry()}}
                                bind:value={endpoint}
                                id="endpoint"
                                placeholder="Endpoint"
                        />
                        <Clipboard
                                copyValue={endpoint}
                                on:copy:done={() => {toast('Endpoint has been copied')}}
                        ></Clipboard>
                    </div>
                </div>
                <div class="flex flex-col space-y-1.5">
                    <Label for="framework">Primary Key</Label>
                    <div class="flex flex-row gap-2">
                        <Input
                                on:change={() => validateEntry()}
                                on:input={() => {validateEntry()}}
                                bind:value={primaryKey}
                                id="key"
                                placeholder="Primary key"
                        />
                        <Clipboard copyValue={primaryKey} on:copy:done={() => {toast('Primary key been copied')}}></Clipboard>
                    </div>
                </div>

                <div class="flex flex-col space-y-1.5">
                    <div class="flex flex-row gap-2">
                        <div class="flex flex-col gap-3">
                            <Label for="framework">Name</Label>
                            <Input
                                    bind:value={connectionName}
                                    id="conn-name"
                                    placeholder="Name"
                            />
                        </div>

                        <div class="flex flex-col gap-3">
                            <Label for="framework">Database</Label>
                            <Input
                                    bind:value={database}
                                    id="database"
                                    placeholder="Database"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </form>
    </Card.Content>
    <Card.Footer class="flex justify-between">
        <div class="flex w-full flex-col items-center">
            <div class="flex flex-row justify-center gap-4">
                <Button variant="outline" on:click={() => {clear()}}>Clear</Button>
                <Button disabled={!validEntry} on:click={() => {saveAndConnect()}}>Save & Connect</Button>
            </div>
            <Separator class="mt-3"></Separator>
            <div class="flex flex-row mt-3 justify-center">
                <Button variant="secondary">
                    <KeyRound class="mr-2 h-5 w-5" />
                    Microsoft
                </Button>
            </div>
        </div>
    </Card.Footer>
</Card.Root>