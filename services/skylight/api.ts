const BASE_URL = 'https://app.ourskylight.com';

export class ApiError extends Error {
  constructor(message: string, public statusCode?: number) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface SkylightList {
  id: string;
  type: 'list';
  attributes: {
    label: string;
    color?: string;
    kind: 'shopping' | 'to_do';
    default_grocery_list?: boolean;
  };
  relationships?: {
    list_items?: {
      data: Array<{ type: 'list_item'; id: string }>;
    };
  };
}

export interface SkylightListItem {
  id: string;
  type: 'list_item';
  attributes: {
    label: string;
    status: 'pending' | 'completed';
    section?: string;
    position?: number;
    created_at?: string;
  };
}

async function apiRequest<T>(
  endpoint: string,
  authToken: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Basic ${authToken}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new ApiError(
      `Request failed: ${errorText}`,
      response.status
    );
  }

  return response.json();
}

export async function getLists(frameId: string, authToken: string): Promise<SkylightList[]> {
  const data = await apiRequest<{ data: SkylightList[] }>(
    `/api/frames/${frameId}/lists`,
    authToken
  );
  return data.data;
}

export async function getListWithItems(
  frameId: string,
  listId: string,
  authToken: string
): Promise<{ list: SkylightList; items: SkylightListItem[] }> {
  const data = await apiRequest<{
    data: SkylightList;
    included?: SkylightListItem[];
  }>(`/api/frames/${frameId}/lists/${listId}`, authToken);

  return {
    list: data.data,
    items: data.included || [],
  };
}

export async function addListItem(
  frameId: string,
  listId: string,
  label: string,
  authToken: string
): Promise<SkylightListItem> {
  // Try simple JSON format first (like the auth endpoint)
  const data = await apiRequest<{ data: SkylightListItem }>(
    `/api/frames/${frameId}/lists/${listId}/list_items`,
    authToken,
    {
      method: 'POST',
      body: JSON.stringify({
        label,
      }),
    }
  );
  return data.data;
}

export async function updateListItem(
  frameId: string,
  listId: string,
  itemId: string,
  updates: Partial<{ label: string; status: 'pending' | 'completed' }>,
  authToken: string
): Promise<SkylightListItem> {
  const data = await apiRequest<{ data: SkylightListItem }>(
    `/api/frames/${frameId}/lists/${listId}/list_items/${itemId}`,
    authToken,
    {
      method: 'PATCH',
      body: JSON.stringify({
        data: {
          type: 'list_item',
          id: itemId,
          attributes: updates,
        },
      }),
    }
  );
  return data.data;
}

export async function deleteListItem(
  frameId: string,
  listId: string,
  itemId: string,
  authToken: string
): Promise<void> {
  await fetch(`${BASE_URL}/api/frames/${frameId}/lists/${listId}/list_items/${itemId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Basic ${authToken}`,
    },
  });
}
