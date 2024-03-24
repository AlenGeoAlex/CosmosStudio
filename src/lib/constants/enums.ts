export enum StoreKeys {
    SavedConnections,
    History,
    AppSettings
}

export enum DashboardState{
    Started,
    StartingConnection,
    Connected,
    Initializing,
    Initialized,

}

export enum ContainerActions {
    Documents = "Documents",
    StoredProcedures = "Procedures",
    UserFunctions = "Functions",
    Console = "Console"
}

export enum ConsoleType {
    Procedure = "SP",
    Function = "UFN",
    Query = "Query"
}

export enum ContextKeys {
    ConnectionSchema = "connectionSchema"
}

export enum ExportType {
    JSON = "json",
    CSV = "csv"
}

export const ExportTypes : ExportType[] = [ExportType.JSON, ExportType.CSV];