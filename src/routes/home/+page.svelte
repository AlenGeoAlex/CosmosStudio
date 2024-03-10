<script lang="ts">
    import CredentialsComponent from "./(components)/CredentialsComponent.svelte";
    import {Separator} from "$lib/components/ui/separator";
    import SaveCards from "./(components)/SaveCards.svelte";
    import {ConnectionSchema} from "$lib/schema/schema";
    import { Bookmark, History, Trash2Icon } from 'lucide-svelte';
    import { v4 as uuidv4 } from 'uuid';
    import {
        addConnectionSchema,
        removeConnectionSchema,
        restoreConnectionHistoryServices,
        savedConnections
    } from '$lib/service/connection-history-service';
    import { toast } from 'svelte-sonner';
    import { shorten } from '$lib/utils';
    import { goto } from '$app/navigation';
    import LineHistory from './(components)/LineHistory.svelte';
    import { page } from '$app/stores';
    import { Button } from '$lib/components/ui/button';
    import { onMount } from 'svelte';
    import { AppSettings } from '$lib/service/settings-service';

    if($page.data.timedOutFrom){
        const connectionSchema = $savedConnections.find(x => x.id == $page.data.timedOutFrom);
        if(connectionSchema !== undefined){
            toast.error(`Failed to connect to the database!`,
              {
                  description: `${connectionSchema.name} ${connectionSchema.badgeText !== undefined ? '['+connectionSchema.badgeText+']' : ''}`,
                  action: {
                      label: "Retry",
                      onClick: event => {connect(connectionSchema);}
                  }
              }
            )
        }
    }


    function saveAndConnect(schema : ConnectionSchema){
        addConnectionSchema(schema)
        toast(`Saved ${shorten(schema.name, 15)}`)
        connect(schema)
    }

    function deleteSchema(schema : ConnectionSchema){
        removeConnectionSchema(schema)
        toast(`Removed ${shorten(schema.name, 15)}`)
    }

    function connect(schema : ConnectionSchema){
        setTimeout(async () => {
            await goto(`/cosmos/${schema.id}/`)
        }, 550);
    }

    function duplicateSaved(schema : ConnectionSchema){
        const copySchema = new ConnectionSchema(
          uuidv4(),
          `${schema.name} Copy`,
          schema.endpoint,
          schema.primaryKey,
          schema.databases,
          -1,
          schema.badgeText,
          schema.badgeColor,
          schema.lastUsedDatabase
        );
        addConnectionSchema(copySchema)
        toast.info(`Created`, {
            description: `Duplicated ${schema.name} as ${copySchema.name}.`,
            action: {
                label: "Delete",
                onClick: (() => {
                    removeConnectionSchema(copySchema)
                })
            }
        })
    }

    onMount(async () => {
       await restoreConnectionHistoryServices();
    });
</script>

<div class="flex max-h-full max-w-full select-none">
    <div class="w-full sm:w-1/3 h-screen flex flex-col bg-black">
        <div class="flex flex-grow flex-col">
            <div class="flex-1 flex-col mt-5 flex-grow h-1/2 overflow-auto">
                <div class="flex mx-auto ps-6 gap-2 sticky top-0 bg-black pb-5 rounded">
                    <Bookmark size={20} class="mt-0.5" strokeWidth={2} absoluteStrokeWidth />
                    <h1 class="font-bold">My Connections</h1>
                </div>
                <div class="flex justify-center items-center mt-4">
                    <div class="grid grid-cols-3 w-full lg:grid-cols-3 md:grid-cols-2 sm:grid-cols-1 mx-2 gap-2">
                        {#each $savedConnections as saved}
                            <SaveCards connection={saved}
                                       on:remove-confirm={(e) => {deleteSchema(e.detail)}}
                                       on:duplicate={(e) => {duplicateSaved(e.detail)}}
                            ></SaveCards>
                        {/each}
                    </div>
                </div>
            </div>
<!--            <div class="flex-1 flex-col mt-5 flex-grow h-1/2  overflow-auto">-->
<!--                <div class="flex mx-auto ps-6 gap-2 sticky top-0 bg-black pb-5 rounded">-->
<!--                    <History size={20} strokeWidth={1.5} class="mt-0.5" absoluteStrokeWidth />-->
<!--                    <h1 class="font-bold ">History</h1>-->
<!--                    <div class="ml-auto me-5 mt-[0]">-->
<!--                        <Button variant="ghost">-->
<!--                            <Trash2Icon size={20} strokeWidth={1.5} class="flex justify-end" absoluteStrokeWidth />-->
<!--                        </Button>-->
<!--                    </div>-->
<!--                </div>-->
<!--                <div class="flex justify-center items-center mt-4">-->
<!--                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">-->
<!--                        <LineHistory></LineHistory>-->
<!--                    </div>-->
<!--                </div>-->
<!--            </div>-->
        </div>
        <div class="h-10">
            <div class="title text-center py-2">Cosmos <span class="text-cyan-400">Studio</span></div>
        </div>
    </div>
    <Separator class="bg-gray-500 w-1" orientation="vertical"></Separator>
    <div class="w-full sm:w-2/3 h-screen flex items-center justify-center">
        <div>
            <CredentialsComponent
              on:save-connect={(schema) => {saveAndConnect(schema.detail)}}
            ></CredentialsComponent>
        </div>
    </div>
</div>

<style>
    .title {
        font-family: "Poppins", sans-serif;
        font-size: 1rem;
        letter-spacing: 0.2rem;
    }

    .row-heading {
        font-family: "Poppins", sans-serif;
        font-size: 1rem;
    }
</style>
