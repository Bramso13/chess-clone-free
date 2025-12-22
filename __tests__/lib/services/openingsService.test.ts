/**
 * Tests pour openingsService
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { getOpenings, getOpeningById } from "@/lib/services/openingsService";
import type { Opening } from "@/types/chess";

// Mock Supabase client
vi.mock("@/lib/supabase/client", () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => ({
          data: null,
          error: null,
        })),
        eq: vi.fn(() => ({
          single: vi.fn(() => ({
            data: null,
            error: null,
          })),
        })),
      })),
    })),
  },
}));

const mockOpenings: Opening[] = [
  {
    id: "1",
    name: "Ruy Lopez",
    eco_code: "C70",
    moves: ["e4", "e5", "Nf3", "Nc6", "Bb5"],
    variations: [
      { name: "Marshall Attack", moves: ["e4", "e5", "Nf3"] },
    ],
    description: "Classic Spanish opening",
    player_side: "white",
    created_at: "2025-01-27T00:00:00Z",
  },
  {
    id: "2",
    name: "Sicilian Defense",
    eco_code: "B50",
    moves: ["e4", "c5"],
    variations: [],
    description: "Popular counter to 1.e4",
    player_side: "black",
    created_at: "2025-01-27T00:00:00Z",
  },
];

describe("openingsService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getOpenings", () => {
    it("should successfully fetch openings", async () => {
      const { supabase } = await import("@/lib/supabase/client");
      
      // Mock successful response
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({
            data: mockOpenings,
            error: null,
          })),
        })),
      } as any);

      const result = await getOpenings();
      
      expect(result).toEqual(mockOpenings);
      expect(supabase.from).toHaveBeenCalledWith("openings");
    });

    it("should handle fetch errors", async () => {
      const { supabase } = await import("@/lib/supabase/client");
      
      // Mock error response
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({
            data: null,
            error: { message: "Database error" },
          })),
        })),
      } as any);

      await expect(getOpenings()).rejects.toThrow("Échec de récupération des ouvertures");
    });

    it("should return empty array when no openings exist", async () => {
      const { supabase } = await import("@/lib/supabase/client");
      
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({
            data: [],
            error: null,
          })),
        })),
      } as any);

      const result = await getOpenings();
      
      expect(result).toEqual([]);
    });
  });

  describe("getOpeningById", () => {
    it("should successfully fetch an opening by ID", async () => {
      const { supabase } = await import("@/lib/supabase/client");
      
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: mockOpenings[0],
              error: null,
            })),
          })),
        })),
      } as any);

      const result = await getOpeningById("1");
      
      expect(result).toEqual(mockOpenings[0]);
      expect(supabase.from).toHaveBeenCalledWith("openings");
    });

    it("should handle fetch errors", async () => {
      const { supabase } = await import("@/lib/supabase/client");
      
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: null,
              error: { message: "Not found" },
            })),
          })),
        })),
      } as any);

      await expect(getOpeningById("999")).rejects.toThrow(
        "Échec de récupération de l'ouverture"
      );
    });

    it("should throw error when opening not found", async () => {
      const { supabase } = await import("@/lib/supabase/client");
      
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: null,
              error: null,
            })),
          })),
        })),
      } as any);

      await expect(getOpeningById("999")).rejects.toThrow(
        "Ouverture introuvable avec l'ID: 999"
      );
    });
  });
});

