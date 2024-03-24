<script lang="ts">
    import {cn, shorten} from "$lib/utils.js";
    import {CalendarDays, Check, ChevronsUpDown, Database} from "lucide-svelte";
    import * as HoverCard from "$lib/components/ui/hover-card";
    import {ConnectionSchema} from "$lib/schema/schema";
    import { asDayWeekString, asRelative, asRelativeFromDate } from '$lib/utilities/date-utils';
    import {Badge} from "flowbite-svelte";
    import * as ContextMenu from '$lib/components/ui/context-menu';
    import {goto} from "$app/navigation";
    import * as Sheet from "$lib/components/ui/sheet";
    import { Button } from "$lib/components/ui/button";
    import { Input } from "$lib/components/ui/input";
    import { Label } from "$lib/components/ui/label";
    import { createEventDispatcher, tick } from 'svelte';
    import * as Command from "$lib/components/ui/command";
    import * as Popover from "$lib/components/ui/popover";
    import {updateConnectionSchema} from "$lib/service/connection-history-service";
    import * as AlertDialog from "$lib/components/ui/alert-dialog";
    import { DialogService } from '$lib/service/dialog-service';

    const dispatcher = createEventDispatcher();
    const NoColor = "No Color";
    const colors = [
        {
            value: "red",
            label: "Red"
        },
        {
            value: "yellow",
            label: "Yellow"
        },
        {
            value: "green",
            label: "Green"
        },
        {
            value: "indigo",
            label: "Indigo"
        },
        {
            value: "purple",
            label: "Purple"
        },
        {
            value: "pink",
            label: "Pink"
        },
        {
            value: "blue",
            label: "Blue"
        },
        {
            value: "none",
            label: NoColor
        },
    ]

    let selectedValue : string;
    $: selectedValue = colors.find((f) => f.value === connection.badgeColor ?? undefined)?.label ?? "No Color..."

    export let connection : ConnectionSchema;
    let editConnection : ConnectionSchema;

    let open : boolean = false;

    let openColor : boolean = false;
    let editedValid : boolean = false;
    $: {
        if (open) {
            editConnection = new ConnectionSchema(connection.id, connection.name, connection.endpoint, connection.primaryKey, connection.databases, connection.lastConnected, connection.badgeText, connection.badgeColor, connection.lastUsedDatabase);
            editConnection.lastConnected = connection.lastConnected;
            validateEditing();
        }
    }

    function click(e : any ){
        if (e.button === 0) {
            connect();
        }
    }


    function handleEditInputEvent(event : any) {
        const target = event.target as HTMLInputElement;
        const field = target.dataset.field;
        const array = target.dataset.array;
        if (field) {
            if(array){
                let editConnectionElement = editConnection[field];
                if(editConnectionElement === null || editConnectionElement === undefined){
                    editConnectionElement = [target.value];
                }else{
                    editConnectionElement.push(target.value)
                }
            }else{
                editConnection[field] = target.value;
            }
        }
        validateEditing()
    }

    function handleColorUpdate(newValue : string, ids: any){
        editConnection.badgeColor = matchColor(newValue) ?? "none";
        closeAndFocusTrigger(ids.trigger);
        selectedValue = colors.find(x => x.value === editConnection.badgeColor)?.label ?? "No Color";
    }
    function connect() {
        goto(`/cosmos/${connection.id}/`)
    }

    function edit(){
        open = false;
        open = true;
    }

    function duplicate(){
        dispatcher('duplicate', connection)
    }

    function closeAndFocusTrigger(triggerId: string) {
        openColor = false;
        tick().then(() => {
            document.getElementById(triggerId)?.focus();
        });
    }

    function saveEdit(){
        open = false;
        connection = editConnection;
        updateConnectionSchema(editConnection);
    }

    function validateEditing() : void {
        let valid = true;
        if(editConnection.name === null || editConnection.name === undefined || editConnection.name.length === 0){
            editedValid = false;
            return;
        }

        if(editConnection.endpoint === null || editConnection.endpoint === undefined || editConnection.endpoint.length === 0){
            editedValid = false;
            return;
        }

        if(editConnection.primaryKey === null || editConnection.primaryKey === undefined || editConnection.primaryKey.length === 0){
            editedValid = false;
            return;
        }

        editedValid = valid;
    }
    function matchColor(input : string) :  "red" | "yellow" | "green" | "indigo" | "purple" | "pink" | "blue" | "dark" | "primary" | "none" | undefined{
        switch (input) {
            case "red":
                return "red";
            case "yellow":
                return "yellow";
            case "green":
                return "green";
            case "indigo":
                return "indigo";
            case "purple":
                return "purple";
            case "pink":
                return "pink";
            case "blue":
                return "blue";
            default:
                return "none";
        }
    }

    function remove(){
        DialogService.create({
            title: "Are you absolutely sure?",
            descriptions: "This action cannot be undone. This will permanently delete and remove your connection.",
            onApprove: async () => {
                removeConfirm()
            }
        });
    }

    function removeConfirm(){
        dispatcher('remove-confirm', connection)
    }


</script>


