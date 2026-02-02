"use client";

import useSWR from "swr";
import useSWRMutation from "swr/mutation";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

// Types
export interface Journey {
  id: string;
  title: string;
  description: string;
  content: string;
  tags: string;
  voteCount: number;
  viewCount: number;
  commentCount?: number;
  createdAt: string;
  author: {
    id: string;
    name: string | null;
    image: string | null;
  };
  award?: {
    type: string;
    rank: number;
  } | null;
  awards?: Array<{
    type: string;
    rank: number;
  }>;
  _count?: {
    comments: number;
  };
  userVote?: number | null;
}

export interface OneShot {
  id: string;
  title: string;
  prompt: string;
  result: string | null;
  category: string;
  copyCount: number;
  createdAt: string;
  author: {
    id: string;
    name: string | null;
    image: string | null;
  };
}

export interface User {
  id: string;
  name: string | null;
  image: string | null;
  bio: string | null;
  createdAt: string;
  journeyCount: number;
  oneShotCount: number;
  totalVotes: number;
  journeys: Journey[];
}

// Hooks
export function useJourneys(params?: { sort?: string; search?: string; tag?: string; page?: number }) {
  const searchParams = new URLSearchParams();
  if (params?.sort) searchParams.set("sort", params.sort);
  if (params?.search) searchParams.set("search", params.search);
  if (params?.tag) searchParams.set("tag", params.tag);
  if (params?.page) searchParams.set("page", params.page.toString());

  const query = searchParams.toString();
  const { data, error, isLoading, mutate } = useSWR<{
    journeys: Journey[];
    total: number;
    pages: number;
  }>(`/api/journeys${query ? `?${query}` : ""}`, fetcher);

  return { journeys: data?.journeys || [], total: data?.total || 0, pages: data?.pages || 0, error, isLoading, mutate };
}

export function useJourney(id: string | null) {
  const { data, error, isLoading, mutate } = useSWR<Journey>(
    id ? `/api/journeys/${id}` : null,
    fetcher
  );
  return { journey: data, error, isLoading, mutate };
}

export function useOneShots(params?: { category?: string; search?: string }) {
  const searchParams = new URLSearchParams();
  if (params?.category) searchParams.set("category", params.category);
  if (params?.search) searchParams.set("search", params.search);

  const query = searchParams.toString();
  const { data, error, isLoading, mutate } = useSWR<OneShot[]>(
    `/api/one-shots${query ? `?${query}` : ""}`,
    fetcher
  );

  return { oneShots: data || [], error, isLoading, mutate };
}

export function useUser(id: string | null) {
  const { data, error, isLoading, mutate } = useSWR<User>(
    id ? `/api/users/${id}` : null,
    fetcher
  );
  return { user: data, error, isLoading, mutate };
}

export function useAwards(type?: string) {
  const { data, error, isLoading } = useSWR(
    `/api/awards${type ? `?type=${type}` : ""}`,
    fetcher
  );
  return { awards: data || [], error, isLoading };
}

// Mutations
async function postData(url: string, { arg }: { arg: unknown }) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(arg),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to submit");
  }
  return res.json();
}

export function useCreateJourney() {
  const { trigger, isMutating, error } = useSWRMutation("/api/journeys", postData);
  return { createJourney: trigger, isLoading: isMutating, error };
}

export function useVote(journeyId: string) {
  const { trigger, isMutating } = useSWRMutation(
    `/api/journeys/${journeyId}/vote`,
    postData
  );
  return { vote: trigger, isVoting: isMutating };
}

export function useCreateComment(journeyId: string) {
  const { trigger, isMutating } = useSWRMutation(
    `/api/journeys/${journeyId}/comments`,
    postData
  );
  return { createComment: trigger, isLoading: isMutating };
}

export function useCreateOneShot() {
  const { trigger, isMutating, error } = useSWRMutation("/api/one-shots", postData);
  return { createOneShot: trigger, isLoading: isMutating, error };
}

export function useCopyOneShot(id: string) {
  const { trigger } = useSWRMutation(`/api/one-shots/${id}/copy`, postData);
  return { trackCopy: trigger };
}
