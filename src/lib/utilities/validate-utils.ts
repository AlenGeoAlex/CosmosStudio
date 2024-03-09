import { DatabaseCreationResponseFactory } from '$lib/components/models/azure-models';


export function validateDatabaseName(dbName : string | undefined | null, existing : string[] = []){
	if(dbName === null || dbName === undefined || dbName.length === 0)
		return DatabaseCreationResponseFactory.FailedDatabaseCreationResponse("NoName");

	if(dbName.indexOf(" ") > 0)
		return DatabaseCreationResponseFactory.FailedDatabaseCreationResponse("Space");

	if(dbName === "Database Name")
		return DatabaseCreationResponseFactory.FailedDatabaseCreationResponse("NoName");

	if(existing.includes(dbName))
		return DatabaseCreationResponseFactory.DuplicateDatabaseCreationResponse;

	return DatabaseCreationResponseFactory.Success();
}

export function validateSql(query : string) : boolean {
	try {
		return query.trim().toLowerCase().startsWith("select");
	}catch (e){
		return false;
	}
}