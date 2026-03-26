/**
 * Catalogue spec defaults (specifications + homologations) — hand-maintained client API.
 */
import { useMutation, useQuery } from "@tanstack/react-query";
import type {
  MutationFunction,
  QueryFunction,
  QueryKey,
  UseMutationOptions,
  UseMutationResult,
  UseQueryOptions,
  UseQueryResult,
} from "@tanstack/react-query";

import type {
  CatalogueSpecDefault,
  CatalogueSpecType,
  CreateCatalogueSpecDefaultBody,
  UpdateCatalogueSpecDefaultBody,
} from "./api.schemas";

import { customFetch } from "../custom-fetch";
import type { BodyType, ErrorType } from "../custom-fetch";

type SecondParameter<T extends (...args: never) => unknown> = Parameters<T>[1];

export const getListCatalogueSpecDefaultsUrl = (specType?: CatalogueSpecType) => {
  const q = specType ? `?type=${encodeURIComponent(specType)}` : "";
  return `/api/catalogue/spec-defaults${q}`;
};

export const listCatalogueSpecDefaults = async (
  specType?: CatalogueSpecType,
  options?: RequestInit,
): Promise<CatalogueSpecDefault[]> => {
  return customFetch<CatalogueSpecDefault[]>(getListCatalogueSpecDefaultsUrl(specType), {
    ...options,
    method: "GET",
  });
};

export const getListCatalogueSpecDefaultsQueryKey = (specType?: CatalogueSpecType) =>
  [`/api/catalogue/spec-defaults`, specType ?? "all"] as const;

export const getListCatalogueSpecDefaultsQueryOptions = <
  TData = Awaited<ReturnType<typeof listCatalogueSpecDefaults>>,
  TError = ErrorType<unknown>,
>(
  specType?: CatalogueSpecType,
  options?: {
    query?: UseQueryOptions<
      Awaited<ReturnType<typeof listCatalogueSpecDefaults>>,
      TError,
      TData
    >;
    request?: SecondParameter<typeof customFetch>;
  },
): UseQueryOptions<
  Awaited<ReturnType<typeof listCatalogueSpecDefaults>>,
  TError,
  TData
> & { queryKey: QueryKey } => {
  const queryKey = getListCatalogueSpecDefaultsQueryKey(specType);
  const queryFn: QueryFunction<Awaited<ReturnType<typeof listCatalogueSpecDefaults>>> = ({
    signal,
  }) => listCatalogueSpecDefaults(specType, { signal, ...options?.request });
  return { queryKey, queryFn, ...options?.query } as UseQueryOptions<
    Awaited<ReturnType<typeof listCatalogueSpecDefaults>>,
    TError,
    TData
  > & { queryKey: QueryKey };
};

export function useListCatalogueSpecDefaults<
  TData = Awaited<ReturnType<typeof listCatalogueSpecDefaults>>,
  TError = ErrorType<unknown>,
>(
  specType?: CatalogueSpecType,
  options?: {
    query?: UseQueryOptions<
      Awaited<ReturnType<typeof listCatalogueSpecDefaults>>,
      TError,
      TData
    >;
    request?: SecondParameter<typeof customFetch>;
  },
): UseQueryResult<TData, TError> & { queryKey: QueryKey } {
  const queryOptions = getListCatalogueSpecDefaultsQueryOptions(specType, options);
  const query = useQuery(queryOptions) as UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
  };
  return { ...query, queryKey: queryOptions.queryKey };
}

const defaultsBase = "/api/catalogue/spec-defaults";

export const createCatalogueSpecDefault = async (
  body: CreateCatalogueSpecDefaultBody,
  options?: RequestInit,
): Promise<CatalogueSpecDefault> => {
  return customFetch<CatalogueSpecDefault>(defaultsBase, {
    ...options,
    method: "POST",
    headers: { "Content-Type": "application/json", ...options?.headers },
    body: JSON.stringify(body),
  });
};

export const useCreateCatalogueSpecDefault = <
  TError = ErrorType<unknown>,
  TContext = unknown,
>(options?: {
  mutation?: UseMutationOptions<
    Awaited<ReturnType<typeof createCatalogueSpecDefault>>,
    TError,
    { data: BodyType<CreateCatalogueSpecDefaultBody> },
    TContext
  >;
  request?: SecondParameter<typeof customFetch>;
}): UseMutationResult<
  Awaited<ReturnType<typeof createCatalogueSpecDefault>>,
  TError,
  { data: BodyType<CreateCatalogueSpecDefaultBody> },
  TContext
> => {
  const mutationFn: MutationFunction<
    Awaited<ReturnType<typeof createCatalogueSpecDefault>>,
    { data: BodyType<CreateCatalogueSpecDefaultBody> }
  > = (props) => {
    const { data } = props ?? {};
    return createCatalogueSpecDefault(data, options?.request);
  };
  return useMutation({ mutationFn, ...options?.mutation });
};

export const updateCatalogueSpecDefault = async (
  id: number,
  body: UpdateCatalogueSpecDefaultBody,
  options?: RequestInit,
): Promise<CatalogueSpecDefault> => {
  return customFetch<CatalogueSpecDefault>(`${defaultsBase}/${id}`, {
    ...options,
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...options?.headers },
    body: JSON.stringify(body),
  });
};

export const useUpdateCatalogueSpecDefault = <
  TError = ErrorType<unknown>,
  TContext = unknown,
>(options?: {
  mutation?: UseMutationOptions<
    Awaited<ReturnType<typeof updateCatalogueSpecDefault>>,
    TError,
    { id: number; data: BodyType<UpdateCatalogueSpecDefaultBody> },
    TContext
  >;
  request?: SecondParameter<typeof customFetch>;
}): UseMutationResult<
  Awaited<ReturnType<typeof updateCatalogueSpecDefault>>,
  TError,
  { id: number; data: BodyType<UpdateCatalogueSpecDefaultBody> },
  TContext
> => {
  const mutationFn: MutationFunction<
    Awaited<ReturnType<typeof updateCatalogueSpecDefault>>,
    { id: number; data: BodyType<UpdateCatalogueSpecDefaultBody> }
  > = (props) => {
    const { id, data } = props ?? {};
    return updateCatalogueSpecDefault(id, data, options?.request);
  };
  return useMutation({ mutationFn, ...options?.mutation });
};

export const deleteCatalogueSpecDefault = async (
  id: number,
  options?: RequestInit,
): Promise<void> => {
  return customFetch<void>(`${defaultsBase}/${id}`, {
    ...options,
    method: "DELETE",
  });
};

export const useDeleteCatalogueSpecDefault = <
  TError = ErrorType<unknown>,
  TContext = unknown,
>(options?: {
  mutation?: UseMutationOptions<
    Awaited<ReturnType<typeof deleteCatalogueSpecDefault>>,
    TError,
    { id: number },
    TContext
  >;
  request?: SecondParameter<typeof customFetch>;
}): UseMutationResult<
  Awaited<ReturnType<typeof deleteCatalogueSpecDefault>>,
  TError,
  { id: number },
  TContext
> => {
  const mutationFn: MutationFunction<
    Awaited<ReturnType<typeof deleteCatalogueSpecDefault>>,
    { id: number }
  > = (props) => {
    const { id } = props ?? {};
    return deleteCatalogueSpecDefault(id, options?.request);
  };
  return useMutation({ mutationFn, ...options?.mutation });
};
