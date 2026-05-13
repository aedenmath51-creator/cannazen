import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, apiPost } from "@/lib/api";

export type AuthUser = {
  id: number;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  birthday: string | null;
  role: string;
  emailVerified: boolean;
  newsletterOptIn: boolean;
  marketingOptIn: boolean;
  loyaltyPoints: number;
  loyaltyTier: string;
  createdAt: string;
};

export function useAuth() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      const res = await api<{ user: AuthUser | null }>("/auth/me");
      return res.user;
    },
    staleTime: 60_000,
  });

  const login = useMutation({
    mutationFn: (vars: { email: string; password: string }) => apiPost("/auth/login", vars),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["auth", "me"] }),
  });

  const signup = useMutation({
    mutationFn: (vars: { email: string; password: string; firstName: string; lastName: string; newsletterOptIn?: boolean }) =>
      apiPost("/auth/signup", vars),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["auth", "me"] }),
  });

  const logout = useMutation({
    mutationFn: () => apiPost("/auth/logout"),
    onSuccess: () => {
      qc.clear();
      qc.invalidateQueries({ queryKey: ["auth", "me"] });
    },
  });

  return { user: data ?? null, isLoading, isAuthenticated: !!data, isAdmin: data?.role === "admin", login, signup, logout };
}
