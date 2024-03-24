import { isNullOrUndefined } from '$lib/utils';
import { browser } from '$app/environment';

export class ExportService {

	private static _jsonService : Nullable<JsonExportService>;

	static get jsonService(){
		if(isNullOrUndefined(ExportService._jsonService)){
			ExportService._jsonService = new JsonExportService();
		}

		return ExportService._jsonService;
	}


}

class JsonExportService {

	async to(data : any, options? : {
		saveSeparately? : boolean,
		fileIdentifierProperty? : string,
		asZip?: boolean
	}) : Promise<boolean>
	{
		if(isNullOrUndefined(data))
			return false;

		try{
			let isMultipleFile = false;
			const exportTimeFrame = new Date().toISOString();
			const fileMap : Map<string, Blob> = new Map<string, Blob>();
			if(Array.isArray(data)){
				const separateFiles = options?.saveSeparately ?? false;
				if(separateFiles){
					isMultipleFile = true;
					let fileCount = 0;
					for (let each of data) {
						fileCount++;
						const eachFile = new Blob([JSON.stringify(each)], {
							type: "application/json"
						});
						let fileName = "";
						if(each.hasOwnProperty(options?.fileIdentifierProperty ?? "id")){
							const idProperty = each["id"];
							if(typeof idProperty === "string" || idProperty instanceof String){
								fileName = `${idProperty}.json`;
							}
						}

						if(isNullOrUndefined(fileName) || fileName.length <= 0){
							fileName = `${exportTimeFrame}-${fileCount}.json`
						}
						if(fileMap.has(fileName)){
							fileName = `${new Date().getMilliseconds()}-${fileName}`
						}
						fileMap.set(fileName, eachFile);
					}
				}else{
					fileMap.set(`${exportTimeFrame}.json`, new Blob([JSON.stringify(data)], {
						type: 'application/json'
					}))
				}
			}else{
				fileMap.set(`${exportTimeFrame}.json`, new Blob([JSON.stringify(data)], {
					type: 'application/json'
				}))
			}

			let saveDirectory = null;

			if (browser && !('__TAURI__' in window)) {

			}else{
				const tauriModule = await getDialogModule();
				const location = await tauriModule?.open({
					multiple: false,
					directory: true
				})
				if(!location){
					return false;
				}

				console.log(location);
			}
		}catch (e) {
			return false;
		}

		return true;
	}

}

export async function getDialogModule() : Promise<Nullable<typeof import('@tauri-apps/api/dialog')>> {
	return  await import('@tauri-apps/api/dialog');
}