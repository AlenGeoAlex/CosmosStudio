<style>
    .page {
        background: rgba(0, 0, 0, 0.78);
        border-radius: 16px;
        box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
        backdrop-filter: blur(16.5px);
        -webkit-backdrop-filter: blur(16.5px);
        border: 1px solid rgba(0, 0, 0, 1);
    }

    .title-header {
        font-family: "Poppins", sans-serif;
    }

    .title-header-main {
        font-size: 12rem;
        letter-spacing: 0.8rem;
    }

    .title-header-sub {
        font-size: 3rem;
        letter-spacing: 1rem;
    }

    .footer {
        font-family: "Poppins", sans-serif;
    }
</style>

<script lang="ts">
    import {Progress} from "$lib/components/ui/progress";
    import {redirect} from "$lib/utilities/redirect-utils";

    let progress : number = 0;

    const intervalId = setInterval(() => {
        if(progress == null || Number.isNaN(progress) || progress >= 100){
            clearInterval(intervalId)
            toNextPage();
            return;
        }

        progress+=4;
    }, 80)

    function toNextPage(){
        redirect('/home', 250)
    }
</script>

<div class="max-h-full max-w-full select-none">
    <div class="page flex h-screen w-screen overflow-hidden items-center justify-center">
        <div class="flex flex-col items-center">
            <div class="title-header title-header-main">
                C<span class="text-accent-foreground">Studio</span>
            </div>
            <div class="title-header title-header-sub mx-auto">
                Cosmos <span class="text-cyan-400">Studio</span>
            </div>
            <Progress class="mt-2" value={progress}></Progress>

            <div class="absolute bottom-10 footer">
                <div class="flex flex-col items-center">
                    <div>
                        Alen Alex
                    </div>
                    <div class="mx-auto">
                        2024
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>