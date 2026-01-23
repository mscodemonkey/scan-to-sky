export interface SkylightSession {
  token: string;
  userId: string;
  frameId: string;
}

export interface SkylightList {
  id: string;
  type: 'lists';
  attributes: {
    name: string;
    color?: string;
    position?: number;
    'created-at'?: string;
    'updated-at'?: string;
  };
}

export interface SkylightListItem {
  id: string;
  type: 'list-items';
  attributes: {
    name: string;
    checked: boolean;
    position?: number;
    'created-at'?: string;
    'updated-at'?: string;
  };
}

export interface SkylightUser {
  id: string;
  type: 'users';
  attributes: {
    email: string;
    name?: string;
  };
  relationships?: {
    frames?: {
      data: Array<{ id: string; type: 'frames' }>;
    };
  };
}

export interface SkylightFrame {
  id: string;
  type: 'frames';
  attributes: {
    name?: string;
  };
}

export interface JsonApiResponse<T> {
  data: T;
  included?: Array<SkylightUser | SkylightFrame | SkylightList | SkylightListItem>;
  meta?: Record<string, unknown>;
}

export interface JsonApiErrorResponse {
  errors: Array<{
    status: string;
    title: string;
    detail?: string;
  }>;
}

export interface LoginCredentials {
  email: string;
  password: string;
}
