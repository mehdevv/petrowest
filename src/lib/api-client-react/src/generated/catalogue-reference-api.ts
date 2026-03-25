/**
 * Product volumes & viscosity grades — same pattern as oil types (hand-maintained).
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
  CreateProductVolumeBody,
  CreateViscosityGradeBody,
  ProductVolume,
  UpdateProductVolumeBody,
  UpdateViscosityGradeBody,
  ViscosityGrade,
} from "./api.schemas";

import { customFetch } from "../custom-fetch";
import type { BodyType, ErrorType } from "../custom-fetch";

type SecondParameter<T extends (...args: never) => unknown> = Parameters<T>[1];

// ─── Product volumes ─────────────────────────────────────────

export const getListProductVolumesUrl = () => `/api/product-volumes`;

export const listProductVolumes = async (
  options?: RequestInit,
): Promise<ProductVolume[]> => {
  return customFetch<ProductVolume[]>(getListProductVolumesUrl(), {
    ...options,
    method: "GET",
  });
};

export const getListProductVolumesQueryKey = () => [`/api/product-volumes`] as const;

export const getListProductVolumesQueryOptions = <
  TData = Awaited<ReturnType<typeof listProductVolumes>>,
  TError = ErrorType<unknown>,
>(options?: {
  query?: UseQueryOptions<
    Awaited<ReturnType<typeof listProductVolumes>>,
    TError,
    TData
  >;
  request?: SecondParameter<typeof customFetch>;
}): UseQueryOptions<
  Awaited<ReturnType<typeof listProductVolumes>>,
  TError,
  TData
> & { queryKey: QueryKey } => {
  const queryKey = getListProductVolumesQueryKey();
  const queryFn: QueryFunction<Awaited<ReturnType<typeof listProductVolumes>>> = ({
    signal,
  }) => listProductVolumes({ signal, ...options?.request });
  return { queryKey, queryFn, ...options?.query } as UseQueryOptions<
    Awaited<ReturnType<typeof listProductVolumes>>,
    TError,
    TData
  > & { queryKey: QueryKey };
};

export function useListProductVolumes<
  TData = Awaited<ReturnType<typeof listProductVolumes>>,
  TError = ErrorType<unknown>,
>(options?: {
  query?: UseQueryOptions<
    Awaited<ReturnType<typeof listProductVolumes>>,
    TError,
    TData
  >;
  request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & { queryKey: QueryKey } {
  const queryOptions = getListProductVolumesQueryOptions(options);
  const query = useQuery(queryOptions) as UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
  };
  return { ...query, queryKey: queryOptions.queryKey };
}

export const createProductVolume = async (
  body: CreateProductVolumeBody,
  options?: RequestInit,
): Promise<ProductVolume> => {
  return customFetch<ProductVolume>(getListProductVolumesUrl(), {
    ...options,
    method: "POST",
    headers: { "Content-Type": "application/json", ...options?.headers },
    body: JSON.stringify(body),
  });
};

export const useCreateProductVolume = <
  TError = ErrorType<unknown>,
  TContext = unknown,
>(options?: {
  mutation?: UseMutationOptions<
    Awaited<ReturnType<typeof createProductVolume>>,
    TError,
    { data: BodyType<CreateProductVolumeBody> },
    TContext
  >;
  request?: SecondParameter<typeof customFetch>;
}): UseMutationResult<
  Awaited<ReturnType<typeof createProductVolume>>,
  TError,
  { data: BodyType<CreateProductVolumeBody> },
  TContext
> => {
  const mutationFn: MutationFunction<
    Awaited<ReturnType<typeof createProductVolume>>,
    { data: BodyType<CreateProductVolumeBody> }
  > = (props) => {
    const { data } = props ?? {};
    return createProductVolume(data, options?.request);
  };
  return useMutation({ mutationFn, ...options?.mutation });
};

export const updateProductVolume = async (
  id: number,
  body: UpdateProductVolumeBody,
  options?: RequestInit,
): Promise<ProductVolume> => {
  return customFetch<ProductVolume>(`/api/product-volumes/${id}`, {
    ...options,
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...options?.headers },
    body: JSON.stringify(body),
  });
};

export const useUpdateProductVolume = <
  TError = ErrorType<unknown>,
  TContext = unknown,
>(options?: {
  mutation?: UseMutationOptions<
    Awaited<ReturnType<typeof updateProductVolume>>,
    TError,
    { id: number; data: BodyType<UpdateProductVolumeBody> },
    TContext
  >;
  request?: SecondParameter<typeof customFetch>;
}): UseMutationResult<
  Awaited<ReturnType<typeof updateProductVolume>>,
  TError,
  { id: number; data: BodyType<UpdateProductVolumeBody> },
  TContext
> => {
  const mutationFn: MutationFunction<
    Awaited<ReturnType<typeof updateProductVolume>>,
    { id: number; data: BodyType<UpdateProductVolumeBody> }
  > = (props) => {
    const { id, data } = props ?? {};
    return updateProductVolume(id, data, options?.request);
  };
  return useMutation({ mutationFn, ...options?.mutation });
};

export const deleteProductVolume = async (
  id: number,
  options?: RequestInit,
): Promise<void> => {
  return customFetch<void>(`/api/product-volumes/${id}`, {
    ...options,
    method: "DELETE",
  });
};

export const useDeleteProductVolume = <
  TError = ErrorType<unknown>,
  TContext = unknown,
>(options?: {
  mutation?: UseMutationOptions<
    Awaited<ReturnType<typeof deleteProductVolume>>,
    TError,
    { id: number },
    TContext
  >;
  request?: SecondParameter<typeof customFetch>;
}): UseMutationResult<
  Awaited<ReturnType<typeof deleteProductVolume>>,
  TError,
  { id: number },
  TContext
> => {
  const mutationFn: MutationFunction<
    Awaited<ReturnType<typeof deleteProductVolume>>,
    { id: number }
  > = (props) => {
    const { id } = props ?? {};
    return deleteProductVolume(id, options?.request);
  };
  return useMutation({ mutationFn, ...options?.mutation });
};

// ─── Viscosity grades ────────────────────────────────────────

export const getListViscosityGradesUrl = () => `/api/viscosity-grades`;

export const listViscosityGrades = async (
  options?: RequestInit,
): Promise<ViscosityGrade[]> => {
  return customFetch<ViscosityGrade[]>(getListViscosityGradesUrl(), {
    ...options,
    method: "GET",
  });
};

export const getListViscosityGradesQueryKey = () => [`/api/viscosity-grades`] as const;

export const getListViscosityGradesQueryOptions = <
  TData = Awaited<ReturnType<typeof listViscosityGrades>>,
  TError = ErrorType<unknown>,
>(options?: {
  query?: UseQueryOptions<
    Awaited<ReturnType<typeof listViscosityGrades>>,
    TError,
    TData
  >;
  request?: SecondParameter<typeof customFetch>;
}): UseQueryOptions<
  Awaited<ReturnType<typeof listViscosityGrades>>,
  TError,
  TData
> & { queryKey: QueryKey } => {
  const queryKey = getListViscosityGradesQueryKey();
  const queryFn: QueryFunction<Awaited<ReturnType<typeof listViscosityGrades>>> = ({
    signal,
  }) => listViscosityGrades({ signal, ...options?.request });
  return { queryKey, queryFn, ...options?.query } as UseQueryOptions<
    Awaited<ReturnType<typeof listViscosityGrades>>,
    TError,
    TData
  > & { queryKey: QueryKey };
};

export function useListViscosityGrades<
  TData = Awaited<ReturnType<typeof listViscosityGrades>>,
  TError = ErrorType<unknown>,
>(options?: {
  query?: UseQueryOptions<
    Awaited<ReturnType<typeof listViscosityGrades>>,
    TError,
    TData
  >;
  request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & { queryKey: QueryKey } {
  const queryOptions = getListViscosityGradesQueryOptions(options);
  const query = useQuery(queryOptions) as UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
  };
  return { ...query, queryKey: queryOptions.queryKey };
}

export const createViscosityGrade = async (
  body: CreateViscosityGradeBody,
  options?: RequestInit,
): Promise<ViscosityGrade> => {
  return customFetch<ViscosityGrade>(getListViscosityGradesUrl(), {
    ...options,
    method: "POST",
    headers: { "Content-Type": "application/json", ...options?.headers },
    body: JSON.stringify(body),
  });
};

export const useCreateViscosityGrade = <
  TError = ErrorType<unknown>,
  TContext = unknown,
>(options?: {
  mutation?: UseMutationOptions<
    Awaited<ReturnType<typeof createViscosityGrade>>,
    TError,
    { data: BodyType<CreateViscosityGradeBody> },
    TContext
  >;
  request?: SecondParameter<typeof customFetch>;
}): UseMutationResult<
  Awaited<ReturnType<typeof createViscosityGrade>>,
  TError,
  { data: BodyType<CreateViscosityGradeBody> },
  TContext
> => {
  const mutationFn: MutationFunction<
    Awaited<ReturnType<typeof createViscosityGrade>>,
    { data: BodyType<CreateViscosityGradeBody> }
  > = (props) => {
    const { data } = props ?? {};
    return createViscosityGrade(data, options?.request);
  };
  return useMutation({ mutationFn, ...options?.mutation });
};

export const updateViscosityGrade = async (
  id: number,
  body: UpdateViscosityGradeBody,
  options?: RequestInit,
): Promise<ViscosityGrade> => {
  return customFetch<ViscosityGrade>(`/api/viscosity-grades/${id}`, {
    ...options,
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...options?.headers },
    body: JSON.stringify(body),
  });
};

export const useUpdateViscosityGrade = <
  TError = ErrorType<unknown>,
  TContext = unknown,
>(options?: {
  mutation?: UseMutationOptions<
    Awaited<ReturnType<typeof updateViscosityGrade>>,
    TError,
    { id: number; data: BodyType<UpdateViscosityGradeBody> },
    TContext
  >;
  request?: SecondParameter<typeof customFetch>;
}): UseMutationResult<
  Awaited<ReturnType<typeof updateViscosityGrade>>,
  TError,
  { id: number; data: BodyType<UpdateViscosityGradeBody> },
  TContext
> => {
  const mutationFn: MutationFunction<
    Awaited<ReturnType<typeof updateViscosityGrade>>,
    { id: number; data: BodyType<UpdateViscosityGradeBody> }
  > = (props) => {
    const { id, data } = props ?? {};
    return updateViscosityGrade(id, data, options?.request);
  };
  return useMutation({ mutationFn, ...options?.mutation });
};

export const deleteViscosityGrade = async (
  id: number,
  options?: RequestInit,
): Promise<void> => {
  return customFetch<void>(`/api/viscosity-grades/${id}`, {
    ...options,
    method: "DELETE",
  });
};

export const useDeleteViscosityGrade = <
  TError = ErrorType<unknown>,
  TContext = unknown,
>(options?: {
  mutation?: UseMutationOptions<
    Awaited<ReturnType<typeof deleteViscosityGrade>>,
    TError,
    { id: number },
    TContext
  >;
  request?: SecondParameter<typeof customFetch>;
}): UseMutationResult<
  Awaited<ReturnType<typeof deleteViscosityGrade>>,
  TError,
  { id: number },
  TContext
> => {
  const mutationFn: MutationFunction<
    Awaited<ReturnType<typeof deleteViscosityGrade>>,
    { id: number }
  > = (props) => {
    const { id } = props ?? {};
    return deleteViscosityGrade(id, options?.request);
  };
  return useMutation({ mutationFn, ...options?.mutation });
};
