// Can be used to add base roles and determine available roles.
export enum PolicyRoles {
    USER = 'USER',
    ADMIN = 'ADMIN',
    SUPERADMIN = 'SUPERADMIN'
}

export enum PolicyRoutes {
    DASHBOARD = 'dashboard',
    ADMINUSERS = 'adminUsers'
}

export enum PolicyActions {
    READ = 'read',
    CREATE = 'create',
    UPDATE = 'update',
    DELETE = 'delete'
}