<div role="button" tabindex="0" class="w-full" on:contextmenu|preventDefault on:mousedown={click}>
    <!-- Hover Card -->
    <HoverCard.Root>
        <HoverCard.Trigger rel="noreferrer noopener" class="underline-offset-4 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-8 focus-visible:outline-black">

            <ContextMenu.Root>
                <ContextMenu.Trigger>
                    <div class="w-full">
                        <div class="rounded-xl border bg-card text-card-foreground shadow min-h-20">
                            <div class="p-6 pt-0">
                                <div class="text-1xl mt-3 text-center font-bold">{shorten(connection.name, 12)}</div>
                                {#if connection.badgeText !== null && connection.badgeText !== undefined }
                                    <Badge class="flex justify-center mt-2" color={connection.badgeColor}>{connection.badgeText}</Badge>
                                {/if}
                            </div>
                        </div>
                    </div>
                </ContextMenu.Trigger>
                <ContextMenu.Content class="w-64">
                    <ContextMenu.Item on:click={(e) => {connect()}} inset>
                        Connect
<!--                        <ContextMenu.Shortcut>⌘[</ContextMenu.Shortcut>-->
                    </ContextMenu.Item>
                    <ContextMenu.Separator />
                    <ContextMenu.Item on:click={() => edit()} inset>
                        Edit
<!--                        <ContextMenu.Shortcut>⌘]</ContextMenu.Shortcut>-->
                    </ContextMenu.Item>
                    <ContextMenu.Item on:click={() => duplicate()} inset>
                        Duplicate
<!--                        <ContextMenu.Shortcut>⌘R</ContextMenu.Shortcut>-->
                    </ContextMenu.Item>
                    <ContextMenu.Separator />
                    <ContextMenu.Item on:click={() => remove()} inset>
                        Remove
<!--                        <ContextMenu.Shortcut>⌘R</ContextMenu.Shortcut>-->
                    </ContextMenu.Item>
                </ContextMenu.Content>
            </ContextMenu.Root>
        </HoverCard.Trigger>
        <HoverCard.Content class="w-full sm:w-80">
            <div class="flex justify-between space-x-4">
                <div class="space-y-1">
                    <h4 class="text-sm font-semibold">{shorten(connection.endpoint, 40)}</h4>
                    <div class="flex items-center pt-2">
                        <Database size={16} strokeWidth={0.75} />
                        <p class="text-xs ml-2 text-muted-foreground">{(connection.databases.length === 0) ? `All/None` : shorten(connection.databases.join(",") , 15)}</p>
                    </div>
                    <div class="flex items-center pt-2">
                        <CalendarDays class="mr-2 h-4 w-4 opacity-70" />{" "}
                        <span class="text-xs text-muted-foreground">
                        Last Connected {(!connection.lastConnected ||connection.lastConnected <= 0) ? `Never` : asRelative(connection.lastConnected)}
                    </span>
                    </div>
                </div>
            </div>
        </HoverCard.Content>
    </HoverCard.Root>

    <!-- SideEditCard -->
    <Sheet.Root open={open} on:close={() => {open = false}}>
        <Sheet.Content side="right" >
            <Sheet.Header>
                <Sheet.Title>Edit Connection</Sheet.Title>
                <Sheet.Description>
                    Edit your connection entry. Click on save once done
                </Sheet.Description>
            </Sheet.Header>
            <div class="grid gap-4 py-4">
                <div class="grid grid-cols-4 items-center gap-4">
                    <Label for="name" class="text-right">Name</Label>
                    <Input id="name" value={editConnection.name} data-field="name" on:input={(e) => {handleEditInputEvent(e)}} class="col-span-3" />
                </div>
                <div class="grid grid-cols-4 items-center gap-4">
                    <Label for="endpoint" class="text-right">Endpoint</Label>
                    <Input id="endpoint" value={editConnection.endpoint} data-field="endpoint" on:input={(e) => {handleEditInputEvent(e)}} class="col-span-3" />
                </div>
                <div class="grid grid-cols-4 items-center gap-4">
                    <Label for="primaryKey" class="text-right">Primary</Label>
                    <Input id="primaryKey" value={editConnection.primaryKey} data-field="primaryKey" on:input={(e) => {handleEditInputEvent(e)}} class="col-span-3" />
                </div>
                <div class="grid grid-cols-4 items-center gap-4">
                    <Label for="databases" class="text-right">Databases</Label>
                    <Input id="databases" value={editConnection.databases.join(',')} data-field="databases" data-array="true" on:input={(e) => {handleEditInputEvent(e)}} class="col-span-3" />
                </div>
                <div class="grid grid-cols-4 items-center gap-4">
                    <Label for="badge" class="text-right">Badge</Label>
                    <Input id="badge" value={editConnection.badgeText} data-field="badgeText" on:input={(e) => {handleEditInputEvent(e)}} class="col-span-3" />
                </div>
                <div class="grid grid-cols-4 items-center gap-4">
                    <Label for="badgeColor" class="text-right">Color</Label>
                    <Popover.Root bind:open={openColor} let:ids>
                        <Popover.Trigger asChild let:builder>
                            <Button
                                    builders={[builder]}
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={open}
                                    class="w-[200px] justify-between"
                            >
                                {selectedValue}
                                <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </Popover.Trigger>
                        <Popover.Content class="w-[200px] p-0">
                            <Command.Root>
                                <Command.Input placeholder="Search color" />
                                <Command.Empty>No color found.</Command.Empty>
                                <Command.Group>
                                    {#each colors as color}
                                        <Command.Item
                                                value={color.value}
                                                onSelect={(currentValue) => {handleColorUpdate(currentValue, ids)}}
                                        >
                                            <Check class={cn("mr-2 h-4 w-4",editConnection.badgeColor !== color.value && "text-transparent")}
                                            />
                                            {color.label}
                                        </Command.Item>
                                    {/each}
                                </Command.Group>
                            </Command.Root>
                        </Popover.Content>
                    </Popover.Root>

                </div>
            </div>
            <Sheet.Footer>
                <Sheet.Close asChild let:builder>
                    <Button builders={[builder]} disabled={!editedValid} on:click={() => {saveEdit()}} type="submit">Save changes</Button>
                </Sheet.Close>
            </Sheet.Footer>
        </Sheet.Content>
    </Sheet.Root>
</div>

