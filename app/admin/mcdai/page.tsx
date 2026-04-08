import { getConversations } from "@/lib/actions/ai-actions";
import AIChatContainer from "@/components/admin/AIChatContainer";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "McdAI | SukaMCD Intelligence",
  description: "Advanced AI assistance for SukaMCD administrators.",
};

export default async function McdAIPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  const initialConversations = await getConversations();
  
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user?.id)
    .single();

  return (
    <div className="h-[calc(100%+4rem)] -m-8 flex overflow-hidden bg-black">
      <AIChatContainer initialConversations={initialConversations} profile={profile} />
    </div>
  );
}
