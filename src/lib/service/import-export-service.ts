import { isNullOrUndefined } from '$lib/utils';
import { AzureMetaKeys, ExportResponse } from '$lib/constants/enums';
import { AppSettings } from '$lib/service/settings-service';
import { invoke } from '@tauri-apps/api/tauri'
import { toast } from 'svelte-sonner';


export interface IImportExportService<T extends IExportOptions, I extends IImportOptions>{

	to(data : any, options : T ) : Promise<ExportResponse>;

	from(data : string, options : I) : Promise<any[]>;
}

export interface IExportOptions{
	asZip?: boolean,
	zipName? : string
	saveDirectory? : string,
	ignoreAzureMetadata? : boolean,
}

export interface IImportOptions{
}

interface IJsonExportOptions extends IExportOptions {
	saveIndividually? : boolean
	fileIdentifierProperty? : string,
}

interface IJsonImportOptions extends IImportOptions {

}

export class ImportExportService {

	private static _jsonService : Nullable<IImportExportService<IJsonExportOptions, IJsonImportOptions>>;

	static get jsonService(){
		if(isNullOrUndefined(ImportExportService._jsonService)){
			ImportExportService._jsonService = new JsonExportService();
		}

		return ImportExportService._jsonService;
	}


}

class JsonExportService implements IImportExportService<IJsonExportOptions, IJsonImportOptions>{
	async to(data: any, options: IJsonExportOptions): Promise<ExportResponse> {
		if(isNullOrUndefined(data))
			return ExportResponse.NoData;

		data = structuredClone(data);
		const fileMap : Map<string, string> = new Map<string, string>();
		let isMultipleFile = false;
		const exportTimeFrame = new Date().getTime();
		if (Array.isArray(data)) {
			if (options?.saveIndividually ?? false) {
				isMultipleFile = true;
				let fileCount = 0;
				for (let each of data) {
					fileCount++;
					if(options?.ignoreAzureMetadata ?? false){
						AzureMetaKeys.forEach(x => {
							if(each.hasOwnProperty(x))
								delete each[x];
						})
					}
					const eachFile = JSON.stringify(each, null, 2);
					let fileName = '';
					if (each.hasOwnProperty(options?.fileIdentifierProperty ?? 'id')) {
						const idProperty = each['id'];
						if (typeof idProperty === 'string' || idProperty instanceof String) {
							fileName = `${idProperty}.json`;
						}
					}

					if (isNullOrUndefined(fileName) || fileName.length <= 0) {
						fileName = `${exportTimeFrame}-${fileCount}.json`;
					}
					if (fileMap.has(fileName)) {
						fileName = `export-${exportTimeFrame}-${fileName}`;
					}
					fileMap.set(fileName, eachFile);
				}
			} else {
				if(options?.ignoreAzureMetadata ?? false){
					data.forEach(each => {
						AzureMetaKeys.forEach(x => {
							if(each.hasOwnProperty(x))
								delete each[x];
						})
					})
				}
				fileMap.set(`${exportTimeFrame}.json`, JSON.stringify(data, null, 2));
			}
		} else {
			AzureMetaKeys.forEach(x => {
				if(data.hasOwnProperty(x))
					delete data[x];
			})
			fileMap.set(`${exportTimeFrame}.json`,JSON.stringify(data, null, 2));
		}

		if(AppSettings.isTauri()){
			if(!options?.saveDirectory){
				return ExportResponse.NoPath;
			}

			const response = await invoke('save_export', {
				body: {
					export_type: "json",
					export_path: options?.saveDirectory,
					is_zip: options?.asZip ?? false,
					zip_name : options?.zipName,
					data: fileMap
				}
			});

			const dataCount = Array.isArray(data) ? data.length : 1;

			if(response){
				if(response === "success"){
					toast('Success', {
						description: `Exported ${dataCount} documents to ${options?.saveDirectory}`
					})
				}else{
					toast.error('Failed', {
						description: `Failed to export data with response code - ${response}`
					})
				}
			}
		}else{

		}

		return ExportResponse.Success;
	}

	from(data: string, options: IImportOptions): Promise<any[]> {
		return Promise.resolve([]);
	}
}