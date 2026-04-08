import { createServerSupabaseClient } from "@/lib/supabase-server";
import { getGroqChatCompletion } from "@/lib/ai/groq";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { message, conversationId, title } = await req.json();

    // 0. Fetch Persona from Profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("ai_settings")
      .eq("id", user.id)
      .single();

    const persona = profile?.ai_settings?.persona || "";

    let currentConversationId = conversationId;

    // 1. Create conversation if it doesn't exist
    if (!currentConversationId) {
      const { data: conv, error: convError } = await supabase
        .from("conversations")
        .insert([{ user_id: user.id, title: title || message.substring(0, 30) + "..." }])
        .select()
        .single();

      if (convError) throw convError;
      currentConversationId = conv.id;
    }

    // 2. Save User Message
    const { error: userMsgError } = await supabase
      .from("messages")
      .insert([{ conversation_id: currentConversationId, role: "user", content: message }]);

    if (userMsgError) throw userMsgError;

    // 3. Get History for Context
    const { data: history } = await supabase
      .from("messages")
      .select("role, content")
      .eq("conversation_id", currentConversationId)
      .order("created_at", { ascending: true })
      .limit(10);

    const contextMessages = history?.map(m => ({
      role: m.role,
      content: m.content
    })) || [];

    // 4. Get Groq Completion
    const completion = await getGroqChatCompletion(contextMessages, persona);
    const aiResponse = completion.choices[0]?.message?.content || "Maaf, sistem sedang mengalami kendala teknis.";

    // 5. Save Assistant Message
    const { error: aiMsgError } = await supabase
      .from("messages")
      .insert([{ conversation_id: currentConversationId, role: "assistant", content: aiResponse }]);

    if (aiMsgError) throw aiMsgError;

    return NextResponse.json({
      success: true,
      conversationId: currentConversationId,
      message: aiResponse
    });

  } catch (error: any) {
    console.error("AI Route Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
