import { NextResponse } from "next/server";
import { SupabaseFullGearedRepository } from "@/src/infrastructure/repositories/SupabaseFullGearedRepository";
import { GetFullGearedCharactersUseCase } from "@/src/application/useCases/GetFullGearedCharactersUseCase";
import { CreateFullGearedCharacterUseCase } from "@/src/application/useCases/CreateFullGearedCharacterUseCase";
import { UpdateFullGearedCharacterUseCase } from "@/src/application/useCases/UpdateFullGearedCharacterUseCase";
import { DeleteFullGearedCharacterUseCase } from "@/src/application/useCases/DeleteFullGearedCharacterUseCase";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");
    const search = searchParams.get("search") || "";
    
    const repository = new SupabaseFullGearedRepository();
    const useCase = new GetFullGearedCharactersUseCase(repository);

    const result = await useCase.execute(page, limit, search);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching full geared characters:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, class: characterClass, icc, rs, gs, main } = body;

    const repository = new SupabaseFullGearedRepository();
    const useCase = new CreateFullGearedCharacterUseCase(repository);

    const newCharacter = await useCase.execute({ name, class: characterClass, icc, rs, gs, main });

    return NextResponse.json(newCharacter);
  } catch (error) {
    console.error("Error creating full geared character:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, name, class: characterClass, icc, rs, gs, main } = body;

    const repository = new SupabaseFullGearedRepository();
    const useCase = new UpdateFullGearedCharacterUseCase(repository);

    const updatedCharacter = await useCase.execute({ id, name, class: characterClass, icc, rs, gs, main });

    return NextResponse.json(updatedCharacter);
  } catch (error) {
    console.error("Error updating full geared character:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    const repository = new SupabaseFullGearedRepository();
    const useCase = new DeleteFullGearedCharacterUseCase(repository);

    await useCase.execute(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting full geared character:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
