import { type PartitionKeyDefinition } from '@azure/cosmos';

export interface DatabaseManageResponse {
	name : string
	status : boolean
	message? : string | undefined
	error? : Nullable<any>
}

export interface IDatabase {
	name : string,
	uniqueId : string,
	lastUpdated : number,
}

export interface IDatabaseCreationResponse {
	status : boolean,
	reason? : string
}

export interface IContainer {
	name : string
	uniqueId : string,
	lastUpdated : number,
	ttl? : number | undefined,
	partitionKey : PartitionKeyDefinition | undefined
}


export interface IContainerCreationResponse {
	status : boolean,
	reason? : string
}



export class DatabaseCreationResponseFactory {
	public static readonly DuplicateDatabaseCreationResponse : IDatabaseCreationResponse = {status: false, reason: "Conflict"}

	public static FailedDatabaseCreationResponse(reason? : string) : IDatabaseCreationResponse{
		return {
			status: false,
			reason: reason
		};
	}

	public static Success(reason? : string) : IDatabaseCreationResponse{
		return {
			status: true,
			reason: reason
		};
	}

}

export class ContainerCreationResponseFactory {
	public static readonly DuplicateDatabaseCreationResponse : IContainerCreationResponse = {status: false, reason: "Conflict"}

	public static FailedDatabaseCreationResponse(reason? : string) : IContainerCreationResponse{
		return {
			status: false,
			reason: reason
		};
	}

	public static Success(reason? : string) : IContainerCreationResponse{
		return {
			status: true,
			reason: reason
		};
	}

}