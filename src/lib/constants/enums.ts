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

export enum ExportResponse {
    Unknown = "unknown",
    NoData = "no-data",
    FileSystemError = "file-system-error",
    FailedToGenerateZip = "failed-to-generate-zip",
    ErrorCreatingZip = "error-creating-zip",
    ErrorWritingZip = "error-writing-zip",
    NoPath = "no-path",
    Success = "success"
}

export const ExportTypes : ExportType[] = [ExportType.JSON, ExportType.CSV];

export const AzureMetaKeys = ["_ts", "_rid", "_self", "_etag", "_attachments", "_ttl"];