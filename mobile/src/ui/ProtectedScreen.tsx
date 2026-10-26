import { AuthScreen } from "../features/auth/AuthScreen";
import { type AuthProfile } from "../lib/auth";

export function ProtectedScreen({
  onSignedIn,
  title,
  language,
}: {
  onSignedIn: (nextState: { userEmail: string; profile: AuthProfile | null }) => void;
  title: string;
  language: "en" | "es";
}) {
  return (
    <AuthScreen
      language={language}
      title={title}
      onSignedIn={onSignedIn}
    />
  );
}
