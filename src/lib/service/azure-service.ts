import { Container, CosmosClient, Database, type DatabaseDefinition, FeedResponse, QueryIterator } from '@azure/cosmos';
import {
	ContainerCreationResponseFactory,
	type DatabaseManageResponse,
	type IContainer,
	type IContainerCreationResponse,
	type IDatabase
} from '$lib/components/models/azure-models';
import type { ConnectionSchema } from '$lib/schema/schema';

export class AzureService {
	protected readonly cosmosClient : CosmosClient;

	private _database : DatabaseService | null = null;
	private _container : ContainerService | null = null;
	private _queryAdapter : QueryAdapter | null = null;
	constructor(cosmosClient: CosmosClient) {
		this.cosmosClient = cosmosClient;
	}
	get database(): DatabaseService {
		if(this._database === null || this._database === undefined)
			this._database = new DatabaseService(this.cosmosClient);

		return this._database;
	}

	get container() : ContainerService {
		if(this._container === null || this._container === undefined)
			this._container = new ContainerService(this.cosmosClient);

		return this._container;
	}

	get queryAdapter() : QueryAdapter {
		if(this._queryAdapter === null || this._queryAdapter === undefined)
			this._queryAdapter = new QueryAdapter(this.cosmosClient);

		return this._queryAdapter;
	}

	public static build(schema : ConnectionSchema) : AzureService {
		const client = new CosmosClient({
			endpoint: schema.endpoint,
			key: schema.primaryKey,

			connectionPolicy: {
				retryOptions: {
					maxRetryAttemptCount: 1,
					maxWaitTimeInSeconds: 4,
					fixedRetryIntervalInMilliseconds: 200,
				},
				enableEndpointDiscovery: false
			}
		});
		return new AzureService(client);
	}
}

class DatabaseService {

	private readonly cosmosClient : CosmosClient;
	constructor(cosmosClient: CosmosClient) {
		this.cosmosClient = cosmosClient;
	}

	async list(abortController : AbortController) : Promise<IDatabase[]> {
		// @ts-ignore
		const { resources : databaseList } = await this.cosmosClient.databases.readAll({abortSignal: abortController.signal}).fetchAll();
		const dbList: IDatabase[] = [];
		databaseList.forEach((db) => {
			dbList.push(
				{
					name: db.id,
					lastUpdated: db._ts,
					uniqueId: db._rid
				}
			)
		})
		return dbList;
	}

	async get(name : string) : Promise<Nullable<IDatabase>>{
		const { resource : dbDefinition } = await this.cosmosClient.database(name).read();
		if(dbDefinition === null || dbDefinition === undefined)
			return null;

		return {
			name: dbDefinition.id,
			lastUpdated: dbDefinition._ts,
			uniqueId: dbDefinition._rid
		}
	}

	async delete(name : string) : Promise<DatabaseManageResponse>{
		try {
			await this.cosmosClient.database(name)?.delete();
			return {
				name: name,
				status: true
			}
		}catch (e){
			return {
				name: name,
				status: false,
				error: e,
				message: e?.toString()
			};
		}
	}

	async create(name : string, abortController : AbortController) : Promise<DatabaseManageResponse>{
		try {
			await this.cosmosClient.databases.createIfNotExists({id : name});
			return {
				name: name,
				status: true
			}
		}catch (e){
			return {
				name: name,
				status: false,
				message: e?.toString(),
				error: e
			}
		}
	}

	async getRef(name : string) : Promise<Nullable<Database>> {
		try {
			return this.cosmosClient.database(name);
		}catch (e){
			return null;
		}
	}
}

class ContainerService {
	private readonly cosmosClient : CosmosClient;
	private readonly itemService : ItemsService = new ItemsService();
	constructor(cosmosClient: CosmosClient) {
		this.cosmosClient = cosmosClient;
	}

	async list(databaseName : string) : Promise<IContainer[]> {
		const iterator = this.cosmosClient.database(databaseName).containers.readAll();
		const  {resources: containerList} = await iterator.fetchAll();

		const response : IContainer[] = [];

		containerList.forEach(x => {
			response.push({
				name: x.id,
				uniqueId: x._rid,
				lastUpdated: x._ts,
				ttl: x.defaultTtl,
				partitionKey: x.partitionKey
			})
		})

		return response;
	}

	async create(containerName : string, databaseName : string) : Promise<IContainerCreationResponse> {
		const database = this.cosmosClient.database(databaseName);
		if(database === null || databaseName === undefined){
			return ContainerCreationResponseFactory.FailedDatabaseCreationResponse("NoDbFound");
		}

		try {
			await database.containers.create({id: containerName})
			return ContainerCreationResponseFactory.Success();
		}catch (e){
			return ContainerCreationResponseFactory.FailedDatabaseCreationResponse("Error");
		}
	}

	async getRef(containerName : string, databaseName? : string, dbRef? : Database) : Promise<Nullable<Container>> {
		let cont: Nullable<Container> = null;
		if((databaseName === null || databaseName === undefined) && (dbRef === null || dbRef === undefined))
			throw new Error("No database provided");

		try {
			if(dbRef === null || dbRef === undefined){
				const db = databaseName as string;
				dbRef = this.cosmosClient.database(db);
			}

			if(dbRef === null)
				return cont;

			const response = await dbRef.container(containerName).read();
			cont = response.container;
			return cont;
		}catch (e) {
			return null;
		}
	}

	async count(containerRef : Container) : Promise<number>{
		const queryIterator = containerRef.items.query("SELECT COUNT(1) AS count FROM C");
		const feedResponse = await queryIterator.fetchNext();
		return feedResponse.resources[0]?.count ?? 0;
	}

}

class QueryAdapter {

	private readonly cosmosClient : CosmosClient;
	constructor(cosmosClient: CosmosClient) {
		this.cosmosClient = cosmosClient;
	}

	async query(queryString : string, containerRef : Container, maxItemCount : number = 50) : Promise<{ status : boolean, error?: any, response? : FeedResponse<any>, iterator? : QueryIterator<any>}>{
		try {
			const queryIterator = containerRef.items.query(queryString, {
				maxItemCount: maxItemCount,
			});

			const feedResponse = await queryIterator.fetchNext();
			return {
				status: true,
				response: feedResponse,
				iterator: queryIterator
			}
		}catch (e) {
			return {
				status: false,
				error: e,
				response: undefined,
				iterator: undefined
			}
		}
	}

	async queryNext(iterator : QueryIterator<any>) : Promise<any[]> {
			if(iterator.hasMoreResults()){
				const feedResponse = await iterator.fetchNext();
				return feedResponse.resources;
			}else{
				return [];
			}
	}

}

class ItemsService {



}


