/**
 * API Route pour servir le fichier PGN des parties
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const pgnPath = resolve(process.cwd(), "data/tactics/games-source.pgn");
    const pgnContent = readFileSync(pgnPath, "utf-8");
    
    return new NextResponse(pgnContent, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  } catch (error) {
    console.error("Erreur lors de la lecture du fichier PGN:", error);
    return NextResponse.json(
      { error: "Impossible de lire le fichier PGN" },
      { status: 500 }
    );
  }
}

